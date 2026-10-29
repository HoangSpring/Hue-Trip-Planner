// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Hono, type MiddlewareHandler } from 'hono'
import { describe, expect, it } from 'vitest'
import { placeDetailSchema } from '@shared/schemas'
import { requestIdMiddleware } from '../middleware/requestId'
import { optionalAuth } from '../middleware/auth'
import type { ApiEnv } from '../types'
import { FixturePlacesRepo } from '../itinerary/placesRepo'
import type { CandidateRecord } from '../itinerary/types'
import { createGenerateTripRoutes } from './generateTrip'
import type { GenerationEvent, GenerationStore } from '../itinerary/generationStore'
import { FakeLlmClient } from '../llm/fake'
import type { FakeLlmScenario } from '../llm/fake'
import type { LlmClient } from '../llm/client'
import { GeminiApiError } from '../llm/providers/gemini'

const fixturePlaces = placeDetailSchema.array().parse(JSON.parse(readFileSync(resolve('tests/fixtures/places.sample.json'), 'utf8')))
const fixtureRecords: CandidateRecord[] = fixturePlaces.map((place) => ({
  place, tagWeights: Object.fromEntries(place.tags.map(({ slug }) => [slug, 2])), featured: false,
}))
const requestBody = {
  clientDraftId: '00000000-0000-4000-8000-000000000099',
  input: {
    numDays: 1, startDate: null, companion: 'couple', groupSize: 2, interests: ['cuisine', 'heritage'],
    pace: 'relaxed', budget: null, transport: 'motorbike', start: null, notes: 'private note must not be stored',
  },
}
const fixedNow = new Date('2026-10-26T02:00:00.000Z')

class FakeGenerationStore implements GenerationStore {
  readonly recorded: GenerationEvent[] = []
  constructor(readonly recent: string[] = [], readonly recentCalls: string[] = []) {}
  async listRecent() { return this.recent }
  async listRecentLlmCalls() { return this.recentCalls }
  async record(event: GenerationEvent) { this.recorded.push(event) }
}

function appFor(options: { records?: CandidateRecord[]; store?: FakeGenerationStore; auth?: MiddlewareHandler<ApiEnv>; llm?: LlmClient; enabled?: boolean; callCap?: number } = {}) {
  const store = options.store ?? new FakeGenerationStore()
  const app = new Hono<ApiEnv>()
  app.use('*', requestIdMiddleware)
  app.route('/api', createGenerateTripRoutes({
    auth: options.auth ?? (async (_context, next) => next()),
    createPlacesRepo: () => new FixturePlacesRepo(options.records ?? fixtureRecords),
    createGenerationStore: () => store,
    validateInterests: async () => true,
    createLlmClient: () => options.llm ?? new FakeLlmClient('valid'),
    llmEnabled: options.enabled ?? false,
    llmDailyCallCap: options.callCap ?? 20,
    logTelemetry: () => undefined,
    now: () => new Date(fixedNow),
    rateLimitSalt: 'test-only-salt',
  }))
  return { app, store }
}

async function post(app: Hono<ApiEnv>, body: unknown, signal?: AbortSignal) {
  return app.fetch(new Request('http://localhost/api/trips/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'fixture-test' }, body: JSON.stringify(body), signal,
  }))
}

describe('POST /api/trips/generate', () => {
  it('returns a fallback TripDraft, warnings, notices, generation, and hydrated published places', async () => {
    const { app, store } = appFor()
    const response = await post(app, requestBody)
    const body = await response.json()
    expect(response.status, JSON.stringify(body)).toBe(200)
    expect(body.draft.generatedBy).toBe('fallback')
    expect(body.draft.clientDraftId).toBe(requestBody.clientDraftId)
    expect(body.draft.days[0].items[0].place.name).toBeTruthy()
    expect(body.generation.by).toBe('fallback')
    expect(body.notices.map((notice: { code: string }) => notice.code)).toContain('FALLBACK_USED')
    expect(store.recorded).toHaveLength(1)
    expect(store.recorded[0].status).toBe('fallback')
    expect(JSON.stringify(store.recorded)).not.toContain(requestBody.input.notes)
    expect(body.draft.days.flatMap((day: { items: Array<{ placeId: string }> }) => day.items)
      .every((item: { placeId: string }) => fixtureRecords.some(({ place }) => place.id === item.placeId && place.status === 'published'))).toBe(true)
  })

  it('returns 400 for malformed JSON shape and records only a generic error code', async () => {
    const { app, store } = appFor()
    const response = await post(app, { input: { numDays: 99 }, secretField: 'unexpected' })
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR')
    expect(store.recorded[0].errorCode).toBe('VALIDATION_ERROR')
  })

  it('returns 422 NO_CANDIDATES for an empty published repository', async () => {
    const { app, store } = appFor({ records: [] })
    const response = await post(app, requestBody)
    expect(response.status).toBe(422)
    expect((await response.json()).error.code).toBe('NO_CANDIDATES')
    expect(store.recorded[0].errorCode).toBe('NO_CANDIDATES')
  })

  it('returns 429 with Retry-After before running the generator', async () => {
    const { app, store } = appFor({ store: new FakeGenerationStore([
      new Date(fixedNow.getTime() - 10 * 60_000).toISOString(),
      new Date(fixedNow.getTime() - 20 * 60_000).toISOString(),
      new Date(fixedNow.getTime() - 30 * 60_000).toISOString(),
    ]) })
    const response = await post(app, requestBody)
    expect(response.status).toBe(429)
    expect(Number(response.headers.get('Retry-After'))).toBeGreaterThan(0)
    expect((await response.json()).error.code).toBe('RATE_LIMITED')
    expect(store.recorded[0].status).toBe('rate_limited')
  })

  it('accepts an injected authenticated principal without changing database access', async () => {
    const auth: MiddlewareHandler<ApiEnv> = async (context, next) => {
      context.set('user', { id: 'user-fixture', email: null })
      await next()
    }
    const { app, store } = appFor({ auth })
    const response = await post(app, requestBody)
    expect(response.status).toBe(200)
    expect(store.recorded[0].userId).toBe('user-fixture')
    expect(store.recorded[0].isGuest).toBe(false)
  })

  it('allows a request with no bearer token through optionalAuth as a guest', async () => {
    const { app, store } = appFor({ auth: optionalAuth })
    const response = await post(app, requestBody)
    expect(response.status).toBe(200)
    expect(store.recorded[0].userId).toBeNull()
    expect(store.recorded[0].isGuest).toBe(true)
  })

  it('uses LLM when enabled, records attempt and aggregate telemetry without notes', async () => {
    const { app, store } = appFor({ enabled: true })
    const response = await post(app, requestBody)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.generation.by).toBe('llm')
    expect(store.recorded.filter(({ llmCallEvent }) => llmCallEvent)).toHaveLength(1)
    expect(store.recorded.some(({ status, generatedBy }) => status === 'success' && generatedBy === 'llm')).toBe(true)
    expect(JSON.stringify(store.recorded)).not.toContain(requestBody.input.notes)
  })

  it.each([
    ['timeout', new FakeLlmClient('timeout', 5), 'timeout'],
    ['invalid JSON', new FakeLlmClient('invalid_json'), 'invalid_json'],
    ['quota', { completeJson: async () => { throw new GeminiApiError('quota', 429) } }, 'quota'],
  ] as const)('returns a valid 200 fallback for provider %s', async (_label, llm, reason) => {
    const { app, store } = appFor({ enabled: true, llm })
    const response = await post(app, requestBody)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.generation.by).toBe('fallback')
    expect(store.recorded.some((event) => event.fallbackReason === reason)).toBe(true)
    expect(body.notices.map((notice: { code: string }) => notice.code)).toContain('FALLBACK_USED')
  })

  it.each(['unknown_id', 'duplicate_id', 'missing_day', 'no_lunch', 'invalid_slot', 'url_html_reason'] as const)(
    'returns 200 and validates %s model output', async (scenario: FakeLlmScenario) => {
      const { app } = appFor({ enabled: true, llm: new FakeLlmClient(scenario) })
      const response = await post(app, requestBody)
      const body = await response.json() as { draft: { days: Array<{ items: Array<{ placeId: string; reason: string }> }> } }
      expect(response.status).toBe(200)
      const items = body.draft.days.flatMap((day: { items: Array<{ placeId: string; reason: string }> }) => day.items)
      expect(new Set(items.map(({ placeId }) => placeId)).size).toBe(items.length)
      expect(items.every(({ placeId }) => fixtureRecords.some(({ place }) => place.id === placeId && place.status === 'published'))).toBe(true)
      expect(items.every(({ reason }) => !/(https?:\/\/|<[^>]*>|[#>*_~`])/i.test(reason))).toBe(true)
    },
  )

  it('enforces the LLM daily call cap in API and returns a valid fallback', async () => {
    const { app, store } = appFor({ enabled: true, callCap: 0 })
    const response = await post(app, requestBody)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.generation.by).toBe('fallback')
    expect(store.recorded.some((event) => event.fallbackReason === 'cap_reached')).toBe(true)
    expect(store.recorded.filter(({ llmCallEvent }) => llmCallEvent)).toHaveLength(0)
  })

  it('stops the model request when the client aborts and finalizes with fallback', async () => {
    const controller = new AbortController()
    const llm: LlmClient = { completeJson: async ({ signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true })
    }) }
    const { app } = appFor({ enabled: true, llm })
    const pending = post(app, requestBody, controller.signal)
    setTimeout(() => controller.abort(), 5)
    const response = await pending
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.generation.by).toBe('fallback')
  })
})

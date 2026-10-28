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
  constructor(readonly recent: string[] = []) {}
  async listRecent() { return this.recent }
  async record(event: GenerationEvent) { this.recorded.push(event) }
}

function appFor(options: { records?: CandidateRecord[]; store?: FakeGenerationStore; auth?: MiddlewareHandler<ApiEnv> } = {}) {
  const store = options.store ?? new FakeGenerationStore()
  const app = new Hono<ApiEnv>()
  app.use('*', requestIdMiddleware)
  app.route('/api', createGenerateTripRoutes({
    auth: options.auth ?? (async (_context, next) => next()),
    createPlacesRepo: () => new FixturePlacesRepo(options.records ?? fixtureRecords),
    createGenerationStore: () => store,
    validateInterests: async () => true,
    now: () => new Date(fixedNow),
    rateLimitSalt: 'test-only-salt',
  }))
  return { app, store }
}

async function post(app: Hono<ApiEnv>, body: unknown) {
  return app.fetch(new Request('http://localhost/api/trips/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'fixture-test' }, body: JSON.stringify(body),
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
})

import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createRegenerateDayRoute } from './regenerateDay'
import { requestIdMiddleware } from '../middleware/requestId'
import { errorHandler } from '../middleware/errorHandler'
import type { PlacesRepo } from '../itinerary/placesRepo'
import type { CandidateRecord } from '../itinerary/types'
import type { GenerationStore } from '../itinerary/generationStore'
import type { ApiEnv } from '../types'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { placeDetailSchema } from '@shared/schemas'
import { FixturePlacesRepo } from '../itinerary/placesRepo'
import { FakeLlmClient } from '../llm/fake'
import type { GenerationEvent } from '../itinerary/generationStore'

const basePlace = {
  shortDescription: null,
  area: null,
  coverImageUrl: null,
  coverImageAlt: null,
  imageCredit: null,
  imageLicense: null,
  imageSourceUrl: null,
  verified: true,
  status: 'published' as const,
  description: null,
  address: null,
  openTime: '08:00',
  closeTime: '18:00',
  closedDays: [],
  openingNote: null,
  visitDurationMin: 60,
  priceLevel: 1,
  ticketPriceVnd: 40000,
  priceNote: null,
  bestTime: ['morning' as const],
  mealType: [],
  suitableFor: [],
  walkingIntensity: 1,
  phone: null,
  website: null,
  images: [],
  lastVerifiedAt: null,
}

const mockRecords: CandidateRecord[] = [
  {
    featured: true,
    tagWeights: {},
    place: {
      ...basePlace,
      id: '11111111-1111-4111-8111-111111111111',
      slug: 'dai-noi',
      name: 'Đại Nội',
      category: 'heritage',
      lat: 16.4691,
      lng: 107.5794,
      tags: [{ slug: 'heritage', name: 'Di sản' }],
    },
  },
  {
    featured: false,
    tagWeights: {},
    place: {
      ...basePlace,
      id: '22222222-2222-4222-8222-222222222222',
      slug: 'chua-thien-mu',
      name: 'Chùa Thiên Mụ',
      category: 'heritage',
      lat: 16.4528,
      lng: 107.5453,
      tags: [{ slug: 'heritage', name: 'Di sản' }],
    },
  },
  {
    featured: false,
    tagWeights: {},
    place: {
      ...basePlace,
      id: '33333333-3333-4333-8333-333333333333',
      slug: 'banh-khoai',
      name: 'Bánh Khoái Lạc Thiện',
      category: 'food',
      lat: 16.4688,
      lng: 107.5815,
      tags: [{ slug: 'cuisine', name: 'Ẩm thực' }],
    },
  },
]

class MockPlacesRepo implements PlacesRepo {
  async listPublished(): Promise<CandidateRecord[]> {
    return mockRecords
  }
}

class MockGenerationStore implements GenerationStore {
  events: string[] = []
  recorded: GenerationEvent[] = []
  async listRecent(): Promise<string[]> {
    return this.events
  }
  async listRecentLlmCalls(): Promise<string[]> {
    return []
  }
  async record(event: GenerationEvent): Promise<void> { this.recorded.push(event) }
}

describe('POST /api/trips/regenerate-day', () => {
  const store = new MockGenerationStore()
  const app = new Hono<ApiEnv>()
  app.use('*', requestIdMiddleware)
  app.onError(errorHandler)
  app.route(
    '/api',
    createRegenerateDayRoute({
      createPlacesRepo: () => new MockPlacesRepo(),
      createGenerationStore: () => store,
      rateLimitSalt: 'test-salt',
      logTelemetry: () => undefined,
    })
  )

  const validPayload = {
    input: {
      numDays: 2,
      startDate: '2026-11-01',
      companion: 'couple',
      groupSize: 2,
      interests: ['heritage', 'cuisine'],
      pace: 'moderate',
      budget: 'mid',
      transport: 'motorbike',
      start: null,
      notes: null,
    },
    dayIndex: 1,
    date: '2026-11-01',
    lockedItems: [
      {
        placeId: '11111111-1111-4111-8111-111111111111',
        slot: 'morning',
      },
    ],
    excludePlaceIds: [],
  }

  it('returns 400 for invalid payload', async () => {
    const res = await app.request('/api/trips/regenerate-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayIndex: 99 }),
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects duplicate locked places before generation', async () => {
    const payload = {
      ...validPayload,
      lockedItems: [
        { placeId: '11111111-1111-4111-8111-111111111111', slot: 'morning' },
        { placeId: '11111111-1111-4111-8111-111111111111', slot: 'afternoon' },
      ],
    }
    const res = await app.request('/api/trips/regenerate-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(400)
  })

  it('regenerates day preserving locked item and fills missing slots', async () => {
    const res = await app.request('/api/trips/regenerate-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      day: { items: Array<{ placeId: string; slot: string; isLocked: boolean }> }
      generation: { by: string }
    }
    expect(body.generation.by).toBe('fallback')
    expect(body.day.items.length).toBeGreaterThan(0)
    const lockedItem = body.day.items.find(
      (it) => it.placeId === '11111111-1111-4111-8111-111111111111'
    )
    expect(lockedItem).toBeDefined()
    expect(lockedItem?.isLocked).toBe(true)
    expect(lockedItem?.slot).toBe('morning')
  })

  it('keeps a locked item in its requested slot despite a conflicting best_time', async () => {
    const payload = {
      ...validPayload,
      lockedItems: [{ placeId: '11111111-1111-4111-8111-111111111111', slot: 'afternoon' }],
    }
    const res = await app.request('/api/trips/regenerate-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { day: { items: Array<{ placeId: string; slot: string; isLocked: boolean }> } }
    const locked = body.day.items.find(({ placeId }) => placeId === '11111111-1111-4111-8111-111111111111')
    expect(locked).toMatchObject({ slot: 'afternoon', isLocked: true })
  })

  it('does not return a place used on another day', async () => {
    const payload = {
      ...validPayload,
      excludePlaceIds: ['22222222-2222-4222-8222-222222222222'],
    }
    const res = await app.request('/api/trips/regenerate-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { day: { items: Array<{ placeId: string }> } }
    expect(body.day.items.map(({ placeId }) => placeId)).not.toContain('22222222-2222-4222-8222-222222222222')
    expect(new Set(body.day.items.map(({ placeId }) => placeId)).size).toBe(body.day.items.length)
  })

  it('uses LLM first when regenerating a day and records the attempt', async () => {
    const samplePlaces = placeDetailSchema.array().parse(JSON.parse(readFileSync(resolve('tests/fixtures/places.sample.json'), 'utf8')))
    const sampleRecords: CandidateRecord[] = samplePlaces.map((place) => ({
      place, tagWeights: Object.fromEntries(place.tags.map(({ slug }) => [slug, 2])), featured: false,
    }))
    const llmStore = new MockGenerationStore()
    const llmApp = new Hono<ApiEnv>()
    llmApp.use('*', requestIdMiddleware)
    llmApp.onError(errorHandler)
    llmApp.route('/api', createRegenerateDayRoute({
      createPlacesRepo: () => new FixturePlacesRepo(sampleRecords),
      createGenerationStore: () => llmStore,
      createLlmClient: () => new FakeLlmClient('valid'),
      llmEnabled: true,
      rateLimitSalt: 'test-salt',
      logTelemetry: () => undefined,
    }))
    const payload = { ...validPayload, input: { ...validPayload.input, numDays: 1 }, lockedItems: [] }
    const response = await llmApp.request('/api/trips/regenerate-day', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    const body = await response.json() as { generation: { by: string }; day: { items: Array<{ placeId: string }> } }
    expect(response.status).toBe(200)
    expect(body.generation.by).toBe('llm')
    expect(llmStore.recorded.filter(({ llmCallEvent }) => llmCallEvent)).toHaveLength(1)
    expect(new Set(body.day.items.map(({ placeId }) => placeId)).size).toBe(body.day.items.length)
  })

  it('returns 429 when hourly limit exceeded', async () => {
    const fullStore = new MockGenerationStore()
    const now = new Date()
    // Fill 6 recent events within last 10 minutes for guest
    fullStore.events = Array(6).fill(new Date(now.getTime() - 5 * 60 * 1000).toISOString())

    const limitedApp = new Hono<ApiEnv>()
    limitedApp.use('*', requestIdMiddleware)
    limitedApp.onError(errorHandler)
    limitedApp.route(
      '/api',
      createRegenerateDayRoute({
        createPlacesRepo: () => new MockPlacesRepo(),
        createGenerationStore: () => fullStore,
        rateLimitSalt: 'test-salt',
        now: () => now,
        logTelemetry: () => undefined,
      })
    )

    const res = await limitedApp.request('/api/trips/regenerate-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    })
    expect(res.status).toBe(429)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('RATE_LIMITED')
    expect(res.headers.get('Retry-After')).toBeDefined()
  })
})

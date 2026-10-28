import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createAlternativesRoute } from './alternatives'
import { requestIdMiddleware } from '../middleware/requestId'
import { errorHandler } from '../middleware/errorHandler'
import type { PlacesRepo } from '../itinerary/placesRepo'
import type { CandidateRecord } from '../itinerary/types'
import type { ApiEnv } from '../types'

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
]

class MockPlacesRepo implements PlacesRepo {
  async listPublished(): Promise<CandidateRecord[]> {
    return mockRecords
  }
}

describe('POST /api/trips/alternatives', () => {
  const app = new Hono<ApiEnv>()
  app.use('*', requestIdMiddleware)
  app.onError(errorHandler)
  app.route('/api', createAlternativesRoute({
    createPlacesRepo: () => new MockPlacesRepo(),
  }))

  it('returns 400 for invalid JSON body or missing placeId', async () => {
    const res = await app.request('/api/trips/alternatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot: 'morning' }),
    })
    expect(res.status).toBe(400)
    const body = (await res.json()) as { error: { code: string } }
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 200 with alternative items', async () => {
    const res = await app.request('/api/trips/alternatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placeId: '11111111-1111-4111-8111-111111111111',
        slot: 'morning',
        limit: 3,
      }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { items: Array<{ place: { id: string }; reasonTag: string }> }
    expect(Array.isArray(body.items)).toBe(true)
    expect(body.items.length).toBe(1)
    expect(body.items[0].place.id).toBe('22222222-2222-4222-8222-222222222222')
    expect(body.items[0].reasonTag).toBeDefined()
  })
})

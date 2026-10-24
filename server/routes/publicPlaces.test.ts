import { Hono } from 'hono'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlaceListQuery } from '../../shared/schemas/placeQueries'
import { AppError } from '../lib/errors'
import { errorHandler } from '../middleware/errorHandler'
import { publicReadRateLimit } from '../middleware/publicReadRateLimit'
import { requestIdMiddleware } from '../middleware/requestId'
import type { PlaceService } from '../services/placeService'
import type { ApiEnv } from '../types'
import { createPublicPlaceRoutes } from './publicPlaces'

const stubReader = {
  getMeta: vi.fn(async () => ({ tags: [], startPoints: [], categories: [] })),
  validateTagSlugs: vi.fn(async () => true),
  listPlaces: vi.fn(async (filters: PlaceListQuery) => ({
    items: [], page: filters.page, pageSize: filters.pageSize, total: 0,
  })),
  listMapPlaces: vi.fn(async () => ({ items: [] })),
  getPlaceBySlug: vi.fn(async (slug: string) => ({ place: { slug }, nearby: [] })),
}
const reader = stubReader as unknown as Pick<PlaceService, 'getMeta' | 'validateTagSlugs' | 'listPlaces' | 'listMapPlaces' | 'getPlaceBySlug'>

function makeApp(rateLimit = publicReadRateLimit()) {
  const app = new Hono<ApiEnv>()
  app.use('*', requestIdMiddleware)
  app.onError(errorHandler)
  app.route('/api', createPublicPlaceRoutes(reader, rateLimit))
  return app
}

describe('public place API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns public meta with the shared public cache policy', async () => {
    const response = await makeApp().request('/api/meta')
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toContain('public, s-maxage=300')
    expect(await response.json()).toEqual({ tags: [], startPoints: [], categories: [] })
  })

  it('validates filters and returns the requested page', async () => {
    const response = await makeApp().request('/api/places?category=heritage&tag=history&tag=cafe&q=lang%20tu%20duc&sort=name&page=2&pageSize=10')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ items: [], page: 2, pageSize: 10, total: 0 })
    expect(reader.listPlaces).toHaveBeenCalledWith({
      category: 'heritage', tag: ['history', 'cafe'], q: 'lang tu duc', sort: 'name',
      featured: undefined, page: 2, pageSize: 10,
    })
  })

  it('returns 400 for unknown category and unknown interest tag', async () => {
    const app = makeApp()
    const badCategory = await app.request('/api/places?category=lodging')
    expect(badCategory.status).toBe(400)
    const errorPayload = await badCategory.json()
    expect(errorPayload.error.code).toBe('VALIDATION_ERROR')
    expect(errorPayload.error.requestId).toBe(badCategory.headers.get('X-Request-Id'))

    stubReader.validateTagSlugs.mockResolvedValueOnce(false)
    const badTag = await makeApp().request('/api/places?tag=not-a-tag')
    expect(badTag.status).toBe(400)
    expect((await badTag.json()).error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when page size is outside the documented limit', async () => {
    const response = await makeApp().request('/api/places?pageSize=61')
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 429 with Retry-After when the public read IP limit is exceeded', async () => {
    const now = 1_000
    const app = makeApp(publicReadRateLimit(1, 60_000, () => now))
    const headers = { 'x-forwarded-for': '203.0.113.11' }
    expect((await app.request('/api/places', { headers })).status).toBe(200)
    const limited = await app.request('/api/places', { headers })
    expect(limited.status).toBe(429)
    expect(limited.headers.get('Retry-After')).toBe('60')
    expect((await limited.json()).error.code).toBe('RATE_LIMITED')
  })

  it('returns lightweight map data and applies an optional category', async () => {
    const response = await makeApp().request('/api/places/map?category=food')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ items: [] })
    expect(reader.listMapPlaces).toHaveBeenCalledWith({ category: 'food' })
  })

  it('returns place detail and maps an absent slug to 404', async () => {
    const app = makeApp()
    const success = await app.request('/api/places/lang-tu-duc')
    expect(success.status).toBe(200)
    expect(await success.json()).toEqual({ place: { slug: 'lang-tu-duc' }, nearby: [] })

    stubReader.getPlaceBySlug.mockRejectedValueOnce(new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.'))
    const missing = await makeApp().request('/api/places/khong-co')
    expect(missing.status).toBe(404)
    expect((await missing.json()).error.code).toBe('NOT_FOUND')
  })
})

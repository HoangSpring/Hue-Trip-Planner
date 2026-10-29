import { Hono, type MiddlewareHandler } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import type { ApiEnv } from '../types'
import type { PlaceSummary } from '@shared/schemas'
import { createSavedPlacesRoutes } from './savedPlaces'

const place: PlaceSummary = {
  id: 'b0000000-0000-4000-8000-000000000001', slug: 'dai-noi', name: 'Đại Nội', category: 'heritage',
  shortDescription: null, area: null, lat: 16.46, lng: 107.59, coverImageUrl: null, coverImageAlt: null,
  imageCredit: null, imageLicense: null, imageSourceUrl: null, tags: [], verified: true,
}

function makeApp(userId = 'a0000000-0000-4000-8000-000000000001') {
  const saved = new Map<string, Set<string>>()
  const repository = {
    isPublished: vi.fn(async (placeId: string) => placeId === place.id),
    list: vi.fn(async (id: string) => [...(saved.get(id) ?? [])].map(() => place)),
    save: vi.fn(async (id: string, placeId: string) => { const values = saved.get(id) ?? new Set<string>(); values.add(placeId); saved.set(id, values) }),
    remove: vi.fn(async (id: string, placeId: string) => { saved.get(id)?.delete(placeId) }),
  }
  const auth: MiddlewareHandler<ApiEnv> = async (context, next) => {
    context.set('user', { id: userId, email: 'person@example.test' })
    context.set('accessToken', 'jwt')
    await next()
  }
  const app = new Hono<ApiEnv>().route('/api', createSavedPlacesRoutes({ auth: auth as never, createRepository: () => repository }))
  return { app, repository, saved }
}

describe('saved places API', () => {
  it('lists only the authenticated user saved places and accepts category filtering', async () => {
    const { app, repository } = makeApp()
    const response = await app.request('/api/saved?category=heritage')
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(await response.json()).toEqual({ items: [] })
    expect(repository.list).toHaveBeenCalledWith('a0000000-0000-4000-8000-000000000001', 'heritage')
    expect((await app.request('/api/saved?category=bogus')).status).toBe(400)
  })

  it('makes PUT/DELETE idempotent and rejects unknown or unpublished places', async () => {
    const { app, repository, saved } = makeApp()
    const first = await app.request(`/api/saved/${place.id}`, { method: 'PUT' })
    const second = await app.request(`/api/saved/${place.id}`, { method: 'PUT' })
    expect(first.status).toBe(204)
    expect(second.status).toBe(204)
    expect(saved.get('a0000000-0000-4000-8000-000000000001')?.size).toBe(1)
    expect(repository.save).toHaveBeenCalledTimes(2)

    expect((await app.request('/api/saved/not-a-uuid', { method: 'PUT' })).status).toBe(400)
    expect((await app.request('/api/saved/b0000000-0000-4000-8000-000000000099', { method: 'PUT' })).status).toBe(404)
    expect((await app.request(`/api/saved/${place.id}`, { method: 'DELETE' })).status).toBe(204)
    expect((await app.request(`/api/saved/${place.id}`, { method: 'DELETE' })).status).toBe(204)
  })

  it('keeps saved-place ownership scoped to each user id', async () => {
    const state = new Map<string, Set<string>>()
    const createRepository = () => ({
      isPublished: async () => true,
      list: async (id: string) => state.get(id)?.has(place.id) ? [place] : [],
      save: async (id: string, placeId: string) => { const values = state.get(id) ?? new Set<string>(); values.add(placeId); state.set(id, values) },
      remove: async (id: string, placeId: string) => { state.get(id)?.delete(placeId) },
    })
    const build = (id: string) => new Hono<ApiEnv>().route('/api', createSavedPlacesRoutes({
      auth: (async (context, next) => { context.set('user', { id, email: null }); context.set('accessToken', 'jwt'); await next() }) as MiddlewareHandler<ApiEnv>,
      createRepository,
    }))
    await build('a0000000-0000-4000-8000-000000000001').request(`/api/saved/${place.id}`, { method: 'PUT' })
    const bList = await build('a0000000-0000-4000-8000-000000000002').request('/api/saved')
    expect(await bList.json()).toEqual({ items: [] })
    expect(state.get('a0000000-0000-4000-8000-000000000001')?.has(place.id)).toBe(true)
  })

  it('requires authentication', async () => {
    const app = new Hono<ApiEnv>().route('/api', createSavedPlacesRoutes())
    expect((await app.request('/api/saved')).status).toBe(401)
  })
})

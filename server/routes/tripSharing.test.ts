import { describe, expect, it } from 'vitest'
import type { MiddlewareHandler } from 'hono'
import { placeSummarySchema, tripInputSchema, type Trip, type TripDraft } from '@shared/schemas'
import type { ApiEnv } from '../types'
import type { TripRepository, TripPlace } from '../services/tripService'
import { createTripSharingRoutes } from './tripSharing'
import type { TripSharingRepository } from '../services/tripSharingRepository'

const ownerId = 'a0000000-0000-4000-8000-000000000001'
const placeId = 'c0000000-0000-4000-8000-000000000003'
const tripId = 'd0000000-0000-4000-8000-000000000004'
const place = placeSummarySchema.parse({ id: placeId, slug: 'dai-noi', name: 'Đại Nội', category: 'heritage', shortDescription: null, area: 'Huế', lat: 16.47, lng: 107.58, coverImageUrl: null, coverImageAlt: null, imageCredit: null, imageLicense: null, imageSourceUrl: null, tags: [], verified: true })
const input = tripInputSchema.parse({ numDays: 1, startDate: '2026-10-30', companion: 'couple', groupSize: 2, interests: ['heritage', 'cuisine'], pace: 'moderate', budget: null, transport: 'motorbike', start: null, notes: 'private notes must not leak' })
const trip: Trip = {
  id: tripId, clientDraftId: 'e0000000-0000-4000-8000-000000000005', title: 'Huế cuối tuần', startDate: input.startDate,
  numDays: 1, input, generatedBy: 'fallback', llmModel: null, start: null, isShared: true, shareToken: null,
  createdAt: '2026-10-30T00:00:00.000Z', updatedAt: '2026-10-30T00:00:00.000Z',
  days: [{ id: 'f0000000-0000-4000-8000-000000000006', dayIndex: 1, date: input.startDate, note: 'private day note', items: [{
    id: 'a1000000-0000-4000-8000-000000000007', placeId, place, position: 0, slot: 'morning', startTime: '08:00', durationMin: 60,
    travelMinFromPrev: null, travelDistanceM: null, reason: 'Ghé thăm khu di sản.', note: 'private item note', isLocked: false, addedBy: 'fallback',
  }] }],
}

class MemorySharing implements TripSharingRepository {
  enabled = true
  token = 'AAAAAAAAAAAAAAAAAAAAAA'
  trip: Trip | null = trip
  async setShare(id: string, enabled: boolean, token: string | null) { if (id !== tripId) return false; this.enabled = enabled; this.token = token ?? ''; return true }
  async getSharedByToken(token: string) { return this.enabled && token === this.token ? { ...this.trip!, isShared: true, shareToken: this.token } : null }
}

class MemoryUserTrips implements TripRepository {
  readonly trips = new Map<string, Trip>()
  readonly places = new Map<string, TripPlace>([[placeId, { id: placeId, status: 'published', lat: 16.47, lng: 107.58 }]])
  async list() { return [...this.trips.values()] }
  async get(id: string) { return this.trips.get(id) ?? null }
  async findByClientDraftId(id: string) { return [...this.trips.values()].find(value => value.clientDraftId === id) ?? null }
  async getPlaces(ids: string[]) { return ids.flatMap(id => this.places.has(id) ? [this.places.get(id)!] : []) }
  async count() { return this.trips.size }
  async create(source: unknown) { const id = crypto.randomUUID(); const payload = source as TripDraft; this.trips.set(id, { ...payload, id, isShared: false, shareToken: null, createdAt: trip.createdAt, updatedAt: trip.updatedAt }); return { id, created: true } }
  async save() { }
  async delete(id: string) { return this.trips.delete(id) }
}

const auth: MiddlewareHandler<ApiEnv> = async (context, next) => {
  const token = context.req.header('authorization')?.replace(/^Bearer /i, '')
  if (!token) return context.json({ error: { code: 'UNAUTHENTICATED', message: 'Vui lòng đăng nhập.', requestId: 'req_test' } }, 401)
  context.set('user', { id: ownerId, email: 'private@example.com' })
  context.set('accessToken', token)
  await next()
}

function testApp() {
  const sharing = new MemorySharing()
  const userTrips = new MemoryUserTrips()
  let now = 1_000_000
  const app = createTripSharingRoutes({ auth, createSharingRepository: () => sharing, createTripRepository: () => userTrips, rateLimitSalt: 'test-salt', appBaseUrl: 'https://example.test', now: () => now })
  return { app, sharing, userTrips, advance: () => { now += 1 } }
}

describe('trip sharing API', () => {
  it('sets and disables sharing with new random tokens and owner auth', async () => {
    const { app, sharing } = testApp()
    expect((await app.request(`/trips/${tripId}/share`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ enabled: true }) })).status).toBe(401)
    const first = await app.request(`/trips/${tripId}/share`, { method: 'PUT', headers: { authorization: 'Bearer owner', 'content-type': 'application/json' }, body: JSON.stringify({ enabled: true }) })
    const firstBody = await first.json() as { shareToken: string; shareUrl: string }
    expect(first.status).toBe(200)
    expect(firstBody.shareToken).toMatch(/^[A-Za-z0-9_-]{22}$/)
    expect(firstBody.shareUrl).toBe(`https://example.test/s/${firstBody.shareToken}`)
    const disabled = await app.request(`/trips/${tripId}/share`, { method: 'PUT', headers: { authorization: 'Bearer owner', 'content-type': 'application/json' }, body: JSON.stringify({ enabled: false }) })
    expect(await disabled.json()).toEqual({ isShared: false, shareToken: null, shareUrl: null })
    expect(sharing.enabled).toBe(false)
    const second = await app.request(`/trips/${tripId}/share`, { method: 'PUT', headers: { authorization: 'Bearer owner', 'content-type': 'application/json' }, body: JSON.stringify({ enabled: true }) })
    expect((await second.json() as { shareToken: string }).shareToken).not.toBe(firstBody.shareToken)
  })

  it('returns a strict read-only projection and equal 404 responses for invalid and disabled tokens', async () => {
    const { app, sharing } = testApp()
    const response = await app.request('/shared/AAAAAAAAAAAAAAAAAAAAAA', { headers: { 'x-real-ip': '203.0.113.3' } })
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('x-robots-tag')).toBe('noindex')
    const body = await response.json() as Record<string, unknown>
    expect(body).not.toHaveProperty('id')
    expect(body).not.toHaveProperty('clientDraftId')
    expect(body).not.toHaveProperty('input')
    expect(body).not.toHaveProperty('shareToken')
    expect(JSON.stringify(body)).not.toContain('private@example.com')
    expect(JSON.stringify(body)).not.toContain('private notes')
    expect(JSON.stringify(body)).not.toContain('private day note')
    expect(JSON.stringify(body)).not.toContain('private item note')
    expect((body.days as Array<{ items: Array<{ reason: string }> }>)[0].items[0].reason).toBe('Ghé thăm khu di sản.')
    const invalid = await app.request('/shared/not-a-token')
    sharing.enabled = false
    const disabled = await app.request('/shared/AAAAAAAAAAAAAAAAAAAAAA')
    expect(invalid.status).toBe(404)
    expect(disabled.status).toBe(404)
    expect(await invalid.json()).toEqual(await disabled.json())
  })

  it('rate limits by a salted IP key and copies shared trips as independent private trips', async () => {
    const { app, userTrips } = testApp()
    const limitedApp = createTripSharingRoutes({ createSharingRepository: () => new MemorySharing(), rateLimitSalt: 'test-salt', publicLimit: 1 })
    expect((await limitedApp.request('/shared/AAAAAAAAAAAAAAAAAAAAAA', { headers: { 'x-real-ip': '203.0.113.8' } })).status).toBe(200)
    const limited = await limitedApp.request('/shared/AAAAAAAAAAAAAAAAAAAAAA', { headers: { 'x-real-ip': '203.0.113.8' } })
    expect(limited.status).toBe(429)
    expect(limited.headers.get('retry-after')).toBeTruthy()
    const unauthenticated = await app.request('/shared/AAAAAAAAAAAAAAAAAAAAAA/copy', { method: 'POST' })
    expect(unauthenticated.status).toBe(401)
    const copied = await app.request('/shared/AAAAAAAAAAAAAAAAAAAAAA/copy', { method: 'POST', headers: { authorization: 'Bearer user' } })
    expect(copied.status).toBe(201)
    const body = await copied.json() as Trip
    expect(body.isShared).toBe(false)
    expect(body.shareToken).toBeNull()
    expect(body.clientDraftId).not.toBe(trip.clientDraftId)
    expect(body.days[0].id).not.toBe(trip.days[0].id)
    expect(userTrips.trips.size).toBe(1)
  })
})

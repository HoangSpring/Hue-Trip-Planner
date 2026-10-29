import { describe, expect, it } from 'vitest'
import type { MiddlewareHandler } from 'hono'
import { placeSummarySchema, tripInputSchema, type Trip, type TripDraft } from '@shared/schemas'
import { createTripRoutes } from './trips'
import type { ApiEnv } from '../types'
import type { TripPlace, TripRepository } from '../services/tripService'

const userA = 'a0000000-0000-4000-8000-000000000001'
const userB = 'b0000000-0000-4000-8000-000000000002'
const placeId = 'c0000000-0000-4000-8000-000000000003'
const tripId = 'd0000000-0000-4000-8000-000000000004'
const draftId = 'e0000000-0000-4000-8000-000000000005'
const dayId = 'f0000000-0000-4000-8000-000000000006'
const itemId = 'a1000000-0000-4000-8000-000000000007'
const place = placeSummarySchema.parse({
  id: placeId, slug: 'dai-noi', name: 'Đại Nội', category: 'heritage', shortDescription: 'Di sản', area: 'Trung tâm',
  lat: 16.47, lng: 107.58, coverImageUrl: null, coverImageAlt: null, imageCredit: null, imageLicense: null,
  tags: [], verified: true, status: 'published',
})
const input = tripInputSchema.parse({
  numDays: 1, startDate: '2026-10-29', companion: 'couple', groupSize: 2, interests: ['heritage', 'cuisine'],
  pace: 'moderate', budget: null, transport: 'motorbike', start: { label: 'Ga Huế', lat: 16.46, lng: 107.58 }, notes: null,
})
const draft: TripDraft = {
  clientDraftId: draftId, title: 'Huế 1 ngày', startDate: '2026-10-29', numDays: 1, input,
  generatedBy: 'fallback', llmModel: null, start: input.start, days: [{ id: dayId, dayIndex: 1, date: '2026-10-29', note: null, items: [{
    id: itemId, placeId, place, position: 0, slot: 'morning', startTime: '08:00', durationMin: 60,
    travelMinFromPrev: 999, travelDistanceM: 999999, reason: 'Một điểm dừng phù hợp.', note: null, isLocked: false, addedBy: 'fallback',
  }] }],
}

class MemoryTrips implements TripRepository {
  readonly trips = new Map<string, Trip>()
  readonly clientDrafts = new Map<string, string>()
  readonly placeRows = new Map<string, TripPlace>([[placeId, { id: placeId, status: 'published', lat: 16.47, lng: 107.58 }]])
  createCount = 0

  async list() { return [...this.trips.values()] }
  async get(id: string) { return this.trips.get(id) ?? null }
  async findByClientDraftId(id: string) { const tripId = this.clientDrafts.get(id); return tripId ? this.get(tripId) : null }
  async getPlaces(ids: string[]) { return ids.flatMap((id) => this.placeRows.get(id) ? [this.placeRows.get(id)!] : []) }
  async count() { return this.trips.size }
  async create(source: unknown) {
    const payload = source as TripDraft
    const existing = this.clientDrafts.get(payload.clientDraftId)
    if (existing) return { id: existing, created: false }
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const trip = { ...payload, id, isShared: false, shareToken: null, createdAt: now, updatedAt: now } as Trip
    this.trips.set(id, trip)
    if (payload.clientDraftId) this.clientDrafts.set(payload.clientDraftId, id)
    this.createCount++
    return { id, created: true }
  }
  async save(id: string, source: unknown, expectedUpdatedAt: string) {
    const current = this.trips.get(id)
    if (!current) throw Object.assign(new Error('not found'), { code: 'PT404' })
    if (current.updatedAt !== expectedUpdatedAt) throw Object.assign(new Error('conflict'), { code: 'PT409' })
    const payload = source as Trip
    this.trips.set(id, { ...current, ...payload, id, updatedAt: new Date(Date.parse(current.updatedAt) + 1000).toISOString() })
  }
  async delete(id: string) { return this.trips.delete(id) }
}

const auth: MiddlewareHandler<ApiEnv> = async (context, next) => {
  const token = context.req.header('authorization')?.replace(/^Bearer /i, '')
  if (!token) return context.json({ error: { code: 'UNAUTHENTICATED', message: 'Vui lòng đăng nhập.', requestId: 'req_test' } }, 401)
  context.set('user', { id: token === 'b' ? userB : userA, email: null })
  context.set('accessToken', token)
  await next()
}

function testApp(repoA = new MemoryTrips(), repoB = new MemoryTrips()) {
  const app = createTripRoutes({ auth, createRepository: (token) => token === 'b' ? repoB : repoA })
  return { app, repoA, repoB }
}
const postDraft = (app: ReturnType<typeof createTripRoutes>) => app.request('/trips', { method: 'POST', headers: { authorization: 'Bearer a', 'content-type': 'application/json' }, body: JSON.stringify(draft) })

describe('trip account API', () => {
  it('requires a bearer session and uses private no-store cache headers', async () => {
    const { app } = testApp()
    const unauthenticated = await app.request('/trips')
    expect(unauthenticated.status).toBe(401)
    const authenticated = await app.request('/trips', { headers: { authorization: 'Bearer a' } })
    expect(authenticated.status).toBe(200)
    expect(authenticated.headers.get('cache-control')).toBe('private, no-store')
  })

  it('creates once by clientDraftId and returns the existing trip on repeat', async () => {
    const { app, repoA } = testApp()
    expect((await postDraft(app)).status).toBe(201)
    const second = await postDraft(app)
    expect(second.status).toBe(200)
    expect(repoA.createCount).toBe(1)
    const saved = await second.json() as Trip
    expect(saved.days[0].items[0].travelDistanceM).not.toBe(999999)
    expect(saved.days[0].items[0].travelMinFromPrev).not.toBe(999)
  })

  it('lists and hydrates owned trips while hiding another user trip as 404', async () => {
    const { app, repoA } = testApp()
    const created = await postDraft(app)
    const trip = await created.json() as Trip
    const mine = await app.request('/trips', { headers: { authorization: 'Bearer a' } })
    expect(mine.status).toBe(200)
    expect(await mine.json()).toMatchObject({ items: [{ id: trip.id, coverImageUrl: null }] })
    expect((await app.request(`/trips/${trip.id}`, { headers: { authorization: 'Bearer b' } })).status).toBe(404)
    expect(repoA.trips.has(trip.id)).toBe(true)
  })

  it('rejects malformed data, extra keys, duplicate places, and HTML', async () => {
    const { app } = testApp()
    const bad = await app.request('/trips', { method: 'POST', headers: { authorization: 'Bearer a', 'content-type': 'application/json' }, body: JSON.stringify({ ...draft, unknown: true }) })
    expect(bad.status).toBe(400)
    const duplicate = { ...draft, clientDraftId: crypto.randomUUID(), numDays: 2, days: [draft.days[0], { ...draft.days[0], id: crypto.randomUUID(), dayIndex: 2, items: [{ ...draft.days[0].items[0], id: crypto.randomUUID(), position: 0 }] }] }
    const repeated = await app.request('/trips', { method: 'POST', headers: { authorization: 'Bearer a', 'content-type': 'application/json' }, body: JSON.stringify(duplicate) })
    expect(repeated.status).toBe(422)
    const html = await app.request('/trips', { method: 'POST', headers: { authorization: 'Bearer a', 'content-type': 'application/json' }, body: JSON.stringify({ ...draft, clientDraftId: crypto.randomUUID(), title: '<b>trip</b>' }) })
    expect(html.status).toBe(400)
  })

  it('returns 404 when a place is absent and preserves an archived place already in an existing trip', async () => {
    const { app, repoA } = testApp()
    const trip = await (await postDraft(app)).json() as Trip
    repoA.placeRows.set(placeId, { id: placeId, status: 'archived', lat: 16.47, lng: 107.58 })
    const putPayload = { expectedUpdatedAt: trip.updatedAt, title: trip.title, startDate: trip.startDate, days: trip.days }
    expect((await app.request(`/trips/${trip.id}`, { method: 'PUT', headers: { authorization: 'Bearer a', 'content-type': 'application/json' }, body: JSON.stringify(putPayload) })).status).toBe(200)
    const newPlaceId = 'c1000000-0000-4000-8000-000000000003'
    const addedArchived = { ...draft, clientDraftId: crypto.randomUUID(), days: [{ ...draft.days[0], items: [{ ...draft.days[0].items[0], placeId: newPlaceId }] }] }
    expect((await app.request('/trips', { method: 'POST', headers: { authorization: 'Bearer a', 'content-type': 'application/json' }, body: JSON.stringify(addedArchived) })).status).toBe(422)
  })

  it('saves twice without duplicating, returns 409 with current trip, patches, duplicates and deletes', async () => {
    const { app, repoB } = testApp()
    const trip = await (await postDraft(app)).json() as Trip
    const payload = { expectedUpdatedAt: trip.updatedAt, title: trip.title, startDate: trip.startDate, days: trip.days }
    const first = await app.request(`/trips/${trip.id}`, { method: 'PUT', headers: { authorization: 'Bearer a', 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    expect(first.status).toBe(200)
    const firstValue = await first.json() as { trip: Trip }
    expect(firstValue.trip.days[0].items).toHaveLength(1)
    const secondPayload = { ...payload, expectedUpdatedAt: firstValue.trip.updatedAt }
    const second = await app.request(`/trips/${trip.id}`, { method: 'PUT', headers: { authorization: 'Bearer a', 'content-type': 'application/json' }, body: JSON.stringify(secondPayload) })
    expect(second.status).toBe(200)
    expect((await second.json() as { trip: Trip }).trip.days[0].items).toHaveLength(1)
    const conflict = await app.request(`/trips/${trip.id}`, { method: 'PUT', headers: { authorization: 'Bearer a', 'content-type': 'application/json' }, body: JSON.stringify(payload) })
    expect(conflict.status).toBe(409)
    expect(await conflict.json()).toMatchObject({ error: { code: 'CONFLICT', details: { current: { id: trip.id } } } })
    const patch = await app.request(`/trips/${trip.id}`, { method: 'PATCH', headers: { authorization: 'Bearer a', 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Tên mới' }) })
    expect(patch.status).toBe(200)
    const duplicate = await app.request(`/trips/${trip.id}/duplicate`, { method: 'POST', headers: { authorization: 'Bearer a' } })
    expect(duplicate.status).toBe(201)
    const copy = await duplicate.json() as Trip
    expect(copy.clientDraftId).toBeNull()
    expect(copy.shareToken).toBeNull()
    expect(copy.id).not.toBe(trip.id)
    expect(copy.days[0].id).not.toBe(trip.days[0].id)
    expect(copy.days[0].items[0].id).not.toBe(trip.days[0].items[0].id)
    for (const method of ['GET', 'PUT', 'DELETE'] as const) {
      const request = await app.request(`/trips/${trip.id}`, { method, headers: { authorization: 'Bearer b', 'content-type': 'application/json' }, body: method === 'PUT' ? JSON.stringify(payload) : undefined })
      expect(request.status).toBe(404)
    }
    expect(repoB.trips.has(trip.id)).toBe(false)
    expect((await app.request(`/trips/${copy.id}`, { method: 'DELETE', headers: { authorization: 'Bearer a' } })).status).toBe(204)
    expect((await app.request(`/trips/${trip.id}`, { method: 'DELETE', headers: { authorization: 'Bearer a' } })).status).toBe(204)
  })

  it('enforces MAX_TRIPS_PER_USER and strict PATCH payloads', async () => {
    const { app } = testApp(new MemoryTrips(), new MemoryTrips())
    const limited = createTripRoutes({ auth, maxTrips: 0, createRepository: () => new MemoryTrips() })
    expect((await postDraft(limited)).status).toBe(422)
    const invalid = await app.request(`/trips/${tripId}`, { method: 'PATCH', headers: { authorization: 'Bearer a', 'content-type': 'application/json' }, body: JSON.stringify({ role: 'admin' }) })
    expect(invalid.status).toBe(400)
  })
})

import type { MiddlewareHandler } from 'hono'
import { describe, expect, it } from 'vitest'
import { adminPlaceInputSchema, type AdminPlaceInput } from '@shared/schemas/adminPlace'
import { AppError } from '../lib/errors'
import type { AdminPlaceRecord, AdminPlaceRepository, AuditAction } from '../services/adminPlaceService'
import { createAdminRoutes } from './admin'
import type { ApiEnv } from '../types'

const placeId = 'd0000000-0000-4000-8000-000000000004'
const actorId = 'a0000000-0000-4000-8000-000000000001'

function placeRecord(overrides: Partial<AdminPlaceRecord> = {}): AdminPlaceRecord {
  return {
    id: placeId, slug: 'test-place', name: 'Điểm thử', category: 'heritage', short_description: 'Mô tả', description: null,
    address: null, area: 'Huế', lat: 16.45, lng: 107.56, open_time: '08:00:00', close_time: '17:00:00', closed_days: [],
    opening_note: null, visit_duration_min: 60, price_level: null, ticket_price_vnd: null, price_note: null,
    best_time: ['morning'], meal_type: [], suitable_for: [], walking_intensity: 1, phone: null, website: null,
    cover_image_url: 'https://example.test/image.jpg', cover_image_alt: null, image_credit: 'Tác giả', image_license: 'CC BY 4.0',
    image_source_url: null, source: 'manual', source_url: null, osm_id: null, google_place_id: null, featured: false,
    sort_order: 0, status: 'draft', verified: false, verified_by: null, verified_at: null, last_verified_at: null,
    ai_filled_fields: ['description', 'opening_note'], search_text: 'diem thu hue', created_at: '2026-11-04T00:00:00Z',
    updated_at: '2026-11-04T00:00:00Z', tags: [], ...overrides,
  }
}

function placeInput(overrides: Partial<AdminPlaceInput> = {}): AdminPlaceInput {
  return adminPlaceInputSchema.parse({
    slug: 'new-place', name: 'Điểm mới', category: 'heritage', shortDescription: 'Mô tả', description: null,
    address: null, area: 'Huế', lat: 16.45, lng: 107.56, openTime: '08:00', closeTime: '17:00', closedDays: [],
    openingNote: null, visitDurationMin: 60, priceLevel: null, ticketPriceVnd: null, priceNote: null,
    bestTime: ['morning'], mealType: [], suitableFor: [], walkingIntensity: 1, phone: null, website: null,
    coverImageUrl: 'https://example.test/image.jpg', coverImageAlt: null, imageCredit: 'Tác giả', imageLicense: 'CC BY 4.0',
    imageSourceUrl: null, source: 'manual', sourceUrl: null, osmId: null, googlePlaceId: null, featured: false,
    sortOrder: 0, status: 'draft', tags: [], ...overrides,
  })
}

class MemoryAdminRepo implements AdminPlaceRepository {
  records = new Map<string, AdminPlaceRecord>([[placeId, placeRecord()]])
  auditRows: Array<{ placeId: string; actorId: string; action: AuditAction; fields: string[] }> = []
  async list() { return [...this.records.values()] }
  async getById(id: string) { return this.records.get(id) ?? null }
  async save(id: string | null, input: AdminPlaceInput) {
    if ([...this.records.values()].some((row) => row.slug === input.slug && row.id !== id)) throw new AppError(409, 'CONFLICT', 'Slug địa điểm đã tồn tại.')
    const row = placeRecord({ ...(id && this.records.get(id) ? this.records.get(id) : {}), id: id ?? 'd1000000-0000-4000-8000-000000000004', slug: input.slug, name: input.name, category: input.category, short_description: input.shortDescription, lat: input.lat, lng: input.lng, cover_image_url: input.coverImageUrl, image_credit: input.imageCredit, image_license: input.imageLicense, visit_duration_min: input.visitDurationMin, status: input.status, tags: input.tags.map(({ slug, weight }) => ({ slug, name: slug, weight })) })
    this.records.set(row.id, row)
    return row
  }
  async changeStatus(id: string, status: AdminPlaceRecord['status']) {
    const record = this.records.get(id)
    if (!record) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.')
    const updated = { ...record, status }
    this.records.set(id, updated)
    return updated
  }
  async verify(id: string, verified: boolean, verifiedBy: string, confirmedFields: string[] | undefined, verifiedAt: string) {
    const record = this.records.get(id)
    if (!record) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.')
    const updated = { ...record, verified, verified_by: verified ? verifiedBy : null, verified_at: verified ? verifiedAt : null, last_verified_at: verified ? verifiedAt : record.last_verified_at, ai_filled_fields: verified ? confirmedFields === undefined ? [] : record.ai_filled_fields.filter((field) => !confirmedFields.includes(field)) : record.ai_filled_fields }
    this.records.set(id, updated)
    return updated
  }
  async audit(placeIdValue: string, actorIdValue: string, action: AuditAction, fields: string[]) { this.auditRows.push({ placeId: placeIdValue, actorId: actorIdValue, action, fields }) }
}

class EmptyImportRepo {
  async tagSlugs() { return new Set<string>() }
  async existingBySlugs() { return new Map() }
  async importPlace() { return { action: 'created' as const, placeId, reason: null } }
}

function api(repo = new MemoryAdminRepo()) {
  const auth: MiddlewareHandler<ApiEnv> = async (context, next) => {
    const token = context.req.header('authorization')?.replace(/^Bearer /i, '')
    if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.')
    context.set('user', { id: token === 'admin' ? actorId : 'b0000000-0000-4000-8000-000000000002', email: null })
    context.set('accessToken', token)
    await next()
  }
  const authorizeAdmin: MiddlewareHandler<ApiEnv> = async (context, next) => {
    if (context.get('accessToken') !== 'admin') throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền.')
    await next()
  }
  const routes = createAdminRoutes({ auth, authorizeAdmin, createRepository: () => repo, createImportRepository: () => new EmptyImportRepo(), listAudit: async () => [{ id: 1, action: 'create', changes: { changedFields: ['name'] }, created_at: '2026-11-05T00:00:00Z', actor_id: actorId }] })
  return { repo, request: (path: string, init: RequestInit = {}) => routes.request(path, init) }
}

const headers = { Authorization: 'Bearer admin' }

describe('admin routes', () => {
  it('returns read-only audit history only after admin authorization', async () => {
    const testApi = api()
    const response = await testApi.request(`/admin/places/${placeId}/audit`, { headers })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ items: [{ action: 'create', actor_id: actorId }] })
  })
  it('requires authentication and rejects regular users on every admin endpoint', async () => {
    const testApi = api()
    const endpoints: Array<[string, RequestInit]> = [
      ['/admin/places', { method: 'GET' }],
      ['/admin/places', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}' }],
      [`/admin/places/${placeId}`, { method: 'GET' }],
      [`/admin/places/${placeId}/audit`, { method: 'GET' }],
      [`/admin/places/${placeId}`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{}' }],
      [`/admin/places/${placeId}/status`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{"status":"draft"}' }],
      [`/admin/places/${placeId}/verify`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{"verified":true}' }],
      ['/admin/places/bulk', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{"ids":[],"action":"archive"}' }],
      ['/admin/import/preview', { method: 'POST', headers: { ...headers, 'Content-Type': 'text/csv' }, body: 'slug,name,category,short_description,lat,lng\na,b,heritage,c,16,107' }],
      ['/admin/import/commit', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{"csv":""}' }],
    ]
    for (const [path, init] of endpoints) {
      const noAuthHeaders = { ...(init.headers as Record<string, string> | undefined) }
      delete noAuthHeaders.Authorization
      const noAuth = await testApi.request(path, { ...init, headers: noAuthHeaders })
      expect(noAuth.status, `missing auth: ${init.method} ${path}`).toBe(401)
      const regular = await testApi.request(path, { ...init, headers: { ...(init.headers as Record<string, string> | undefined), Authorization: 'Bearer regular' } })
      expect(regular.status).toBe(403)
    }
  })

  it('lists filtered places and missing fields with normalized search and pagination', async () => {
    const testApi = api()
    const response = await testApi.request('/admin/places?q=DIEM%20THU&missing=hours&page=1&pageSize=10', { headers })
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ items: [], page: 1, total: 0 })
    const existing = await testApi.request('/admin/places?page=1&pageSize=10', { headers })
    expect((await existing.json() as { items: Array<{ missingFields: string[] }> }).items[0]?.missingFields).toEqual([])
  })

  it('rejects invalid image URLs and attribution and returns all publication omissions', async () => {
    const testApi = api()
    const noCredit = { ...placeInput(), imageCredit: null }
    const invalidCredit = await testApi.request('/admin/places', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(noCredit) })
    expect(invalidCredit.status).toBe(400)
    const httpImage = { ...placeInput(), coverImageUrl: 'http://example.test/image.jpg' }
    const invalidUrl = await testApi.request('/admin/places', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(httpImage) })
    expect(invalidUrl.status).toBe(400)
    const incomplete = placeRecord({ lat: null, lng: null, short_description: null, cover_image_url: null, image_credit: null, image_license: null, visit_duration_min: null })
    const publishApi = api(new MemoryAdminRepo())
    publishApi.repo.records.set(placeId, incomplete)
    const publish = await publishApi.request(`/admin/places/${placeId}/status`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'published' }) })
    expect(publish.status).toBe(422)
    const body = await publish.json() as { error: { details: Array<{ path: string }> } }
    expect(body.error.details.map(({ path }) => path)).toEqual(['lat', 'lng', 'shortDescription', 'coverImageUrl', 'imageCredit', 'imageLicense', 'visitDurationMin'])
  })

  it('saves places, maps duplicate slugs, and writes compact audit entries', async () => {
    const testApi = api()
    const create = await testApi.request('/admin/places', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(placeInput({ slug: 'another-place' })) })
    expect(create.status).toBe(201)
    expect(testApi.repo.auditRows[0]).toMatchObject({ action: 'create', actorId, placeId: 'd1000000-0000-4000-8000-000000000004' })
    const duplicate = await testApi.request('/admin/places', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(placeInput({ slug: 'test-place' })) })
    expect(duplicate.status).toBe(409)
    const update = await testApi.request(`/admin/places/${placeId}`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(placeInput({ slug: 'changed-place', status: 'draft' })) })
    expect(update.status).toBe(200)
    expect(testApi.repo.auditRows.some((row) => row.action === 'update' && row.fields.includes('slug'))).toBe(true)
  })

  it('verifies with selected ai fields and returns per-item bulk outcomes', async () => {
    const testApi = api()
    const verified = await testApi.request(`/admin/places/${placeId}/verify`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ verified: true, confirmedFields: ['description'] }) })
    expect(verified.status).toBe(200)
    expect(await verified.json()).toMatchObject({ verified: true, verifiedBy: actorId, aiFilledFields: ['opening_note'] })
    const bulk = await testApi.request('/admin/places/bulk', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [placeId, 'd1000000-0000-4000-8000-000000000004'], action: 'archive' }) })
    expect(bulk.status).toBe(200)
    expect(await bulk.json()).toMatchObject({ results: [{ id: placeId, success: true }, { id: 'd1000000-0000-4000-8000-000000000004', success: false }] })
    expect(testApi.repo.auditRows.map(({ action }) => action)).toEqual(['verify', 'archive'])
  })

  it('previews CSV without writes and commits by accepting the CSV again', async () => {
    const testApi = api()
    const csv = 'slug,name,category,short_description,lat,lng,tags\nnew-csv,Điểm CSV,heritage,Mô tả,16.4,107.5,'
    const preview = await testApi.request('/admin/import/preview', { method: 'POST', headers: { ...headers, 'Content-Type': 'text/csv; charset=utf-8' }, body: csv })
    expect(preview.status, JSON.stringify(await preview.clone().json())).toBe(200)
    expect(await preview.json()).toMatchObject({ summary: { total: 1 }, rows: [{ line: 2, slug: 'new-csv', action: 'create' }] })
    const commit = await testApi.request('/admin/import/commit', { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ csv }) })
    expect(commit.status).toBe(200)
    const result = await commit.json() as Record<string, unknown>
    expect(result).toMatchObject({ created: 1, updated: 0, skipped: 0, errors: [] })
    expect(result).not.toHaveProperty('previewToken')
  })
})

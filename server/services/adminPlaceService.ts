import type { AdminPlaceInput, AdminPlaceListQuery, AdminPlaceStatus } from '@shared/schemas/adminPlace'
import { adminPlaceInputSchema } from '@shared/schemas/adminPlace'
import type { Tables } from '../../src/types/supabase'
import { AppError } from '../lib/errors'
import { normalizePlaceSearch } from './placeService'

export type AdminTag = { slug: string; name: string; weight: number }
export type AdminPlaceRecord = Tables<'places'> & { tags: AdminTag[] }
export type AuditAction = 'create' | 'update' | 'publish' | 'unpublish' | 'archive' | 'verify' | 'unverify' | 'import'

export type AdminPlaceFilters = Pick<AdminPlaceListQuery, 'status' | 'verified' | 'category' | 'q'>

export interface AdminPlaceRepository {
  list(filters: AdminPlaceFilters): Promise<AdminPlaceRecord[]>
  getById(id: string): Promise<AdminPlaceRecord | null>
  save(id: string | null, place: AdminPlaceInput): Promise<AdminPlaceRecord>
  changeStatus(id: string, status: AdminPlaceStatus): Promise<AdminPlaceRecord>
  verify(id: string, verified: boolean, verifiedBy: string, confirmedFields: string[] | undefined, verifiedAt: string): Promise<AdminPlaceRecord>
  audit(placeId: string, actorId: string, action: AuditAction, changedFields: string[]): Promise<void>
}

export const missingFieldMessages: Record<string, string> = {
  lat: 'Thiếu vĩ độ.',
  lng: 'Thiếu kinh độ.',
  shortDescription: 'Thiếu mô tả ngắn.',
  coverImageUrl: 'Thiếu ảnh bìa.',
  imageCredit: 'Thiếu tên tác giả ảnh.',
  imageLicense: 'Thiếu giấy phép ảnh.',
  visitDurationMin: 'Thiếu thời lượng tham quan.',
}

export function missingPublishFields(place: Pick<AdminPlaceRecord, 'lat' | 'lng' | 'short_description' | 'cover_image_url' | 'image_credit' | 'image_license' | 'visit_duration_min'>): { path: string; message: string }[] {
  const missing: string[] = []
  if (place.lat === null) missing.push('lat')
  if (place.lng === null) missing.push('lng')
  if (!place.short_description?.trim()) missing.push('shortDescription')
  if (!place.cover_image_url) missing.push('coverImageUrl')
  if (!place.image_credit?.trim()) missing.push('imageCredit')
  if (!place.image_license?.trim()) missing.push('imageLicense')
  if (place.visit_duration_min === null) missing.push('visitDurationMin')
  return missing.map((path) => ({ path, message: missingFieldMessages[path] ?? 'Thiếu dữ liệu bắt buộc.' }))
}

export function calculateMissingFields(place: Pick<AdminPlaceRecord, 'open_time' | 'close_time' | 'visit_duration_min' | 'cover_image_url' | 'image_credit' | 'image_license' | 'lat' | 'lng' | 'category' | 'meal_type' | 'best_time'>): string[] {
  const missing: string[] = []
  if (place.open_time === null || place.close_time === null) missing.push('hours')
  if (place.visit_duration_min === null) missing.push('duration')
  if (place.cover_image_url === null || place.image_credit === null || place.image_license === null) missing.push('image')
  if (place.lat === null || place.lng === null) missing.push('coords')
  if (place.category === 'food' && place.meal_type.length === 0) missing.push('meal_type')
  if (place.best_time.length === 0) missing.push('best_time')
  return missing
}

function timeValue(value: string | null): string | null {
  return value === null ? null : `${value}:00`
}

export function toAdminPlaceDatabaseFields(place: AdminPlaceInput) {
  return {
    slug: place.slug,
    name: place.name,
    category: place.category,
    short_description: place.shortDescription,
    description: place.description,
    address: place.address,
    area: place.area,
    lat: place.lat,
    lng: place.lng,
    open_time: timeValue(place.openTime),
    close_time: timeValue(place.closeTime),
    closed_days: place.closedDays,
    opening_note: place.openingNote,
    visit_duration_min: place.visitDurationMin,
    price_level: place.priceLevel,
    ticket_price_vnd: place.ticketPriceVnd,
    price_note: place.priceNote,
    best_time: place.bestTime,
    meal_type: place.mealType,
    suitable_for: place.suitableFor,
    walking_intensity: place.walkingIntensity,
    phone: place.phone,
    website: place.website,
    cover_image_url: place.coverImageUrl,
    cover_image_alt: place.coverImageAlt,
    image_credit: place.imageCredit,
    image_license: place.imageLicense,
    image_source_url: place.imageSourceUrl,
    source: place.source,
    source_url: place.sourceUrl,
    osm_id: place.osmId,
    google_place_id: place.googlePlaceId,
    featured: place.featured,
    sort_order: place.sortOrder,
    status: place.status,
  }
}

export class AdminPlaceService {
  constructor(private readonly repository: AdminPlaceRepository) {}

  async list(filters: AdminPlaceListQuery) {
    const q = filters.q ? normalizePlaceSearch(filters.q) : undefined
    const records = await this.repository.list({ status: filters.status, verified: filters.verified, category: filters.category, q })
    const filtered = filters.missing ? records.filter((place) => calculateMissingFields(place).includes(filters.missing!)) : records
    const start = (filters.page - 1) * filters.pageSize
    return {
      items: filtered.slice(start, start + filters.pageSize).map((place) => this.toView(place)),
      page: filters.page,
      pageSize: filters.pageSize,
      total: filtered.length,
    }
  }

  async get(id: string) {
    const place = await this.repository.getById(id)
    if (!place) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.')
    return this.toView(place)
  }

  async create(value: unknown, actorId: string) {
    const place = this.parseInput(value)
    const record = await this.repository.save(null, place)
    await this.repository.audit(record.id, actorId, 'create', Object.keys(toAdminPlaceDatabaseFields(place)))
    return this.toView(record)
  }

  async update(id: string, value: unknown, actorId: string) {
    const place = this.parseInput(value)
    const previous = await this.repository.getById(id)
    if (!previous) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.')
    const changed = Object.entries(toAdminPlaceDatabaseFields(place))
      .filter(([key, value]) => JSON.stringify(previous[key as keyof Tables<'places'>]) !== JSON.stringify(value))
      .map(([key]) => key)
    const record = await this.repository.save(id, place)
    if (changed.length) await this.repository.audit(id, actorId, 'update', changed)
    return this.toView(record)
  }

  async changeStatus(id: string, status: AdminPlaceStatus, actorId: string) {
    const previous = await this.repository.getById(id)
    if (!previous) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.')
    if (status === previous.status) return this.toView(previous)
    const allowed: Record<AdminPlaceStatus, AdminPlaceStatus[]> = {
      draft: ['published', 'archived'],
      published: ['draft', 'archived'],
      archived: ['draft'],
    }
    if (!allowed[previous.status as AdminPlaceStatus]?.includes(status)) {
      throw new AppError(422, 'BUSINESS_RULE_VIOLATION', 'Không thể chuyển địa điểm sang trạng thái này.')
    }
    if (status === 'published') {
      const missing = missingPublishFields(previous)
      if (missing.length) throw new AppError(422, 'BUSINESS_RULE_VIOLATION', 'Bổ sung thông tin bắt buộc trước khi xuất bản.', missing)
    }
    const record = await this.repository.changeStatus(id, status)
    const action: AuditAction = status === 'published' ? 'publish' : status === 'draft' ? 'unpublish' : 'archive'
    await this.repository.audit(id, actorId, action, ['status'])
    return this.toView(record)
  }

  async verify(id: string, verified: boolean, confirmedFields: string[] | undefined, actorId: string) {
    const previous = await this.repository.getById(id)
    if (!previous) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.')
    const record = await this.repository.verify(id, verified, actorId, confirmedFields, new Date().toISOString())
    if (previous.verified !== verified || verified) {
      await this.repository.audit(id, actorId, verified ? 'verify' : 'unverify', [
        'verified', 'verified_by', 'verified_at', 'last_verified_at', 'ai_filled_fields',
      ])
    }
    return this.toView(record)
  }

  async bulk(ids: string[], action: 'publish' | 'unpublish' | 'archive' | 'verify' | 'unverify', actorId: string) {
    const results = await Promise.all(ids.map(async (id) => {
      try {
        if (action === 'verify' || action === 'unverify') {
          await this.verify(id, action === 'verify', undefined, actorId)
        } else {
          const status = action === 'publish' ? 'published' : action === 'unpublish' ? 'draft' : 'archived'
          await this.changeStatus(id, status, actorId)
        }
        return { id, success: true as const }
      } catch (error) {
        return { id, success: false as const, reason: error instanceof AppError ? error.message : 'Không thể cập nhật địa điểm lúc này.' }
      }
    }))
    return { results }
  }

  private parseInput(value: unknown): AdminPlaceInput {
    const parsed = adminPlaceInputSchema.safeParse(value)
    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Thông tin địa điểm chưa hợp lệ.', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })))
    }
    return parsed.data
  }

  private toView(place: AdminPlaceRecord) {
    const parsed = adminPlaceInputSchema.parse({
      slug: place.slug, name: place.name, category: place.category, shortDescription: place.short_description,
      description: place.description, address: place.address, area: place.area, lat: place.lat, lng: place.lng,
      openTime: place.open_time?.slice(0, 5) ?? null, closeTime: place.close_time?.slice(0, 5) ?? null,
      closedDays: place.closed_days, openingNote: place.opening_note, visitDurationMin: place.visit_duration_min,
      priceLevel: place.price_level, ticketPriceVnd: place.ticket_price_vnd, priceNote: place.price_note,
      bestTime: place.best_time, mealType: place.meal_type, suitableFor: place.suitable_for,
      walkingIntensity: place.walking_intensity, phone: place.phone, website: place.website,
      coverImageUrl: place.cover_image_url, coverImageAlt: place.cover_image_alt, imageCredit: place.image_credit,
      imageLicense: place.image_license, imageSourceUrl: place.image_source_url, source: place.source,
      sourceUrl: place.source_url, osmId: place.osm_id, googlePlaceId: place.google_place_id,
      featured: place.featured, sortOrder: place.sort_order, status: place.status,
      tags: place.tags.map(({ slug, weight }) => ({ slug, weight })),
    })
    return {
      id: place.id,
      ...parsed,
      verified: place.verified,
      verifiedBy: place.verified_by,
      verifiedAt: place.verified_at,
      lastVerifiedAt: place.last_verified_at,
      aiFilledFields: place.ai_filled_fields,
      createdAt: place.created_at,
      updatedAt: place.updated_at,
      missingFields: calculateMissingFields(place),
    }
  }
}

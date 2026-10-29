import { randomUUID } from 'node:crypto'
import {
  tripCreateRequestSchema,
  tripPatchRequestSchema,
  tripReplaceRequestSchema,
  tripSchema,
  type Trip,
  type TripCreateRequest,
  type TripPatchRequest,
  type TripReplaceRequest,
} from '@shared/schemas'
import { estimateTravel } from '@shared/itinerary'
import { computeWarnings } from '@shared/itinerary'
import { AppError } from '../lib/errors'

export type TripPlace = { id: string; status: 'published' | 'archived' | 'draft'; lat: number | null; lng: number | null }
export type TripListRow = Pick<Trip, 'id' | 'title' | 'numDays' | 'startDate' | 'isShared' | 'updatedAt'> & { coverImageUrl: string | null }

export interface TripRepository {
  list(): Promise<Trip[]>
  get(id: string): Promise<Trip | null>
  findByClientDraftId(id: string): Promise<Trip | null>
  getPlaces(ids: string[]): Promise<TripPlace[]>
  count(): Promise<number>
  create(payload: unknown): Promise<{ id: string; created: boolean }>
  save(id: string, payload: unknown, expectedUpdatedAt: string): Promise<void>
  delete(id: string): Promise<boolean>
}

function sanitizeText(value: string, path: string): string {
  const sanitized = value.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').trim()
  if (/<\/?[a-z][^>]*>/i.test(sanitized)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Không chấp nhận nội dung HTML.', [{ path, message: 'Chỉ nhập văn bản thuần.' }])
  }
  return sanitized
}

function sanitizeRequiredText(value: string, path: string): string {
  const result = sanitizeText(value, path)
  if (!result) throw new AppError(400, 'VALIDATION_ERROR', 'Trường bắt buộc không được để trống.', [{ path, message: 'Nhập nội dung văn bản.' }])
  return result
}

function sanitizeNullable(value: string | null, path: string): string | null {
  return value === null ? null : sanitizeText(value, path)
}

function sanitizeDraft(source: unknown): TripCreateRequest {
  const parsed = tripCreateRequestSchema.safeParse(source)
  if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu chuyến đi chưa hợp lệ.', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })))
  const draft = parsed.data
  return {
    ...draft,
    title: sanitizeRequiredText(draft.title, 'title'),
    input: { ...draft.input, notes: sanitizeNullable(draft.input.notes, 'input.notes'), start: draft.input.start ? { ...draft.input.start, label: sanitizeRequiredText(draft.input.start.label, 'input.start.label') } : null },
    days: draft.days.map((day, dayIndex) => ({
      ...day,
      note: sanitizeNullable(day.note, `days.${dayIndex}.note`),
      items: day.items.map((item, itemIndex) => ({
        ...item,
        reason: sanitizeNullable(item.reason, `days.${dayIndex}.items.${itemIndex}.reason`),
        note: sanitizeNullable(item.note, `days.${dayIndex}.items.${itemIndex}.note`),
      })),
    })),
  }
}

function sanitizeReplace(source: unknown): TripReplaceRequest {
  const parsed = tripReplaceRequestSchema.safeParse(source)
  if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Nội dung cập nhật chuyến đi chưa hợp lệ.', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })))
  return {
    ...parsed.data,
    title: sanitizeRequiredText(parsed.data.title, 'title'),
    days: parsed.data.days.map((day, dayIndex) => ({
      ...day,
      note: sanitizeNullable(day.note, `days.${dayIndex}.note`),
      items: day.items.map((item, itemIndex) => ({
        ...item,
        reason: sanitizeNullable(item.reason, `days.${dayIndex}.items.${itemIndex}.reason`),
        note: sanitizeNullable(item.note, `days.${dayIndex}.items.${itemIndex}.note`),
      })),
    })),
  }
}

function dateAtOffset(startDate: string | null, offset: number): string | null {
  if (!startDate) return null
  const date = new Date(`${startDate}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

export class TripService {
  constructor(private readonly repository: TripRepository, private readonly maxTrips = 50) {}

  async list(): Promise<TripListRow[]> {
    const trips = await this.repository.list()
    return trips.map((trip) => ({
      id: trip.id, title: trip.title, numDays: trip.numDays, startDate: trip.startDate,
      isShared: trip.isShared, updatedAt: trip.updatedAt,
      coverImageUrl: trip.days.flatMap((day) => day.items).find((item) => item.place?.coverImageUrl)?.place?.coverImageUrl ?? null,
    }))
  }

  async get(id: string): Promise<Trip> {
    const trip = await this.repository.get(id)
    if (!trip) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy chuyến đi.')
    return tripSchema.parse(trip)
  }

  async create(source: unknown): Promise<{ trip: Trip; created: boolean }> {
    const draft = sanitizeDraft(source)
    const existing = await this.repository.findByClientDraftId(draft.clientDraftId)
    if (existing) return { trip: existing, created: false }
    if (await this.repository.count() >= this.maxTrips) throw new AppError(422, 'BUSINESS_RULE_VIOLATION', 'Bạn đã đạt giới hạn số chuyến đi.')
    const places = await this.validatePlaces(draft.days.flatMap((day) => day.items.map((item) => item.placeId)), new Set())
    const payload = { ...draft, days: this.recalculateTravel(draft.days, draft.input.start, draft.input.transport, places) }
    const result = await this.repository.create(payload)
    const trip = await this.get(result.id)
    return { trip, created: result.created }
  }

  async replace(id: string, source: unknown): Promise<{ trip: Trip; warnings: ReturnType<typeof computeWarnings> }> {
    const current = await this.get(id)
    const request = sanitizeReplace(source)
    if (request.days.length !== current.numDays) throw new AppError(422, 'BUSINESS_RULE_VIOLATION', 'Không thể thay đổi số ngày của chuyến đi.')
    const previousIds = new Set(current.days.flatMap((day) => day.items.map((item) => item.placeId)))
    const places = await this.validatePlaces(request.days.flatMap((day) => day.items.map((item) => item.placeId)), previousIds)
    const days = this.recalculateTravel(request.days, current.input.start, current.input.transport, places)
    const payload = { ...current, title: request.title, startDate: request.startDate, days }
    try {
      await this.repository.save(id, payload, request.expectedUpdatedAt)
    } catch (error) {
      if (isConflict(error)) throw new AppError(409, 'CONFLICT', 'Lịch trình đã thay đổi ở nơi khác. Tải lại?', { current: await this.get(id) })
      throw error
    }
    const trip = await this.get(id)
    return { trip, warnings: computeWarnings({ ...trip, transport: trip.input.transport, pace: trip.input.pace, companion: trip.input.companion, start: trip.input.start }) }
  }

  async patch(id: string, source: unknown): Promise<Trip> {
    const parsed = tripPatchRequestSchema.safeParse(source)
    if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu đổi tên/ngày chưa hợp lệ.', parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })))
    const patch: TripPatchRequest = {
      ...(parsed.data.title === undefined ? {} : { title: sanitizeRequiredText(parsed.data.title, 'title') }),
      ...(parsed.data.startDate === undefined ? {} : { startDate: parsed.data.startDate }),
    }
    const current = await this.get(id)
    const startDate = patch.startDate === undefined ? current.startDate : patch.startDate
    const days = patch.startDate === undefined
      ? current.days
      : current.days.map((day) => ({ ...day, date: dateAtOffset(startDate, day.dayIndex - 1) }))
    try {
      await this.repository.save(id, { ...current, title: patch.title ?? current.title, startDate, days }, current.updatedAt)
    } catch (error) {
      if (isConflict(error)) throw new AppError(409, 'CONFLICT', 'Lịch trình đã thay đổi ở nơi khác. Tải lại?', { current: await this.get(id) })
      throw error
    }
    return this.get(id)
  }

  async remove(id: string): Promise<void> {
    if (!(await this.repository.delete(id))) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy chuyến đi.')
  }

  async duplicate(id: string): Promise<Trip> {
    const current = await this.get(id)
    if (await this.repository.count() >= this.maxTrips) throw new AppError(422, 'BUSINESS_RULE_VIOLATION', 'Bạn đã đạt giới hạn số chuyến đi.')
    const places = await this.validatePlaces(current.days.flatMap((day) => day.items.map((item) => item.placeId)), new Set(current.days.flatMap((day) => day.items.map((item) => item.placeId))))
    const payload = {
      ...current,
      clientDraftId: null,
      title: sanitizeRequiredText(`${current.title.slice(0, 90)} (bản sao)`, 'title'),
      isShared: false,
      shareToken: null,
      days: this.recalculateTravel(current.days.map((day) => ({ ...day, id: randomUUID(), items: day.items.map((item) => ({ ...item, id: randomUUID() })) })), current.input.start, current.input.transport, places),
    }
    const result = await this.repository.create(payload)
    return this.get(result.id)
  }

  private async validatePlaces(ids: string[], previouslyUsed: Set<string>): Promise<Map<string, TripPlace>> {
    if (new Set(ids).size !== ids.length) throw new AppError(422, 'BUSINESS_RULE_VIOLATION', 'Không thể lặp địa điểm trong chuyến đi.')
    const rows = await this.repository.getPlaces([...new Set(ids)])
    const byId = new Map(rows.map((row) => [row.id, row]))
    for (const id of ids) {
      const place = byId.get(id)
      if (!place || (place.status !== 'published' && !(place.status === 'archived' && previouslyUsed.has(id)))) {
        throw new AppError(422, 'BUSINESS_RULE_VIOLATION', 'Có địa điểm không còn khả dụng trong chuyến đi.', [{ path: 'days', message: `Địa điểm ${id} không được xuất bản.` }])
      }
    }
    return byId
  }

  private recalculateTravel<T extends { items: Array<{ placeId: string; position: number; travelMinFromPrev: number | null; travelDistanceM: number | null }> }>(
    days: T[], start: { lat: number; lng: number } | null, transport: Trip['input']['transport'], places: Map<string, TripPlace>
  ): T[] {
    return days.map((day) => {
      let previous = start
      const items = [...day.items].sort((a, b) => a.position - b.position).map((item, position) => {
        const place = places.get(item.placeId)
        const coords = place?.lat === null || place?.lat === undefined || place.lng === null || place.lng === undefined ? null : { lat: place.lat, lng: place.lng }
        const estimate = previous && coords ? estimateTravel(previous, coords, transport) : null
        if (coords) previous = coords
        return { ...item, position, travelMinFromPrev: estimate?.travelMin ?? null, travelDistanceM: estimate ? Math.round(estimate.distanceKm * 1000) : null }
      })
      return { ...day, items }
    })
  }
}

function isConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'PT409'
}

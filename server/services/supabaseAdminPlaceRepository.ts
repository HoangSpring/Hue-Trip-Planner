import type { SupabaseClient } from '@supabase/supabase-js'
import type { AdminPlaceInput, AdminPlaceStatus } from '@shared/schemas/adminPlace'
import type { Database, Json, Tables } from '../../src/types/supabase'
import { AppError } from '../lib/errors'
import type { AdminPlaceFilters, AdminPlaceRecord, AdminPlaceRepository, AuditAction } from './adminPlaceService'
import { toAdminPlaceDatabaseFields } from './adminPlaceService'

type JoinedPlace = Tables<'places'> & { place_tags: { weight: number; tags: { slug: string; name: string } | null }[] }

function withTags(row: JoinedPlace): AdminPlaceRecord {
  const { place_tags: placeTags, ...place } = row
  return { ...place, tags: placeTags.flatMap((link) => link.tags ? [{ ...link.tags, weight: link.weight }] : []) }
}

function fail(error: { code?: string; message?: string; details?: string } | null): never {
  if (error?.code === '23505') throw new AppError(409, 'CONFLICT', 'Slug địa điểm đã tồn tại.')
  if (error?.code === '23514') {
    const details = error.message ?? ''
    const message = details.includes('places_open_close_ok')
      ? 'Giờ mở và giờ đóng phải cùng có hoặc cùng trống.'
      : details.includes('places_image_credit_required')
        ? 'Ảnh bìa cần có tên tác giả và giấy phép.'
        : details.includes('places_published_requires_core')
          ? 'Bổ sung các trường bắt buộc trước khi xuất bản.'
          : 'Một trường địa điểm không đạt điều kiện dữ liệu.'
    throw new AppError(400, 'VALIDATION_ERROR', message)
  }
  if (error?.code === 'PT404') throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.')
  if (error?.code === '42501') throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.')
  if (error?.code === '23503') throw new AppError(400, 'VALIDATION_ERROR', 'Một hoặc nhiều tag không tồn tại.')
  if (error?.code === '22023') throw new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu địa điểm chưa hợp lệ.')
  throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể lưu địa điểm lúc này.')
}

export class SupabaseAdminPlaceRepository implements AdminPlaceRepository {
  constructor(private readonly userClient: SupabaseClient<Database>, private readonly auditClient: SupabaseClient<Database>) {}

  async list(filters: AdminPlaceFilters): Promise<AdminPlaceRecord[]> {
    let query = this.userClient.from('places').select('*,place_tags(weight,tags(slug,name))')
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.verified !== undefined) query = query.eq('verified', filters.verified)
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.q) query = query.ilike('search_text', `%${filters.q.replace(/[\\%_]/g, '\\$&')}%`)
    const { data, error } = await query.order('name', { ascending: true })
    if (error || !data) return fail(error)
    return (data as unknown as JoinedPlace[]).map(withTags)
  }

  async getById(id: string): Promise<AdminPlaceRecord | null> {
    const { data, error } = await this.userClient.from('places').select('*,place_tags(weight,tags(slug,name))').eq('id', id).maybeSingle()
    if (error) return fail(error)
    return data ? withTags(data as unknown as JoinedPlace) : null
  }

  async save(id: string | null, place: AdminPlaceInput): Promise<AdminPlaceRecord> {
    const p_place = { ...toAdminPlaceDatabaseFields(place), ...(id ? { id } : {}) } as unknown as Json
    const p_tags = place.tags as unknown as Json
    const { data, error } = await this.userClient.rpc('admin_save_place_with_tags', { p_place, p_tags })
    if (error || !data) return fail(error)
    const record = await this.getById(data)
    if (!record) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Đã lưu địa điểm nhưng chưa thể tải lại dữ liệu.')
    return record
  }

  async changeStatus(id: string, status: AdminPlaceStatus): Promise<AdminPlaceRecord> {
    const { error } = await this.userClient.from('places').update({ status }).eq('id', id)
    if (error) return fail(error)
    const record = await this.getById(id)
    if (!record) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.')
    return record
  }

  async verify(id: string, verified: boolean, verifiedBy: string, confirmedFields: string[] | undefined, verifiedAt: string): Promise<AdminPlaceRecord> {
    const current = await this.getById(id)
    if (!current) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.')
    const fields = verified
      ? confirmedFields === undefined ? [] : current.ai_filled_fields.filter((field) => !confirmedFields.includes(field))
      : current.ai_filled_fields
    const { error } = await this.userClient.from('places').update({
      verified,
      verified_by: verified ? verifiedBy : null,
      verified_at: verified ? verifiedAt : null,
      last_verified_at: verified ? verifiedAt : current.last_verified_at,
      ai_filled_fields: fields,
    }).eq('id', id)
    if (error) return fail(error)
    const updated = await this.getById(id)
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.')
    return updated
  }

  async audit(placeId: string, actorId: string, action: AuditAction, changedFields: string[]): Promise<void> {
    const { error } = await this.auditClient.from('place_audit_log').insert({
      place_id: placeId,
      actor_id: actorId,
      action,
      changes: { changedFields } as Json,
    })
    if (error) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể ghi nhật ký thay đổi địa điểm.')
  }
}

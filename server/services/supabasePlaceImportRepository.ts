import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '../../src/types/supabase'
import { AppError } from '../lib/errors'
import type { ImportExistingPlace, PlaceImportRepository } from './importService'

export class SupabasePlaceImportRepository implements PlaceImportRepository {
  constructor(private readonly userClient: SupabaseClient<Database>, private readonly writeClient: SupabaseClient<Database>) {}

  async tagSlugs(slugs: string[]): Promise<Set<string>> {
    if (!slugs.length) return new Set()
    const { data, error } = await this.userClient.from('tags').select('slug').in('slug', slugs)
    if (error || !data) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể kiểm tra tag import.')
    return new Set(data.map(({ slug }) => slug))
  }

  async existingBySlugs(slugs: string[]): Promise<Map<string, ImportExistingPlace>> {
    const output = new Map<string, ImportExistingPlace>()
    for (let offset = 0; offset < slugs.length; offset += 100) {
      const batch = slugs.slice(offset, offset + 100)
      if (!batch.length) continue
      const { data, error } = await this.userClient.from('places').select('id,slug,status,verified,source').in('slug', batch)
      if (error || !data) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể kiểm tra địa điểm đã có.')
      for (const row of data) output.set(row.slug, row)
    }
    return output
  }

  async upsertPlace(row: Record<string, unknown>): Promise<string> {
    const insert = row as unknown as Database['public']['Tables']['places']['Insert']
    const { data, error } = await this.writeClient.from('places').upsert(insert, { onConflict: 'slug' }).select('id').single()
    if (error || !data) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể ghi địa điểm từ CSV.')
    return data.id
  }

  async replaceTags(placeId: string, tags: Array<{ slug: string; weight: number }>): Promise<void> {
    const slugs = tags.map(({ slug }) => slug)
    const { data, error: loadError } = await this.writeClient.from('tags').select('id,slug').in('slug', slugs)
    if (loadError || !data || data.length !== slugs.length) throw new AppError(400, 'VALIDATION_ERROR', 'Một hoặc nhiều tag không tồn tại.')
    const idBySlug = new Map(data.map(({ id, slug }) => [slug, id]))
    const { error: deleteError } = await this.writeClient.from('place_tags').delete().eq('place_id', placeId)
    if (deleteError) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể cập nhật tag địa điểm.')
    const rows = tags.map(({ slug, weight }) => ({ place_id: placeId, tag_id: idBySlug.get(slug)!, weight }))
    const { error } = await this.writeClient.from('place_tags').insert(rows)
    if (error) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể cập nhật tag địa điểm.')
  }

  async audit(placeId: string, actorId: string, changedFields: string[]): Promise<void> {
    const { error } = await this.writeClient.from('place_audit_log').insert({
      place_id: placeId,
      actor_id: actorId,
      action: 'import',
      changes: { changedFields } as Json,
    })
    if (error) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể ghi nhật ký import.')
  }
}

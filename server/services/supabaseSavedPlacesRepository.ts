import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '../../src/types/supabase'
import type { Category, PlaceSummary } from '@shared/schemas'
import { mapPlaceSummary, type PlaceTag } from '../mappers/place'
import { AppError } from '../lib/errors'
import type { SavedPlacesRepository } from './savedPlacesService'

type PlaceRow = Tables<'places'>

export class SupabaseSavedPlacesRepository implements SavedPlacesRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async isPublished(placeId: string): Promise<boolean> {
    const { data, error } = await this.client.from('places').select('id').eq('id', placeId).eq('status', 'published').maybeSingle()
    if (error) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Dịch vụ địa điểm chưa sẵn sàng.')
    return Boolean(data)
  }

  async list(userId: string, category?: Category): Promise<PlaceSummary[]> {
    const { data: saved, error: savedError } = await this.client.from('saved_places').select('place_id, created_at').eq('user_id', userId).order('created_at', { ascending: false })
    if (savedError) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể tải địa điểm đã lưu.')
    const ids = (saved ?? []).map(row => row.place_id)
    if (!ids.length) return []

    let placesQuery = this.client.from('places').select('*').in('id', ids).eq('status', 'published')
    if (category) placesQuery = placesQuery.eq('category', category)
    const { data: places, error: placesError } = await placesQuery
    if (placesError) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể tải địa điểm đã lưu.')
    const rows = (places ?? []) as PlaceRow[]
    if (!rows.length) return []

    const placeIds = rows.map(row => row.id)
    const { data: links, error: linksError } = await this.client.from('place_tags').select('place_id, tag_id').in('place_id', placeIds)
    if (linksError) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể tải địa điểm đã lưu.')
    const tagIds = [...new Set((links ?? []).map(link => link.tag_id))]
    const { data: tags, error: tagsError } = tagIds.length
      ? await this.client.from('tags').select('id, slug, name').in('id', tagIds)
      : { data: [], error: null }
    if (tagsError) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể tải địa điểm đã lưu.')
    const tagsById = new Map((tags ?? []).map(tag => [tag.id, { slug: tag.slug, name: tag.name }]))
    const tagsByPlace = new Map<string, PlaceTag[]>()
    for (const link of links ?? []) {
      const tag = tagsById.get(link.tag_id)
      if (!tag) continue
      const current = tagsByPlace.get(link.place_id) ?? []
      current.push(tag)
      tagsByPlace.set(link.place_id, current)
    }
    const summaries = new Map(rows.map(row => [row.id, mapPlaceSummary(row, tagsByPlace.get(row.id) ?? [])]))
    return ids.map(id => summaries.get(id)).filter((place): place is PlaceSummary => Boolean(place))
  }

  async save(userId: string, placeId: string): Promise<void> {
    const { error } = await this.client.from('saved_places').upsert({ user_id: userId, place_id: placeId }, { onConflict: 'user_id,place_id', ignoreDuplicates: true })
    if (error) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể lưu địa điểm lúc này.')
  }

  async remove(userId: string, placeId: string): Promise<void> {
    const { error } = await this.client.from('saved_places').delete().eq('user_id', userId).eq('place_id', placeId)
    if (error) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể bỏ lưu địa điểm lúc này.')
  }
}

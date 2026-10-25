import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlaceListQuery, PlaceMapQuery } from '../../shared/schemas/placeQueries'
import type { Database } from '../../src/types/supabase'
import { AppError } from '../lib/errors'
import {
  mapNearbyPlace,
  mapPlaceDetail,
  mapPlaceMapItem,
  mapPlaceSummary,
  type NearbyPlaceRow,
  type PlaceRow,
  type PlaceTag,
} from '../mappers/place'

const categoryNames = [
  { slug: 'heritage', name: 'Di sản' },
  { slug: 'food', name: 'Ẩm thực' },
  { slug: 'cafe', name: 'Cà phê' },
  { slug: 'sightseeing', name: 'Tham quan' },
  { slug: 'shopping', name: 'Mua sắm' },
] as const

export function normalizePlaceSearch(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[đĐ]/g, 'd').toLocaleLowerCase('vi-VN').trim()
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

function serviceUnavailable(): AppError {
  return new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể tải dữ liệu địa điểm lúc này.')
}

export class PlaceService {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getMeta() {
    const [tagsResponse, pointsResponse] = await Promise.all([
      this.client.from('tags').select('slug,name,icon,image_url').eq('kind', 'interest').order('sort_order'),
      this.client.from('start_points').select('slug,name,lat,lng').order('sort_order'),
    ])
    if (tagsResponse.error || pointsResponse.error || !tagsResponse.data || !pointsResponse.data) throw serviceUnavailable()
    return {
      tags: tagsResponse.data.map((tag) => ({ slug: tag.slug, name: tag.name, icon: tag.icon, imageUrl: tag.image_url })),
      startPoints: pointsResponse.data,
      categories: categoryNames,
    }
  }

  async validateTagSlugs(slugs: string[]): Promise<boolean> {
    if (!slugs.length) return true
    const { data, error } = await this.client.from('tags').select('slug').eq('kind', 'interest').in('slug', slugs)
    if (error || !data) throw serviceUnavailable()
    return new Set(data.map(({ slug }) => slug)).size === new Set(slugs).size
  }

  private async getTagsByPlaceIds(placeIds: string[]): Promise<Map<string, PlaceTag[]>> {
    const output = new Map<string, PlaceTag[]>()
    if (!placeIds.length) return output
    const { data: links, error: linksError } = await this.client
      .from('place_tags')
      .select('place_id,tag_id')
      .in('place_id', placeIds)
    if (linksError || !links) throw serviceUnavailable()
    const tagIds = [...new Set(links.map(({ tag_id }) => tag_id))]
    if (!tagIds.length) return output
    const { data: tags, error: tagsError } = await this.client.from('tags').select('id,slug,name').in('id', tagIds)
    if (tagsError || !tags) throw serviceUnavailable()
    const tagsById = new Map(tags.map((tag) => [tag.id, { slug: tag.slug, name: tag.name }]))
    for (const link of links) {
      const tag = tagsById.get(link.tag_id)
      if (!tag) continue
      const current = output.get(link.place_id) ?? []
      current.push(tag)
      output.set(link.place_id, current)
    }
    for (const placeTags of output.values()) placeTags.sort((left, right) => left.slug.localeCompare(right.slug))
    return output
  }

  private async getTagFilteredPlaceIds(slugs: string[]): Promise<string[] | null> {
    if (!slugs.length) return null
    const { data: tags, error: tagError } = await this.client.from('tags').select('id,slug').eq('kind', 'interest').in('slug', slugs)
    if (tagError || !tags) throw serviceUnavailable()
    if (new Set(tags.map(({ slug }) => slug)).size !== new Set(slugs).size) return []
    const tagIds = tags.map(({ id }) => id)
    const { data: links, error: linkError } = await this.client.from('place_tags').select('place_id').in('tag_id', tagIds)
    if (linkError || !links) throw serviceUnavailable()
    return [...new Set(links.map(({ place_id }) => place_id))]
  }

  async listPlaces(filters: PlaceListQuery) {
    const tagPlaceIds = await this.getTagFilteredPlaceIds(filters.tag ?? [])
    if (tagPlaceIds?.length === 0) return { items: [], page: filters.page, pageSize: filters.pageSize, total: 0 }

    let query = this.client.from('places').select('*', { count: 'exact' }).eq('status', 'published')
    if (filters.category) query = query.eq('category', filters.category)
    if (filters.featured === 'true') query = query.eq('featured', true)
    if (tagPlaceIds) query = query.in('id', tagPlaceIds)
    if (filters.q) query = query.ilike('search_text', `%${escapeLikePattern(normalizePlaceSearch(filters.q))}%`)
    query = filters.sort === 'name'
      ? query.order('name', { ascending: true })
      : query.order('featured', { ascending: false }).order('sort_order', { ascending: true }).order('name', { ascending: true })
    const from = (filters.page - 1) * filters.pageSize
    const { data, count, error } = await query.range(from, from + filters.pageSize - 1)
    if (error || !data) throw serviceUnavailable()
    const tags = await this.getTagsByPlaceIds(data.map(({ id }) => id))
    return {
      items: data.map((place) => mapPlaceSummary(place, tags.get(place.id) ?? [])),
      page: filters.page,
      pageSize: filters.pageSize,
      total: count ?? 0,
    }
  }

  async listMapPlaces(filters: PlaceMapQuery) {
    let query = this.client.from('places').select('*').eq('status', 'published').not('lat', 'is', null).not('lng', 'is', null)
    if (filters.category) query = query.eq('category', filters.category)
    const { data, error } = await query.order('sort_order', { ascending: true }).order('name', { ascending: true })
    if (error || !data) throw serviceUnavailable()
    return { items: data.map(mapPlaceMapItem) }
  }

  async getPlaceBySlug(slug: string) {
    const { data: place, error } = await this.client.from('places').select('*').eq('slug', slug).eq('status', 'published').maybeSingle()
    if (error) throw serviceUnavailable()
    if (!place) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.')
    const [tags, imagesResponse, nearby] = await Promise.all([
      this.getTagsByPlaceIds([place.id]),
      this.client.from('place_images').select('*').eq('place_id', place.id).order('sort_order', { ascending: true }),
      this.getNearbyPlaces(place.lat ?? 0, place.lng ?? 0, [place.id], 5),
    ])
    if (imagesResponse.error || !imagesResponse.data) throw serviceUnavailable()
    return {
      place: mapPlaceDetail(place, tags.get(place.id) ?? [], imagesResponse.data),
      nearby,
    }
  }

  async getNearbyPlaces(lat: number, lng: number, excludeIds: string[] = [], limit = 5) {
    const { data, error } = await this.client.rpc('nearby_places', {
      p_lat: lat,
      p_lng: lng,
      p_limit: limit,
      p_exclude: excludeIds,
    })
    if (error || !data) throw serviceUnavailable()
    const rows = data as NearbyPlaceRow[]
    const ids = rows.map(({ id }) => id)
    const [tags, sourceResponse] = await Promise.all([
      this.getTagsByPlaceIds(ids),
      ids.length ? this.client.from('places').select('id,image_source_url').in('id', ids) : Promise.resolve({ data: [], error: null }),
    ])
    if (sourceResponse.error || !sourceResponse.data) throw serviceUnavailable()
    const sourceById = new Map(sourceResponse.data.map((place) => [place.id, place.image_source_url]))
    return rows.map((place) => mapNearbyPlace(place, tags.get(place.id) ?? [], sourceById.get(place.id) ?? null))
  }
}

export function isPublishedPlace(row: PlaceRow): boolean {
  return row.status === 'published'
}

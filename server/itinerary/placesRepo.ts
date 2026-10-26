import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/types/supabase'
import { mapPlaceDetail, type PlaceImageRow, type PlaceRow, type PlaceTag } from '../mappers/place'
import type { CandidateRecord } from './types'

export interface PlacesRepo {
  listPublished(signal?: AbortSignal): Promise<CandidateRecord[]>
  getDataQuality?(): PlaceDataQuality
}

export type PlaceDataQuality = { published: number; missingCoordinates: number; missingVisitDuration: number }

/** Read-only adapter used by the generator. All data is fetched in batches. */
export class SupabasePlacesRepo implements PlacesRepo {
  private quality: PlaceDataQuality = { published: 0, missingCoordinates: 0, missingVisitDuration: 0 }

  constructor(private readonly client: SupabaseClient<Database>) {}

  getDataQuality(): PlaceDataQuality { return this.quality }

  async listPublished(signal?: AbortSignal): Promise<CandidateRecord[]> {
    const { data: rows, error } = await this.client.from('places').select('*').eq('status', 'published').order('slug')
    if (error || !rows) throw new Error('Không thể tải địa điểm đã xuất bản.')
    if (signal?.aborted) throw new DOMException('Đã hủy yêu cầu.', 'AbortError')
    this.quality = {
      published: rows.length,
      missingCoordinates: rows.filter((row) => row.lat === null || row.lng === null).length,
      missingVisitDuration: rows.filter((row) => row.visit_duration_min === null).length,
    }
    const eligibleRows = rows.filter((row) => row.lat !== null && row.lng !== null &&
      row.visit_duration_min !== null && row.visit_duration_min > 0)
    const ids = eligibleRows.map(({ id }) => id)
    if (!ids.length) return []

    const [linksResponse, imagesResponse] = await Promise.all([
      this.client.from('place_tags').select('place_id,tag_id,weight').in('place_id', ids),
      this.client.from('place_images').select('*').in('place_id', ids).order('sort_order'),
    ])
    if (linksResponse.error || !linksResponse.data || imagesResponse.error || !imagesResponse.data) {
      throw new Error('Không thể tải thông tin địa điểm.')
    }
    const tagIds = [...new Set(linksResponse.data.map(({ tag_id }) => tag_id))]
    const tagsResponse = tagIds.length
      ? await this.client.from('tags').select('id,slug,name').in('id', tagIds)
      : { data: [], error: null }
    if (tagsResponse.error || !tagsResponse.data) throw new Error('Không thể tải tag địa điểm.')

    const tagById = new Map(tagsResponse.data.map((tag) => [tag.id, { slug: tag.slug, name: tag.name }]))
    const linksByPlace = new Map<string, { tag: PlaceTag; weight: number }[]>()
    for (const link of linksResponse.data) {
      const tag = tagById.get(link.tag_id)
      if (!tag) continue
      const links = linksByPlace.get(link.place_id) ?? []
      links.push({ tag, weight: link.weight })
      linksByPlace.set(link.place_id, links)
    }
    const imagesByPlace = new Map<string, PlaceImageRow[]>()
    for (const image of imagesResponse.data) {
      const images = imagesByPlace.get(image.place_id) ?? []
      images.push(image)
      imagesByPlace.set(image.place_id, images)
    }

    return eligibleRows.map((row) => {
      const links = linksByPlace.get(row.id) ?? []
      return {
        place: mapPlaceDetail(row as PlaceRow, links.map(({ tag }) => tag), imagesByPlace.get(row.id) ?? []),
        tagWeights: Object.fromEntries(links.map(({ tag, weight }) => [tag.slug, weight])),
        featured: row.featured,
      }
    })
  }
}

/** Fixture adapter deliberately has no Supabase dependency and is safe in unit tests. */
export class FixturePlacesRepo implements PlacesRepo {
  constructor(private readonly records: readonly CandidateRecord[]) {}

  async listPublished(signal?: AbortSignal): Promise<CandidateRecord[]> {
    if (signal?.aborted) throw new DOMException('Đã hủy yêu cầu.', 'AbortError')
    return this.records.filter(({ place }) => place.status === 'published').map((record) => ({
      ...record,
      tagWeights: { ...record.tagWeights },
    }))
  }
}

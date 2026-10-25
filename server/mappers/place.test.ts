import { describe, expect, it } from 'vitest'
import { mapPlaceDetail, mapPlaceMapItem, mapPlaceSummary, type PlaceRow } from './place'

const row = {
  id: '123e4567-e89b-42d3-a456-426614174000',
  slug: 'lang-tu-duc',
  name: 'Lăng Tự Đức',
  category: 'heritage',
  short_description: 'Di tích thử nghiệm',
  description: 'Mô tả',
  address: 'Huế',
  area: 'Tây Huế',
  lat: 16.4,
  lng: 107.6,
  open_time: '07:30:00',
  close_time: '17:00:00',
  closed_days: [1],
  opening_note: null,
  visit_duration_min: 90,
  price_level: 1,
  ticket_price_vnd: null,
  price_note: null,
  best_time: ['morning'],
  meal_type: [],
  suitable_for: ['family_kids'],
  walking_intensity: 2,
  phone: null,
  website: null,
  cover_image_url: null,
  cover_image_alt: null,
  image_credit: null,
  image_license: null,
  image_source_url: null,
  source: 'manual',
  source_url: null,
  osm_id: null,
  google_place_id: null,
  featured: true,
  sort_order: 1,
  status: 'published',
  verified: true,
  verified_by: null,
  verified_at: null,
  last_verified_at: null,
  ai_filled_fields: [],
  search_text: 'lang tu duc hue tay hue',
  created_at: '2026-10-24T00:00:00.000Z',
  updated_at: '2026-10-24T00:00:00.000Z',
} satisfies PlaceRow

describe('place mapper', () => {
  it('maps database field names and tag relations to the public summary DTO', () => {
    expect(mapPlaceSummary(row, [{ slug: 'heritage', name: 'Di sản' }])).toEqual(expect.objectContaining({
      id: row.id,
      slug: 'lang-tu-duc',
      shortDescription: 'Di tích thử nghiệm',
      coverImageUrl: null,
      tags: [{ slug: 'heritage', name: 'Di sản' }],
      status: 'published',
    }))
  })

  it('keeps map rows light and converts SQL time values in detail DTOs', () => {
    expect(mapPlaceMapItem(row)).toEqual({
      id: row.id,
      slug: row.slug,
      name: row.name,
      category: 'heritage',
      lat: 16.4,
      lng: 107.6,
      coverImageUrl: null,
    })
    expect(mapPlaceDetail(row, [], []).openTime).toBe('07:30')
    expect(mapPlaceDetail(row, [], []).closedDays).toEqual([1])
  })
})

import { placeDetailSchema, placeSummarySchema, type PlaceDetail, type PlaceSummary } from '../../shared/schemas/place'
import { categorySchema } from '../../shared/schemas/enums'
import type { Database, Tables } from '../../src/types/supabase'

export type PlaceRow = Tables<'places'>
export type PlaceTag = { slug: string; name: string }
export type PlaceImageRow = Tables<'place_images'>
export type NearbyPlaceRow = Database['public']['Functions']['nearby_places']['Returns'][number]

export type PlaceMapItem = {
  id: string
  slug: string
  name: string
  category: PlaceSummary['category']
  lat: number
  lng: number
  coverImageUrl: string | null
}

function requiredCoordinates(row: PlaceRow): { lat: number; lng: number } {
  if (row.lat === null || row.lng === null) throw new Error(`Địa điểm published thiếu tọa độ: ${row.slug}`)
  return { lat: row.lat, lng: row.lng }
}

function mapTime(value: string | null): string | null {
  return value === null ? null : value.slice(0, 5)
}

export function mapPlaceSummary(row: PlaceRow, tags: PlaceTag[] = []): PlaceSummary {
  const { lat, lng } = requiredCoordinates(row)
  return placeSummarySchema.parse({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: categorySchema.parse(row.category),
    shortDescription: row.short_description,
    area: row.area,
    lat,
    lng,
    coverImageUrl: row.cover_image_url,
    coverImageAlt: row.cover_image_alt,
    imageCredit: row.image_credit,
    imageLicense: row.image_license,
    tags,
    verified: row.verified,
    status: row.status === 'published' ? 'published' : undefined,
  })
}

export function mapPlaceMapItem(row: PlaceRow): PlaceMapItem {
  const { lat, lng } = requiredCoordinates(row)
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: categorySchema.parse(row.category),
    lat,
    lng,
    coverImageUrl: row.cover_image_url,
  }
}

export function mapNearbyPlace(row: NearbyPlaceRow, tags: PlaceTag[] = []): PlaceSummary {
  return placeSummarySchema.parse({
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: categorySchema.parse(row.category),
    shortDescription: row.short_description,
    area: row.area,
    lat: row.lat,
    lng: row.lng,
    coverImageUrl: row.cover_image_url,
    coverImageAlt: row.cover_image_alt,
    imageCredit: row.image_credit,
    imageLicense: row.image_license,
    tags,
    verified: row.verified,
    status: 'published',
  })
}

export function mapPlaceDetail(row: PlaceRow, tags: PlaceTag[], imageRows: PlaceImageRow[]): PlaceDetail {
  return placeDetailSchema.parse({
    ...mapPlaceSummary(row, tags),
    description: row.description,
    address: row.address,
    openTime: mapTime(row.open_time),
    closeTime: mapTime(row.close_time),
    closedDays: row.closed_days,
    openingNote: row.opening_note,
    visitDurationMin: row.visit_duration_min,
    priceLevel: row.price_level,
    ticketPriceVnd: row.ticket_price_vnd,
    priceNote: row.price_note,
    bestTime: row.best_time,
    mealType: row.meal_type,
    suitableFor: row.suitable_for,
    walkingIntensity: row.walking_intensity,
    phone: row.phone,
    website: row.website,
    images: imageRows.map((image) => ({
      url: image.url,
      alt: image.alt,
      credit: image.credit,
      license: image.license,
      sourceUrl: image.source_url,
    })),
    lastVerifiedAt: row.last_verified_at,
  })
}

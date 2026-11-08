import { describe, expect, it } from 'vitest'
import { buildPlaceJsonLd, serializeJsonLd } from './placeJsonLd'
import type { PlaceDetail } from '@shared/schemas/place'

const place: PlaceDetail = {
  id: 'a0000000-0000-4000-8000-000000000001', slug: 'place', name: 'Địa điểm', category: 'food',
  shortDescription: '<script>alert(1)</script>', description: null, address: 'Địa chỉ thật', area: null, lat: 16.46, lng: 107.59,
  coverImageUrl: null, coverImageAlt: null, imageCredit: null, imageLicense: null, imageSourceUrl: null, tags: [], verified: true,
  status: 'published', openTime: null, closeTime: null, closedDays: [], openingNote: null, visitDurationMin: null, priceLevel: null,
  ticketPriceVnd: null, priceNote: null, bestTime: [], mealType: [], suitableFor: [], walkingIntensity: null, phone: null, website: null,
  images: [], lastVerifiedAt: null,
}

describe('place JSON-LD', () => {
  it('includes real available fields without inventing ratings or prices', () => {
    const result = buildPlaceJsonLd(place)
    expect(result).toMatchObject({ '@context': 'https://schema.org', '@type': 'Restaurant', name: 'Địa điểm', geo: { latitude: 16.46, longitude: 107.59 } })
    expect(result).not.toHaveProperty('aggregateRating')
    expect(result).not.toHaveProperty('priceRange')
  })

  it('escapes less-than characters in script-safe JSON', () => {
    const serialized = serializeJsonLd(buildPlaceJsonLd(place))
    expect(serialized).not.toContain('<script>')
    expect(serialized).toContain('\\u003cscript>')
  })
})

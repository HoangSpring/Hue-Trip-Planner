import { describe, expect, it } from 'vitest'
import { adminPlaceInputSchema } from '@shared/schemas/adminPlace'
import { adminPlaceWarnings, isAdminImageAllowed } from './adminWarnings'

const base = {
  slug: 'place-test', name: 'Địa điểm thử', category: 'heritage' as const,
  shortDescription: null, description: null, address: null, area: null,
  lat: 16.4637, lng: 107.5909, openTime: null, closeTime: null, closedDays: [], openingNote: null,
  visitDurationMin: null, priceLevel: null, ticketPriceVnd: null, priceNote: null, bestTime: [], mealType: [],
  suitableFor: [], walkingIntensity: null, phone: null, website: null,
  coverImageUrl: null, coverImageAlt: null, imageCredit: null, imageLicense: null, imageSourceUrl: null,
  source: null, sourceUrl: null, osmId: null, googlePlaceId: null, featured: false, sortOrder: 0, status: 'draft' as const, tags: [],
}

describe('admin place form rules', () => {
  it('warns about lunch slot mismatch, unknown hours, outside area, and distance over 25 km', () => {
    const warnings = adminPlaceWarnings({ ...base, mealType: ['lunch'], bestTime: [], lat: 17.4, lng: 108.4 })
    expect(warnings).toHaveLength(4)
    expect(warnings.join(' ')).toContain('bữa trưa')
    expect(warnings.join(' ')).toContain('Chưa có giờ')
    expect(warnings.join(' ')).toContain('ngoài vùng')
    expect(warnings.join(' ')).toContain('hơn 25 km')
  })

  it('rejects non-HTTPS image URLs and an image without author/license', () => {
    expect(adminPlaceInputSchema.safeParse({ ...base, coverImageUrl: 'http://images.example/place.jpg' }).success).toBe(false)
    expect(adminPlaceInputSchema.safeParse({ ...base, coverImageUrl: 'https://images.example/place.jpg' }).success).toBe(false)
    expect(adminPlaceInputSchema.safeParse({ ...base, coverImageUrl: 'https://images.example/place.jpg', imageCredit: 'Tác giả', imageLicense: 'CC BY 4.0' }).success).toBe(true)
  })

  it('accepts only supported image formats up to 2 MB', () => {
    expect(isAdminImageAllowed({ type: 'image/webp', size: 2 * 1024 * 1024 })).toBe(true)
    expect(isAdminImageAllowed({ type: 'image/gif', size: 100 })).toBe(false)
    expect(isAdminImageAllowed({ type: 'image/png', size: 2 * 1024 * 1024 + 1 })).toBe(false)
  })
})

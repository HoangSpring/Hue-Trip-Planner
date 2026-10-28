import { describe, expect, it } from 'vitest'
import { findAlternatives } from './alternatives'
import type { CandidateRecord } from './types'

const basePlace = {
  shortDescription: 'Mô tả ngắn',
  area: 'Trung tâm',
  coverImageUrl: 'https://example.com/cover.jpg',
  coverImageAlt: 'Ảnh bìa',
  imageCredit: 'Hue Travel',
  imageLicense: 'CC-BY',
  imageSourceUrl: null,
  verified: true,
  status: 'published' as const,
  description: 'Mô tả chi tiết',
  address: '123 Đường Lê Lợi',
  openTime: '07:30',
  closeTime: '17:30',
  closedDays: [],
  openingNote: null,
  visitDurationMin: 90,
  priceLevel: 1,
  ticketPriceVnd: 50000,
  priceNote: null,
  bestTime: ['morning' as const, 'afternoon' as const],
  mealType: [],
  suitableFor: ['couple', 'friends'],
  walkingIntensity: 2,
  phone: null,
  website: null,
  images: [],
  lastVerifiedAt: null,
}

const records: CandidateRecord[] = [
  {
    featured: true,
    tagWeights: { heritage: 1.0, history: 0.8 },
    place: {
      ...basePlace,
      id: '11111111-1111-4111-8111-111111111111',
      slug: 'dai-noi',
      name: 'Đại Nội Huế',
      category: 'heritage',
      lat: 16.4691,
      lng: 107.5794,
      tags: [
        { slug: 'heritage', name: 'Di sản & cung đình' },
        { slug: 'history', name: 'Lịch sử' },
      ],
    },
  },
  {
    featured: false,
    tagWeights: { heritage: 0.9, spiritual: 0.8 },
    place: {
      ...basePlace,
      id: '22222222-2222-4222-8222-222222222222',
      slug: 'chua-thien-mu',
      name: 'Chùa Thiên Mụ',
      category: 'heritage',
      lat: 16.4528,
      lng: 107.5453,
      tags: [
        { slug: 'heritage', name: 'Di sản & cung đình' },
        { slug: 'spiritual', name: 'Tâm linh' },
      ],
    },
  },
  {
    featured: false,
    tagWeights: { heritage: 0.9, history: 0.9 },
    place: {
      ...basePlace,
      id: '33333333-3333-4333-8333-333333333333',
      slug: 'lang-tu-duc',
      name: 'Lăng Tự Đức',
      category: 'heritage',
      lat: 16.4328,
      lng: 107.5658,
      tags: [
        { slug: 'heritage', name: 'Di sản & cung đình' },
        { slug: 'history', name: 'Lịch sử' },
      ],
    },
  },
  {
    featured: false,
    tagWeights: { cuisine: 1.0 },
    place: {
      ...basePlace,
      id: '44444444-4444-4444-8444-444444444444',
      slug: 'banh-khoai',
      name: 'Bánh Khoái Lạc Thiện',
      category: 'food',
      lat: 16.4688,
      lng: 107.5815,
      tags: [{ slug: 'cuisine', name: 'Ẩm thực' }],
    },
  },
]

describe('findAlternatives', () => {
  it('excludes the target place itself and any excludedPlaceIds', () => {
    const res = findAlternatives(records, {
      placeId: '11111111-1111-4111-8111-111111111111',
      slot: 'morning',
      excludePlaceIds: ['22222222-2222-4222-8222-222222222222'],
      limit: 5,
    })

    const resultIds = res.items.map((it) => it.place.id)
    expect(resultIds).not.toContain('11111111-1111-4111-8111-111111111111')
    expect(resultIds).not.toContain('22222222-2222-4222-8222-222222222222')
    expect(resultIds).toContain('33333333-3333-4333-8333-333333333333')
  })

  it('ranks same category and high tag overlap higher', () => {
    const res = findAlternatives(records, {
      placeId: '11111111-1111-4111-8111-111111111111',
      slot: 'morning',
      excludePlaceIds: [],
      limit: 5,
    })

    expect(res.items.length).toBeGreaterThan(0)
    // Lăng Tự Đức and Chùa Thiên Mụ are heritage, Bánh Khoái is food
    expect(res.items[0].place.category).toBe('heritage')
    expect(res.items[0].reasonTag).toMatch(/Cùng loại/i)
  })

  it('returns items: [] if placeId is not found', () => {
    const res = findAlternatives(records, {
      placeId: '00000000-0000-0000-0000-000000000000',
      slot: 'morning',
      excludePlaceIds: [],
      limit: 5,
    })

    expect(res.items).toEqual([])
  })
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { placeDetailSchema } from '@shared/schemas'

const csvPath = resolve(process.cwd(), 'supabase/seed/places.sample.csv')
const fixturePath = resolve(process.cwd(), 'tests/fixtures/places.sample.json')

describe('sample place data', () => {
  it('has the documented CSV columns and at least 20 sample rows', () => {
    const lines = readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/)
    expect(lines[0].split(',')).toEqual([
      'slug', 'name', 'category', 'short_description', 'description', 'address', 'area', 'lat', 'lng',
      'open_time', 'close_time', 'closed_days', 'opening_note', 'visit_duration_min', 'price_level',
      'ticket_price_vnd', 'price_note', 'best_time', 'meal_type', 'suitable_for', 'walking_intensity', 'tags',
      'phone', 'website', 'cover_image_url', 'image_credit', 'image_license', 'image_source_url', 'source',
      'source_url', 'featured',
    ])
    expect(lines).toHaveLength(21)
    expect(lines.some(line => /,17:00,01:00,/.test(line))).toBe(true)
    expect(lines.some(line => /,09:00,17:00,mon,/.test(line))).toBe(true)
    expect(lines.some(line => /,,Chưa có dữ liệu giờ mở cửa,/.test(line))).toBe(true)
  })

  it('provides 40 schema-valid fixture records across all five categories and hour edge cases', () => {
    const places: unknown = JSON.parse(readFileSync(fixturePath, 'utf8'))
    expect(Array.isArray(places)).toBe(true)
    if (!Array.isArray(places)) return
    expect(places).toHaveLength(40)
    const parsed = places.map(place => placeDetailSchema.parse(place))
    expect(new Set(parsed.map(place => place.category))).toEqual(new Set(['heritage', 'food', 'cafe', 'sightseeing', 'shopping']))
    expect(parsed.some(place => place.openTime === null)).toBe(true)
    expect(parsed.some(place => place.closedDays.includes(1))).toBe(true)
    expect(parsed.some(place => place.openTime === '17:00' && place.closeTime === '01:00')).toBe(true)
  })
})

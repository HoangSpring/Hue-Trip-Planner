import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCsv, toPlaceDatabaseRow, validatePlaceCsv } from './placeCsv'

describe('place CSV import', () => {
  it('parses UTF-8 BOM, quoted commas, escaped quotes, and newlines', () => {
    const parsed = parseCsv('\uFEFFslug,name,category,short_description,lat,lng,visit_duration_min,tags\r\na,"Tên, \"\"đẹp\"\"\nHuế",heritage,Mô tả,16.4,107.6,60,')
    expect(parsed.records[0]?.values.name).toBe('Tên, "đẹp"\nHuế')
    expect(parsed.records[0]?.rowNumber).toBe(2)
  })

  it('rejects malformed quote and missing required columns', () => {
    expect(() => parseCsv('slug,name\na,"unterminated')).toThrow('chưa đóng')
    expect(() => parseCsv('slug,name\na,b')).toThrow('thiếu cột bắt buộc')
  })

  it('validates the supplied sample CSV without importing fictional places', () => {
    const csv = readFileSync('supabase/seed/places.sample.csv', 'utf8')
    const { records } = parseCsv(csv)
    const result = validatePlaceCsv(records)
    expect(records.length).toBeGreaterThanOrEqual(20)
    expect(result.invalid).toEqual([])
    expect(result.valid.every(({ data }) => data.short_description.includes('giả lập'))).toBe(true)
    expect(result.valid[0]?.data.tags).toEqual([])
  })

  it('requires image credit and license when an image is present', () => {
    const parsed = parseCsv([
      'slug,name,category,short_description,lat,lng,visit_duration_min,tags,cover_image_url',
      'sample-place,Điểm thử,heritage,Mô tả,10,105,60,,https://example.com/image.jpg',
    ].join('\n'))
    const result = validatePlaceCsv(parsed.records)
    expect(result.invalid[0]?.errors.join(' ')).toContain('image_credit')
    expect(result.valid).toHaveLength(0)
  })

  it('warns when valid coordinates fall outside the approximate Huế bounds', () => {
    const parsed = parseCsv([
      'slug,name,category,short_description,lat,lng',
      'sample-place,Điểm thử,heritage,Mô tả,10,105',
    ].join('\n'))
    const result = validatePlaceCsv(parsed.records)
    expect(result.invalid).toHaveLength(0)
    expect(result.valid[0]?.warnings).toHaveLength(1)
  })

  it('maps validated rows to safe draft records', () => {
    const parsed = parseCsv([
      'slug,name,category,short_description,lat,lng,visit_duration_min,tags,closed_days',
      'sample-place,Điểm thử,heritage,Mô tả,16.4,107.6,60,heritage:3,mon|sun',
    ].join('\n'))
    const entry = validatePlaceCsv(parsed.records).valid[0]
    expect(entry).toBeDefined()
    const dbRow = toPlaceDatabaseRow(entry!.data)
    expect(dbRow.status).toBe('draft')
    expect(dbRow.verified).toBe(false)
    expect(dbRow.closed_days).toEqual([1, 7])
    expect(entry!.tagWeights).toEqual([{ slug: 'heritage', weight: 3 }])
  })
})

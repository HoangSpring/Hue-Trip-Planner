import { describe, expect, it } from 'vitest'
import type { ImportExistingPlace, PlaceImportRepository } from './importService'
import { ImportService } from './importService'

const idA = 'd0000000-0000-4000-8000-000000000004'
const idB = 'd1000000-0000-4000-8000-000000000004'
const actorId = 'a0000000-0000-4000-8000-000000000001'
const header = 'slug,name,category,short_description,lat,lng,visit_duration_min,cover_image_url,image_credit,image_license,tags,open_time,close_time,meal_type,best_time,source'

function csvRow(values: Partial<Record<string, string>> = {}) {
  const row: Record<string, string> = {
    slug: 'new-place', name: 'Điểm mới', category: 'heritage', short_description: 'Mô tả', lat: '16.45', lng: '107.56',
    visit_duration_min: '60', cover_image_url: 'https://example.test/new.jpg', image_credit: 'Tác giả', image_license: 'CC BY 4.0',
    tags: 'heritage:2', open_time: '08:00', close_time: '17:00', meal_type: '', best_time: 'morning', source: '',
  }
  Object.assign(row, values)
  return header.split(',').map((key) => {
    const value = row[key] ?? ''
    return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
  }).join(',')
}

class MemoryImportRepo implements PlaceImportRepository {
  readonly tags = new Set(['heritage', 'food'])
  readonly places = new Map<string, ImportExistingPlace>()
  readonly tagAssignments = new Map<string, Array<{ slug: string; weight: number }>>()
  readonly auditRows: Array<{ id: string; actor: string; fields: string[] }> = []
  nextId = 0

  async tagSlugs(slugs: string[]) { return new Set(slugs.filter((slug) => this.tags.has(slug))) }
  async existingBySlugs(slugs: string[]) { return new Map(slugs.flatMap((slug) => { const row = this.places.get(slug); return row ? [[slug, row] as const] : [] })) }
  async importPlace(row: Record<string, unknown>, overwriteVerified: boolean) {
    const slug = String(row.slug)
    const current = this.places.get(slug)
    if (current?.verified && !overwriteVerified) return { action: 'skipped' as const, placeId: current.id, reason: 'Địa điểm đã verified và không được ghi đè.' }
    const id = current?.id ?? (this.nextId++ === 0 ? idA : idB)
    this.places.set(slug, { id, slug, status: (current?.status ?? row.status) as ImportExistingPlace['status'], verified: current?.verified ?? Boolean(row.verified), source: (row.source as string | null) ?? null })
    const tags = row.tags as Array<{ slug: string; weight: number }>
    if (tags.length) this.tagAssignments.set(id, tags)
    this.auditRows.push({ id, actor: actorId, fields: [...Object.keys(row).filter((field) => field !== 'tags'), ...(tags.length ? ['tags'] : [])] })
    return { action: current ? 'updated' as const : 'created' as const, placeId: id, reason: null }
  }
}

describe('ImportService', () => {
  it('previews UTF-8 BOM, quoted commas, warnings, errors, and actions without writes', async () => {
    const repository = new MemoryImportRepo()
    repository.places.set('known-place', { id: idB, slug: 'known-place', status: 'published', verified: true, source: 'manual' })
    const service = new ImportService(repository)
    const csv = `\uFEFF${header}\r\n${csvRow({ name: 'Quán, thử', lat: '10', lng: '105' })}\r\n${csvRow({ slug: 'known-place', tags: '' })}\r\n${csvRow({ slug: 'bad-image', image_credit: '' })}\r\n${csvRow({ slug: 'bad-tag', tags: 'unknown-tag' })}`
    const preview = await service.preview(csv)
    expect(preview.summary).toEqual({ total: 4, valid: 0, warnings: 2, errors: 2 })
    expect(preview.rows[0]).toMatchObject({ line: 2, slug: 'new-place', status: 'warning', action: 'create' })
    expect(preview.rows[0]?.messages[0]).toContain('ngoài vùng Huế')
    expect(preview.rows[1]).toMatchObject({ slug: 'known-place', action: 'skip', status: 'warning' })
    expect(preview.rows[2]?.status).toBe('error')
    expect(preview.rows[3]?.messages.join(' ')).toContain('Tag không tồn tại')
    expect(repository.places.size).toBe(1)
    expect(repository.auditRows).toHaveLength(0)
  })

  it('creates drafts, keeps existing lifecycle and empty tags, and never overwrites verified without opt-in', async () => {
    const repository = new MemoryImportRepo()
    repository.places.set('published-existing', { id: idB, slug: 'published-existing', status: 'published', verified: false, source: 'manual' })
    repository.places.set('verified-existing', { id: idA, slug: 'verified-existing', status: 'archived', verified: true, source: 'osm' })
    repository.tagAssignments.set(idB, [{ slug: 'food', weight: 3 }])
    repository.tagAssignments.set(idA, [{ slug: 'heritage', weight: 1 }])
    const service = new ImportService(repository)
    const csv = [header,
      csvRow({ slug: 'new-place', tags: '', source: '' }),
      csvRow({ slug: 'published-existing', tags: '', source: '' }),
      csvRow({ slug: 'verified-existing', tags: 'food:2', source: 'csv-source' }),
    ].join('\n')
    const result = await service.commit(csv, false)
    expect(result).toMatchObject({ created: 1, updated: 1, skipped: 1 })
    expect(repository.places.get('new-place')).toMatchObject({ status: 'draft', verified: false, source: 'csv-import' })
    expect(repository.places.get('published-existing')).toMatchObject({ status: 'published', verified: false, source: 'manual' })
    expect(repository.tagAssignments.get(idB)).toEqual([{ slug: 'food', weight: 3 }])
    expect(repository.places.get('verified-existing')).toMatchObject({ status: 'archived', verified: true, source: 'osm' })
    expect(repository.tagAssignments.get(idA)).toEqual([{ slug: 'heritage', weight: 1 }])
    expect(result.errorCsv).toContain('Địa điểm đã verified')
    expect(repository.auditRows).toHaveLength(2)
    expect(repository.auditRows.every((row) => row.actor === actorId)).toBe(true)
  })

  it('requires explicit overwrite for verified places and replaces non-empty tags while preserving status', async () => {
    const repository = new MemoryImportRepo()
    repository.places.set('verified-existing', { id: idA, slug: 'verified-existing', status: 'published', verified: true, source: 'manual' })
    repository.tagAssignments.set(idA, [{ slug: 'heritage', weight: 1 }])
    const service = new ImportService(repository)
    const result = await service.commit([header, csvRow({ slug: 'verified-existing', tags: 'food:3' })].join('\n'), true)
    expect(result).toMatchObject({ created: 0, updated: 1, skipped: 0 })
    expect(repository.places.get('verified-existing')).toMatchObject({ status: 'published', verified: true })
    expect(repository.tagAssignments.get(idA)).toEqual([{ slug: 'food', weight: 3 }])
    expect(repository.auditRows[0]?.fields).toContain('tags')
  })

  it('continues after row errors, produces a downloadable error CSV, and repeated import does not duplicate', async () => {
    const repository = new MemoryImportRepo()
    const service = new ImportService(repository)
    const csv = [header, csvRow({ slug: 'same-place', tags: '' }), csvRow({ slug: 'same-place', tags: '' }), csvRow({ slug: 'bad-row', category: 'unknown' }), csvRow({ slug: 'good-place', tags: '' })].join('\n')
    const first = await service.commit(csv, false)
    expect(first).toMatchObject({ created: 1, updated: 0, skipped: 3 })
    expect(first.errorCsv).toContain('line,slug,reason')
    const duplicateOnly = [header, csvRow({ slug: 'same-place', tags: '' })].join('\n')
    const imported = await service.commit(duplicateOnly, false)
    const repeated = await service.commit(duplicateOnly, false)
    expect(imported.created).toBe(1)
    expect(repeated.updated).toBe(1)
    expect(repository.places.size).toBe(2)
  })

  it('delegates every accepted row to one repository RPC so place, tags, and audit are one unit', async () => {
    const repository = new MemoryImportRepo()
    const service = new ImportService(repository)
    const result = await service.commit([header, csvRow({ slug: 'atomic-place' })].join('\n'), false)
    expect(result).toMatchObject({ created: 1, updated: 0, skipped: 0 })
    expect(repository.places.has('atomic-place')).toBe(true)
    expect(repository.auditRows).toHaveLength(1)
    expect(repository.tagAssignments.get(idA)).toEqual([{ slug: 'heritage', weight: 2 }])
  })
})

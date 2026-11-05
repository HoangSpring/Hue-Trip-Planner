import { importCommitResponseSchema, importPreviewResponseSchema, type ImportCommitResponse, type ImportPreviewResponse, type ImportPreviewRow } from '@shared/schemas/placeImport'
import type { Tables } from '../../src/types/supabase'
import { AppError } from '../lib/errors'
import { parseCsv, toPlaceDatabaseRow, validatePlaceCsv, type InvalidPlaceRow, type ValidatedPlaceRow } from './placeCsv'

export type ImportExistingPlace = Pick<Tables<'places'>, 'id' | 'slug' | 'status' | 'verified' | 'source'>

export interface PlaceImportRepository {
  tagSlugs(slugs: string[]): Promise<Set<string>>
  existingBySlugs(slugs: string[]): Promise<Map<string, ImportExistingPlace>>
  importPlace(row: Record<string, unknown>, overwriteVerified: boolean): Promise<{ action: 'created' | 'updated' | 'skipped'; placeId: string; reason: string | null }>
}

type ValidImportRow = {
  entry: ValidatedPlaceRow
  existing: ImportExistingPlace | null
  warnings: string[]
}

type ErrorImportRow = { line: number; slug: string | null; messages: string[]; values: Record<string, string> }
type ImportPlan = { preview: ImportPreviewResponse; valid: ValidImportRow[]; invalid: ErrorImportRow[] }

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

function errorCsv(rows: ErrorImportRow[]): string {
  return [
    'line,slug,reason',
    ...rows.map((row) => [String(row.line), row.slug ?? '', row.messages.join('; ')].map(csvCell).join(',')),
  ].join('\r\n') + '\r\n'
}

function formatInvalid(row: InvalidPlaceRow): ErrorImportRow {
  return { line: row.rowNumber, slug: row.values.slug || null, messages: row.errors, values: row.values }
}

export class ImportService {
  constructor(private readonly repository: PlaceImportRepository) {}

  async preview(csv: string): Promise<ImportPreviewResponse> {
    return (await this.plan(csv, false)).preview
  }

  async commit(csv: string, overwriteVerified: boolean): Promise<ImportCommitResponse> {
    const plan = await this.plan(csv, overwriteVerified)
    let created = 0
    let updated = 0
    let skipped = plan.invalid.length
    const errors = plan.invalid.map(({ line, messages }) => ({ line, message: messages.join('; ') }))
    const csvErrors = [...plan.invalid]

    for (const row of plan.valid) {
      const { entry, existing } = row
      if (existing?.verified && !overwriteVerified) {
        skipped += 1
        const message = 'Địa điểm đã verified; bật overwriteVerified để cho phép ghi đè.'
        errors.push({ line: entry.rowNumber, message })
        csvErrors.push({ line: entry.rowNumber, slug: entry.data.slug, messages: [message], values: {} })
        continue
      }
      try {
        const place = toPlaceDatabaseRow(entry.data)
        const rowToSave: Record<string, unknown> = {
          ...place,
          source: entry.data.source ?? existing?.source ?? 'csv-import',
          tags: entry.tagWeights,
        }
        const result = await this.repository.importPlace(rowToSave, overwriteVerified)
        if (result.action === 'created') created += 1
        else if (result.action === 'updated') updated += 1
        else {
          skipped += 1
          const message = result.reason ?? 'Địa điểm đã verified và không được ghi đè.'
          errors.push({ line: entry.rowNumber, message })
          csvErrors.push({ line: entry.rowNumber, slug: entry.data.slug, messages: [message], values: {} })
        }
      } catch {
        skipped += 1
        const message = 'Không thể import dòng này; không ghi nhận hoàn tất.'
        errors.push({ line: entry.rowNumber, message })
        csvErrors.push({ line: entry.rowNumber, slug: entry.data.slug, messages: [message], values: {} })
      }
    }

    return importCommitResponseSchema.parse({ created, updated, skipped, errors, errorCsv: errorCsv(csvErrors) })
  }

  private async plan(csv: string, overwriteVerified: boolean): Promise<ImportPlan> {
    if (Buffer.byteLength(csv, 'utf8') > 2 * 1024 * 1024) throw new AppError(413, 'PAYLOAD_TOO_LARGE', 'CSV vượt giới hạn 2 MB.')
    let parsed
    try { parsed = parseCsv(csv) } catch (error) {
      throw new AppError(400, 'VALIDATION_ERROR', error instanceof Error ? error.message : 'CSV chưa hợp lệ.')
    }
    const result = validatePlaceCsv(parsed.records)
    const invalid = result.invalid.map(formatInvalid)
    const seen = new Set<string>()
    const duplicateSlugs = new Set<string>()
    for (const { data } of result.valid) {
      if (seen.has(data.slug)) duplicateSlugs.add(data.slug)
      seen.add(data.slug)
    }
    const candidates = result.valid.filter(({ data }) => !duplicateSlugs.has(data.slug))
    for (const entry of result.valid.filter(({ data }) => duplicateSlugs.has(data.slug))) {
      invalid.push({ line: entry.rowNumber, slug: entry.data.slug, messages: [`Slug trùng trong CSV: ${entry.data.slug}.`], values: {} })
    }

    const tags = [...new Set(candidates.flatMap(({ tagWeights }) => tagWeights.map(({ slug }) => slug)))]
    const availableTags = await this.repository.tagSlugs(tags)
    const unknownTagRows = new Set<number>()
    for (const entry of candidates) {
      const unknown = entry.tagWeights.filter(({ slug }) => !availableTags.has(slug)).map(({ slug }) => slug)
      if (unknown.length) {
        unknownTagRows.add(entry.rowNumber)
        invalid.push({ line: entry.rowNumber, slug: entry.data.slug, messages: [`Tag không tồn tại: ${unknown.join(', ')}.`], values: {} })
      }
    }
    const eligible = candidates.filter(({ rowNumber }) => !unknownTagRows.has(rowNumber))
    const current = await this.repository.existingBySlugs(eligible.map(({ data }) => data.slug))
    const valid: ValidImportRow[] = eligible.map((entry) => {
      const existing = current.get(entry.data.slug) ?? null
      const warnings = [...entry.warnings]
      if (existing?.verified && !overwriteVerified) warnings.push('Địa điểm đã verified sẽ được bỏ qua nếu chưa bật ghi đè.')
      return { entry, existing, warnings }
    })
    const rows: ImportPreviewRow[] = [
      ...valid.map(({ entry, existing, warnings }) => ({
        line: entry.rowNumber,
        slug: entry.data.slug,
        status: warnings.length ? 'warning' as const : 'valid' as const,
        action: existing?.verified && !overwriteVerified ? 'skip' as const : existing ? 'update' as const : 'create' as const,
        messages: warnings,
      })),
      ...invalid.map(({ line, slug, messages }) => ({ line, slug, status: 'error' as const, action: 'skip' as const, messages })),
    ].sort((left, right) => left.line - right.line)
    const preview = importPreviewResponseSchema.parse({
      summary: {
        total: parsed.records.length,
        valid: rows.filter(({ status }) => status === 'valid').length,
        warnings: rows.filter(({ status }) => status === 'warning').length,
        errors: rows.filter(({ status }) => status === 'error').length,
      },
      rows,
    })
    return { preview, valid, invalid }
  }
}

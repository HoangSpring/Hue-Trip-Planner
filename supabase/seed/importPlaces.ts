import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import type { Database } from '../../src/types/supabase'
import { parseCsv, toPlaceDatabaseRow, validatePlaceCsv, type InvalidPlaceRow } from '../../server/services/placeCsv'

type Options = { csvPath: string; dryRun: boolean; overwriteVerified: boolean; reportPath: string; errorsPath: string }

function readLocalEnvironment(): void {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!match || process.env[match[1]]) continue
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2')
    process.env[match[1]] = value
  }
}

function parseArgs(args: string[]): Options {
  const options: Options = {
    csvPath: 'supabase/seed/places.sample.csv',
    dryRun: false,
    overwriteVerified: false,
    reportPath: '',
    errorsPath: '',
  }
  for (const arg of args.filter((value) => value !== '--')) {
    if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--overwrite-verified') options.overwriteVerified = true
    else if (arg.startsWith('--csv=')) options.csvPath = arg.slice('--csv='.length)
    else if (arg.startsWith('--report=')) options.reportPath = arg.slice('--report='.length)
    else if (arg.startsWith('--errors=')) options.errorsPath = arg.slice('--errors='.length)
    else throw new Error(`Tham số không hỗ trợ: ${arg}`)
  }
  const csvName = basename(options.csvPath).replace(/\.csv$/i, '')
  const outputDirectory = dirname(resolve(options.csvPath))
  options.reportPath ||= resolve(outputDirectory, `${csvName}.import-report.json`)
  options.errorsPath ||= resolve(outputDirectory, `${csvName}.import-errors.csv`)
  return options
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value
}

function writeErrorCsv(path: string, rows: InvalidPlaceRow[]): void {
  const header = [...new Set(rows.flatMap(({ values }) => Object.keys(values).filter((key) => key !== '__extra_columns')))]
  const columns = ['row_number', ...header, 'errors']
  const content = [
    columns.join(','),
    ...rows.map(({ rowNumber, values, errors }) => [rowNumber, ...header.map((key) => values[key] ?? ''), errors.join('; ')].map(String).map(csvCell).join(',')),
  ].join('\r\n')
  writeFileSync(path, `${content}\r\n`, 'utf8')
}

async function run(): Promise<void> {
  readLocalEnvironment()
  const options = parseArgs(process.argv.slice(2))
  const csvPath = resolve(options.csvPath)
  const csv = readFileSync(csvPath, 'utf8')
  if (Buffer.byteLength(csv, 'utf8') > 2 * 1024 * 1024) throw new Error('CSV vượt giới hạn 2 MB')
  const parsed = parseCsv(csv)
  const result = validatePlaceCsv(parsed.records)

  const duplicatedSlugs = new Set<string>()
  const seenSlugs = new Set<string>()
  for (const entry of result.valid) {
    if (seenSlugs.has(entry.data.slug)) duplicatedSlugs.add(entry.data.slug)
    seenSlugs.add(entry.data.slug)
  }
  if (duplicatedSlugs.size) {
    for (const entry of result.valid.filter(({ data }) => duplicatedSlugs.has(data.slug))) {
      result.invalid.push({ rowNumber: entry.rowNumber, values: {}, errors: [`slug trùng trong CSV: ${entry.data.slug}`] })
    }
    result.valid = result.valid.filter(({ data }) => !duplicatedSlugs.has(data.slug))
  }

  const { valid } = result
  const url = process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) throw new Error('Cần cấu hình VITE_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY trong môi trường hoặc .env.local')
  const supabase = createClient<Database>(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const tagSlugs = [...new Set(valid.flatMap(({ tagWeights }) => tagWeights.map(({ slug }) => slug)))]
  const tagIds = new Map<string, string>()
  if (tagSlugs.length) {
    const { data, error } = await supabase.from('tags').select('id,slug').in('slug', tagSlugs)
    if (error || !data) throw new Error('Không thể kiểm tra tag trong Supabase')
    for (const tag of data) tagIds.set(tag.slug, tag.id)
  }
  const missingTagSlugs = new Set(tagSlugs.filter((slug) => !tagIds.has(slug)))
  if (missingTagSlugs.size) {
    for (const entry of valid.filter(({ tagWeights }) => tagWeights.some(({ slug }) => missingTagSlugs.has(slug)))) {
      result.invalid.push({ rowNumber: entry.rowNumber, values: {}, errors: [`Tag không tồn tại: ${entry.tagWeights.filter(({ slug }) => missingTagSlugs.has(slug)).map(({ slug }) => slug).join(', ')}`] })
    }
    result.valid = valid.filter(({ tagWeights }) => !tagWeights.some(({ slug }) => missingTagSlugs.has(slug)))
  }

  const currentBySlug = new Map<string, { id: string; verified: boolean }>()
  for (let offset = 0; offset < result.valid.length; offset += 100) {
    const slugs = result.valid.slice(offset, offset + 100).map(({ data }) => data.slug)
    if (!slugs.length) continue
    const { data, error } = await supabase.from('places').select('id,slug,verified').in('slug', slugs)
    if (error || !data) throw new Error('Không thể kiểm tra địa điểm hiện có trong Supabase')
    for (const place of data) currentBySlug.set(place.slug, { id: place.id, verified: place.verified })
  }

  const rows = result.valid
  const ignoredVerified = rows.filter(({ data }) => currentBySlug.get(data.slug)?.verified && !options.overwriteVerified)
  const candidates = rows.filter(({ data }) => !currentBySlug.get(data.slug)?.verified || options.overwriteVerified)
  const summary = {
    file: basename(csvPath),
    dryRun: options.dryRun,
    overwriteVerified: options.overwriteVerified,
    totalRows: parsed.records.length,
    validRows: rows.length,
    plannedCreates: candidates.filter(({ data }) => !currentBySlug.has(data.slug)).length,
    plannedUpdates: candidates.filter(({ data }) => currentBySlug.has(data.slug)).length,
    created: 0,
    updated: 0,
    skippedVerified: ignoredVerified.length,
    invalidRows: result.invalid.length,
    failedRows: 0,
    warnings: rows.reduce((total, row) => total + row.warnings.length, 0),
    errorsFile: resolve(options.errorsPath),
  }

  if (!options.dryRun) {
    for (const entry of candidates) {
      try {
        const previous = currentBySlug.get(entry.data.slug)
        const { data: place, error: placeError } = await supabase
          .from('places')
          .upsert(toPlaceDatabaseRow(entry.data), { onConflict: 'slug' })
          .select('id,slug')
          .single()
        if (placeError || !place) throw new Error('Không thể ghi địa điểm')
        const { error: deleteTagsError } = await supabase.from('place_tags').delete().eq('place_id', place.id)
        if (deleteTagsError) throw new Error('Không thể cập nhật tag địa điểm')
        const tags = entry.tagWeights.map(({ slug, weight }) => ({ place_id: place.id, tag_id: tagIds.get(slug)!, weight }))
        if (tags.length) {
          const { error: tagError } = await supabase.from('place_tags').insert(tags)
          if (tagError) throw new Error('Không thể ghi tag địa điểm')
        }
        const { error: auditError } = await supabase.from('place_audit_log').insert({
          place_id: place.id,
          actor_id: null,
          action: 'import',
          changes: { source: 'csv', rowNumber: entry.rowNumber, overwrittenVerified: previous?.verified ?? false },
        })
        if (auditError) throw new Error('Không thể ghi nhật ký import')
        if (previous) summary.updated += 1
        else summary.created += 1
      } catch {
        summary.failedRows += 1
        result.invalid.push({ rowNumber: entry.rowNumber, values: {}, errors: ['Ghi địa điểm thất bại; kiểm tra log Supabase và chạy lại sau khi xử lý'] })
      }
    }
  }

  summary.invalidRows = result.invalid.length
  writeErrorCsv(resolve(options.errorsPath), result.invalid)
  writeFileSync(resolve(options.reportPath), `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  for (const entry of rows) {
    for (const warning of entry.warnings) process.stdout.write(`Cảnh báo dòng ${entry.rowNumber}: ${warning}\n`)
  }
  process.stdout.write(`${options.dryRun ? 'Dry-run' : 'Import'} hoàn tất: ${JSON.stringify(summary)}\n`)
  process.stdout.write(`Báo cáo: ${resolve(options.reportPath)}\nTệp lỗi: ${resolve(options.errorsPath)}\n`)
  if (summary.invalidRows || summary.failedRows) process.exitCode = 1
}

run().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Import thất bại'}\n`)
  process.exitCode = 1
})

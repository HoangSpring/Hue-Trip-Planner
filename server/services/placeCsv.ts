import { z } from 'zod'
import { categorySchema } from '../../shared/schemas/enums'

export const placeCsvHeaders = [
  'slug', 'name', 'category', 'short_description', 'description', 'address', 'area', 'lat', 'lng',
  'open_time', 'close_time', 'closed_days', 'opening_note', 'visit_duration_min', 'price_level',
  'ticket_price_vnd', 'price_note', 'best_time', 'meal_type', 'suitable_for', 'walking_intensity',
  'tags', 'phone', 'website', 'cover_image_url', 'image_credit', 'image_license', 'image_source_url',
  'source', 'source_url', 'featured',
] as const

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug phải gồm chữ thường, số và dấu gạch ngang')
const nullableNumber = (schema: z.ZodNumber) => z.preprocess((value) => value === '' ? null : Number(value), schema.nullable())
const nullableText = z.preprocess((value) => value === '' ? null : value, z.string().nullable())
const listOf = <T extends z.ZodType>(schema: T) => z.preprocess(
  (value) => typeof value === 'string' && value ? value.split('|').map((part) => part.trim()).filter(Boolean) : [],
  z.array(schema),
)

const timeSchema = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
const daySchema = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
const tagItemSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*(?::[1-3])?$/)

const placeCsvRowSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1).max(200),
  category: categorySchema,
  short_description: z.string().trim().min(1).max(200),
  description: nullableText,
  address: nullableText,
  area: nullableText,
  lat: z.preprocess((value) => value === '' ? Number.NaN : Number(value), z.number().min(-90).max(90)),
  lng: z.preprocess((value) => value === '' ? Number.NaN : Number(value), z.number().min(-180).max(180)),
  open_time: z.preprocess((value) => value === '' ? null : value, timeSchema.nullable()),
  close_time: z.preprocess((value) => value === '' ? null : value, timeSchema.nullable()),
  closed_days: listOf(daySchema),
  opening_note: nullableText,
  visit_duration_min: nullableNumber(z.number().int().min(5).max(600)),
  price_level: nullableNumber(z.number().int().min(0).max(3)),
  ticket_price_vnd: nullableNumber(z.number().int().nonnegative()),
  price_note: nullableText,
  best_time: listOf(z.enum(['morning', 'noon', 'afternoon', 'evening'])),
  meal_type: listOf(z.enum(['breakfast', 'lunch', 'dinner', 'snack'])),
  suitable_for: listOf(z.enum(['solo', 'couple', 'family_kids', 'friends', 'seniors'])),
  walking_intensity: nullableNumber(z.number().int().min(1).max(3)),
  tags: listOf(tagItemSchema),
  phone: nullableText,
  website: z.preprocess((value) => value === '' ? null : value, z.string().url().nullable()),
  cover_image_url: z.preprocess((value) => value === '' ? null : value, z.string().trim().min(1).nullable()),
  image_credit: nullableText,
  image_license: nullableText,
  image_source_url: z.preprocess((value) => value === '' ? null : value, z.string().url().nullable()),
  source: nullableText,
  source_url: z.preprocess((value) => value === '' ? null : value, z.string().url().nullable()),
  featured: z.preprocess((value) => value === '' ? false : value === 'true', z.boolean()),
}).strict().superRefine((row, context) => {
  if ((row.open_time === null) !== (row.close_time === null)) {
    context.addIssue({ code: 'custom', path: ['open_time'], message: 'open_time và close_time phải cùng có hoặc cùng trống' })
  }
  if (row.cover_image_url && (!row.image_credit || !row.image_license)) {
    context.addIssue({ code: 'custom', path: ['image_credit'], message: 'Ảnh bìa cần image_credit và image_license' })
  }
})

export type PlaceCsvRow = z.infer<typeof placeCsvRowSchema>
export type CsvRecord = { rowNumber: number; values: Record<string, string> }

export type ParsedCsv = { headers: string[]; records: CsvRecord[] }

export function parseCsv(text: string): ParsedCsv {
  const source = text.replace(/^\uFEFF/, '')
  const records: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        cell += char
      }
    } else if (char === '"' && cell.length === 0) {
      quoted = true
    } else if (char === ',') {
      row.push(cell)
      cell = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[index + 1] === '\n') index += 1
      row.push(cell)
      records.push(row)
      row = []
      cell = ''
    } else {
      cell += char
    }
  }
  if (quoted) throw new Error('CSV có dấu ngoặc kép chưa đóng')
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    records.push(row)
  }

  const [headers = [], ...data] = records
  const normalizedHeaders = headers.map((header) => header.trim())
  if (normalizedHeaders.length === 0 || normalizedHeaders.some((header) => !header)) {
    throw new Error('CSV thiếu dòng tiêu đề hoặc có tên cột trống')
  }
  if (new Set(normalizedHeaders).size !== normalizedHeaders.length) throw new Error('CSV có tên cột trùng')

  const unknownHeaders = normalizedHeaders.filter((header) => !placeCsvHeaders.includes(header as (typeof placeCsvHeaders)[number]))
  if (unknownHeaders.length) throw new Error(`CSV có cột không hỗ trợ: ${unknownHeaders.join(', ')}`)
  const missingHeaders = ['slug', 'name', 'category', 'short_description', 'lat', 'lng']
    .filter((header) => !normalizedHeaders.includes(header))
  if (missingHeaders.length) throw new Error(`CSV thiếu cột bắt buộc: ${missingHeaders.join(', ')}`)

  return {
    headers: normalizedHeaders,
    records: data.filter((cells) => cells.some((value) => value.trim() !== '')).map((cells, index) => ({
      rowNumber: index + 2,
      values: {
        ...Object.fromEntries(placeCsvHeaders.map((header) => {
          const column = normalizedHeaders.indexOf(header)
          return [header, column < 0 ? '' : cells[column] ?? '']
        })),
        ...(cells.length > normalizedHeaders.length ? { __extra_columns: String(cells.length - normalizedHeaders.length) } : {}),
      },
    })),
  }
}

export type ValidatedPlaceRow = {
  rowNumber: number
  data: PlaceCsvRow
  tagWeights: { slug: string; weight: number }[]
  warnings: string[]
}

export type InvalidPlaceRow = { rowNumber: number; values: Record<string, string>; errors: string[] }

export function validatePlaceCsv(records: CsvRecord[]): { valid: ValidatedPlaceRow[]; invalid: InvalidPlaceRow[] } {
  const valid: ValidatedPlaceRow[] = []
  const invalid: InvalidPlaceRow[] = []

  for (const record of records) {
    const parsed = placeCsvRowSchema.safeParse(record.values)
    if (!parsed.success) {
      invalid.push({
        ...record,
        errors: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'row'}: ${issue.message}`),
      })
      continue
    }
    const tagWeights = parsed.data.tags.map((item) => {
      const [slug, weight = '1'] = item.split(':')
      return { slug, weight: Number(weight) }
    })
    const warnings = parsed.data.lat < 16.0 || parsed.data.lat > 16.8 || parsed.data.lng < 107.0 || parsed.data.lng > 108.0
      ? ['Tọa độ nằm ngoài vùng Huế mở rộng ước tính (16.0–16.8°N, 107.0–108.0°E)']
      : []
    valid.push({ rowNumber: record.rowNumber, data: parsed.data, tagWeights, warnings })
  }

  return { valid, invalid }
}

export function toPlaceDatabaseRow(row: PlaceCsvRow) {
  const dayNumbers: Record<(typeof daySchema)['_output'], number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 }
  return {
    slug: row.slug,
    name: row.name,
    category: row.category,
    short_description: row.short_description,
    description: row.description,
    address: row.address,
    area: row.area,
    lat: row.lat,
    lng: row.lng,
    open_time: row.open_time,
    close_time: row.close_time,
    closed_days: row.closed_days.map((day) => dayNumbers[day]),
    opening_note: row.opening_note,
    visit_duration_min: row.visit_duration_min,
    price_level: row.price_level,
    ticket_price_vnd: row.ticket_price_vnd,
    price_note: row.price_note,
    best_time: row.best_time,
    meal_type: row.meal_type,
    suitable_for: row.suitable_for,
    walking_intensity: row.walking_intensity,
    phone: row.phone,
    website: row.website,
    cover_image_url: row.cover_image_url,
    image_credit: row.image_credit,
    image_license: row.image_license,
    image_source_url: row.image_source_url,
    source: row.source ?? 'csv',
    source_url: row.source_url,
    featured: row.featured,
    status: 'draft' as const,
    verified: false,
  }
}

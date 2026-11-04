import { z } from 'zod'
import { categorySchema, placeStatusSchema, slotSchema } from './enums'

const nullableText = (max = 2000) => z.string().trim().max(max).nullable()
const nullableUrl = z.string().url().nullable()

export const adminPlaceInputSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160),
  name: z.string().trim().min(1).max(200),
  category: categorySchema,
  shortDescription: nullableText(500),
  description: nullableText(20_000),
  address: nullableText(500),
  area: nullableText(200),
  lat: z.number().min(-90).max(90).nullable(),
  lng: z.number().min(-180).max(180).nullable(),
  openTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(),
  closeTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable(),
  closedDays: z.array(z.number().int().min(1).max(7)),
  openingNote: nullableText(1000),
  visitDurationMin: z.number().int().min(5).max(600).nullable(),
  priceLevel: z.number().int().min(0).max(3).nullable(),
  ticketPriceVnd: z.number().int().nonnegative().nullable(),
  priceNote: nullableText(1000),
  bestTime: z.array(slotSchema),
  mealType: z.array(z.enum(['breakfast', 'lunch', 'dinner', 'snack'])),
  suitableFor: z.array(z.enum(['solo', 'couple', 'family_kids', 'friends', 'seniors'])),
  walkingIntensity: z.number().int().min(1).max(3).nullable(),
  phone: nullableText(80),
  website: nullableUrl,
  coverImageUrl: z.string().url().nullable(),
  coverImageAlt: nullableText(500),
  imageCredit: nullableText(300),
  imageLicense: nullableText(200),
  imageSourceUrl: nullableUrl,
  source: nullableText(100),
  sourceUrl: nullableUrl,
  osmId: nullableText(160),
  googlePlaceId: nullableText(200),
  featured: z.boolean(),
  sortOrder: z.number().int().min(-100_000).max(100_000),
  status: placeStatusSchema,
  tags: z.array(z.object({ slug: z.string().trim().min(1).max(100), weight: z.number().int().min(1).max(3) }).strict()).max(100),
}).strict().superRefine((place, context) => {
  if ((place.openTime === null) !== (place.closeTime === null)) {
    context.addIssue({ code: 'custom', path: ['openTime'], message: 'Giờ mở và giờ đóng phải cùng có hoặc cùng trống.' })
  }
  if (place.coverImageUrl && new URL(place.coverImageUrl).protocol !== 'https:') {
    context.addIssue({ code: 'custom', path: ['coverImageUrl'], message: 'Ảnh bìa chỉ được dùng liên kết HTTPS.' })
  }
  if (place.coverImageUrl && (!place.imageCredit || !place.imageLicense)) {
    context.addIssue({ code: 'custom', path: ['imageCredit'], message: 'Ảnh bìa cần có tên tác giả và giấy phép.' })
  }
  const tagSlugs = place.tags.map(({ slug }) => slug)
  if (new Set(tagSlugs).size !== tagSlugs.length) {
    context.addIssue({ code: 'custom', path: ['tags'], message: 'Tag bị trùng.' })
  }
})

export const adminPlaceIdSchema = z.string().uuid()
export const adminPlaceStatusRequestSchema = z.object({ status: z.enum(['published', 'draft', 'archived']) }).strict()
export const adminVerifyRequestSchema = z.object({
  verified: z.boolean(),
  confirmedFields: z.array(z.string().trim().min(1).max(100)).max(100).optional(),
}).strict()
export const adminBulkRequestSchema = z.object({
  ids: z.array(adminPlaceIdSchema).min(1).max(100),
  action: z.enum(['publish', 'unpublish', 'archive', 'verify', 'unverify']),
}).strict().superRefine((value, context) => {
  if (new Set(value.ids).size !== value.ids.length) context.addIssue({ code: 'custom', path: ['ids'], message: 'Danh sách địa điểm bị trùng.' })
})

const queryBoolean = z.preprocess((value) => value === undefined ? undefined : value === 'true' ? true : value === 'false' ? false : value, z.boolean().optional())
const queryNumber = (fallback: number, max: number) => z.preprocess(
  (value) => value === undefined ? fallback : Number(value),
  z.number().int().min(1).max(max),
)

export const adminPlaceListQuerySchema = z.object({
  status: placeStatusSchema.optional(),
  verified: queryBoolean,
  category: categorySchema.optional(),
  q: z.string().trim().max(200).optional(),
  missing: z.enum(['hours', 'duration', 'image', 'coords', 'meal_type', 'best_time']).optional(),
  page: queryNumber(1, 1_000_000),
  pageSize: queryNumber(25, 100),
}).strict()

export type AdminPlaceInput = z.infer<typeof adminPlaceInputSchema>
export type AdminPlaceStatus = z.infer<typeof placeStatusSchema>
export type AdminPlaceListQuery = z.infer<typeof adminPlaceListQuerySchema>

import { z } from 'zod'
import { categorySchema, placeStatusSchema, slotSchema } from './enums'

export const uuidSchema = z.string().uuid()
export const tagSchema = z.object({ slug: z.string(), name: z.string() })

export const placeSummarySchema = z.object({
  id: uuidSchema,
  slug: z.string(),
  name: z.string(),
  category: categorySchema,
  shortDescription: z.string().nullable(),
  area: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  coverImageUrl: z.string().url().nullable(),
  coverImageAlt: z.string().nullable(),
  imageCredit: z.string().nullable(),
  imageLicense: z.string().nullable(),
  imageSourceUrl: z.string().url().nullable().optional(),
  tags: z.array(tagSchema),
  verified: z.boolean(),
  status: z.enum(['published', 'archived']).optional(),
})

export const placeImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().nullable(),
  credit: z.string(),
  license: z.string(),
  sourceUrl: z.string().url().nullable(),
})

export const placeDetailSchema = placeSummarySchema.extend({
  description: z.string().nullable(),
  address: z.string().nullable(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  closedDays: z.array(z.number().int().min(1).max(7)),
  openingNote: z.string().nullable(),
  visitDurationMin: z.number().int().positive().nullable(),
  priceLevel: z.number().int().min(0).max(3).nullable(),
  ticketPriceVnd: z.number().nonnegative().nullable(),
  priceNote: z.string().nullable(),
  bestTime: z.array(slotSchema),
  mealType: z.array(z.enum(['breakfast', 'lunch', 'dinner', 'snack'])),
  suitableFor: z.array(z.string()),
  walkingIntensity: z.number().int().min(1).max(3).nullable(),
  phone: z.string().nullable(),
  website: z.string().url().nullable(),
  images: z.array(placeImageSchema),
  lastVerifiedAt: z.string().datetime().nullable(),
})

export type PlaceSummary = z.infer<typeof placeSummarySchema>
export type PlaceDetail = z.infer<typeof placeDetailSchema>
export type PlaceStatusValue = z.infer<typeof placeStatusSchema>

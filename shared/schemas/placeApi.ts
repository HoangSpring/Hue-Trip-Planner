import { z } from 'zod'
import { categorySchema } from './enums'
import { placeDetailSchema, placeSummarySchema } from './place'

export const paginatedPlacesSchema = z.object({
  items: z.array(placeSummarySchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(60),
  total: z.number().int().nonnegative(),
})

export const placeMapItemSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  category: categorySchema,
  lat: z.number(),
  lng: z.number(),
  coverImageUrl: z.string().url().nullable(),
})

export const mapPlacesSchema = z.object({ items: z.array(placeMapItemSchema) })

export const placeMetaSchema = z.object({
  tags: z.array(z.object({
    slug: z.string(),
    name: z.string(),
    icon: z.string().nullable(),
    imageUrl: z.string().url().nullable(),
  })),
  startPoints: z.array(z.object({ slug: z.string(), name: z.string(), lat: z.number(), lng: z.number() })),
  categories: z.array(z.object({ slug: categorySchema, name: z.string() })),
})

export const placeDetailResponseSchema = z.object({
  place: placeDetailSchema,
  nearby: z.array(placeSummarySchema),
})

export type PaginatedPlaces = z.infer<typeof paginatedPlacesSchema>
export type PlaceMapItemDto = z.infer<typeof placeMapItemSchema>
export type PlaceMeta = z.infer<typeof placeMetaSchema>
export type PlaceDetailResponse = z.infer<typeof placeDetailResponseSchema>

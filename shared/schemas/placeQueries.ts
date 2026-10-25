import { z } from 'zod'
import { categorySchema } from './enums'

const tagSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)

export const placeListQuerySchema = z.object({
  category: categorySchema.optional(),
  tag: z.array(tagSlugSchema).max(10).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(['featured', 'name']).default('featured'),
  featured: z.enum(['true']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(24),
})

export const placeMapQuerySchema = z.object({ category: categorySchema.optional() })

export type PlaceListQuery = z.infer<typeof placeListQuerySchema>
export type PlaceMapQuery = z.infer<typeof placeMapQuerySchema>

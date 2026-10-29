import { z } from 'zod'
import { categorySchema } from './enums'
import { placeSummarySchema, uuidSchema } from './place'

export const savedPlacesResponseSchema = z.object({ items: z.array(placeSummarySchema) }).strict()
export const savedPlacesQuerySchema = z.object({ category: categorySchema.optional() }).strict()
export const savedPlaceIdSchema = uuidSchema
export type SavedPlacesResponse = z.infer<typeof savedPlacesResponseSchema>

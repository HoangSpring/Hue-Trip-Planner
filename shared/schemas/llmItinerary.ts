import { z } from 'zod'
import { slotSchema } from './enums'
import { uuidSchema } from './place'

export const llmItineraryItemSchema = z.object({
  placeId: uuidSchema,
  slot: slotSchema,
  reason: z.string().min(1).max(240),
}).strict()

export const llmItineraryDaySchema = z.object({
  dayIndex: z.number().int().min(1).max(5),
  theme: z.string().max(80).optional(),
  items: z.array(llmItineraryItemSchema).min(1).max(8),
}).strict()

export const llmItinerarySchema = z.object({
  summary: z.string().max(240).optional(),
  days: z.array(llmItineraryDaySchema).min(1).max(5),
}).strict()

export type LlmItinerary = z.infer<typeof llmItinerarySchema>

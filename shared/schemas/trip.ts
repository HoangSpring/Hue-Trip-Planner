import { z } from 'zod'
import { addedBySchema, generatedBySchema, slotSchema, warningCodeSchema, noticeCodeSchema } from './enums'
import { placeSummarySchema, uuidSchema } from './place'
import { tripInputSchema } from './tripInput'

export const tripItemSchema = z.object({
  id: uuidSchema,
  placeId: uuidSchema,
  place: placeSummarySchema.optional(),
  position: z.number().int().min(0),
  slot: slotSchema,
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  durationMin: z.number().int().positive().nullable(),
  travelMinFromPrev: z.number().int().nonnegative().nullable(),
  travelDistanceM: z.number().nonnegative().nullable(),
  reason: z.string().max(240).nullable(),
  note: z.string().max(300).nullable(),
  isLocked: z.boolean(),
  addedBy: addedBySchema,
}).strict()

export const tripDaySchema = z.object({
  id: uuidSchema,
  dayIndex: z.number().int().min(1).max(5),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  note: z.string().nullable(),
  items: z.array(tripItemSchema).max(8),
}).strict()

export const tripSchema = z.object({
  id: uuidSchema,
  clientDraftId: uuidSchema.nullable(),
  title: z.string().min(1).max(100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  numDays: z.number().int().min(1).max(5),
  input: tripInputSchema,
  generatedBy: generatedBySchema,
  llmModel: z.string().nullable(),
  start: tripInputSchema.shape.start,
  isShared: z.boolean(),
  shareToken: z.string().nullable(),
  days: z.array(tripDaySchema).max(5),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).strict()

export const tripDraftSchema = tripSchema.omit({ id: true, isShared: true, shareToken: true, createdAt: true, updatedAt: true }).extend({
  clientDraftId: uuidSchema,
})

export const generateTripRequestSchema = z.object({
  input: tripInputSchema,
  clientDraftId: uuidSchema.optional(),
}).strict()

export const warningSchema = z.object({
  code: warningCodeSchema,
  itemId: uuidSchema.nullable(),
  dayIndex: z.number().int().min(1).max(5),
  message: z.string(),
})

export const noticeSchema = z.object({ code: noticeCodeSchema, message: z.string() })

export const generateTripResponseSchema = z.object({
  draft: tripDraftSchema,
  warnings: z.array(warningSchema),
  notices: z.array(noticeSchema),
  generation: z.object({
    by: generatedBySchema,
    model: z.string().nullable(),
    durationMs: z.number(),
  }),
}).strict()

export const alternativesRequestSchema = z.object({
  placeId: uuidSchema,
  slot: slotSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  excludePlaceIds: z.array(uuidSchema).default([]),
  limit: z.number().int().min(1).max(20).default(5),
  input: tripInputSchema.optional(),
}).strict()

export const alternativeItemSchema = z.object({
  place: placeSummarySchema,
  distanceM: z.number().nonnegative(),
  reasonTag: z.string(),
}).strict()

export const alternativesResponseSchema = z.object({
  items: z.array(alternativeItemSchema),
}).strict()

export const lockedItemSchema = z.object({
  placeId: uuidSchema,
  slot: slotSchema,
}).strict()

export const regenerateDayRequestSchema = z.object({
  input: tripInputSchema,
  dayIndex: z.number().int().min(1).max(5),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  lockedItems: z.array(lockedItemSchema).default([]),
  excludePlaceIds: z.array(uuidSchema).default([]),
}).strict()

export const regenerateDayResponseSchema = z.object({
  day: tripDaySchema,
  warnings: z.array(warningSchema),
  notices: z.array(noticeSchema),
  generation: z.object({
    by: generatedBySchema,
    model: z.string().nullable(),
    durationMs: z.number(),
  }),
}).strict()

export type TripItem = z.infer<typeof tripItemSchema>
export type TripDay = z.infer<typeof tripDaySchema>
export type Trip = z.infer<typeof tripSchema>
export type TripDraft = z.infer<typeof tripDraftSchema>
export type Warning = z.infer<typeof warningSchema>
export type Notice = z.infer<typeof noticeSchema>
export type GenerateTripResponse = z.infer<typeof generateTripResponseSchema>
export type AlternativesRequest = z.infer<typeof alternativesRequestSchema>
export type AlternativeItem = z.infer<typeof alternativeItemSchema>
export type AlternativesResponse = z.infer<typeof alternativesResponseSchema>
export type RegenerateDayRequest = z.infer<typeof regenerateDayRequestSchema>
export type RegenerateDayResponse = z.infer<typeof regenerateDayResponseSchema>


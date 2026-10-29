import { z } from 'zod'
import { addedBySchema, generatedBySchema, slotSchema, warningCodeSchema, noticeCodeSchema } from './enums'
import { placeSummarySchema, uuidSchema } from './place'
import { tripInputSchema } from './tripInput'

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}, 'Ngày không hợp lệ')

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
  date: isoDateSchema.nullable(),
  note: z.string().nullable(),
  items: z.array(tripItemSchema).max(8),
}).strict()

export const tripSchema = z.object({
  id: uuidSchema,
  clientDraftId: uuidSchema.nullable(),
  title: z.string().min(1).max(100),
  startDate: isoDateSchema.nullable(),
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

const tripWriteDaySchema = tripDaySchema.extend({
  note: z.string().max(300).nullable(),
  items: z.array(tripItemSchema).max(8),
}).strict()

export const tripCreateRequestSchema = tripDraftSchema.superRefine((trip, context) => {
  if (trip.days.length !== trip.numDays) context.addIssue({ code: 'custom', path: ['days'], message: 'Số ngày không khớp numDays.' })
  trip.days.forEach((day, dayIndex) => {
    if (day.dayIndex !== dayIndex + 1) context.addIssue({ code: 'custom', path: ['days', dayIndex, 'dayIndex'], message: 'Ngày phải liên tục từ 1.' })
    day.items.forEach((item, itemIndex) => {
      if (item.position !== itemIndex) context.addIssue({ code: 'custom', path: ['days', dayIndex, 'items', itemIndex, 'position'], message: 'Vị trí phải liên tục từ 0.' })
    })
  })
})

export const tripReplaceRequestSchema = z.object({
  expectedUpdatedAt: z.string().datetime(),
  title: z.string().min(1).max(100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  days: z.array(tripWriteDaySchema).max(5),
}).strict().superRefine((trip, context) => {
  const indexes = trip.days.map((day) => day.dayIndex)
  if (indexes.some((index, i) => index !== i + 1)) context.addIssue({ code: 'custom', path: ['days'], message: 'Ngày phải liên tục từ 1.' })
  trip.days.forEach((day, dayIndex) => day.items.forEach((item, itemIndex) => {
    if (item.position !== itemIndex) context.addIssue({ code: 'custom', path: ['days', dayIndex, 'items', itemIndex, 'position'], message: 'Vị trí phải liên tục từ 0.' })
  }))
})

export const tripPatchRequestSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  startDate: isoDateSchema.nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'Cần có ít nhất một trường cần cập nhật.')

export const tripListItemSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  numDays: z.number().int().min(1).max(5),
  startDate: isoDateSchema.nullable(),
  isShared: z.boolean(),
  coverImageUrl: z.string().url().nullable(),
  updatedAt: z.string().datetime(),
}).strict()

export const tripListResponseSchema = z.object({ items: z.array(tripListItemSchema) }).strict()

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
export const tripReplaceResponseSchema = z.object({ trip: tripSchema, warnings: z.array(warningSchema) }).strict()

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
}).strict().superRefine((request, context) => {
  if (request.dayIndex > request.input.numDays) {
    context.addIssue({ code: 'custom', path: ['dayIndex'], message: 'Ngày cần tạo lại nằm ngoài chuyến đi.' })
  }
  const lockedIds = request.lockedItems.map(({ placeId }) => placeId)
  if (new Set(lockedIds).size !== lockedIds.length) {
    context.addIssue({ code: 'custom', path: ['lockedItems'], message: 'Không thể khóa trùng một địa điểm.' })
  }
  if (new Set(request.excludePlaceIds).size !== request.excludePlaceIds.length) {
    context.addIssue({ code: 'custom', path: ['excludePlaceIds'], message: 'Danh sách loại trừ có địa điểm trùng.' })
  }
  if (lockedIds.some((id) => request.excludePlaceIds.includes(id))) {
    context.addIssue({ code: 'custom', path: ['lockedItems'], message: 'Địa điểm bị khóa không thể đồng thời nằm ở ngày khác.' })
  }
})

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
export type TripCreateRequest = z.infer<typeof tripCreateRequestSchema>
export type TripReplaceRequest = z.infer<typeof tripReplaceRequestSchema>
export type TripPatchRequest = z.infer<typeof tripPatchRequestSchema>
export type Warning = z.infer<typeof warningSchema>
export type Notice = z.infer<typeof noticeSchema>
export type GenerateTripResponse = z.infer<typeof generateTripResponseSchema>
export type AlternativesRequest = z.infer<typeof alternativesRequestSchema>
export type AlternativeItem = z.infer<typeof alternativeItemSchema>
export type AlternativesResponse = z.infer<typeof alternativesResponseSchema>
export type RegenerateDayRequest = z.infer<typeof regenerateDayRequestSchema>
export type RegenerateDayResponse = z.infer<typeof regenerateDayResponseSchema>


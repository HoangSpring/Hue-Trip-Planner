import { z } from 'zod'
import { slotSchema, type Slot } from './enums'
import { placeSummarySchema, uuidSchema, type PlaceSummary } from './place'

const sharedItemSchema = z.object({
  placeId: uuidSchema,
  position: z.number().int().nonnegative(),
  slot: slotSchema,
  startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  durationMin: z.number().int().positive().nullable(),
  travelMinFromPrev: z.number().int().nonnegative().nullable(),
  travelDistanceM: z.number().nonnegative().nullable(),
  reason: z.string().max(240).nullable(),
  place: placeSummarySchema,
}).strict()

const sharedDaySchema = z.object({
  dayIndex: z.number().int().min(1).max(5),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  items: z.array(sharedItemSchema).max(8),
}).strict()

export const sharedTripViewSchema = z.object({
  title: z.string().min(1).max(100),
  numDays: z.number().int().min(1).max(5),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  start: z.object({ label: z.string(), lat: z.number(), lng: z.number() }).strict().nullable(),
  days: z.array(sharedDaySchema).max(5),
}).strict()

export const setShareRequestSchema = z.object({ enabled: z.boolean() }).strict()
export const setShareResponseSchema = z.object({
  isShared: z.boolean(),
  shareToken: z.string().regex(/^[A-Za-z0-9_-]{22}$/).nullable(),
  shareUrl: z.string().url().nullable(),
}).strict()
export const shareTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{22}$/)

export type SharedTripView = {
  title: string
  numDays: number
  startDate: string | null
  start: { label: string; lat: number; lng: number } | null
  days: Array<{
    dayIndex: number
    date: string | null
    items: Array<{
      placeId: string
      position: number
      slot: Slot
      startTime: string | null
      durationMin: number | null
      travelMinFromPrev: number | null
      travelDistanceM: number | null
      reason: string | null
      place: PlaceSummary
    }>
  }>
}
export type SetShareRequest = { enabled: boolean }

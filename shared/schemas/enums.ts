import { z } from 'zod'

export const categorySchema = z.enum(['heritage', 'food', 'cafe', 'sightseeing', 'shopping'])
export const placeStatusSchema = z.enum(['draft', 'published', 'archived'])
export const slotSchema = z.enum(['morning', 'noon', 'afternoon', 'evening'])
export const companionSchema = z.enum(['solo', 'couple', 'family_kids', 'friends', 'seniors'])
export const paceSchema = z.enum(['relaxed', 'moderate', 'packed'])
export const budgetSchema = z.enum(['budget', 'mid', 'comfortable'])
export const transportSchema = z.enum(['motorbike', 'taxi', 'walk_bike', 'tour'])
export const generatedBySchema = z.enum(['llm', 'fallback', 'manual'])
export const addedBySchema = z.enum(['ai', 'fallback', 'user'])
export const warningCodeSchema = z.enum([
  'CLOSED_ON_DAY', 'CLOSED_AT_TIME', 'MISSING_HOURS', 'TOO_FAR',
  'TOO_MANY_ITEMS', 'TIME_OVERLAP', 'PLACE_ARCHIVED', 'LUNCH_MISSING',
])
export const noticeCodeSchema = z.enum(['FALLBACK_USED', 'FEW_CANDIDATES', 'FILTER_RELAXED', 'LLM_DISABLED', 'LUNCH_MISSING'])

export type Category = z.infer<typeof categorySchema>
export type PlaceStatus = z.infer<typeof placeStatusSchema>
export type Slot = z.infer<typeof slotSchema>
export type Companion = z.infer<typeof companionSchema>
export type Pace = z.infer<typeof paceSchema>
export type Budget = z.infer<typeof budgetSchema>
export type Transport = z.infer<typeof transportSchema>
export type GeneratedBy = z.infer<typeof generatedBySchema>
export type AddedBy = z.infer<typeof addedBySchema>
export type WarningCode = z.infer<typeof warningCodeSchema>
export type NoticeCode = z.infer<typeof noticeCodeSchema>

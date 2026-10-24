import { z } from 'zod'
import { budgetSchema, companionSchema, paceSchema, transportSchema } from './enums'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
}, 'Ngày không hợp lệ')

const interestSlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Mã sở thích không hợp lệ')

export const tripInputSchema = z.object({
  numDays: z.number().int().min(1).max(5),
  startDate: dateSchema.nullable(),
  companion: companionSchema,
  groupSize: z.number().int().min(1).max(50).nullable(),
  interests: z.array(interestSlugSchema).min(2).max(6),
  pace: paceSchema,
  budget: budgetSchema.nullable(),
  transport: transportSchema.nullable(),
  start: z.object({
    label: z.string().trim().min(1).max(100),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).strict().nullable(),
  notes: z.string().max(300).nullable(),
}).strict()

export type TripInput = z.infer<typeof tripInputSchema>

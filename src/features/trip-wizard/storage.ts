import { z } from 'zod'
import {
  companionSchema,
  paceSchema,
  budgetSchema,
  transportSchema,
  tripInputSchema,
  tripDraftSchema,
  type TripDraft,
  type TripInput,
} from '@shared/schemas'

export const WIZARD_DRAFT_KEY = 'wizard_draft_v1'
export const TRIP_DRAFT_KEY = 'trip_draft_v1'

export interface TripWizardFormValues {
  numDays: number
  startDate: string
  companion: z.infer<typeof companionSchema> | null
  groupSize: number | null
  interests: string[]
  pace: z.infer<typeof paceSchema>
  budget: z.infer<typeof budgetSchema> | null
  transport: z.infer<typeof transportSchema> | null
  start: {
    label: string
    lat: number
    lng: number
  } | null
  notes: string
}

export const defaultWizardValues: TripWizardFormValues = {
  numDays: 2,
  startDate: '',
  companion: null,
  groupSize: 2,
  interests: [],
  pace: 'moderate',
  budget: null,
  transport: null,
  start: null,
  notes: '',
}

export const storedWizardDraftSchema = z.object({
  step: z.number().int().min(1).max(6).default(1),
  values: z.object({
    numDays: z.number().int().min(1).max(5).default(2),
    startDate: z.string().default(''),
    companion: companionSchema.nullable().default(null),
    groupSize: z.number().int().positive().nullable().default(2),
    interests: z.array(z.string()).default([]),
    pace: paceSchema.default('moderate'),
    budget: budgetSchema.nullable().default(null),
    transport: transportSchema.nullable().default(null),
    start: z.object({
      label: z.string(),
      lat: z.number(),
      lng: z.number(),
    }).nullable().default(null),
    notes: z.string().max(300).default(''),
  }).default(defaultWizardValues),
  input: tripInputSchema.optional(),
  updatedAt: z.string().optional(),
})

export type StoredWizardDraft = z.infer<typeof storedWizardDraftSchema>

let memoryWizardDraft: StoredWizardDraft | null = null
let memoryTripDraft: TripDraft | null = null

export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, '1')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function readStoredWizardDraft(): StoredWizardDraft | null {
  try {
    const raw = localStorage.getItem(WIZARD_DRAFT_KEY)
    if (!raw) return memoryWizardDraft
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      localStorage.removeItem(WIZARD_DRAFT_KEY)
      return null
    }
    const validated = storedWizardDraftSchema.safeParse(parsed)
    if (validated.success) return validated.data
    // Data is corrupted, discard cleanly without crashing
    localStorage.removeItem(WIZARD_DRAFT_KEY)
    return null
  } catch {
    return memoryWizardDraft
  }
}

export function writeStoredWizardDraft(draft: StoredWizardDraft): boolean {
  memoryWizardDraft = draft
  try {
    const serialized = JSON.stringify(draft)
    localStorage.setItem(WIZARD_DRAFT_KEY, serialized)
    return true
  } catch {
    return false
  }
}

export function clearStoredWizardDraft(): void {
  memoryWizardDraft = null
  try {
    localStorage.removeItem(WIZARD_DRAFT_KEY)
  } catch {
    // Ignore error in restricted environments
  }
}

export function readStoredTripDraft(): TripDraft | null {
  try {
    const raw = localStorage.getItem(TRIP_DRAFT_KEY)
    if (!raw) return memoryTripDraft
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      localStorage.removeItem(TRIP_DRAFT_KEY)
      return null
    }
    const validated = tripDraftSchema.safeParse(parsed)
    if (validated.success) return validated.data
    localStorage.removeItem(TRIP_DRAFT_KEY)
    return null
  } catch {
    return memoryTripDraft
  }
}

export function writeStoredTripDraft(draft: TripDraft): boolean {
  memoryTripDraft = draft
  try {
    const serialized = JSON.stringify(draft)
    localStorage.setItem(TRIP_DRAFT_KEY, serialized)
    return true
  } catch {
    return false
  }
}

export function clearStoredTripDraft(): void {
  memoryTripDraft = null
  try {
    localStorage.removeItem(TRIP_DRAFT_KEY)
  } catch {
    // Ignore error
  }
}

export const NOTICES_KEY = 'trip_notices_v1'
let memoryNotices: import('@shared/schemas').Notice[] = []

export function readStoredNotices(): import('@shared/schemas').Notice[] {
  try {
    const raw = localStorage.getItem(NOTICES_KEY)
    if (!raw) return memoryNotices
    return JSON.parse(raw)
  } catch {
    return memoryNotices
  }
}

export function writeStoredNotices(notices: import('@shared/schemas').Notice[]): void {
  memoryNotices = notices
  try {
    localStorage.setItem(NOTICES_KEY, JSON.stringify(notices))
  } catch {
    // Ignore error
  }
}

export function formValuesToTripInput(values: TripWizardFormValues): TripInput {

  return tripInputSchema.parse({
    numDays: values.numDays,
    startDate: values.startDate.trim() ? values.startDate.trim() : null,
    companion: values.companion,
    groupSize: values.groupSize ?? null,
    interests: values.interests,
    pace: values.pace,
    budget: values.budget ?? null,
    transport: values.transport ?? null,
    start: values.start ?? null,
    notes: values.notes.trim() ? values.notes.trim().slice(0, 300) : null,
  })
}

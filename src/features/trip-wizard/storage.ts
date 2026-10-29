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
export const TRIP_SAVE_PENDING_KEY = 'trip_save_pending_v1'
export const PENDING_ACTION_KEY = 'pending_action'
export const AUTH_SYNC_PENDING_KEY = 'auth_sync_pending_v1'
export const AUTH_SYNC_NEXT_KEY = 'auth_sync_next_v1'

export type PendingAction = { type: 'save_place'; placeId: string }

const pendingActionSchema = z.string().regex(/^save_place:[0-9a-f-]{36}$/i)

export function readPendingAction(): PendingAction | null {
  try {
    const raw = localStorage.getItem(PENDING_ACTION_KEY)
    if (!raw || !pendingActionSchema.safeParse(raw).success) return null
    return { type: 'save_place', placeId: raw.slice('save_place:'.length) }
  } catch { return null }
}

export function writePendingAction(action: PendingAction): void {
  try { localStorage.setItem(PENDING_ACTION_KEY, `${action.type}:${action.placeId}`) } catch { /* Retry remains possible from the originating flow. */ }
}

export function clearPendingAction(): void {
  try { localStorage.removeItem(PENDING_ACTION_KEY) } catch { /* Ignore restricted storage. */ }
}

export function hasPendingAuthSync(): boolean {
  try { return localStorage.getItem(AUTH_SYNC_PENDING_KEY) === 'true' } catch { return false }
}

export function markAuthSyncPending(): void {
  try { localStorage.setItem(AUTH_SYNC_PENDING_KEY, 'true') } catch { /* Draft remains the durable copy. */ }
}

export function clearAuthSyncPending(): void {
  try { localStorage.removeItem(AUTH_SYNC_PENDING_KEY) } catch { /* Ignore restricted storage. */ }
}

export function readAuthSyncNext(): string | null {
  try { return localStorage.getItem(AUTH_SYNC_NEXT_KEY) } catch { return null }
}

export function writeAuthSyncNext(next: string): void {
  try { localStorage.setItem(AUTH_SYNC_NEXT_KEY, next) } catch { /* Navigation still has its in-memory fallback. */ }
}

export function clearAuthSyncNext(): void {
  try { localStorage.removeItem(AUTH_SYNC_NEXT_KEY) } catch { /* Ignore restricted storage. */ }
}

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

export function hasPendingTripSave(): boolean {
  try { return localStorage.getItem(TRIP_SAVE_PENDING_KEY) === 'true' } catch { return false }
}

export function markTripSavePending(): void {
  try { localStorage.setItem(TRIP_SAVE_PENDING_KEY, 'true') } catch { /* Keep the trip draft as the durable copy. */ }
}

export function clearPendingTripSave(): void {
  try { localStorage.removeItem(TRIP_SAVE_PENDING_KEY) } catch { /* Ignore restricted storage. */ }
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

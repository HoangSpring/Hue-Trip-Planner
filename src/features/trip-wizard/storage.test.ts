import { beforeEach, describe, expect, it } from 'vitest'
import {
  readStoredWizardDraft,
  writeStoredWizardDraft,
  clearStoredWizardDraft,
  readStoredTripDraft,
  writeStoredTripDraft,
  clearStoredTripDraft,
  readStoredNotices,
  writeStoredNotices,
  formValuesToTripInput,
  defaultWizardValues,
  WIZARD_DRAFT_KEY,
  TRIP_DRAFT_KEY,
  NOTICES_KEY,
  type TripWizardFormValues,
} from './storage'
import type { TripDraft } from '@shared/schemas'

const sampleValidTripDraft: TripDraft = {
  clientDraftId: '00000000-0000-4000-8000-000000000001',
  title: 'Chuyến đi Huế 2 ngày',
  numDays: 2,
  startDate: '2026-11-01',
  generatedBy: 'fallback',
  llmModel: null,
  start: { label: 'Đại Nội', lat: 16.4691, lng: 107.5794 },
  input: {
    numDays: 2,
    startDate: '2026-11-01',
    companion: 'couple',
    groupSize: 2,
    interests: ['heritage', 'cuisine'],
    pace: 'moderate',
    budget: 'mid',
    transport: 'motorbike',
    start: { label: 'Đại Nội', lat: 16.4691, lng: 107.5794 },
    notes: 'Ghi chú thử nghiệm',
  },
  days: [
    {
      id: '00000000-0000-4000-8000-000000000010',
      dayIndex: 1,
      date: '2026-11-01',
      note: null,
      items: [],
    },
    {
      id: '00000000-0000-4000-8000-000000000011',
      dayIndex: 2,
      date: '2026-11-02',
      note: null,
      items: [],
    },
  ],
}

describe('Trip Wizard Storage', () => {
  beforeEach(() => {
    localStorage.clear()
    clearStoredWizardDraft()
    clearStoredTripDraft()
  })

  it('writes and reads valid wizard draft', () => {
    const draft = {
      step: 3,
      values: {
        ...defaultWizardValues,
        numDays: 3,
        companion: 'couple' as const,
        interests: ['heritage', 'cuisine'],
      },
      updatedAt: new Date().toISOString(),
    }

    const written = writeStoredWizardDraft(draft)
    expect(written).toBe(true)

    const read = readStoredWizardDraft()
    expect(read).not.toBeNull()
    expect(read?.step).toBe(3)
    expect(read?.values.numDays).toBe(3)
    expect(read?.values.companion).toBe('couple')
    expect(read?.values.interests).toEqual(['heritage', 'cuisine'])
  })

  it('safely discards corrupted wizard draft data without crashing', () => {
    // Malformed JSON
    localStorage.setItem(WIZARD_DRAFT_KEY, 'not-json{{{')
    expect(readStoredWizardDraft()).toBeNull()
    expect(localStorage.getItem(WIZARD_DRAFT_KEY)).toBeNull()

    // Invalid schema (e.g. invalid numDays or companion type)
    localStorage.setItem(WIZARD_DRAFT_KEY, JSON.stringify({ step: 99, values: { numDays: 100 } }))
    expect(readStoredWizardDraft()).toBeNull()
    expect(localStorage.getItem(WIZARD_DRAFT_KEY)).toBeNull()
  })

  it('clears wizard draft completely', () => {
    writeStoredWizardDraft({
      step: 2,
      values: defaultWizardValues,
    })
    expect(readStoredWizardDraft()).not.toBeNull()

    clearStoredWizardDraft()
    expect(readStoredWizardDraft()).toBeNull()
    expect(localStorage.getItem(WIZARD_DRAFT_KEY)).toBeNull()
  })

  it('writes and reads trip draft', () => {
    const written = writeStoredTripDraft(sampleValidTripDraft)
    expect(written).toBe(true)

    const read = readStoredTripDraft()
    expect(read).not.toBeNull()
    expect(read?.title).toBe('Chuyến đi Huế 2 ngày')
    expect(read?.clientDraftId).toBe('00000000-0000-4000-8000-000000000001')
  })

  it('safely discards corrupted trip draft data without crashing', () => {
    localStorage.setItem(TRIP_DRAFT_KEY, '{"invalid": "data"}')
    expect(readStoredTripDraft()).toBeNull()
    expect(localStorage.getItem(TRIP_DRAFT_KEY)).toBeNull()
  })

  it('writes, reads, and clears notices', () => {
    const notices = [{ code: 'FEW_CANDIDATES' as const, message: 'Ít ứng viên phù hợp' }]
    writeStoredNotices(notices)

    const read = readStoredNotices()
    expect(read).toHaveLength(1)
    expect(read[0].code).toBe('FEW_CANDIDATES')

    localStorage.removeItem(NOTICES_KEY)
    expect(readStoredNotices()).toEqual(notices) // fallback to memory
  })

  it('converts form values to strict TripInput', () => {
    const formValues: TripWizardFormValues = {
      numDays: 3,
      startDate: '2026-11-05',
      companion: 'seniors',
      groupSize: 4,
      interests: ['heritage', 'spiritual'],
      pace: 'relaxed',
      budget: 'mid',
      transport: 'taxi',
      start: { label: 'Đại Nội', lat: 16.4691, lng: 107.5794 },
      notes: '   Người lớn tuổi đi thong thả   ',
    }

    const tripInput = formValuesToTripInput(formValues)
    expect(tripInput.numDays).toBe(3)
    expect(tripInput.startDate).toBe('2026-11-05')
    expect(tripInput.companion).toBe('seniors')
    expect(tripInput.groupSize).toBe(4)
    expect(tripInput.interests).toEqual(['heritage', 'spiritual'])
    expect(tripInput.pace).toBe('relaxed')
    expect(tripInput.notes).toBe('Người lớn tuổi đi thong thả')
  })

  it('handles empty optional fields cleanly in TripInput', () => {
    const formValues: TripWizardFormValues = {
      numDays: 2,
      startDate: '',
      companion: 'solo',
      groupSize: null,
      interests: ['cuisine', 'cafe'],
      pace: 'moderate',
      budget: null,
      transport: null,
      start: null,
      notes: '',
    }

    const tripInput = formValuesToTripInput(formValues)
    expect(tripInput.startDate).toBeNull()
    expect(tripInput.groupSize).toBeNull()
    expect(tripInput.budget).toBeNull()
    expect(tripInput.transport).toBeNull()
    expect(tripInput.start).toBeNull()
    expect(tripInput.notes).toBeNull()
  })
})

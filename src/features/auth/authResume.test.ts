import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TripDraft } from '@shared/schemas'
import { clearStoredTripDraft, readPendingAction, readStoredTripDraft, writePendingAction, writeStoredTripDraft, hasPendingAuthSync } from '@/features/trip-wizard/storage'

const mocks = vi.hoisted(() => ({ createTripApi: vi.fn(), putSavedPlaceApi: vi.fn() }))
vi.mock('@/lib/api', () => mocks)

import { resumeAfterAuthentication } from './authResume'

const draft: TripDraft = {
  clientDraftId: '00000000-0000-4000-8000-000000000001', title: 'Huế', startDate: '2026-11-01', numDays: 1,
  generatedBy: 'fallback', llmModel: null, start: null,
  input: { numDays: 1, startDate: '2026-11-01', companion: 'couple', groupSize: 2, interests: ['heritage', 'cuisine'], pace: 'moderate', budget: null, transport: null, start: null, notes: null },
  days: [{ id: '00000000-0000-4000-8000-000000000010', dayIndex: 1, date: '2026-11-01', note: null, items: [] }],
}

describe('resumeAfterAuthentication', () => {
  beforeEach(() => {
    localStorage.clear()
    clearStoredTripDraft()
    mocks.createTripApi.mockReset().mockResolvedValue({ id: '00000000-0000-4000-8000-000000000099' })
    mocks.putSavedPlaceApi.mockReset().mockResolvedValue(undefined)
  })

  it('deduplicates concurrent resumes and clears the draft only after success', async () => {
    writeStoredTripDraft(draft)
    const first = resumeAfterAuthentication('test-token', '/account/trips')
    const second = resumeAfterAuthentication('test-token', '/account/trips')
    expect(first).toBe(second)
    await expect(first).resolves.toBe('/trip/00000000-0000-4000-8000-000000000099')
    expect(mocks.createTripApi).toHaveBeenCalledTimes(1)
    expect(mocks.createTripApi.mock.calls[0]?.[0].clientDraftId).toBe(draft.clientDraftId)
    expect(readStoredTripDraft()).toBeNull()
  })

  it('keeps draft and pending action on failure, then retries with the same idempotency key', async () => {
    writeStoredTripDraft(draft)
    writePendingAction({ type: 'save_place', placeId: '00000000-0000-4000-8000-000000000002' })
    mocks.putSavedPlaceApi.mockRejectedValueOnce(new Error('not ready')).mockResolvedValueOnce(undefined)

    await expect(resumeAfterAuthentication('test-token', '/place/example')).rejects.toThrow('not ready')
    expect(readStoredTripDraft()?.clientDraftId).toBe(draft.clientDraftId)
    expect(readPendingAction()).toEqual({ type: 'save_place', placeId: '00000000-0000-4000-8000-000000000002' })
    expect(hasPendingAuthSync()).toBe(true)

    await expect(resumeAfterAuthentication('test-token', '/place/example')).resolves.toBe('/trip/00000000-0000-4000-8000-000000000099')
    expect(mocks.createTripApi).toHaveBeenCalledTimes(2)
    expect(mocks.createTripApi.mock.calls.map(([request]) => request.clientDraftId)).toEqual([draft.clientDraftId, draft.clientDraftId])
    expect(readStoredTripDraft()).toBeNull()
    expect(readPendingAction()).toBeNull()
  })
})

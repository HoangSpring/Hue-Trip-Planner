import { paths, safeNextPath } from '@/app/paths'
import { putSavedPlaceApi, createTripApi } from '@/lib/api'
import { tripCreateRequestSchema } from '@shared/schemas'
import {
  clearAuthSyncPending,
  clearAuthSyncNext,
  clearPendingAction,
  clearPendingTripSave,
  clearStoredTripDraft,
  markAuthSyncPending,
  markTripSavePending,
  readPendingAction,
  readStoredTripDraft,
} from '@/features/trip-wizard/storage'

let activeResume: { accessToken: string; promise: Promise<string> } | null = null

/** Resume a guest's deferred work. API idempotency uses the draft's clientDraftId. */
export function resumeAfterAuthentication(accessToken: string, next: string | null): Promise<string> {
  if (activeResume?.accessToken === accessToken) return activeResume.promise
  const promise = resume(accessToken, next).finally(() => {
    if (activeResume?.promise === promise) activeResume = null
  })
  activeResume = { accessToken, promise }
  return promise
}

async function resume(accessToken: string, next: string | null): Promise<string> {
  const draft = readStoredTripDraft()
  const action = readPendingAction()
  let savedTripPath: string | null = null

  try {
    if (draft) {
      const request = tripCreateRequestSchema.parse(draft)
      const trip = await createTripApi(request, accessToken)
      savedTripPath = paths.trip(trip.id)
    }
    if (action?.type === 'save_place') await putSavedPlaceApi(action.placeId, accessToken)

    // Keep the draft until every deferred action has succeeded. A retry is safe because
    // createTripApi is idempotent by clientDraftId.
    if (draft) clearStoredTripDraft()
    if (action) clearPendingAction()
    clearPendingTripSave()
    clearAuthSyncPending()
    clearAuthSyncNext()
    return savedTripPath ?? safeNextPath(next)
  } catch (error) {
    if (draft) markTripSavePending()
    markAuthSyncPending()
    throw error
  }
}


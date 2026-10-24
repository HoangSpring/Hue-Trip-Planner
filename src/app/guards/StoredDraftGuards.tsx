import { Navigate, Outlet } from 'react-router-dom'
import { tripDraftSchema, wizardDraftSchema } from '@shared/schemas'
import { paths } from '../paths'

function readStoredValue(key: string): unknown {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as unknown : null
  } catch { return null }
}

export function RequireWizardDraft() {
  const draft = readStoredValue('wizard_draft_v1')
  return wizardDraftSchema.safeParse(draft).success ? <Outlet /> : <Navigate to={paths.planNew} replace />
}

export function RequireTripDraft() {
  const draft = readStoredValue('trip_draft_v1')
  if (tripDraftSchema.safeParse(draft).success) return <Outlet />
  return <Navigate to={`${paths.planNew}?notice=no-draft`} replace />
}

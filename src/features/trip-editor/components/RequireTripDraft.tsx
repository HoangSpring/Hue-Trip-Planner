import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { paths } from '@/app/paths'
import { readStoredTripDraft } from '@/features/trip-wizard/storage'

export function RequireTripDraft({ children }: { children: ReactNode }) {
  const draft = readStoredTripDraft()

  if (!draft) {
    return (
      <Navigate
        to={paths.planNew}
        state={{ notice: 'Chưa có lịch trình nào' }}
        replace
      />
    )
  }

  return <>{children}</>
}

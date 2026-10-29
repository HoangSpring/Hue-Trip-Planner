import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../hooks/useSession'
import { resumeAfterAuthentication } from '../authResume'
import { hasPendingAuthSync, readAuthSyncNext, readStoredTripDraft } from '@/features/trip-wizard/storage'
import { vi } from '@/lib/strings/vi'

export function AuthResumeNotice() {
  const auth = useSession()
  const location = useLocation()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  if (auth.status !== 'authenticated' || !auth.session || !hasPendingAuthSync() || readStoredTripDraft()) return null

  async function retry() {
    if (!auth.session) return
    setBusy(true)
    try {
      const destination = await resumeAfterAuthentication(auth.session.access_token, readAuthSyncNext())
      navigate(destination, { replace: true })
    } catch {
      setBusy(false)
    }
  }

  return <aside key={location.key} className="mx-auto flex max-w-content flex-col gap-3 border-b border-warning/30 bg-warning/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between md:px-6" role="alert">
    <p>{vi.auth.resumeFailed}</p>
    <button type="button" disabled={busy} onClick={() => void retry()} className="min-h-11 shrink-0 rounded-control bg-primary px-4 font-semibold text-white disabled:opacity-60">
      {busy ? vi.system.loading : vi.system.retry}
    </button>
  </aside>
}

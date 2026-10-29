import { Outlet, useNavigate, useSearchParams } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useSession } from '@/features/auth/hooks/useSession'
import { safeNextPath } from '../paths'
import { vi } from '@/lib/strings/vi'
import { clearAuthSyncNext, markAuthSyncPending, readStoredTripDraft, writeAuthSyncNext } from '@/features/trip-wizard/storage'
import { resumeAfterAuthentication } from '@/features/auth/authResume'
import { paths } from '../paths'

export function RequireGuest() {
  const auth = useSession()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const started = useRef(false)
  const next = safeNextPath(searchParams.get('next'))

  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.session || started.current) return
    started.current = true
    writeAuthSyncNext(next)
    void resumeAfterAuthentication(auth.session.access_token, next).then((destination) => {
      clearAuthSyncNext()
      navigate(destination, { replace: true })
    }).catch(() => {
      markAuthSyncPending()
      navigate(readStoredTripDraft() ? paths.tripDraft : next, { replace: true })
    })
  }, [auth.session, auth.status, navigate, next])

  if (auth.status === 'loading') return <p className="p-8 text-center" role="status">{vi.system.loading}</p>
  if (auth.status === 'authenticated') return <p className="p-8 text-center" role="status">{vi.system.loading}</p>
  return <Outlet />
}

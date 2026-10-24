import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '@/features/auth/hooks/useSession'
import { paths } from '../paths'
import { vi } from '@/lib/strings/vi'

export function RequireAuth() {
  const auth = useSession()
  const location = useLocation()
  if (auth.status === 'loading') return <p className="p-8 text-center text-ink-muted" role="status">{vi.system.loading}</p>
  if (auth.status !== 'authenticated') {
    const next = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`${paths.login}?next=${encodeURIComponent(next)}`} replace />
  }
  return <Outlet />
}

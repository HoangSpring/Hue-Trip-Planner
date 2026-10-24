import { Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { useAuthState } from '../authState'
import { safeNextPath } from '../paths'
import { vi } from '@/lib/strings/vi'

export function RequireGuest() {
  const auth = useAuthState()
  const [searchParams] = useSearchParams()
  if (auth.status === 'loading') return <p className="p-8 text-center" role="status">{vi.system.loading}</p>
  if (auth.status === 'authenticated') return <Navigate to={safeNextPath(searchParams.get('next'))} replace />
  return <Outlet />
}

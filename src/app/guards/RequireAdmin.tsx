import { Navigate, Outlet } from 'react-router-dom'
import { useAuthState } from '../authState'
import { paths } from '../paths'
import { ForbiddenPage } from '@/features/static/ForbiddenPage'
import { vi } from '@/lib/strings/vi'

export function RequireAdmin() {
  const auth = useAuthState()
  if (auth.status === 'loading') return <p className="p-8 text-center" role="status">{vi.system.loading}</p>
  if (auth.status !== 'authenticated') return <Navigate to={`${paths.login}?next=${encodeURIComponent(paths.adminPlaces)}`} replace />
  if (auth.role !== 'admin') return <ForbiddenPage />
  return <Outlet />
}

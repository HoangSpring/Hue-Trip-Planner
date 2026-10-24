import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from '@/features/auth/hooks/useSession'
import { useProfile } from '@/features/auth/hooks/useProfile'
import { paths } from '../paths'
import { ForbiddenPage } from '@/features/static/ForbiddenPage'
import { vi } from '@/lib/strings/vi'

export function RequireAdmin() {
  const session = useSession()
  const profile = useProfile()
  if (session.isLoading) return <p className="p-8 text-center" role="status">{vi.system.loading}</p>
  if (!session.isAuthenticated) return <Navigate to={`${paths.login}?next=${encodeURIComponent(paths.adminPlaces)}`} replace />
  if (profile.isPending) return <p className="p-8 text-center" role="status">{vi.system.loading}</p>
  if (profile.isError) return <p className="p-8 text-center" role="alert">{vi.system.serviceConnectionError}</p>
  if (profile.data.role !== 'admin') return <ForbiddenPage />
  return <Outlet />
}

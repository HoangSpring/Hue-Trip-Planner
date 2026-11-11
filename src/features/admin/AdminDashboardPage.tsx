import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { paths } from '@/app/paths'
import { useSession } from '@/features/auth/hooks/useSession'
import { vi } from '@/lib/strings/vi'
import { getAdminDashboard } from './adminApi'

export default function AdminDashboardPage() {
  const token = useSession().session?.access_token ?? ''
  const query = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => getAdminDashboard(token), enabled: Boolean(token), retry: false })

  return <div className="space-y-6">
    <header><p className="text-sm font-semibold text-secondary">{vi.layout.admin}</p><h1 className="mt-1 font-serif text-3xl font-bold">{vi.admin.dashboard}</h1><p className="mt-2 text-sm text-ink-muted">{vi.admin.dashboardIntro}</p></header>
    {query.isPending ? <div role="status" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-card bg-surface-high" />)}</div>
      : query.isError ? <section role="alert" className="rounded-card border border-line bg-surface p-6"><p>{vi.admin.userActionFailed}</p><button type="button" onClick={() => void query.refetch()} className="mt-3 rounded-control bg-primary px-4 py-2 font-semibold text-white">{vi.admin.retry}</button></section>
        : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label={vi.admin.totalUsers} value={query.data.users} to={paths.adminUsers} />
          <MetricCard label={vi.admin.totalPlaces} value={query.data.places.total} to={paths.adminPlaces} />
          <MetricCard label={vi.admin.publishedPlaces} value={query.data.places.published} to={paths.adminPlaces} />
          <MetricCard label={vi.admin.totalTrips} value={query.data.trips} />
        </div>}
    <div className="grid gap-4 md:grid-cols-2">
      <Link to={paths.adminPlaces} className="rounded-card border border-line bg-surface p-5 transition hover:border-primary/40"><h2 className="font-serif text-xl font-semibold">{vi.layout.places}</h2><p className="mt-2 text-sm text-ink-muted">{vi.admin.title}</p></Link>
      <Link to={paths.adminUsers} className="rounded-card border border-line bg-surface p-5 transition hover:border-primary/40"><h2 className="font-serif text-xl font-semibold">{vi.admin.users}</h2><p className="mt-2 text-sm text-ink-muted">{vi.admin.usersIntro}</p></Link>
    </div>
  </div>
}

function MetricCard({ label, value, to }: { label: string; value: number; to?: string }) {
  const content = <><p className="text-sm text-ink-muted">{label}</p><p className="mt-3 font-serif text-3xl font-bold text-ink">{value.toLocaleString('vi-VN')}</p></>
  return to ? <Link to={to} className="rounded-card border border-line bg-surface p-5 hover:border-primary/40">{content}</Link> : <div className="rounded-card border border-line bg-surface p-5">{content}</div>
}

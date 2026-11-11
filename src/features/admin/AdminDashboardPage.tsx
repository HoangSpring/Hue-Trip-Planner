import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  MapPin,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react'
import { paths } from '@/app/paths'
import { useSession } from '@/features/auth/hooks/useSession'
import { vi } from '@/lib/strings/vi'
import { getAdminDashboard } from './adminApi'

export default function AdminDashboardPage() {
  const token = useSession().session?.access_token ?? ''

  const query = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => getAdminDashboard(token),
    enabled: Boolean(token),
    retry: false,
  })

  const stats = query.data
    ? [
      {
        label: vi.admin.totalUsers,
        value: query.data.users,
        icon: Users,
        description: 'Tài khoản trong hệ thống',
        tone: 'bg-sky-50 text-sky-700 ring-sky-100',
        trend: 'Quản lý người dùng',
        to: paths.adminUsers,
      },
      {
        label: vi.admin.totalPlaces,
        value: query.data.places.total,
        icon: MapPin,
        description: 'Địa điểm đã được tạo',
        tone: 'bg-violet-50 text-violet-700 ring-violet-100',
        trend: 'Quản lý địa điểm',
        to: paths.adminPlaces,
      },
      {
        label: vi.admin.publishedPlaces,
        value: query.data.places.published,
        icon: Compass,
        description: 'Địa điểm công khai',
        tone: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
        trend: 'Đang hiển thị',
        to: paths.adminPlaces,
      },
      {
        label: vi.admin.totalTrips,
        value: query.data.trips,
        icon: WalletCards,
        description: 'Chuyến đi được ghi nhận',
        tone: 'bg-amber-50 text-amber-700 ring-amber-100',
        trend: 'Tổng chuyến đi',
      },
    ]
    : []

  return (
    <main className="min-h-full space-y-8 pb-10">
      {/* Page heading */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            {vi.layout.admin}
          </div>

          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {vi.admin.dashboard}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-muted sm:text-base">
            {vi.admin.dashboardIntro}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink-muted sm:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Tổng quan quản trị
        </div>
      </header>

      {/* Error state */}
      {query.isError && (
        <section
          role="alert"
          className="flex flex-col gap-4 rounded-2xl border border-red-200 bg-red-50/70 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-red-800">
              Không thể tải dữ liệu tổng quan
            </p>
            <p className="mt-1 text-sm leading-6 text-red-700">
              {vi.admin.userActionFailed}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void query.refetch()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {vi.admin.retry}
            <ArrowRight className="h-4 w-4" />
          </button>
        </section>
      )}

      {/* Statistic cards */}
      <section aria-label="Thống kê hệ thống">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">Số liệu tổng quan</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Tình hình hoạt động của hệ thống
            </p>
          </div>

          {query.dataUpdatedAt > 0 && !query.isError && (
            <span className="text-right text-xs text-ink-muted">
              Cập nhật lần cuối
              <br />
              {new Date(query.dataUpdatedAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {query.isPending
            ? Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                role="status"
                aria-label="Đang tải thống kê"
                className="h-48 animate-pulse rounded-2xl border border-line bg-surface p-5"
              >
                <div className="h-11 w-11 rounded-xl bg-surface-high" />
                <div className="mt-6 h-3 w-2/3 rounded bg-surface-high" />
                <div className="mt-3 h-8 w-1/2 rounded bg-surface-high" />
                <div className="mt-4 h-3 w-3/4 rounded bg-surface-high" />
              </div>
            ))
            : query.isError
              ? null
              : stats.map((stat) => {
                const Icon = stat.icon

                const content = (
                  <div className="group relative flex h-full min-h-48 flex-col overflow-hidden rounded-2xl border border-line bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ${stat.tone}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      {stat.to && (
                        <span className="rounded-full border border-line p-2 text-ink-muted transition group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary">
                          <ArrowUpRight className="h-4 w-4" />
                        </span>
                      )}
                    </div>

                    <p className="mt-5 text-sm font-medium text-ink-muted">
                      {stat.label}
                    </p>

                    <p className="mt-1 font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                      {stat.value.toLocaleString('vi-VN')}
                    </p>

                    <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-ink-muted">
                      <span className="truncate">{stat.description}</span>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-primary">
                      {stat.trend}
                      {stat.to && (
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      )}
                    </div>
                  </div>
                )

                return stat.to ? (
                  <Link
                    key={stat.label}
                    to={stat.to}
                    className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={stat.label}>{content}</div>
                )
              })}
        </div>
      </section>

      {/* Management shortcuts */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-ink">Quản lý hệ thống</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Truy cập nhanh các khu vực quản trị
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            to={paths.adminPlaces}
            className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 sm:p-6"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100 transition group-hover:scale-105">
              <MapPin className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-lg font-bold text-ink">
                {vi.layout.places}
              </h3>
              <p className="mt-1 text-sm leading-5 text-ink-muted">
                {vi.admin.title}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Mở quản lý địa điểm
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>

          <Link
            to={paths.adminUsers}
            className="group flex items-center gap-4 rounded-2xl border border-line bg-surface p-5 transition duration-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 sm:p-6"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100 transition group-hover:scale-105">
              <Users className="h-6 w-6" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-lg font-bold text-ink">
                {vi.admin.users}
              </h3>
              <p className="mt-1 text-sm leading-5 text-ink-muted">
                {vi.admin.usersIntro}
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Mở quản lý người dùng
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Footer note */}
      <footer className="flex items-start gap-3 rounded-2xl border border-line bg-surface/70 p-4 sm:items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <p className="text-xs leading-5 text-ink-muted sm:text-sm">
          Khu vực quản trị dành cho người có quyền truy cập phù hợp. Hãy kiểm tra
          số liệu trước khi thực hiện các thao tác quản lý quan trọng.
        </p>
      </footer>
    </main>
  )
}

import { Link, NavLink, Outlet } from 'react-router-dom'
import { BrandMark } from '@/components/BrandMark'
import { paths } from '../paths'
import { vi } from '@/lib/strings/vi'
import { AuthResumeNotice } from '@/features/auth/components/AuthResumeNotice'
import { useSession } from '@/features/auth/hooks/useSession'
import { useProfile } from '@/features/auth/hooks/useProfile'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `relative rounded-full px-3.5 py-2.5 text-sm transition-all duration-300 ${isActive
    ? 'bg-[#EDE5F5] font-semibold text-[#57347D]'
    : 'text-[#625B62] hover:bg-[#F1EBF4] hover:text-[#57347D]'
  }`

export function PublicLayout() {
  const { isAuthenticated, user } = useSession()
  const profile = useProfile()

  const userName =
    profile.data?.displayName?.trim()
    || (typeof user?.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name.trim()
      : '')
    || (typeof user?.user_metadata?.name === 'string'
      ? user.user_metadata.name.trim()
      : '')
    || user?.email?.split('@')[0]
    || vi.navigation.me

  return (
    <div className="min-h-screen bg-[#FAF7F0] pb-20 text-[#30283A] md:pb-0">

      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 border-b border-[#E9E0D5] bg-[#FAF7F0]/95 shadow-[0_2px_16px_rgba(48,35,57,0.04)] backdrop-blur-xl">
        <nav
          className="mx-auto flex min-h-[68px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8"
          aria-label={vi.layout.primaryNavigation}
        >
          {/* Logo */}
          <div className="shrink-0">
            <BrandMark />
          </div>

          {/* Desktop navigation */}
          <div className="hidden items-center gap-1 lg:flex">

            <NavLink to={paths.home} end className={navClass}>
              {vi.navigation.home}
            </NavLink>

            <NavLink to={paths.explore} className={navClass}>
              {vi.navigation.explore}
            </NavLink>

            <NavLink to={paths.map} className={navClass}>
              {vi.navigation.map}
            </NavLink>

            <NavLink to={paths.accountTrips} className={navClass}>
              {vi.navigation.myTrips}
            </NavLink>

            {/* Primary CTA */}
            <Link
              to={paths.planNew}
              className="ml-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#57347D] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(87,52,125,0.16)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#462765] hover:shadow-[0_7px_18px_rgba(87,52,125,0.22)] active:translate-y-0"
            >
              <span>{vi.navigation.createTrip}</span>
            </Link>

            {/* Account */}
            {isAuthenticated ? (
              <NavLink
                to={paths.accountSettings}
                aria-label={userName}
                title={userName}
                className={({ isActive }) =>
                  `ml-1 inline-flex min-h-10 max-w-[190px] items-center gap-2 rounded-full border px-2.5 py-1.5 transition-all duration-300 ${isActive
                    ? 'border-[#D8C8E7] bg-[#EDE5F5] text-[#57347D]'
                    : 'border-transparent text-[#625B62] hover:border-[#E9DFF0] hover:bg-white'
                  }`
                }
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#57347D] text-sm font-semibold text-white"
                  aria-hidden="true"
                >
                  {userName.slice(0, 1).toUpperCase()}
                </span>

                <span className="truncate text-sm font-medium">
                  {userName}
                </span>
              </NavLink>
            ) : (
              <NavLink
                to={paths.login}
                aria-label={vi.navigation.signIn}
                title={vi.navigation.signIn}
                className="ml-1 flex size-10 shrink-0 items-center justify-center rounded-full bg-[#57347D] text-sm font-semibold text-white transition-all duration-300 hover:bg-[#462765]"
              >
                <span aria-hidden="true">
                  {vi.navigation.signIn.slice(0, 1).toUpperCase()}
                </span>
              </NavLink>
            )}
          </div>

          {/* Tablet / mobile account */}
          <div className="flex items-center gap-2 lg:hidden">
            <Link
              to={paths.planNew}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#57347D] px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#462765]"
            >
              {vi.navigation.createTrip}
            </Link>

            {isAuthenticated ? (
              <Link
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#E6DCEC] bg-[#EDE5F5] text-sm font-semibold text-[#57347D] transition-colors hover:bg-[#E2D5EF]"
                to={paths.accountSettings}
                aria-label={userName}
                title={userName}
              >
                {userName.slice(0, 1).toUpperCase()}
              </Link>
            ) : (
              <Link
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#E6DCEC] bg-white text-sm font-semibold text-[#57347D] transition-colors hover:bg-[#EDE5F5]"
                to={paths.login}
                aria-label={vi.navigation.signIn}
                title={vi.navigation.signIn}
              >
                <span aria-hidden="true">↗</span>
              </Link>
            )}
          </div>
        </nav>

        {/* Secondary mobile navigation */}
        <div className="border-t border-[#E9E0D5]/70 px-3 py-2 lg:hidden">
          <div className="mx-auto flex max-w-[1440px] items-center justify-center gap-1 overflow-x-auto">
            <MobileTopTab to={paths.home} label={vi.navigation.home} />
            <MobileTopTab to={paths.explore} label={vi.navigation.explore} />
            <MobileTopTab to={paths.map} label={vi.navigation.map} />
            <MobileTopTab to={paths.accountTrips} label={vi.navigation.myTrips} />
          </div>
        </div>
      </header>

      {/* Authentication notice */}
      <AuthResumeNotice />

      {/* Page content */}
      <main className="min-w-0">
        <Outlet />
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-[#E7DED2] bg-[#F4EFE5] px-4 py-8 sm:px-6 md:py-10">
        <div className="mx-auto max-w-[1440px]">

          <div className="flex flex-col gap-7 md:flex-row md:items-start md:justify-between">

            {/* Brand */}
            <div className="max-w-md space-y-3">
              <Link
                to={paths.home}
                className="inline-flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
              >
                <BrandMark />
              </Link>

              <p className="max-w-sm text-sm leading-6 text-[#756B65]">
                Nét Huế – nơi bạn tìm thấy hành trình phù hợp để khám phá
                di sản, văn hóa và nhịp sống bình yên của cố đô.
              </p>
            </div>

            {/* Footer links */}
            <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm text-[#756B65]">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#57347D]">
                  {vi.layout.about}
                </span>

                <Link
                  to={paths.about}
                  className="transition-colors hover:text-[#57347D]"
                >
                  {vi.layout.about}
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#57347D]">
                  Pháp lý
                </span>

                <Link
                  to={paths.privacy}
                  className="transition-colors hover:text-[#57347D]"
                >
                  {vi.layout.privacy}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 border-t border-[#E4DACE] pt-5 text-xs leading-5 text-[#8A8077] sm:flex-row sm:items-center sm:justify-between">
            <span>{vi.layout.osmCredit}</span>

            <span>
              © {new Date().getFullYear()} Hue Trip Planner
            </span>
          </div>
        </div>
      </footer>

      {/* ================= MOBILE BOTTOM NAVIGATION ================= */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[#E7DED2] bg-[#FAF7F0]/95 px-1 pt-1.5 pb-[env(safe-area-inset-bottom)] shadow-[0_-5px_24px_rgba(48,35,57,0.06)] backdrop-blur-xl md:hidden"
        aria-label={vi.layout.mobileNavigation}
      >
        <MobileTab to={paths.home} label={vi.navigation.home} />

        <MobileTab to={paths.explore} label={vi.navigation.explore} />

        <Link
          to={paths.planNew}
          className="-mt-4 mx-1 flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-2xl border-[3px] border-[#FAF7F0] bg-[#57347D] px-1 text-center text-[10px] font-semibold leading-tight text-white shadow-[0_5px_15px_rgba(87,52,125,0.2)] transition-all duration-300 hover:bg-[#462765] active:scale-95"
          aria-label={vi.navigation.createTrip}
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ＋
          </span>
          <span>{vi.navigation.createTrip}</span>
        </Link>

        <MobileTab to={paths.map} label={vi.navigation.map} />

        <MobileTab
          to={isAuthenticated ? paths.accountTrips : paths.login}
          label={vi.navigation.me}
        />
      </nav>
    </div>
  )
}

function MobileTab({
  to,
  label,
}: {
  to: string
  label: string
}) {
  return (
    <NavLink
      to={to}
      end={to === paths.home}
      className={({ isActive }) =>
        `flex min-h-12 flex-col items-center justify-center rounded-xl px-1 text-center text-[10px] transition-all duration-300 ${isActive
          ? 'bg-[#EDE5F5] font-semibold text-[#57347D]'
          : 'text-[#81766D] hover:text-[#57347D]'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

function MobileTopTab({
  to,
  label,
}: {
  to: string
  label: string
}) {
  return (
    <NavLink
      to={to}
      end={to === paths.home}
      className={({ isActive }) =>
        `shrink-0 rounded-full px-3 py-2 text-xs transition-colors duration-300 ${isActive
          ? 'bg-[#EDE5F5] font-semibold text-[#57347D]'
          : 'text-[#756B65] hover:bg-white hover:text-[#57347D]'
        }`
      }
    >
      {label}
    </NavLink>
  )
}

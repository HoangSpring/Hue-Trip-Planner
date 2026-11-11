
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { BrandMark } from '@/components/BrandMark'
import { paths } from '@/app/paths'
import { useSession } from '@/features/auth/hooks/useSession'
import { useProfile } from '@/features/auth/hooks/useProfile'
import { supabaseClient } from '@/lib/supabase'
import { vi } from '@/lib/strings/vi'

function LandingHero() {
  return (
    <section className="relative isolate min-h-[680px] overflow-hidden bg-[#211329] md:min-h-[760px]">
      {/* Ảnh nền zoom ra rồi zoom vào liên tục */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <img
          src="/images/dai-noi-hue-hero.jpg"
          alt=""
          aria-hidden="true"
          width={1920}
          height={1080}
          loading="eager"
          ref={(image) => image?.setAttribute('fetchpriority', 'high')}
          decoding="async"
          className="hero-zoom-out absolute inset-0 h-full w-full object-cover object-center"
        />
      </div>

      {/* Lớp phủ giúp nội dung dễ đọc */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#211329]/95 via-[#211329]/65 to-[#211329]/10"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#211329]/70 via-transparent to-black/10"
      />

      {/* Nội dung Hero */}
      <div className="relative z-10 mx-auto flex min-h-[680px] max-w-[1440px] items-center px-4 py-12 sm:px-6 sm:py-16 md:min-h-[760px] md:px-12 md:py-20 lg:px-16">
        <div className="w-full max-w-[680px]">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#f4dda5] backdrop-blur-sm sm:px-4 sm:text-sm sm:tracking-[0.16em]">
            <span className="size-2 shrink-0 rounded-full bg-[#e9c779]" />
            Khám phá Cố Đô Huế
          </span>

          <h1 className="mt-6 break-words font-serif text-4xl font-bold leading-[1.08] tracking-tight text-white sm:mt-7 sm:text-6xl md:text-7xl lg:text-[76px]">
            Lịch trình Huế,
            <span className="mt-1 block text-[#f4d994]">
              đúng gu của bạn
            </span>
          </h1>

          <p className="mt-6 max-w-[610px] text-sm leading-7 text-white/90 sm:mt-7 sm:text-lg sm:leading-8 md:text-xl">
            Từ những công trình di sản trầm mặc đến món ngon đất Cố Đô,
            hãy để mỗi hành trình đưa bạn đến gần hơn với vẻ đẹp và nhịp
            sống của Huế.
          </p>

          {/* Hai nút hành động chính */}
          <div className="mt-7 flex flex-wrap gap-3 sm:mt-9">
            <Link
              to={paths.planNew}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#3A0F34] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#511747] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAAA00] sm:px-6 sm:py-4"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="size-5 shrink-0"
              >
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h6" />
              </svg>
              Tạo lịch trình
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              to={paths.explore}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4d994] sm:px-6 sm:py-4"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="size-5 shrink-0"
              >
                <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              Khám phá Huế
            </Link>
          </div>

          {/* Thẻ kế hoạch trên banner */}
          <Link
            to={paths.tripDraft}
            className="mt-5 flex w-full max-w-sm items-center justify-between gap-3 rounded-xl border border-white/25 bg-white/10 px-3 py-3 text-white shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EAAA00] sm:px-4"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-xs text-white/70">
                Tiếp tục chuyến đi
              </span>
              <span className="break-words text-sm font-semibold">
                Kế hoạch Huế đang dang dở
              </span>
            </span>

            <span className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#F7F6F5] px-3 py-2 text-xs font-semibold text-[#3A0F34] transition-colors hover:bg-[#FFF3CC]">
              Mở →
            </span>
          </Link>

          {/* Các điểm nổi bật */}
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/20 pt-5 text-xs text-white/90 sm:mt-8 sm:gap-x-6 sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <span className="text-[#f4d994]">✦</span>
              Di sản và văn hóa
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="text-[#f4d994]">✦</span>
              Khám phá ẩm thực
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="text-[#f4d994]">✦</span>
              Lịch trình cá nhân hóa
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * Lớp mây chuyển cảnh giữa Hero và phần nội dung.
 * Tiến trình thay đổi theo scrollY, nên khi cuộn ngược lên,
 * lớp mây cũng chuyển động ngược lại.
 */
function CloudTransition() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const updateProgress = () => {
      cancelAnimationFrame(frame)

      frame = requestAnimationFrame(() => {
        const distance = Math.max(window.innerHeight * 0.4, 1)
        const value = Math.min(
          1,
          Math.max(0, window.scrollY / distance),
        )

        setProgress(value)
      })
    }

    updateProgress()

    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  const cloudStyle = {
    '--cloud-progress': progress,
  } as CSSProperties

  return (
    <div
      aria-hidden="true"
      className="cloud-transition"
      style={cloudStyle}
    >
      <div className="cloud-transition__layer cloud-transition__layer--back" />
      <div className="cloud-transition__layer cloud-transition__layer--front" />
    </div>
  )
}

function MobileTab({
  to,
  label,
  icon,
}: {
  to: string
  label: string
  icon: string
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive
          ? 'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-primary transition'
          : 'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-ink-muted transition'
      }
    >
      <span aria-hidden="true" className="text-lg leading-5">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

export function PublicLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const auth = useSession()
  const profile = useProfile()
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [signOutError, setSignOutError] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  const isHome = location.pathname === paths.home

  const userName =
    profile.data?.displayName ||
    (typeof auth.session?.user?.user_metadata?.full_name === 'string'
      ? auth.session.user.user_metadata.full_name
      : '') ||
    auth.session?.user?.email?.split('@')[0] ||
    ''

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  useEffect(() => {
    setAccountMenuOpen(false)
    setSignOutError(false)
  }, [location.pathname])

  useEffect(() => {
    if (!accountMenuOpen) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !accountMenuRef.current?.contains(event.target)
      ) {
        setAccountMenuOpen(false)
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setAccountMenuOpen(false)
    }

    document.addEventListener('pointerdown', closeOnOutsidePointer)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [accountMenuOpen])

  async function signOut() {
    if (!supabaseClient) {
      setSignOutError(true)
      return
    }

    const { error } = await supabaseClient.auth.signOut()

    if (error) {
      setSignOutError(true)
      return
    }

    queryClient.clear()
    setAccountMenuOpen(false)
    navigate(paths.home, { replace: true })
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-bg text-ink">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-control bg-white px-4 py-3 text-primary focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        Bỏ qua đến nội dung chính
      </a>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-line/70 bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-[64px] max-w-content items-center justify-between gap-2 px-3 sm:min-h-[76px] sm:gap-4 sm:px-4 md:px-8">
          {/* BrandMark tự tạo Link, không bọc Link bên ngoài */}
          <div className="min-w-0 shrink">
            <BrandMark />
          </div>

          <nav
            aria-label="Điều hướng chính"
            className="hidden items-center gap-1 lg:flex"
          >
            <NavLink
              to={paths.home}
              end
              className={({ isActive }) =>
                isActive
                  ? 'rounded-full bg-primary-tint px-4 py-3 text-sm font-medium text-primary transition'
                  : 'rounded-full px-4 py-3 text-sm font-medium text-ink-muted transition hover:bg-surface-high hover:text-ink'
              }
            >
              Trang chủ
            </NavLink>

            <NavLink
              to={paths.explore}
              className={({ isActive }) =>
                isActive
                  ? 'rounded-full bg-primary-tint px-4 py-3 text-sm font-medium text-primary transition'
                  : 'rounded-full px-4 py-3 text-sm font-medium text-ink-muted transition hover:bg-surface-high hover:text-ink'
              }
            >
              Khám phá
            </NavLink>

            <NavLink
              to={paths.map}
              className={({ isActive }) =>
                isActive
                  ? 'rounded-full bg-primary-tint px-4 py-3 text-sm font-medium text-primary transition'
                  : 'rounded-full px-4 py-3 text-sm font-medium text-ink-muted transition hover:bg-surface-high hover:text-ink'
              }
            >
              Bản đồ
            </NavLink>

            <NavLink
              to={paths.accountTrips}
              className={({ isActive }) =>
                isActive
                  ? 'rounded-full bg-primary-tint px-4 py-3 text-sm font-medium text-primary transition'
                  : 'rounded-full px-4 py-3 text-sm font-medium text-ink-muted transition hover:bg-surface-high hover:text-ink'
              }
            >
              Chuyến đi của tôi
            </NavLink>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Link
              to={paths.planNew}
              className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg bg-primary px-2.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary/90 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-5 sm:py-3 sm:text-sm"
            >
              <span aria-hidden="true">＋</span>
              <span className="hidden sm:inline">Tạo lịch trình</span>
              <span className="sm:hidden">Tạo lịch</span>
            </Link>

            {auth.session ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setSignOutError(false)
                    setAccountMenuOpen((open) => !open)
                  }}
                  className="flex min-w-0 max-w-[180px] items-center gap-2 rounded-full py-2 text-sm font-medium text-ink-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`Tài khoản${userName ? ` ${userName}` : ''}`}
                  aria-expanded={accountMenuOpen}
                  aria-controls="account-menu"
                >
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-white sm:size-9"
                  >
                    {userName ? userName.charAt(0).toUpperCase() : '●'}
                  </span>

                  <span className="hidden truncate xl:block">
                    {userName || 'Tài khoản'}
                  </span>
                </button>

                {accountMenuOpen && (
                  <div
                    id="account-menu"
                    role="group"
                    aria-label="Tài khoản"
                    className="absolute right-0 top-full z-[60] mt-2 w-56 rounded-card border border-line bg-surface p-2 shadow-lg"
                  >
                    <p className="truncate px-3 py-2 text-xs text-ink-muted">
                      {auth.session.user.email}
                    </p>

                    <Link
                      to={paths.accountTrips}
                      onClick={() => setAccountMenuOpen(false)}
                      className="block rounded-control px-3 py-2.5 text-sm hover:bg-surface-high"
                    >
                      {vi.navigation.myTrips}
                    </Link>

                    <Link
                      to={paths.accountSaved}
                      onClick={() => setAccountMenuOpen(false)}
                      className="block rounded-control px-3 py-2.5 text-sm hover:bg-surface-high"
                    >
                      {vi.layout.saved}
                    </Link>

                    <Link
                      to={paths.accountSettings}
                      onClick={() => setAccountMenuOpen(false)}
                      className="block rounded-control px-3 py-2.5 text-sm hover:bg-surface-high"
                    >
                      {vi.layout.settings}
                    </Link>

                    {profile.data?.role === 'admin' && (
                      <Link
                        to={paths.adminPlaces}
                        onClick={() => setAccountMenuOpen(false)}
                        className="block rounded-control px-3 py-2.5 text-sm hover:bg-surface-high"
                      >
                        {vi.layout.admin}
                      </Link>
                    )}

                    {signOutError && (
                      <p role="alert" className="px-3 py-2 text-xs text-danger">
                        {vi.account.actionFailed}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() => void signOut()}
                      className="mt-1 block w-full rounded-control border-t border-line px-3 py-2.5 text-left text-sm font-semibold text-danger hover:bg-danger/5"
                    >
                      {vi.navigation.signOut}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to={paths.login}
                className="hidden min-h-10 items-center justify-center rounded-xl px-2 text-xs font-semibold text-primary hover:bg-primary-tint sm:inline-flex sm:px-3 sm:text-sm"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero chỉ xuất hiện ở trang chủ */}
      {isHome && <LandingHero />}

      {/* Mây chuyển cảnh: chỉ xuất hiện trên trang chủ */}
      {isHome && <CloudTransition />}

      {/* Giữ nguyên nội dung của các trang */}
      <main
        id="main-content"
        tabIndex={-1}
        className={isHome ? 'relative z-0' : undefined}
      >
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="relative z-0 mt-16 border-t border-line bg-surface">
        <div className="mx-auto max-w-content px-4 py-10 md:px-8">
          <div className="grid gap-8 md:grid-cols-[1fr_auto_auto] md:gap-16">
            <div className="max-w-md">
              <div className="inline-flex items-center gap-3">
                <BrandMark />
              </div>

              <p className="mt-3 text-sm leading-6 text-ink-muted">
                Nền tảng kiến tạo hành trình di sản và trải nghiệm văn hóa
                Cố Đô Huế tinh tế, chậm rãi dành cho lữ khách trân quý hồn
                cốt ngàn xưa.
              </p>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
                Khám phá
              </h2>

              <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                <li>
                  <Link to={paths.about} className="hover:text-primary">
                    Giới thiệu
                  </Link>
                </li>

                <li>
                  <Link to={paths.explore} className="hover:text-primary">
                    Khám phá Cố Đô
                  </Link>
                </li>

                <li>
                  <Link to={paths.planNew} className="hover:text-primary">
                    Tạo lịch trình
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
                Pháp lý
              </h2>

              <ul className="mt-3 space-y-2 text-sm text-ink-muted">
                <li>
                  <Link to={paths.privacy} className="hover:text-primary">
                    Chính sách bảo mật
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-line pt-5 text-xs leading-5 text-ink-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Bản đồ © OpenStreetMap contributors · © 2025 Cố Đô — Hue Trip Planner
            </p>

            <p className="font-medium text-secondary">
              Di sản Hoàng triều Nguyễn · Huế, Việt Nam
            </p>
          </div>
        </div>
      </footer>

      {/* Điều hướng mobile */}
      <nav
        aria-label="Điều hướng trên thiết bị di động"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md lg:hidden"
      >
        <MobileTab to={paths.home} label="Trang chủ" icon="⌂" />
        <MobileTab to={paths.explore} label="Khám phá" icon="⌕" />
        <MobileTab to={paths.map} label="Bản đồ" icon="⌖" />

        <MobileTab
          to={auth.session ? paths.accountTrips : paths.login}
          label="Chuyến đi"
          icon="▤"
        />
      </nav>
    </div>
  )
}

export default PublicLayout

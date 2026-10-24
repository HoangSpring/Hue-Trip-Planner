import { Link, NavLink, Outlet } from 'react-router-dom'
import { BrandMark } from '@/components/BrandMark'
import { paths } from '../paths'
import { vi } from '@/lib/strings/vi'

const navClass = ({ isActive }: { isActive: boolean }) => `rounded-control px-3 py-2 text-sm ${isActive ? 'bg-primary-tint text-primary' : 'text-ink-muted hover:text-primary'}`

export function PublicLayout() {
  return <div className="min-h-screen bg-bg pb-20 md:pb-0">
    <header className="border-b border-line bg-surface"><nav className="mx-auto flex min-h-16 max-w-content items-center justify-between gap-4 px-4 md:px-6" aria-label={vi.layout.primaryNavigation}>
      <BrandMark /><div className="hidden items-center gap-1 md:flex"><NavLink to={paths.explore} className={navClass}>{vi.navigation.explore}</NavLink><NavLink to={paths.map} className={navClass}>{vi.navigation.map}</NavLink><Link to={paths.planNew} className="rounded-control bg-primary px-4 py-3 text-sm font-semibold text-surface hover:bg-primary-hover">{vi.navigation.createTrip}</Link><NavLink to={paths.accountTrips} className={navClass}>{vi.navigation.myTrips}</NavLink><NavLink to={paths.login} className={navClass}>{vi.navigation.signIn}</NavLink></div>
      <Link className="min-h-11 rounded-control px-3 py-2 text-sm text-primary md:hidden" to={paths.login}>{vi.navigation.me}</Link>
    </nav></header>
    <main><Outlet /></main>
    <footer className="border-t border-line bg-surface px-4 py-6 text-center text-sm text-ink-muted"><div className="mx-auto flex max-w-content flex-wrap justify-center gap-5"><Link to={paths.about}>{vi.layout.about}</Link><Link to={paths.privacy}>{vi.layout.privacy}</Link><span>{vi.layout.osmCredit}</span></div></footer>
    <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)] pt-1 md:hidden" aria-label={vi.layout.mobileNavigation}>
      <MobileTab to={paths.home} label={vi.navigation.home} /><MobileTab to={paths.explore} label={vi.navigation.explore} />
      <Link to={paths.planNew} className="-mt-4 flex min-h-16 flex-col items-center justify-center gap-1 rounded-control bg-primary px-2 text-center text-xs font-semibold text-surface shadow-card" aria-label={vi.navigation.createTrip}><span aria-hidden="true" className="text-xl">＋</span><span>{vi.navigation.createTrip}</span></Link>
      <MobileTab to={paths.map} label={vi.navigation.map} /><MobileTab to={paths.login} label={vi.navigation.me} />
    </nav>
  </div>
}

function MobileTab({ to, label }: { to: string; label: string }) {
  return <NavLink to={to} end={to === paths.home} className={({ isActive }) => `flex min-h-12 items-center justify-center px-1 text-center text-xs ${isActive ? 'font-semibold text-primary' : 'text-ink-muted'}`}>{label}</NavLink>
}

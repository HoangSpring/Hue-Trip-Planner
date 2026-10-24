import { NavLink, Outlet } from 'react-router-dom'
import { paths } from '../paths'
import { vi } from '@/lib/strings/vi'

export function AccountLayout() {
  return <div className="mx-auto grid max-w-content gap-6 px-4 py-8 md:grid-cols-[220px_1fr] md:px-6"><nav aria-label={vi.layout.accountNavigation} className="flex gap-2 overflow-x-auto md:flex-col"><AccountLink to={paths.accountTrips}>{vi.layout.accountTrips}</AccountLink><AccountLink to={paths.accountSaved}>{vi.layout.saved}</AccountLink><AccountLink to={paths.accountSettings}>{vi.layout.settings}</AccountLink></nav><section className="min-w-0"><Outlet /></section></div>
}

function AccountLink({ to, children }: { to: string; children: string }) {
  return <NavLink to={to} className={({ isActive }) => `min-h-11 rounded-control px-4 py-3 text-sm ${isActive ? 'bg-primary-tint font-semibold text-primary' : 'text-ink-muted hover:bg-surface'}`}>{children}</NavLink>
}

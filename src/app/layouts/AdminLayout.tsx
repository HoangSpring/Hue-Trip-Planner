import { NavLink, Outlet } from 'react-router-dom'
import { BrandMark } from '@/components/BrandMark'
import { paths } from '../paths'
import { vi } from '@/lib/strings/vi'

export function AdminLayout() {
  return <div className="min-h-screen bg-bg"><header className="border-b border-line bg-surface px-4"><div className="mx-auto flex min-h-16 max-w-content items-center justify-between"><BrandMark /><span className="text-sm text-ink-muted">{vi.layout.admin}</span></div></header><div className="mx-auto grid max-w-content gap-6 px-4 py-6 md:grid-cols-[220px_1fr] md:px-6"><nav aria-label={vi.layout.adminNavigation} className="flex gap-2 md:flex-col"><NavLink className="min-h-11 rounded-control px-4 py-3 text-sm text-ink-muted hover:bg-surface" to={paths.adminPlaces}>{vi.layout.places}</NavLink><NavLink className="min-h-11 rounded-control px-4 py-3 text-sm text-ink-muted hover:bg-surface" to={paths.adminImport}>{vi.layout.csvImport}</NavLink></nav><main className="min-w-0"><Outlet /></main></div></div>
}

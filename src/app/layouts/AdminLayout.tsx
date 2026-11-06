import { NavLink, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import { BrandMark } from '@/components/BrandMark'
import { paths } from '../paths'
import { vi } from '@/lib/strings/vi'

export function AdminLayout() {
  useEffect(() => {
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots) }
    robots.content = 'noindex, nofollow'
    return () => { robots?.remove() }
  }, [])
  const navClass = ({ isActive }: { isActive: boolean }) => `inline-flex min-h-11 items-center rounded-control px-4 py-2 text-sm font-semibold ${isActive ? 'bg-primary-tint text-primary' : 'text-ink-muted hover:bg-surface'}`
  return <div className="min-h-screen bg-bg"><header className="border-b border-line bg-surface px-4"><div className="mx-auto flex min-h-16 max-w-content items-center justify-between"><BrandMark /><span className="text-sm text-ink-muted">{vi.layout.admin}</span></div></header><div className="mx-auto grid max-w-content gap-4 px-4 py-5 md:gap-6 md:px-6 md:py-8 lg:grid-cols-[220px_1fr]"><nav aria-label={vi.layout.adminNavigation} className="flex flex-wrap gap-2 lg:sticky lg:top-6 lg:h-fit lg:flex-col"><NavLink className={navClass} to={paths.adminPlaces}>{vi.layout.places}</NavLink><NavLink className={navClass} to={paths.adminImport}>{vi.layout.csvImport}</NavLink></nav><main className="min-w-0"><Outlet /></main></div></div>
}

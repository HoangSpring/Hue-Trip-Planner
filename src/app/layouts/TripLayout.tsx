import { Link, Outlet } from 'react-router-dom'
import { BrandMark } from '@/components/BrandMark'
import { paths } from '../paths'
import { vi } from '@/lib/strings/vi'

export function TripLayout() {
  return <div className="min-h-screen bg-bg"><header className="border-b border-line bg-surface px-4"><div className="mx-auto flex min-h-16 max-w-content items-center justify-between"><BrandMark /><Link to={paths.explore} className="min-h-11 rounded-control px-3 py-2 text-sm text-primary">{vi.layout.exploreHue}</Link></div></header><main className="mx-auto max-w-content px-4 py-6 md:px-6"><Outlet /></main></div>
}

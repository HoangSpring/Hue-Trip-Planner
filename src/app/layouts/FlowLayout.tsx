import { Link, Outlet } from 'react-router-dom'
import { BrandMark } from '@/components/BrandMark'
import { paths } from '../paths'
import { vi } from '@/lib/strings/vi'

export function FlowLayout() {
  return <div className="min-h-screen bg-bg"><header className="border-b border-line bg-surface px-4"><div className="mx-auto flex min-h-16 max-w-content items-center justify-between"><BrandMark /><Link to={paths.home} aria-label={vi.layout.exitFlow} className="grid size-11 place-items-center rounded-full text-xl text-ink-muted hover:bg-bg">×</Link></div></header><main className="mx-auto max-w-content px-4 py-8 md:px-6"><Outlet /></main></div>
}

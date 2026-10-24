import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'

export function NotFoundPage() {
  return <div className="mx-auto flex min-h-[70vh] max-w-content flex-col items-center justify-center px-4 py-16 text-center"><span className="font-serif text-7xl font-semibold text-primary">404</span><h1 className="mt-4 text-3xl font-semibold">{vi.system.notFoundTitle}</h1><p className="mt-3 max-w-lg text-ink-muted">{vi.system.notFoundBody}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link className="min-h-12 rounded-control bg-primary px-5 py-3 font-semibold text-surface" to={paths.home}>{vi.system.backHome}</Link><Link className="min-h-12 rounded-control border border-primary px-5 py-3 font-semibold text-primary" to={paths.planNew}>{vi.system.createTrip}</Link></div></div>
}

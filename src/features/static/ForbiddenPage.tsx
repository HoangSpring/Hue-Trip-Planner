import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'

export function ForbiddenPage() {
  return <div className="mx-auto flex min-h-[60vh] max-w-content flex-col items-center justify-center px-4 py-16 text-center"><span className="font-serif text-7xl font-semibold text-danger">403</span><h1 className="mt-4 text-3xl font-semibold">{vi.system.forbiddenTitle}</h1><Link className="mt-8 min-h-12 rounded-control bg-primary px-5 py-3 font-semibold text-surface" to={paths.home}>{vi.system.backHome}</Link></div>
}

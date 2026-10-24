import { Link, useRouteError } from 'react-router-dom'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'

export function ErrorPage() {
  useRouteError()
  return <div className="mx-auto flex min-h-[70vh] max-w-content flex-col items-center justify-center px-4 py-16 text-center"><span aria-hidden="true" className="text-5xl text-danger">!</span><h1 className="mt-4 text-3xl font-semibold">{vi.system.errorTitle}</h1><p className="mt-3 text-ink-muted">{vi.system.errorBody}</p><button type="button" onClick={() => window.location.reload()} className="mt-7 min-h-12 rounded-control bg-primary px-5 py-3 font-semibold text-surface">{vi.system.retry}</button><Link className="mt-4 text-primary underline" to={paths.home}>{vi.system.backHome}</Link></div>
}

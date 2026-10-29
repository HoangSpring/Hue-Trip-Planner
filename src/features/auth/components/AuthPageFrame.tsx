import { useEffect, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BrandMark } from '@/components/BrandMark'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'
import { brand } from '@/lib/brand'

type Props = {
  title: string
  intro: string
  children: ReactNode
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
  footer?: ReactNode
}

export function AuthPageFrame({ title, intro, children, onSubmit, footer }: Props) {
  useEffect(() => {
    const previousTitle = document.title
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const createdRobots = !robots
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots) }
    const previousRobots = robots.content
    document.title = `${title} · ${brand.name}`
    robots.content = 'noindex,follow'
    return () => {
      document.title = previousTitle
      if (createdRobots) robots?.remove()
      else if (previousRobots) robots!.content = previousRobots
      else robots?.removeAttribute('content')
    }
  }, [title])

  return (
    <div className="grid min-h-[calc(100vh-5rem)] overflow-hidden rounded-card border border-line bg-surface shadow-card lg:grid-cols-[1fr_1fr]">
      <aside className="relative hidden min-h-[620px] overflow-hidden bg-primary p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_18%,rgba(255,255,255,.17),transparent_38%),linear-gradient(145deg,#5B3A8C,#34234e)]" />
        <div className="relative"><BrandMark inverse /></div>
        <div className="relative max-w-md py-12">
          <p className="text-sm font-semibold uppercase tracking-[.18em] text-[#ead8af]">Huế theo nhịp của bạn</p>
          <p className="mt-4 font-serif text-4xl leading-tight">Một chuyến đi hay bắt đầu từ những điều bạn yêu thích.</p>
        </div>
        <p className="relative text-sm text-white/70">Lưu lịch trình để xem lại và chia sẻ với người đồng hành.</p>
      </aside>
      <main className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Link to={paths.home}><BrandMark /></Link></div>
          <h1 className="font-serif text-3xl font-semibold text-ink md:text-4xl">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{intro}</p>
          {onSubmit ? <form className="mt-7 space-y-4" onSubmit={onSubmit}>{children}</form> : <div className="mt-7 space-y-4">{children}</div>}
          {footer && <div className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-muted">{footer}</div>}
        </div>
      </main>
    </div>
  )
}

export function AuthTextField({ label, type, value, onChange, autoComplete, required = true }: {
  label: string
  type: 'email' | 'password' | 'text'
  value: string
  onChange: (value: string) => void
  autoComplete: string
  required?: boolean
}) {
  return <label className="block space-y-1.5 text-sm font-medium text-ink">
    <span>{label}</span>
    <input className="min-h-12 w-full rounded-control border border-line bg-white px-3 outline-none transition focus-visible:ring-2 focus-visible:ring-primary" type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} required={required} />
  </label>
}

export function AuthSubmitButton({ children, busy }: { children: string; busy: boolean }) {
  return <button className="inline-flex min-h-12 w-full items-center justify-center rounded-control bg-primary px-5 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={busy}>
    {busy ? <><span aria-hidden="true" className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />{vi.auth.submitting}</> : children}
  </button>
}

export function AuthAlert({ children, success = false }: { children: ReactNode; success?: boolean }) {
  return <p role={success ? 'status' : 'alert'} className={`rounded-control border p-3 text-sm leading-6 ${success ? 'border-secondary/30 bg-secondary-tint text-secondary' : 'border-danger/30 bg-danger/5 text-danger'}`}>{children}</p>
}

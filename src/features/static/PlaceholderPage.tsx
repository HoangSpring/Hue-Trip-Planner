import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { brand } from '@/lib/brand'
import { vi } from '@/lib/strings/vi'

export default function PlaceholderPage({ title, noindex = false }: { title: string; noindex?: boolean }) {
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    document.title = `${title} · ${brand.name}`
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots) }
    robots.content = noindex || location.search ? 'noindex,follow' : 'index,follow'
    return () => { robots?.removeAttribute('content') }
  }, [location.search, noindex, title])
  return <section className="mx-auto flex min-h-[55vh] max-w-content flex-col items-center justify-center px-4 py-16 text-center"><p className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary">{brand.tagline}</p><h1 className="text-3xl font-semibold text-ink md:text-4xl">{title}</h1><p className="mt-4 max-w-xl text-ink-muted">{vi.system.placeholder}</p><button type="button" onClick={() => navigate(-1)} className="mt-8 min-h-12 rounded-control border border-primary px-5 py-3 font-semibold text-primary hover:bg-primary-tint">{vi.system.back}</button></section>
}

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { PlaceMapItemDto } from '@shared/schemas'
import { getSharedTripApi, copySharedTripApi } from '@/lib/api'
import { useSession } from '@/features/auth/hooks/useSession'
import { paths, safeNextPath } from '@/app/paths'
import { vi } from '@/lib/strings/vi'
import { brand } from '@/lib/brand'
import { MapView } from '@/features/map/MapView'
import { ApiRequestError } from '@/lib/api'

export default function SharedTripPage() {
  const { shareToken = '' } = useParams()
  const auth = useSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [copyError, setCopyError] = useState(false)
  const started = useRef(false)
  const query = useQuery({ queryKey: ['shared-trip', shareToken], queryFn: ({ signal }) => getSharedTripApi(shareToken, signal), retry: false, staleTime: 0 })
  const copy = useMutation({ mutationFn: () => copySharedTripApi(shareToken, auth.session!.access_token), onSuccess: trip => navigate(paths.trip(trip.id), { replace: true }), onError: () => setCopyError(true) })

  useEffect(() => {
    document.title = `${vi.share.pageTitle} · ${brand.name}`
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.append(description) }
    description.content = vi.share.pageDescription
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots) }
    robots.content = 'noindex, nofollow'
    return () => { description?.removeAttribute('content'); robots?.removeAttribute('content') }
  }, [])

  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.session || params.get('copy') !== '1' || started.current || !query.data) return
    started.current = true
    navigate(paths.sharedTrip(shareToken), { replace: true })
    copy.mutate()
  }, [auth.session, auth.status, navigate, params, query.data, shareToken])

  const trip = query.data

  if (query.isPending) return <main className="mx-auto max-w-content animate-pulse px-4 py-10"><div className="h-10 w-2/3 rounded bg-line"/><div className="mt-6 h-96 rounded-card bg-line"/></main>
  if (query.error instanceof ApiRequestError && query.error.status === 404) return <main className="mx-auto max-w-content px-4 py-20 text-center"><p className="text-5xl" aria-hidden="true">⌁</p><h1 className="mt-4 font-serif text-3xl">{vi.share.invalidTitle}</h1><p className="mt-2 text-ink-muted">{vi.share.invalidBody}</p><Link to={paths.planNew} className="mt-6 inline-flex min-h-12 items-center rounded-control bg-primary px-5 font-semibold text-white">{vi.system.createTrip}</Link></main>
  if (query.isError || !trip) return <main className="mx-auto max-w-content px-4 py-16 text-center"><h1 className="font-serif text-3xl">{vi.share.loadFailed}</h1><button type="button" onClick={() => void query.refetch()} className="mt-5 min-h-11 rounded-control bg-primary px-5 font-semibold text-white">{vi.system.retry}</button></main>

  const mapPlaces: PlaceMapItemDto[] = trip.days.flatMap(day => day.items.map(item => ({ id: item.place.id, slug: item.place.slug, name: item.place.name, category: item.place.category, lat: item.place.lat, lng: item.place.lng, coverImageUrl: item.place.coverImageUrl })))
  const next = safeNextPath(`/s/${shareToken}?copy=1`)
  return <main className="mx-auto max-w-content px-4 pb-28 pt-8 md:px-8 md:pb-12 md:pt-12">
    <header className="mb-8"><p className="text-xs font-semibold uppercase tracking-widest text-secondary">{vi.share.eyebrow}</p><h1 className="mt-2 font-serif text-3xl font-bold md:text-4xl">{trip.title}</h1><p className="mt-3 text-ink-muted">{vi.share.subtitle(trip.numDays, trip.startDate)}</p></header>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)]"><section className="space-y-5" aria-label={vi.share.timelineLabel}>{trip.days.map(day => <article key={day.dayIndex} className="rounded-card border border-line bg-surface p-5 shadow-card"><h2 className="font-serif text-2xl font-semibold">{vi.share.dayTitle(day.dayIndex)}{day.date ? ` · ${day.date}` : ''}</h2>{day.items.length ? <ol className="mt-4 space-y-4">{[...day.items].sort((a,b) => a.position-b.position).map(item => <li key={item.placeId} className="border-l-2 border-accent pl-4"><p className="text-xs font-semibold text-primary">{vi.tripEditor.slots[item.slot]}{item.startTime ? ` · ${item.startTime}` : ''}</p><h3 className="mt-1 font-semibold">{item.place.name}</h3>{item.place.area && <p className="text-sm text-ink-muted">{item.place.area}</p>}{item.reason && <p className="mt-2 text-sm leading-6 text-ink-muted">{item.reason}</p>}{item.travelMinFromPrev != null && <p className="mt-2 text-xs text-ink-muted">{item.travelMinFromPrev} phút{item.travelDistanceM != null ? ` · ${(item.travelDistanceM / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km` : ''}</p>}<Link to={paths.place(item.place.slug)} className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-primary underline">{vi.place.explore}</Link></li>)}</ol> : <p className="mt-4 text-sm text-ink-muted">{vi.share.emptyDay}</p>}</article>)}</section><aside className="lg:sticky lg:top-6 lg:self-start"><MapView places={mapPlaces} height="min(68vh, 620px)"/></aside></div>
    {copyError && <p role="alert" className="mt-5 rounded-control bg-danger/10 p-3 text-sm text-danger">{vi.share.copyFailed}</p>}
    <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-line bg-surface p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:static md:mt-8 md:justify-end md:border-0 md:bg-transparent md:p-0"><button type="button" disabled={copy.isPending} onClick={() => { if (auth.status === 'authenticated') copy.mutate(); else navigate(`${paths.login}?next=${encodeURIComponent(next)}`) }} className="min-h-12 flex-1 rounded-control bg-primary px-4 font-semibold text-white disabled:opacity-60 md:flex-none">{copy.isPending ? vi.system.loading : vi.share.copyTrip}</button><Link to={paths.planNew} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-control border border-primary px-4 text-center font-semibold text-primary md:flex-none">{vi.share.newTrip}</Link></div>
  </main>
}

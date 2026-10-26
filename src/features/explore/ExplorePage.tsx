import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { placeListQuerySchema } from '@shared/schemas'
import { getPlaces, getPublicMeta } from '@/lib/api'
import { vi } from '@/lib/strings/vi'
import { PlaceCard } from '@/components/ui/PlaceCard'
import { parseExploreQuery } from './query'
import { ExploreFilters } from './ExploreFilters'

export default function ExplorePage() {
  const [params, setParams] = useSearchParams()
  const parsed = useMemo(() => parseExploreQuery(params.toString()), [params])
  const filters = parsed.success ? parsed.data : placeListQuerySchema.parse({})
  const meta = useQuery({ queryKey: ['places-meta'], queryFn: getPublicMeta })
  const places = useQuery({ queryKey: ['places', filters], queryFn: () => getPlaces(filters), retry: 1 })
  const patchQuery = (key: string, value: string | string[] | undefined) => {
    const next = new URLSearchParams(params)
    next.delete(key)
    if (Array.isArray(value)) value.forEach((item) => next.append(key, item))
    else if (value) next.set(key, value)
    if (key !== 'page') next.delete('page')
    setParams(next, { replace: key === 'q' })
  }
  const clearFilters = () => setParams(new URLSearchParams())

  return <div className="mx-auto max-w-content px-4 pb-16 pt-10 md:px-8 md:pt-16">
    <header className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-secondary">{vi.explore.eyebrow}</p><h1 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">{vi.explore.title}</h1><p className="mt-3 max-w-2xl text-base leading-7 text-ink-muted">{vi.explore.intro}</p></header>
    <div><ExploreFilters filters={filters} query={params.get('q') ?? ''} tags={meta.data?.tags ?? []} onChange={patchQuery}/>
      {!parsed.success && <p className="mt-3 text-sm text-warning" role="status">{vi.explore.invalidFilter}</p>}
    </div>
    <div className="mt-8 flex items-end justify-between gap-4"><div><p className="text-sm text-ink-muted">{places.data ? vi.explore.placeCount(places.data.total) : vi.explore.loadingCount}</p><h2 className="mt-1 font-serif text-2xl">{vi.explore.resultTitle}</h2></div>{(filters.category || filters.tag?.length || filters.q) && <button onClick={clearFilters} className="min-h-11 rounded-control px-3 text-sm font-semibold text-primary underline underline-offset-4">{vi.explore.clearFilters}</button>}</div>
    {places.isPending ? <div role="status" aria-label={vi.explore.loading} className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="animate-pulse overflow-hidden rounded-card border border-line bg-white"><div className="aspect-[4/3] bg-[#eee9df]"/><div className="space-y-3 p-4"><div className="h-4 w-1/3 rounded bg-[#eee9df]"/><div className="h-6 w-2/3 rounded bg-[#eee9df]"/></div></div>)}</div>
      : places.isError ? <div className="mt-6 rounded-card border border-line bg-white p-8 text-center"><h3 className="font-serif text-xl">{vi.explore.errorTitle}</h3><p className="mt-2 text-sm text-ink-muted">{vi.explore.errorBody}</p><button onClick={() => void places.refetch()} className="mt-4 min-h-11 rounded-control bg-primary px-5 font-semibold text-white">{vi.explore.retry}</button></div>
      : places.data.items.length === 0 ? <div className="mt-6 rounded-card border border-line bg-white p-8 text-center"><h3 className="font-serif text-xl">{vi.explore.emptyTitle}</h3><p className="mt-2 text-sm text-ink-muted">{vi.explore.emptyBody}</p><button onClick={clearFilters} className="mt-4 min-h-11 rounded-control border border-primary px-5 font-semibold text-primary">{vi.explore.clearFilters}</button></div>
      : <><div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{places.data.items.map((place) => <PlaceCard key={place.id} place={place}/>)}</div><nav className="mt-8 flex items-center justify-center gap-3" aria-label="Phân trang"><button disabled={filters.page <= 1} onClick={() => patchQuery('page', String(filters.page - 1))} className="min-h-11 rounded-control border border-line px-4 disabled:opacity-40">{vi.explore.previous}</button><span className="text-sm text-ink-muted">{vi.explore.page(places.data.page, Math.max(1, Math.ceil(places.data.total / 24)))}</span><button disabled={places.data.page * 24 >= places.data.total} onClick={() => patchQuery('page', String(filters.page + 1))} className="min-h-11 rounded-control border border-line px-4 disabled:opacity-40">{vi.explore.next}</button></nav></>}
  </div>
}

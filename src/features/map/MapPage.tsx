import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { placeMapQuerySchema } from '@shared/schemas/placeQueries'
import { getMapPlaces } from '@/lib/api'
import { categoryColor, MapView } from './MapView'
import { vi } from '@/lib/strings/vi'

const categoryEntries = Object.entries(vi.placeCategories) as Array<[keyof typeof vi.placeCategories, string]>

export default function MapPage() {
  const [params, setParams] = useSearchParams()
  const parsed = placeMapQuerySchema.safeParse({ category: params.get('category') ?? undefined })
  const category = parsed.success ? parsed.data.category : undefined
  const places = useQuery({ queryKey: ['map-places', category], queryFn: () => getMapPlaces(category ? { category } : {}) })
  const chooseCategory = (value: string) => setParams(value === category ? new URLSearchParams() : new URLSearchParams({ category: value }))
  return <div className="mx-auto max-w-content px-4 pb-14 pt-10 md:px-8 md:pt-14">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-secondary">{vi.map.eyebrow}</p><h1 className="mt-3 text-4xl font-semibold">{vi.map.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{vi.map.intro}</p></div><p className="text-sm text-ink-muted">{places.data ? vi.explore.placeCount(places.data.items.length) : vi.map.loadingCount}</p></header>
    <div className="my-5 flex flex-wrap gap-2" aria-label="Lọc địa điểm trên bản đồ">{categoryEntries.map(([value, label]) => <button key={value} type="button" aria-pressed={category === value} onClick={() => chooseCategory(value)} className={`min-h-10 rounded-full border px-4 text-sm ${category === value ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink'}`}>{label}</button>)}</div>
    <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-muted" aria-label={vi.map.legend}>{categoryEntries.map(([value, label]) => <li key={value} className="flex items-center gap-2"><span aria-hidden="true" className="size-3 rounded-full" style={{ backgroundColor: categoryColor[value] }}/>{label}</li>)}</ul>
    {!parsed.success && <p className="mb-3 text-sm text-warning" role="status">{vi.map.invalidCategory}</p>}
    {places.isPending ? <div role="status" aria-label={vi.map.loading} className="h-[65vh] min-h-[420px] animate-pulse rounded-card bg-[#ece8e0]"/> : places.isError ? <div className="grid min-h-[360px] place-content-center rounded-card border border-line bg-white p-6 text-center"><h2 className="font-serif text-xl">{vi.map.errorTitle}</h2><button onClick={() => void places.refetch()} className="mt-4 min-h-11 rounded-control bg-primary px-5 font-semibold text-white">{vi.explore.retry}</button></div> : places.data.items.length === 0 ? <div className="rounded-card border border-line bg-white p-8 text-center"><h2 className="font-serif text-xl">{vi.map.emptyTitle}</h2><p className="mt-2 text-sm text-ink-muted">{vi.map.emptyBody}</p></div> : <MapView places={places.data.items} height="min(68vh, 720px)"/>}
  </div>
}

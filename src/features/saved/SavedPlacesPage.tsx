import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Category, PlaceSummary } from '@shared/schemas'
import { getSavedPlacesApi } from '@/lib/api'
import { useSession } from '@/features/auth/hooks/useSession'
import { PlaceCard } from '@/components/ui/PlaceCard'
import { vi } from '@/lib/strings/vi'
import { useAccountPageMeta } from '@/features/account/useAccountPageMeta'
import { AddToTripDialog } from '@/features/trip-editor/components/AddToTripDialog'
import { paths } from '@/app/paths'
import { Link } from 'react-router-dom'

const categories = Object.entries(vi.placeCategories) as Array<[Category, string]>

export default function SavedPlacesPage() {
  useAccountPageMeta(vi.saved.title)
  const auth = useSession()
  const [category, setCategory] = useState<string>('')
  const [adding, setAdding] = useState<PlaceSummary | null>(null)
  const token = auth.session?.access_token
  const saved = useQuery({ queryKey: ['saved-places', auth.user?.id], queryFn: () => getSavedPlacesApi(token!), enabled: Boolean(token), retry: false })
  const visiblePlaces = saved.data?.items.filter(place => !category || place.category === category) ?? []

  return <div className="space-y-6">
    <header><h1 className="font-serif text-3xl font-bold text-ink">{vi.saved.title}</h1><p className="mt-2 text-sm text-ink-muted">{vi.saved.intro}</p></header>
    <div className="flex flex-wrap items-center gap-2" aria-label={vi.saved.filterLabel}><button type="button" aria-pressed={!category} onClick={() => setCategory('')} className={`min-h-10 rounded-full border px-4 text-sm ${!category ? 'border-primary bg-primary text-white' : 'border-line bg-surface'}`}>{vi.saved.allCategories}</button>{categories.map(([value, label]) => <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(category === value ? '' : value)} className={`min-h-10 rounded-full border px-4 text-sm ${category === value ? 'border-primary bg-primary text-white' : 'border-line bg-surface'}`}>{label}</button>)}</div>
    {saved.isPending ? <div role="status" className="grid animate-pulse gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-72 rounded-card bg-[#eee9df]" />)}</div> : saved.isError ? <div role="alert" className="rounded-card border border-line bg-surface p-8 text-center"><p>{vi.account.loadFailed}</p><button onClick={() => void saved.refetch()} className="mt-4 min-h-11 rounded-control bg-primary px-4 font-semibold text-white">{vi.system.retry}</button></div> : visiblePlaces.length === 0 ? <section className="rounded-card border border-line bg-surface p-8 text-center"><h2 className="font-serif text-xl">{vi.saved.empty}</h2><Link to={paths.explore} className="mt-4 inline-flex min-h-11 items-center rounded-control bg-primary px-5 font-semibold text-white">{vi.place.explore}</Link></section> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{visiblePlaces.map(place => <div key={place.id} className="space-y-3"><PlaceCard place={place}/><button type="button" onClick={() => setAdding(place)} className="min-h-11 w-full rounded-control border border-primary px-4 text-sm font-semibold text-primary">{vi.saved.addToTrip}</button></div>)}</div>}
    {adding && <AddToTripDialog place={adding} onClose={() => setAdding(null)} />}
  </div>
}

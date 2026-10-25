import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { placeMapItemSchema } from '@shared/schemas/placeApi'
import { getPlaceBySlug, ApiRequestError } from '@/lib/api'
import { brand } from '@/lib/brand'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'
import { ImageCredit } from '@/components/ui/ImageCredit'
import { PlaceCard } from '@/components/ui/PlaceCard'
import { MapView } from '@/features/map/MapView'

export default function PlacePage() {
  const { slug = '' } = useParams()
  const query = useQuery({ queryKey: ['place', slug], queryFn: () => getPlaceBySlug(slug), retry: false })
  const place = query.data?.place
  useEffect(() => {
    if (!place) return
    document.title = `${place.name} · ${brand.name}`
    let description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!description) { description = document.createElement('meta'); description.name = 'description'; document.head.append(description) }
    description.content = place.shortDescription || place.description || `${place.name} · ${brand.description}`
    return () => { description?.removeAttribute('content') }
  }, [place])

  if (query.isPending) return <div role="status" aria-label={vi.place.loading} className="mx-auto max-w-content animate-pulse px-4 py-12"><div className="h-9 w-2/3 rounded bg-[#eee9df]"/><div className="mt-6 h-[min(55vw,520px)] rounded-card bg-[#eee9df]"/><div className="mt-6 h-28 rounded-card bg-[#eee9df]"/></div>
  if (query.isError) {
    if (query.error instanceof ApiRequestError && query.error.status === 404) return <div className="mx-auto max-w-content px-4 py-20 text-center"><p className="text-sm font-semibold text-primary">404</p><h1 className="mt-2 font-serif text-3xl">{vi.place.notFoundTitle}</h1><p className="mt-3 text-ink-muted">{vi.place.notFoundBody}</p><Link to={paths.explore} className="mt-6 inline-flex min-h-12 items-center rounded-control bg-primary px-5 font-semibold text-white">{vi.place.explore}</Link></div>
    return <div className="mx-auto max-w-content px-4 py-20 text-center"><h1 className="font-serif text-3xl">{vi.place.errorTitle}</h1><p className="mt-2 text-ink-muted">{vi.place.errorBody}</p><button onClick={() => void query.refetch()} className="mt-5 min-h-12 rounded-control bg-primary px-5 font-semibold text-white">{vi.explore.retry}</button></div>
  }
  if (!place) return null

  const mapItem = placeMapItemSchema.parse({ id: place.id, slug: place.slug, name: place.name, category: place.category, lat: place.lat, lng: place.lng, coverImageUrl: place.coverImageUrl })
  const images = place.images.length ? place.images : place.coverImageUrl ? [{ url: place.coverImageUrl, alt: place.coverImageAlt, credit: place.imageCredit ?? '', license: place.imageLicense ?? '', sourceUrl: null }] : []
  const price = place.ticketPriceVnd != null ? `${new Intl.NumberFormat('vi-VN').format(place.ticketPriceVnd)} ₫` : place.priceNote
  const timeLabel = (slot: keyof typeof vi.place.timeLabels) => vi.place.timeLabels[slot] ?? slot
  const directionsUrl = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${place.lat}%2C${place.lng}%3B${place.lat}%2C${place.lng}`
  return <article className="mx-auto max-w-content px-4 pb-16 pt-8 md:px-8 md:pt-12">
    <nav className="text-sm text-ink-muted"><Link to={paths.explore} className="underline underline-offset-4">{vi.place.breadcrumb}</Link><span aria-hidden="true"> / </span>{vi.placeCategories[place.category]}</nav>
    <header className="mt-4 max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[.15em] text-secondary">{vi.placeCategories[place.category]}{place.area ? ` · ${place.area}` : ''}</p><h1 className="mt-2 text-4xl font-semibold leading-tight md:text-5xl">{place.name}</h1>{place.shortDescription && <p className="mt-4 text-lg leading-8 text-ink-muted">{place.shortDescription}</p>}</header>
    {images.length > 0 ? <div className="mt-7 grid gap-3 md:grid-cols-[1.5fr_1fr]">{images.slice(0, 3).map((image, index) => <figure key={`${image.url}-${index}`} className={`overflow-hidden rounded-card border border-line bg-white ${index > 0 ? 'hidden md:block' : ''}`}><img src={image.url} alt={image.alt ?? place.name} className={`w-full object-cover ${index === 0 ? 'aspect-[4/3] md:aspect-[16/10]' : 'aspect-[16/9]'}`} loading={index ? 'lazy' : 'eager'}/><ImageCredit credit={image.credit || null} license={image.license || null} sourceUrl={image.sourceUrl}/></figure>)}</div> : <figure className="mt-7"><div className="grid min-h-64 place-items-center rounded-card bg-[radial-gradient(ellipse_at_50%_90%,#d7c2a0_0%,#efe7d8_55%,#f7f3eb_100%)] text-6xl text-primary/70" aria-label="Ảnh giữ chỗ">❋</div><ImageCredit credit={null} license={null} placeholder/></figure>}
    <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,.9fr)]">
      <div className="space-y-8"><section><h2 className="font-serif text-2xl">{vi.place.introTitle}</h2>{place.description && <p className="mt-3 whitespace-pre-line text-base leading-7 text-ink-muted">{place.description}</p>}{place.address && <p className="mt-3 text-sm"><span className="font-semibold">{vi.place.address}: </span>{place.address}</p>}</section>
        {place.tags.length > 0 && <section><h2 className="font-serif text-xl">Hợp với</h2><div className="mt-3 flex flex-wrap gap-2">{place.tags.map((tag) => <span key={tag.slug} className="rounded-full bg-primary-tint px-3 py-2 text-xs font-semibold text-primary">{tag.name}</span>)}</div></section>}
        {query.data.nearby.length > 0 && <section><h2 className="font-serif text-2xl">{vi.place.nearbyTitle}</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{query.data.nearby.slice(0, 4).map((nearby) => <PlaceCard key={nearby.id} place={nearby}/>)}</div></section>}
        <p className="border-l-2 border-accent pl-4 text-sm leading-6 text-ink-muted">{vi.place.visitNote}{place.lastVerifiedAt && ` Cập nhật gần nhất: ${new Date(place.lastVerifiedAt).toLocaleDateString('vi-VN')}.`}</p>
      </div>
      <aside className="space-y-5"><section className="rounded-card border border-line bg-white p-5 shadow-card"><h2 className="font-serif text-xl">{vi.place.infoTitle}</h2><dl className="mt-4 divide-y divide-line text-sm">{(place.openTime || place.closeTime) && <InfoRow label={vi.place.openHours} value={`${place.openTime ?? ''}${place.openTime && place.closeTime ? ' – ' : ''}${place.closeTime ?? ''}`}/ >}{place.closedDays.length > 0 && <InfoRow label={vi.place.closedDays} value={place.closedDays.map((day) => vi.place.days[day - 1]).join(', ')}/ >}{price && <InfoRow label={vi.place.price} value={price}/ >}{place.priceLevel != null && !price && <InfoRow label={vi.place.priceLevel} value={vi.place.priceLevels[place.priceLevel]}/ >}{place.visitDurationMin && <InfoRow label={vi.place.duration} value={`${place.visitDurationMin} phút`}/ >}{place.bestTime.length > 0 && <InfoRow label={vi.place.bestTime} value={place.bestTime.map(timeLabel).join(', ')}/ >}{place.openingNote && <InfoRow label={vi.place.note} value={place.openingNote}/ >}</dl><a href={directionsUrl} target="_blank" rel="noreferrer" className="mt-5 flex min-h-12 items-center justify-center rounded-control bg-primary px-4 text-center font-semibold text-white">{vi.place.directions}</a></section>
        <section><h2 className="mb-3 font-serif text-xl">{vi.place.locationTitle}</h2><MapView places={[mapItem]} height="300px"/></section>
      </aside>
    </div>
  </article>
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 py-3"><dt className="text-ink-muted">{label}</dt><dd className="max-w-[60%] text-right font-semibold">{value}</dd></div>
}

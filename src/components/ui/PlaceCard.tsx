import type { PlaceSummary } from '@shared/schemas'
import { vi } from '@/lib/strings/vi'

const categoryLabels: Record<PlaceSummary['category'], string> = vi.placeCategories

export function PlaceCard({ place, onSave, saved = false }: { place: PlaceSummary; onSave?: () => void; saved?: boolean }) {
  return <article className="overflow-hidden rounded-card border border-line bg-white shadow-card">
    <div className="aspect-[4/3] bg-surface-muted">{place.coverImageUrl && <img src={place.coverImageUrl} alt={place.coverImageAlt ?? place.name} loading="lazy" width="640" height="480" className="h-full w-full object-cover" />}</div>
    {place.imageCredit && <p className="px-4 pt-2 text-xs text-ink-muted">{vi.components.imageCredit}: {place.imageCredit}{place.imageLicense ? ` · ${place.imageLicense}` : ''}</p>}
    <div className="flex items-start justify-between gap-3 p-4"><div className="min-w-0"><span className="inline-flex rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-primary">{categoryLabels[place.category]}</span><h3 className="mt-2 truncate font-heading text-xl">{place.name}</h3>{place.area && <p className="mt-1 text-sm text-ink-muted">{place.area}</p>}</div>{onSave && <button type="button" aria-label={(saved ? vi.components.unsavePlace : vi.components.savePlace)(place.name)} aria-pressed={saved} onClick={onSave} className="grid size-11 shrink-0 place-items-center rounded-full text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{saved ? '♥' : '♡'}</button>}</div>
  </article>
}

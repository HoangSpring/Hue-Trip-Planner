import type { PlaceSummary } from '@shared/schemas'
import { vi } from '@/lib/strings/vi'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { ImageCredit } from './ImageCredit'
import { PlacePhoto } from './PlacePhoto'

const categoryLabels: Record<PlaceSummary['category'], string> = vi.placeCategories

export function PlaceCard({ place, onSave, saved = false }: { place: PlaceSummary; onSave?: () => void; saved?: boolean }) {
  return <article className="overflow-hidden rounded-card border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
    <Link to={paths.place(place.slug)} aria-label={`Xem ${place.name}`} className="block">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#eee5d6]"><PlacePhoto src={place.coverImageUrl} alt={place.coverImageAlt ?? place.name}/></div>
      <ImageCredit credit={place.imageCredit} license={place.imageLicense} sourceUrl={place.imageSourceUrl} placeholder={!place.coverImageUrl} />
      <div className="px-4 pb-4"><div className="flex flex-wrap gap-2"><span className="inline-flex rounded-full bg-primary-tint px-3 py-1 text-xs font-semibold text-primary">{categoryLabels[place.category]}</span>{place.tags.slice(0, 1).map((tag) => <span key={tag.slug} className="inline-flex rounded-full bg-secondary-tint px-3 py-1 text-xs font-semibold text-secondary">{tag.name}</span>)}</div><h3 className="mt-2 font-serif text-xl">{place.name}</h3>{place.area && <p className="mt-1 text-sm text-ink-muted">{place.area}</p>}</div>
    </Link>
    {onSave && <button type="button" aria-label={(saved ? vi.components.unsavePlace : vi.components.savePlace)(place.name)} aria-pressed={saved} onClick={onSave} className="sr-only" />}
  </article>
}

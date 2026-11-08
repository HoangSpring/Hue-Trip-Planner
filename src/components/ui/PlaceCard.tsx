
import type { PlaceSummary } from '@shared/schemas'
import { vi } from '@/lib/strings/vi'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { ImageCredit } from './ImageCredit'
import { PlacePhoto } from './PlacePhoto'
import { SavedPlaceButton } from '@/features/saved/SavedPlaceButton'

const categoryLabels: Record<PlaceSummary['category'], string> =
  vi.placeCategories

export function PlaceCard({ place }: { place: PlaceSummary }) {
  return (
    <article className="relative overflow-hidden rounded-card border border-line bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <SavedPlaceButton
        place={place}
        className="absolute right-3 top-3 z-10"
      />

      <Link
        to={paths.place(place.slug)}
        className="block"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-[#eee5d6]">
          <PlacePhoto
            src={place.coverImageUrl}
            alt={place.coverImageAlt ?? place.name}
          />
        </div>

        <ImageCredit
          credit={place.imageCredit}
          license={place.imageLicense}
          placeholder={!place.coverImageUrl}
        />

        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-primary-tint px-3 py-1 text-xs font-semibold text-primary">
              {categoryLabels[place.category]}
            </span>

            {place.tags.slice(0, 1).map((tag) => (
              <span
                key={tag.slug}
                className="inline-flex rounded-full bg-secondary-tint px-3 py-1 text-xs font-semibold text-secondary"
              >
                {tag.name}
              </span>
            ))}
          </div>

          <h3 className="mt-2 font-serif text-xl">
            {place.name}
          </h3>

          {place.area && (
            <p className="mt-1 text-sm text-ink-muted">
              {place.area}
            </p>
          )}
        </div>
      </Link>

      <div className="px-4 pb-4">
        <Link
          to={`${paths.map}?place=${encodeURIComponent(place.id)}`}
          className="inline-flex min-h-10 items-center gap-2 rounded-control border border-primary/30 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary-tint"
          aria-label={`Xem trên bản đồ: ${place.name}`}
        >
          <span aria-hidden="true">⌖</span>
          Xem trên bản đồ
        </Link>
      </div>
    </article>
  )
}

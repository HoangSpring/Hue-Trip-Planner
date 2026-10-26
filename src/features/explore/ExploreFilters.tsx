import { vi } from '@/lib/strings/vi'
import type { PlaceMeta } from '@shared/schemas/placeApi'
import type { PlaceListQuery } from '@shared/schemas/placeQueries'

const categoryEntries = Object.entries(vi.placeCategories) as Array<[NonNullable<PlaceListQuery['category']>, string]>

export function ExploreFilters({ filters, query, tags, onChange }: { filters: PlaceListQuery; query: string; tags: PlaceMeta['tags']; onChange: (key: string, value: string | string[] | undefined) => void }) {
  const tagSlugs = filters.tag ?? []
  return <section className="mt-8 rounded-card border border-line bg-white p-4 shadow-card md:p-6" aria-label="Bộ lọc địa điểm">
    <label className="block text-sm font-semibold" htmlFor="place-search">{vi.explore.searchLabel}</label>
    <div className="mt-2 flex flex-col gap-3 md:flex-row"><input id="place-search" value={query} onChange={(event) => onChange('q', event.target.value.trim() ? event.target.value : undefined)} placeholder={vi.explore.searchPlaceholder} className="min-h-12 min-w-0 flex-1 rounded-control border border-line px-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary-tint" /><select aria-label={vi.explore.sortLabel} value={filters.sort} onChange={(event) => onChange('sort', event.target.value)} className="min-h-12 rounded-control border border-line bg-white px-4"><option value="featured">{vi.explore.sortFeatured}</option><option value="name">{vi.explore.sortName}</option></select></div>
    <div className="mt-4 flex flex-wrap gap-2" aria-label={vi.explore.categories}>{categoryEntries.map(([value, label]) => <button key={value} type="button" aria-pressed={filters.category === value} onClick={() => onChange('category', filters.category === value ? undefined : value)} className={`min-h-10 rounded-full border px-4 text-sm ${filters.category === value ? 'border-primary bg-primary text-white' : 'border-line bg-bg text-ink hover:border-primary'}`}>{label}</button>)}</div>
    <div className="mt-4 flex flex-wrap gap-2" aria-label={vi.explore.tags}>{tags.map((tag) => <button key={tag.slug} type="button" aria-pressed={tagSlugs.includes(tag.slug)} onClick={() => onChange('tag', tagSlugs.includes(tag.slug) ? tagSlugs.filter((item) => item !== tag.slug) : [...tagSlugs, tag.slug])} className={`min-h-9 rounded-full border px-3 text-xs ${tagSlugs.includes(tag.slug) ? 'border-secondary bg-secondary text-white' : 'border-line bg-white text-ink-muted'}`}>{tag.name}</button>)}</div>
  </section>
}

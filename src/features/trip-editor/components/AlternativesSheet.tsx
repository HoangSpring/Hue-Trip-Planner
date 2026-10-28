import { useQuery } from '@tanstack/react-query'
import type { PlaceSummary, TripInput, TripItem } from '@shared/schemas'
import { fetchAlternativesApi } from '@/lib/api'
import { vi } from '@/lib/strings/vi'
import { categoryColor } from '@/features/map/MapView'

interface AlternativesSheetProps {
  isOpen: boolean
  targetItem: TripItem | null
  currentDate: string | null
  tripInput?: TripInput
  excludePlaceIds: string[]
  onClose: () => void
  onSelectAlternative: (item: TripItem, newPlace: PlaceSummary, reasonTag: string) => void
  onOpenSearchFallback: () => void
}

export function AlternativesSheet({
  isOpen,
  targetItem,
  currentDate,
  tripInput,
  excludePlaceIds,
  onClose,
  onSelectAlternative,
  onOpenSearchFallback,
}: AlternativesSheetProps) {
  const query = useQuery({
    queryKey: [
      'alternatives',
      targetItem?.placeId,
      targetItem?.slot,
      currentDate,
      excludePlaceIds,
    ],
    queryFn: () => {
      if (!targetItem?.placeId || !targetItem?.slot) {
        return Promise.resolve({ items: [] })
      }
      return fetchAlternativesApi({
        placeId: targetItem.placeId,
        slot: targetItem.slot,
        date: currentDate,
        excludePlaceIds,
        limit: 5,
        input: tripInput,
      })
    },
    enabled: isOpen && Boolean(targetItem?.placeId),
    staleTime: 60 * 1000,
  })

  if (!isOpen || !targetItem) return null

  const items = query.data?.items ?? []
  const targetName = targetItem.place?.name ?? 'địa điểm này'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alternatives-sheet-title"
    >
      <div className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-surface p-5 sm:p-6 shadow-2xl border border-line max-h-[85vh] flex flex-col animate-slide-up sm:animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-line">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {vi.tripEditor.replaceItem}
            </span>
            <h2 id="alternatives-sheet-title" className="mt-0.5 font-serif text-lg sm:text-xl font-bold text-ink">
              Gợi ý thay thế cho {targetName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-surface-high text-ink-muted hover:text-ink text-base font-bold"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Content list */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {query.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex gap-3 rounded-2xl bg-surface-high/60 p-3 animate-pulse">
                  <div className="size-20 rounded-xl bg-line shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-line rounded w-3/4" />
                    <div className="h-3 bg-line rounded w-1/2" />
                    <div className="h-3 bg-line rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : query.isError ? (
            <div className="rounded-2xl bg-surface-high p-6 text-center">
              <p className="text-sm text-ink-muted">Không thể tải gợi ý lúc này.</p>
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="mt-3 rounded-control bg-primary px-4 py-1.5 text-xs font-semibold text-white"
              >
                Thử lại
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-surface-high/60 p-6 text-center border border-line">
              <span className="text-3xl">🔍</span>
              <p className="mt-2 text-sm text-ink font-medium">
                Chưa có gợi ý thay thế phù hợp
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Bạn có thể tìm kiếm trong danh sách tất cả địa điểm để chọn điểm đến mong muốn.
              </p>
              <button
                type="button"
                onClick={onOpenSearchFallback}
                className="mt-4 inline-flex items-center gap-1.5 rounded-control bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
              >
                <span>Tìm trong danh sách</span>
              </button>
            </div>
          ) : (
            items.map((alt) => {
              const place = alt.place
              const color = categoryColor[place.category] || '#5B3A8C'
              const distLabel =
                alt.distanceM >= 1000
                  ? `Cách ${(alt.distanceM / 1000).toFixed(1)} km`
                  : `Cách ${alt.distanceM} m`

              return (
                <article
                  key={place.id}
                  className="flex flex-col rounded-2xl bg-surface-high/40 border border-line p-3 hover:border-primary/50 transition-colors shadow-xs"
                >
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-high border border-line/60">
                      {place.coverImageUrl ? (
                        <img
                          src={place.coverImageUrl}
                          alt={place.coverImageAlt || place.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl">
                          🏛️
                        </div>
                      )}
                    </div>

                    {/* Info & Choose button */}
                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-serif text-sm font-bold text-ink truncate">
                            {place.name}
                          </h3>
                          <span
                            className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                            style={{ color, backgroundColor: `${color}15` }}
                          >
                            {vi.placeCategories[place.category] || place.category}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectAlternative(targetItem, place, alt.reasonTag)}
                          className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-hover active:scale-95 transition-all"
                        >
                          Chọn
                        </button>
                      </div>

                      <div className="mt-1 flex items-center gap-1 text-[11px] text-ink-muted">
                        <span>📍</span>
                        <span>{distLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI reasonTag banner */}
                  <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-primary-tint/30 px-2.5 py-1 text-xs text-primary font-medium">
                    <span>✨</span>
                    <span>{alt.reasonTag}</span>
                  </div>
                </article>
              )
            })
          )}
        </div>

        {/* Footer fallback button */}
        {items.length > 0 && (
          <div className="mt-4 pt-3 border-t border-line text-center">
            <button
              type="button"
              onClick={onOpenSearchFallback}
              className="text-xs font-medium text-primary hover:underline"
            >
              Không thích các gợi ý này? Tìm trong danh sách
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { PlaceSummary, Slot } from '@shared/schemas'
import { getPlaces } from '@/lib/api'
import { vi } from '@/lib/strings/vi'
import { categoryColor } from '@/features/map/MapView'

interface AddPlaceSheetProps {
  isOpen: boolean
  dayIndex: number
  allExistingPlaceIds: Set<string>
  defaultSlot?: Slot
  onClose: () => void
  onAddPlace: (place: PlaceSummary, slot: Slot) => void
}

const slotOptions: { slot: Slot; label: string; icon: string }[] = [
  { slot: 'morning', label: 'Sáng', icon: '🌅' },
  { slot: 'noon', label: 'Trưa', icon: '🍜' },
  { slot: 'afternoon', label: 'Chiều', icon: '☕' },
  { slot: 'evening', label: 'Tối', icon: '🌙' },
]

export function AddPlaceSheet({
  isOpen,
  dayIndex,
  allExistingPlaceIds,
  defaultSlot = 'morning',
  onClose,
  onAddPlace,
}: AddPlaceSheetProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<Slot>(defaultSlot)

  const query = useQuery({
    queryKey: ['places-search', searchQuery],
    queryFn: () => getPlaces({ q: searchQuery.trim() || undefined, pageSize: 20 }),
    enabled: isOpen,
    staleTime: 30 * 1000,
  })

  if (!isOpen) return null

  const places = query.data?.items ?? []

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-place-sheet-title"
    >
      <div className="relative w-full max-w-xl rounded-t-3xl sm:rounded-3xl bg-surface p-5 sm:p-6 shadow-2xl border border-line max-h-[90vh] flex flex-col animate-slide-up sm:animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-line">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {vi.tripEditor.dayTab(dayIndex)}
            </span>
            <h2 id="add-place-sheet-title" className="mt-0.5 font-serif text-lg sm:text-xl font-bold text-ink">
              Thêm địa điểm vào ngày {dayIndex}
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

        {/* Slot selector */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-ink-muted">Chọn khung giờ:</label>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {slotOptions.map((opt) => (
              <button
                key={opt.slot}
                type="button"
                onClick={() => setSelectedSlot(opt.slot)}
                className={`flex items-center justify-center gap-1 rounded-xl py-2 px-2 text-xs font-medium border transition-all ${
                  selectedSlot === opt.slot
                    ? 'border-primary bg-primary text-white shadow-xs font-bold'
                    : 'border-line bg-surface-high text-ink hover:bg-surface-high/80'
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search input */}
        <div className="mt-4 relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên địa điểm, di sản, quán ăn..."
            className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 pl-9 text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            autoFocus
          />
          <span className="absolute left-3 top-3 text-ink-muted text-xs">
            🔍
          </span>
        </div>

        {/* Places list */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px]">
          {query.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex gap-3 rounded-2xl bg-surface-high/60 p-3 animate-pulse">
                  <div className="size-16 rounded-xl bg-line shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-line rounded w-2/3" />
                    <div className="h-3 bg-line rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : query.isError ? (
            <div className="p-8 text-center text-xs text-ink-muted">
              Không thể tải danh sách địa điểm lúc này.
            </div>
          ) : places.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted">
              Không tìm thấy địa điểm nào khớp với từ khóa.
            </div>
          ) : (
            places.map((place) => {
              const isAlreadyAdded = allExistingPlaceIds.has(place.id)
              const color = categoryColor[place.category] || '#5B3A8C'

              return (
                <article
                  key={place.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3 transition-colors ${
                    isAlreadyAdded
                      ? 'border-line/40 bg-surface-high/30 opacity-70'
                      : 'border-line bg-surface-high/40 hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-surface-high border border-line/60">
                      {place.coverImageUrl ? (
                        <img
                          src={place.coverImageUrl}
                          alt={place.coverImageAlt || place.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg">
                          🏛️
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-serif text-sm font-bold text-ink truncate">
                        {place.name}
                      </h4>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ color, backgroundColor: `${color}15` }}
                        >
                          {vi.placeCategories[place.category] || place.category}
                        </span>
                        {place.area && (
                          <span className="text-[11px] text-ink-muted truncate">
                            {place.area}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isAlreadyAdded ? (
                    <span className="shrink-0 rounded-xl bg-surface-high px-3 py-1.5 text-xs font-semibold text-ink-muted">
                      Đã thêm
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAddPlace(place, selectedSlot)}
                      className="shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-primary-hover active:scale-95 transition-all"
                    >
                      + Thêm
                    </button>
                  )}
                </article>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

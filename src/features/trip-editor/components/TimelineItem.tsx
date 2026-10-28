import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { TripItem, Warning } from '@shared/schemas'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'
import { categoryColor } from '@/features/map/MapView'

interface TimelineItemProps {
  item: TripItem
  orderNumber: number
  isSelected: boolean
  isFirst: boolean
  isLast: boolean
  totalDays: number
  currentDayIndex: number
  warnings: Warning[]
  onSelect: (itemId: string) => void
  onToggleLock?: (itemId: string) => void
  onMoveUp?: (itemId: string) => void
  onMoveDown?: (itemId: string) => void
  onMoveToDay?: (itemId: string, targetDayIndex: number) => void
  onDelete?: (itemId: string) => void
  onOpenAlternatives?: (item: TripItem) => void
  onUpdateItemTimes?: (itemId: string, startTime: string | null, durationMin: number | null) => void
  onUpdateNote?: (itemId: string, note: string | null) => void
  onDropOnItem?: (sourceItemId: string, targetItemId: string) => void
}

function calculateEndTime(startTime: string | null, durationMin: number | null): string | null {
  if (!startTime || !durationMin) return null
  const [h, m] = startTime.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  const totalM = h * 60 + m + durationMin
  const endH = Math.floor(totalM / 60) % 24
  const endM = totalM % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

export function TimelineItem({
  item,
  orderNumber,
  isSelected,
  isFirst,
  isLast,
  totalDays,
  currentDayIndex,
  warnings,
  onSelect,
  onToggleLock,
  onMoveUp,
  onMoveDown,
  onMoveToDay,
  onDelete,
  onOpenAlternatives,
  onUpdateItemTimes,
  onUpdateNote,
  onDropOnItem,
}: TimelineItemProps) {
  const [isEditingTimes, setIsEditingTimes] = useState(false)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [showMoveDayMenu, setShowMoveDayMenu] = useState(false)

  const [editStartTime, setEditStartTime] = useState(item.startTime ?? '')
  const [editDuration, setEditDuration] = useState(item.durationMin ? String(item.durationMin) : '')
  const [editNoteText, setEditNoteText] = useState(item.note ?? '')

  const place = item.place
  const category = place?.category ?? 'sightseeing'
  const color = categoryColor[category] || '#5B3A8C'
  const categoryLabel = vi.placeCategories[category] || category

  const endTime = calculateEndTime(item.startTime, item.durationMin)
  const timeRangeLabel = item.startTime
    ? endTime
      ? `${item.startTime} – ${endTime}`
      : item.startTime
    : null

  const itemWarnings = warnings.filter((w) => w.itemId === item.id)

  const handleSaveTimes = (e: React.FormEvent) => {
    e.preventDefault()
    const dur = editDuration ? parseInt(editDuration, 10) : null
    onUpdateItemTimes?.(item.id, editStartTime || null, dur && dur > 0 ? dur : null)
    setIsEditingTimes(false)
  }

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateNote?.(item.id, editNoteText.trim() ? editNoteText.trim().slice(0, 300) : null)
    setIsEditingNote(false)
  }

  return (
    <div
      id={`item-${item.id}`}
      onClick={() => onSelect(item.id)}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(e) => {
        e.preventDefault()
        const sourceId = e.dataTransfer.getData('text/plain')
        if (sourceId && sourceId !== item.id) {
          onDropOnItem?.(sourceId, item.id)
        }
      }}
      className={`group relative rounded-2xl bg-surface border transition-all ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 shadow-md'
          : 'border-line hover:border-line-dark shadow-xs hover:shadow-card'
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
        {/* Left: Thumbnail & Order Badge */}
        <div className="relative w-full sm:w-44 h-36 shrink-0 overflow-hidden rounded-xl bg-surface-high border border-line/60">
          {place?.coverImageUrl ? (
            <img
              src={place.coverImageUrl}
              alt={place.coverImageAlt || place.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-surface-high text-ink-muted">
              <span className="text-3xl">🏛️</span>
              <span className="mt-1 text-xs">{categoryLabel}</span>
            </div>
          )}

          {/* Order Badge (Numbered) */}
          <div
            className="absolute top-2 left-2 flex size-7 items-center justify-center rounded-full text-white text-xs font-bold shadow-md ring-2 ring-white"
            style={{ backgroundColor: color }}
            title={`Chặng ${orderNumber}`}
          >
            {orderNumber}
          </div>

          {/* Time range pill over image */}
          {timeRangeLabel && (
            <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-xs">
              {timeRangeLabel}
            </div>
          )}
        </div>

        {/* Right: Place details & controls */}
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            {/* Top row: Category, Lock & Action icons */}
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{ color, backgroundColor: `${color}15` }}
              >
                {categoryLabel}
              </span>

              {/* Action Buttons Toolbar */}
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Lock button */}
                {onToggleLock && (
                  <button
                    type="button"
                    onClick={() => onToggleLock(item.id)}
                    title={item.isLocked ? vi.tripEditor.unlockItem : vi.tripEditor.lockItem}
                    className={`flex size-7 items-center justify-center rounded-lg transition-colors ${
                      item.isLocked
                        ? 'text-primary bg-primary/10'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-high'
                    }`}
                  >
                    {item.isLocked ? (
                      <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Drag handle for desktop */}
                {onDropOnItem && (
                  <div
                    draggable={true}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', item.id)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    className="hidden sm:flex size-7 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-high cursor-grab active:cursor-grabbing transition-colors"
                    title="Kéo thả để đổi thứ tự"
                  >
                    <svg className="size-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-12a2 2 0 10.001 4.001A2 2 0 0013 2zm0 6a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                    </svg>
                  </div>
                )}

                {/* Move Up */}
                {onMoveUp && !isFirst && (
                  <button
                    type="button"
                    onClick={() => onMoveUp(item.id)}
                    title={vi.tripEditor.moveUp}
                    className="flex size-7 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-high transition-colors"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                )}

                {/* Move Down */}
                {onMoveDown && !isLast && (
                  <button
                    type="button"
                    onClick={() => onMoveDown(item.id)}
                    title={vi.tripEditor.moveDown}
                    className="flex size-7 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-high transition-colors"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}

                {/* Move to another Day */}
                {onMoveToDay && totalDays > 1 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMoveDayMenu(!showMoveDayMenu)}
                      title={vi.tripEditor.moveToDay}
                      className="flex size-7 items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface-high transition-colors"
                    >
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    {showMoveDayMenu && (
                      <div className="absolute right-0 top-8 z-30 w-36 rounded-xl bg-surface border border-line p-1 shadow-card">
                        <div className="px-2 py-1 text-[11px] font-semibold text-ink-muted">
                          {vi.tripEditor.selectDayTarget}
                        </div>
                        {Array.from({ length: totalDays }, (_, i) => i + 1)
                          .filter((d) => d !== currentDayIndex)
                          .map((targetDay) => (
                            <button
                              key={targetDay}
                              type="button"
                              onClick={() => {
                                onMoveToDay(item.id, targetDay)
                                setShowMoveDayMenu(false)
                              }}
                              className="w-full text-left rounded-lg px-2 py-1.5 text-xs text-ink hover:bg-primary-tint/30 hover:text-primary transition-colors"
                            >
                              {vi.tripEditor.dayTab(targetDay)}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Title & Link to Place */}
            <h3 className="mt-1 font-serif text-lg font-bold text-ink hover:text-primary transition-colors">
              {place ? (
                <Link
                  to={paths.place(place.slug)}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline"
                >
                  {place.name}
                </Link>
              ) : (
                item.placeId
              )}
            </h3>

            {/* Photo credit and license if available */}
            {place?.imageCredit && (
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {vi.tripEditor.imageCreditPrefix} {place.imageCredit}
                {place.imageLicense && ` (${place.imageLicense})`}
              </p>
            )}

            {/* Time info and editing */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-surface-high px-2 py-1 text-xs text-ink-muted">
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {item.durationMin ? vi.tripEditor.durationMin(item.durationMin) : '—'}
              </span>

              {onUpdateItemTimes && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditingTimes(!isEditingTimes)
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  {isEditingTimes ? 'Đóng sửa giờ' : 'Sửa giờ'}
                </button>
              )}
            </div>

            {/* Inline edit form for Times */}
            {isEditingTimes && (
              <form
                onSubmit={handleSaveTimes}
                onClick={(e) => e.stopPropagation()}
                className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-surface-high p-2.5 border border-line"
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <label htmlFor={`start-${item.id}`} className="text-ink-muted">Giờ đến:</label>
                  <input
                    id={`start-${item.id}`}
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="rounded border border-line bg-surface px-2 py-1 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <label htmlFor={`dur-${item.id}`} className="text-ink-muted">Thời lượng (phút):</label>
                  <input
                    id={`dur-${item.id}`}
                    type="number"
                    min="15"
                    max="480"
                    step="15"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    className="w-16 rounded border border-line bg-surface px-2 py-1 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded bg-primary px-2.5 py-1 text-xs font-semibold text-white"
                >
                  Lưu
                </button>
              </form>
            )}
          </div>

          {/* AI Curation Reason */}
          {item.reason && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary-tint/25 p-2.5 text-xs text-ink">
              <span className="font-semibold text-primary shrink-0">
                {vi.tripEditor.curationReason}:
              </span>
              <span className="italic leading-relaxed">{item.reason}</span>
            </div>
          )}

          {/* Item Note or Add Note Prompt */}
          {item.note && !isEditingNote && (
            <div className="mt-2 flex items-start justify-between gap-2 rounded-xl bg-surface-high p-2 text-xs text-ink border border-line/60">
              <div className="flex items-center gap-1.5 text-ink-muted">
                <span>📝</span>
                <span className="text-ink">{item.note}</span>
              </div>
              {onUpdateNote && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditingNote(true)
                  }}
                  className="shrink-0 text-[11px] text-primary hover:underline"
                >
                  Sửa
                </button>
              )}
            </div>
          )}

          {isEditingNote && (
            <form
              onSubmit={handleSaveNote}
              onClick={(e) => e.stopPropagation()}
              className="mt-2 flex flex-col gap-1.5 rounded-xl bg-surface-high p-2.5 border border-line"
            >
              <textarea
                value={editNoteText}
                onChange={(e) => setEditNoteText(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder={vi.tripEditor.notePlaceholder}
                className="w-full rounded-lg border border-line bg-surface p-2 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingNote(false)}
                  className="text-xs text-ink-muted hover:underline"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded bg-primary px-3 py-1 text-xs font-semibold text-white"
                >
                  Lưu ghi chú
                </button>
              </div>
            </form>
          )}

          {/* Warnings Badges */}
          {itemWarnings.length > 0 && (
            <div className="mt-2.5 flex flex-col gap-1">
              {itemWarnings.map((w, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-lg bg-accent-tint/60 border border-accent/40 px-2.5 py-1 text-xs text-accent-dark"
                  role="status"
                >
                  <span aria-hidden="true">⚠️</span>
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Card Actions: Replace, Add Note, Delete */}
          <div
            className="mt-3 flex items-center justify-between border-t border-line/50 pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              {onOpenAlternatives && (
                <button
                  type="button"
                  onClick={() => onOpenAlternatives(item)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted hover:text-primary transition-colors"
                >
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>{vi.tripEditor.replaceItem}</span>
                </button>
              )}

              {onUpdateNote && !item.note && !isEditingNote && (
                <button
                  type="button"
                  onClick={() => setIsEditingNote(true)}
                  className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors"
                >
                  <span>+ Ghi chú</span>
                </button>
              )}
            </div>

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-error transition-colors"
                title={vi.tripEditor.deleteItem}
              >
                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>{vi.tripEditor.deleteItem}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import type { Slot, TripItem, Warning, Transport } from '@shared/schemas'
import { vi } from '@/lib/strings/vi'
import { TimelineItem } from './TimelineItem'
import { TravelConnector } from './TravelConnector'

interface SlotSectionProps {
  slot: Slot
  items: TripItem[]
  dayItems: TripItem[]
  totalDays: number
  currentDayIndex: number
  selectedItemId: string | null
  warnings: Warning[]
  transport?: Transport | null
  onSelectItem: (itemId: string) => void
  onToggleLock?: (itemId: string) => void
  onMoveUp?: (itemId: string) => void
  onMoveDown?: (itemId: string) => void
  onMoveToDay?: (itemId: string, targetDayIndex: number) => void
  onDelete?: (itemId: string) => void
  onOpenAlternatives?: (item: TripItem) => void
  onUpdateItemTimes?: (itemId: string, startTime: string | null, durationMin: number | null) => void
  onUpdateNote?: (itemId: string, note: string | null) => void
}

const slotIcons: Record<Slot, string> = {
  morning: '🌅',
  noon: '🍜',
  afternoon: '☕',
  evening: '🌙',
}

export function SlotSection({
  slot,
  items,
  dayItems,
  totalDays,
  currentDayIndex,
  selectedItemId,
  warnings,
  transport,
  onSelectItem,
  onToggleLock,
  onMoveUp,
  onMoveDown,
  onMoveToDay,
  onDelete,
  onOpenAlternatives,
  onUpdateItemTimes,
  onUpdateNote,
}: SlotSectionProps) {
  if (items.length === 0) {
    return null
  }

  const slotTitle = vi.tripEditor.slots[slot]
  const slotTimeRange = vi.tripEditor.slotTimes[slot]
  const icon = slotIcons[slot]

  return (
    <section className="flex flex-col gap-3">
      {/* Slot Header */}
      <div className="flex items-center justify-between border-b border-line/60 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-surface-high text-base shadow-xs">
            {icon}
          </span>
          <h2 className="font-serif text-base font-bold text-ink uppercase tracking-wide">
            {slotTitle}
          </h2>
          <span className="rounded-md bg-surface-high px-2 py-0.5 text-xs text-ink-muted font-medium">
            {slotTimeRange}
          </span>
        </div>
        <span className="text-xs text-ink-muted">
          {vi.tripEditor.stopsCount(items.length)}
        </span>
      </div>

      {/* Items List in this slot */}
      <div className="flex flex-col">
        {items.map((item, index) => {
          // Find overall index in day to display 1-based order badge
          const overallIndex = dayItems.findIndex((d) => d.id === item.id)
          const orderNumber = overallIndex !== -1 ? overallIndex + 1 : index + 1
          const isFirstInDay = overallIndex === 0
          const isLastInDay = overallIndex === dayItems.length - 1

          return (
            <div key={item.id} className="flex flex-col">
              {/* If not the first stop of the day, show travel connector from previous stop */}
              {!isFirstInDay && item.travelMinFromPrev != null && (
                <TravelConnector
                  travelMin={item.travelMinFromPrev}
                  travelDistanceM={item.travelDistanceM}
                  transport={transport}
                />
              )}

              <TimelineItem
                item={item}
                orderNumber={orderNumber}
                isSelected={selectedItemId === item.id}
                isFirst={isFirstInDay}
                isLast={isLastInDay}
                totalDays={totalDays}
                currentDayIndex={currentDayIndex}
                warnings={warnings}
                onSelect={onSelectItem}
                onToggleLock={onToggleLock}
                onMoveUp={onMoveUp}
                onMoveDown={onMoveDown}
                onMoveToDay={onMoveToDay}
                onDelete={onDelete}
                onOpenAlternatives={onOpenAlternatives}
                onUpdateItemTimes={onUpdateItemTimes}
                onUpdateNote={onUpdateNote}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

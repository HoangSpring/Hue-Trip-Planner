import { useEffect, useRef } from 'react'
import { vi } from '@/lib/strings/vi'
import { dateAtOffset } from '@shared/itinerary/calendar'

interface DaySelectorProps {
  numDays: number
  activeDayIndex: number
  startDate: string | null
  onSelectDay: (dayIndex: number) => void
}

function formatDaySublabel(startDate: string | null, dayIndex: number): string | null {
  if (!startDate) return null
  try {
    const iso = dateAtOffset(startDate, dayIndex - 1)
    const [year, month, day] = iso.split('-')
    if (!year || !month || !day) return null
    return `${day}/${month}`
  } catch {
    return null
  }
}

export function DaySelector({
  numDays,
  activeDayIndex,
  startDate,
  onSelectDay,
}: DaySelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Desktop keyboard navigation with ArrowLeft / ArrowRight
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement | null
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return
      }

      if (e.key === 'ArrowLeft') {
        if (activeDayIndex > 1) {
          e.preventDefault()
          onSelectDay(activeDayIndex - 1)
        }
      } else if (e.key === 'ArrowRight') {
        if (activeDayIndex < numDays) {
          e.preventDefault()
          onSelectDay(activeDayIndex + 1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeDayIndex, numDays, onSelectDay])

  return (
    <div
      ref={containerRef}
      className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none"
      role="tablist"
      aria-label="Chọn ngày trong chuyến đi"
    >
      {Array.from({ length: numDays }, (_, i) => i + 1).map((dayIndex) => {
        const isActive = dayIndex === activeDayIndex
        const sublabel = formatDaySublabel(startDate, dayIndex)

        return (
          <button
            key={dayIndex}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelectDay(dayIndex)}
            className={`group relative flex min-w-[100px] flex-col items-center justify-center rounded-2xl px-4 py-2.5 transition-all sm:min-w-[120px] ${
              isActive
                ? 'bg-primary text-white shadow-card font-semibold'
                : 'bg-surface hover:bg-surface-high text-ink border border-line hover:border-line-dark'
            }`}
          >
            <span className="text-sm font-medium">
              {vi.tripEditor.dayTab(dayIndex)}
            </span>
            {sublabel && (
              <span
                className={`text-xs mt-0.5 ${
                  isActive ? 'text-white/80' : 'text-ink-muted group-hover:text-ink'
                }`}
              >
                {sublabel}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

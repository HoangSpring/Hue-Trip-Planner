import { useState } from 'react'
import type { TripDay, TripInput, TripItem } from '@shared/schemas'
import { regenerateDayApi, ApiRequestError } from '@/lib/api'

interface RegenerateDayDialogProps {
  isOpen: boolean
  day: TripDay
  tripInput: TripInput
  excludePlaceIds: string[]
  onClose: () => void
  onToggleLockItem: (itemId: string) => void
  onQuickLockAll: () => void
  onRegenerateSuccess: (dayIndex: number, newItems: TripItem[]) => void
}

export function RegenerateDayDialog({
  isOpen,
  day,
  tripInput,
  excludePlaceIds,
  onClose,
  onToggleLockItem,
  onQuickLockAll,
  onRegenerateSuccess,
}: RegenerateDayDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const lockedCount = day.items.filter((it) => it.isLocked).length
  const allLocked = lockedCount === day.items.length && day.items.length > 0

  const handleRegenerate = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const lockedItems = day.items
        .filter((it) => it.isLocked)
        .map((it) => ({
          placeId: it.placeId,
          slot: it.slot,
        }))

      const response = await regenerateDayApi({
        input: tripInput,
        dayIndex: day.dayIndex,
        date: day.date,
        lockedItems,
        excludePlaceIds,
      })

      onRegenerateSuccess(day.dayIndex, response.day.items)
      onClose()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 429) {
          setErrorMessage('Bạn đã đạt giới hạn tạo lại ngày trong giờ này. Vui lòng thử lại sau.')
        } else {
          setErrorMessage(err.message || 'Không thể tạo lại ngày lúc này. Vui lòng thử lại.')
        }
      } else {
        setErrorMessage('Đã có lỗi xảy ra khi tạo lại ngày. Lịch trình cũ của bạn vẫn được giữ nguyên.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="regenerate-dialog-title"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-surface p-6 shadow-2xl border border-line flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 id="regenerate-dialog-title" className="font-serif text-lg font-bold text-ink">
              Tạo lại lịch trình Ngày {day.dayIndex}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex size-8 items-center justify-center rounded-full bg-surface-high text-ink-muted hover:text-ink text-base font-bold disabled:opacity-50"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Explanation text */}
        <p className="mt-3 text-xs text-ink-muted leading-relaxed">
          Hệ thống sẽ giữ nguyên các địa điểm có biểu tượng{' '}
          <strong className="text-primary font-semibold">Khóa 🔒</strong> và tạo mới các điểm dừng còn lại để tối ưu cung đường.
        </p>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 rounded-xl bg-accent-tint/60 border border-accent/40 p-3 text-xs text-accent-dark flex items-start gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Current Items Lock List */}
        <div className="mt-4 flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs text-ink-muted px-1">
            <span>Điểm dừng hiện tại ({day.items.length})</span>
            <button
              type="button"
              onClick={onQuickLockAll}
              disabled={isSubmitting}
              className="text-primary hover:underline font-medium"
            >
              {allLocked ? 'Mở khóa tất cả' : 'Khóa nhanh tất cả'}
            </button>
          </div>

          {day.items.map((it) => (
            <div
              key={it.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-surface-high/50 border border-line/60 p-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm">
                  {it.slot === 'morning' ? '🌅' : it.slot === 'noon' ? '🍜' : it.slot === 'afternoon' ? '☕' : '🌙'}
                </span>
                <span className="truncate font-medium text-ink">
                  {it.place?.name ?? it.placeId}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onToggleLockItem(it.id)}
                disabled={isSubmitting}
                className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
                  it.isLocked
                    ? 'bg-primary/10 text-primary'
                    : 'bg-surface-high text-ink-muted hover:text-ink'
                }`}
              >
                <span>{it.isLocked ? '🔒 Đã khóa' : '🔓 Chưa khóa'}</span>
              </button>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-control px-4 py-2 text-xs font-medium text-ink-muted hover:text-ink transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-1.5 rounded-control bg-primary px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-60"
          >
            {isSubmitting ? (
              <span>Đang tạo lại...</span>
            ) : (
              <>
                <span>✨</span>
                <span>Tạo lại ngày này</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

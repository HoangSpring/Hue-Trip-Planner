import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { readStoredTripDraft, readStoredNotices } from '@/features/trip-wizard/storage'
import type { TripDraft, Notice } from '@shared/schemas'

const slotLabels: Record<string, string> = {
  morning: 'Buổi sáng (08:00 – 11:30)',
  noon: 'Buổi trưa (11:30 – 13:30)',
  afternoon: 'Buổi chiều (13:30 – 17:30)',
  evening: 'Buổi tối (17:30 – 21:00)',
}

export function DraftInspectionPage() {
  const [draft, setDraft] = useState<TripDraft | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])

  useEffect(() => {
    const loaded = readStoredTripDraft()
    setDraft(loaded)
    setNotices(readStoredNotices())
  }, [])

  if (!draft) {
    return (
      <div className="mx-auto max-w-content px-4 py-12 text-center">
        <p className="text-ink-muted">Chưa có lịch trình nháp nào.</p>
        <Link to={paths.planNew} className="mt-4 inline-block font-semibold text-primary underline">
          Tạo lịch trình mới
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Dev / Milestone Badge */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-control bg-accent-tint/60 px-4 py-2.5 text-xs text-ink border border-accent/40">
        <span className="font-bold text-accent">
          [TODO T-025: Trình xem và chỉnh sửa lịch trình hoàn chỉnh]
        </span>
        <span className="text-ink-muted">
          Bản hiển thị kiểm tra nháp (Phase 2B)
        </span>
      </div>

      {/* Notices Banner (e.g. FEW_CANDIDATES, FALLBACK_USED) */}
      {notices.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {notices.map((notice, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-control bg-secondary/10 px-4 py-3 text-sm text-secondary border border-secondary/25"
            >
              <span aria-hidden="true" className="text-base">ℹ️</span>
              <div className="flex flex-col">
                <span className="font-semibold">{notice.code}</span>
                <span className="text-xs text-ink">{notice.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trip Header */}
      <div className="mb-8 flex flex-col gap-2 rounded-card bg-surface p-6 shadow-card border border-line">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Lịch trình nháp
          </span>
          <span className="text-xs text-ink-muted">
            ID: {draft.clientDraftId}
          </span>
        </div>
        <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">
          {draft.title}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-xs text-ink-muted">
          <span>{draft.numDays} ngày</span>
          {draft.startDate && <span>Bắt đầu: {draft.startDate}</span>}
          <span>Sinh bởi: {draft.generatedBy}</span>
          {draft.start && <span>Điểm đón: {draft.start.label}</span>}
        </div>

        {/* Guest prompt per FL-01 */}
        <div className="mt-3 border-t border-line/60 pt-3 flex items-center justify-between">
          <p className="text-xs text-ink-muted">
            Đăng nhập để lưu lịch trình và chia sẻ cho bạn bè.
          </p>
          <Link
            to={paths.login}
            className="rounded-control bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
          >
            Đăng nhập
          </Link>
        </div>
      </div>

      {/* Days & Items List */}
      <div className="flex flex-col gap-6">
        {draft.days.map((day) => (
          <section
            key={day.id}
            className="flex flex-col gap-4 rounded-card bg-surface p-5 sm:p-6 shadow-card border border-line"
          >
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="font-serif text-lg font-bold text-ink">
                Ngày {day.dayIndex} {day.date ? `(${day.date})` : ''}
              </h2>
              <span className="text-xs text-ink-muted font-medium">
                {day.items.length} điểm đến
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {day.items.map((item, itemIdx) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-1.5 rounded-control bg-bg p-3.5 border border-line/70"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="grid size-5 place-items-center rounded-full bg-primary text-white text-[10px] font-bold">
                        {itemIdx + 1}
                      </span>
                      <h3 className="font-serif text-sm font-bold text-ink">
                        {item.place?.name || `Địa điểm #${item.placeId.slice(0, 8)}`}
                      </h3>
                      {item.place?.category && (
                        <span className="rounded-full bg-line/60 px-2 py-0.2 text-[10px] font-medium text-ink-muted">
                          {item.place.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-ink-muted">
                      {item.startTime && (
                        <span className="font-semibold text-primary">
                          {item.startTime}
                        </span>
                      )}
                      {item.durationMin && (
                        <span>(~{item.durationMin} phút)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                    <span className="font-medium text-secondary">
                      {slotLabels[item.slot] || item.slot}
                    </span>
                    {item.travelMinFromPrev !== null && item.travelMinFromPrev > 0 && (
                      <span>• Di chuyển ~{item.travelMinFromPrev} phút</span>
                    )}
                  </div>

                  {item.reason && (
                    <p className="mt-0.5 text-xs italic text-ink-muted leading-relaxed">
                      "{item.reason}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default DraftInspectionPage

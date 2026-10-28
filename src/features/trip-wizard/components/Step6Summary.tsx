import { vi } from '@/lib/strings/vi'
import { Button } from '@/components/ui/Button'
import type { TripWizardFormValues } from '../storage'
import type { InterestTagItem } from './Step3Interests'

interface Step6SummaryProps {
  values: TripWizardFormValues
  availableTags: InterestTagItem[]
  onJumpToStep: (step: number) => void
  onSubmit: () => void
  isSubmitting?: boolean
  error?: string | null
}

export function Step6Summary({
  values,
  availableTags,
  onJumpToStep,
  onSubmit,
  isSubmitting = false,
  error,
}: Step6SummaryProps) {
  const companionInfo = values.companion ? vi.wizard.companions[values.companion] : null
  const paceInfo = vi.wizard.paces[values.pace]
  const budgetInfo = values.budget ? vi.wizard.budgets[values.budget] : null
  const transportInfo = values.transport ? vi.wizard.transports[values.transport] : null

  const selectedTagNames = values.interests.map((slug) => {
    const found = availableTags.find((t) => t.slug === slug)
    return found ? found.name : slug
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          {vi.wizard.step6Title}
        </h2>
        <p className="text-sm leading-relaxed text-ink-muted">
          {vi.wizard.step6Subtitle}
        </p>
      </div>

      {error && (
        <div className="rounded-control bg-danger/10 p-3 text-xs font-medium text-danger border border-danger/20" role="alert">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {/* Row 1: Thời gian */}
        <div className="flex items-start gap-4 rounded-card bg-surface p-4 shadow-card border border-line">
          <div className="grid size-10 shrink-0 place-items-center rounded-control bg-primary/10 text-primary text-lg" aria-hidden="true">
            📅
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {vi.wizard.summaryTime}
              </span>
              <button
                type="button"
                onClick={() => onJumpToStep(1)}
                className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none"
              >
                {vi.wizard.editAction}
              </button>
            </div>
            <p className="font-serif text-base font-semibold text-ink mt-0.5">
              {values.numDays} {vi.wizard.dayUnit}
              {values.startDate && (
                <span className="ml-2 font-sans text-xs font-normal text-ink-muted">
                  (Bắt đầu từ {values.startDate})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Row 2: Người đồng hành */}
        <div className="flex items-start gap-4 rounded-card bg-surface p-4 shadow-card border border-line">
          <div className="grid size-10 shrink-0 place-items-center rounded-control bg-accent/15 text-accent text-lg" aria-hidden="true">
            👥
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {vi.wizard.summaryCompanion}
              </span>
              <button
                type="button"
                onClick={() => onJumpToStep(2)}
                className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none"
              >
                {vi.wizard.editAction}
              </button>
            </div>
            <p className="font-serif text-base font-semibold text-ink mt-0.5">
              {companionInfo?.title || 'Chưa chọn'}
              {values.groupSize && (
                <span className="ml-2 font-sans text-xs font-normal text-ink-muted">
                  ({values.groupSize} {vi.wizard.groupSizeUnit})
                </span>
              )}
            </p>
            {companionInfo && (
              <p className="text-xs text-ink-muted mt-0.5">
                {companionInfo.desc}
              </p>
            )}
          </div>
        </div>

        {/* Row 3: Sở thích */}
        <div className="flex items-start gap-4 rounded-card bg-surface p-4 shadow-card border border-line">
          <div className="grid size-10 shrink-0 place-items-center rounded-control bg-secondary/15 text-secondary text-lg" aria-hidden="true">
            🏷️
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {vi.wizard.summaryInterests} ({values.interests.length})
              </span>
              <button
                type="button"
                onClick={() => onJumpToStep(3)}
                className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none"
              >
                {vi.wizard.editAction}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedTagNames.map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: Phong cách & Phương tiện */}
        <div className="flex items-start gap-4 rounded-card bg-surface p-4 shadow-card border border-line">
          <div className="grid size-10 shrink-0 place-items-center rounded-control bg-line/60 text-ink text-lg" aria-hidden="true">
            🧭
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {vi.wizard.summaryStyle}
              </span>
              <button
                type="button"
                onClick={() => onJumpToStep(4)}
                className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none"
              >
                {vi.wizard.editAction}
              </button>
            </div>
            <p className="font-serif text-base font-semibold text-ink mt-0.5">
              Nhịp độ: {paceInfo?.title || values.pace}
              <span className="ml-2 font-sans text-xs font-normal text-ink-muted">
                ({paceInfo?.count})
              </span>
            </p>
            <div className="mt-1 flex flex-wrap gap-2 text-xs text-ink-muted">
              {budgetInfo && (
                <span>Ngân sách: <strong>{budgetInfo.title}</strong> ({budgetInfo.range})</span>
              )}
              {transportInfo && (
                <span>• Di chuyển: <strong>{transportInfo.title}</strong></span>
              )}
            </div>
          </div>
        </div>

        {/* Row 5: Điểm xuất phát & Ghi chú */}
        <div className="flex items-start gap-4 rounded-card bg-surface p-4 shadow-card border border-line">
          <div className="grid size-10 shrink-0 place-items-center rounded-control bg-accent-tint text-accent text-lg" aria-hidden="true">
            📍
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                {vi.wizard.summaryStart}
              </span>
              <button
                type="button"
                onClick={() => onJumpToStep(5)}
                className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none"
              >
                {vi.wizard.editAction}
              </button>
            </div>
            <p className="font-serif text-sm font-semibold text-ink mt-0.5">
              {values.start?.label || vi.wizard.defaultStartPoint}
            </p>
            {/* Plain text render of notes - NEVER raw HTML */}
            <p className="mt-1 text-xs leading-relaxed text-ink-muted italic">
              {values.notes ? `"${values.notes}"` : vi.wizard.noNotes}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Submit CTA */}
      <div className="pt-2">
        <Button
          type="button"
          variant="primary"
          size="md"
          loading={isSubmitting}
          onClick={onSubmit}
          className="w-full text-base font-bold shadow-md"
        >
          {vi.wizard.createTripBtn}
        </Button>
      </div>
    </div>
  )
}

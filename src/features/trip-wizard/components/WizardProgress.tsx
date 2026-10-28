import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'

interface WizardProgressProps {
  currentStep: number
  onBack: () => void
  canBack?: boolean
}

export function WizardProgress({ currentStep, onBack, canBack = true }: WizardProgressProps) {
  const percentage = Math.round((currentStep / 6) * 100)

  return (
    <header className="mb-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {canBack ? (
          <button
            type="button"
            onClick={onBack}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-ink-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-control px-1 py-0.5"
            aria-label={vi.wizard.back}
          >
            <span aria-hidden="true" className="text-base transition-transform group-hover:-translate-x-0.5">←</span>
            <span>{vi.wizard.back}</span>
          </button>
        ) : (
          <div className="w-16" />
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            {vi.wizard.progress}
          </span>
          <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-semibold text-ink shadow-sm border border-line">
            {vi.wizard.step} {currentStep} / 6
          </span>
        </div>

        <Link
          to={paths.home}
          className="inline-flex items-center gap-1 text-sm text-ink-muted transition-colors hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger rounded-control px-1 py-0.5"
          aria-label={vi.wizard.exit}
        >
          <span>{vi.wizard.exit}</span>
          <span aria-hidden="true">✕</span>
        </Link>
      </div>

      <div
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={6}
        aria-label={`${vi.wizard.step} ${currentStep} trên 6`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </header>
  )
}

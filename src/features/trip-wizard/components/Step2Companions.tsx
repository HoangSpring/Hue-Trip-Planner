import type { Companion } from '@shared/schemas'
import { vi } from '@/lib/strings/vi'

interface Step2CompanionsProps {
  companion: Companion | null
  groupSize: number | null
  onChangeCompanion: (companion: Companion) => void
  onChangeGroupSize: (size: number) => void
  error?: string | null
}

const companionIcons: Record<Companion, string> = {
  solo: '👤',
  couple: '❤️',
  family_kids: '👨‍👩‍👧',
  friends: '👥',
  seniors: '🧓',
}

export function Step2Companions({
  companion,
  groupSize,
  onChangeCompanion,
  onChangeGroupSize,
  error,
}: Step2CompanionsProps) {
  const currentSize = groupSize ?? (companion === 'solo' ? 1 : 2)
  const tip = companion ? vi.wizard.companionTips[companion] : null

  const handleSelectCompanion = (type: Companion) => {
    onChangeCompanion(type)
    if (type === 'solo' && currentSize !== 1) {
      onChangeGroupSize(1)
    } else if (type === 'couple' && currentSize !== 2) {
      onChangeGroupSize(2)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          {vi.wizard.step2Title}
        </h2>
        <p className="text-sm leading-relaxed text-ink-muted">
          {vi.wizard.step2Subtitle}
        </p>
      </div>

      {/* Companion Cards Radio Group */}
      <div
        role="radiogroup"
        aria-label={vi.wizard.step2Title}
        className="flex flex-col gap-3"
      >
        {(['solo', 'couple', 'family_kids', 'friends', 'seniors'] as const).map((type) => {
          const item = vi.wizard.companions[type]
          const isSelected = companion === type
          return (
            <div
              key={type}
              role="radio"
              tabIndex={0}
              aria-checked={isSelected}
              onClick={() => handleSelectCompanion(type)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault()
                  handleSelectCompanion(type)
                }
              }}
              className={`group relative flex cursor-pointer items-start gap-4 rounded-card p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'bg-surface shadow-card border-2 border-primary ring-1 ring-primary/20'
                  : 'bg-surface/80 hover:bg-surface border border-line shadow-sm'
              }`}
            >
              <div
                className={`grid size-12 shrink-0 place-items-center rounded-control text-2xl transition-colors ${
                  isSelected ? 'bg-primary/10 text-primary' : 'bg-bg text-ink'
                }`}
                aria-hidden="true"
              >
                {companionIcons[type]}
              </div>

              <div className="flex-1 pr-6">
                <h3 className={`font-serif text-base font-semibold leading-snug ${
                  isSelected ? 'text-primary' : 'text-ink'
                }`}>
                  {item.title}
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                  {item.desc}
                </p>
              </div>

              <div
                className={`absolute right-4 top-4 grid size-6 place-items-center rounded-full border transition-colors ${
                  isSelected
                    ? 'border-primary bg-primary text-white'
                    : 'border-line bg-surface text-transparent'
                }`}
                aria-hidden="true"
              >
                <span className="text-xs font-bold">✓</span>
              </div>
            </div>
          )
        })}
      </div>

      {error && (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}

      {/* Group Size Stepper */}
      <section className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card border border-line">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-ink">
              {vi.wizard.groupSizeLabel}
            </h4>
            <p className="text-xs text-ink-muted">
              {vi.wizard.groupSizeHint}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-full bg-bg px-2 py-1 border border-line">
            <button
              type="button"
              disabled={currentSize <= 1}
              onClick={() => onChangeGroupSize(Math.max(1, currentSize - 1))}
              className="grid size-8 place-items-center rounded-full bg-surface text-ink shadow-sm transition-all hover:bg-line/40 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Giảm 1 người"
            >
              <span className="font-bold text-sm" aria-hidden="true">−</span>
            </button>

            <span className="min-w-16 text-center text-sm font-bold text-ink">
              {currentSize} {vi.wizard.groupSizeUnit}
            </span>

            <button
              type="button"
              disabled={currentSize >= 50}
              onClick={() => onChangeGroupSize(Math.min(50, currentSize + 1))}
              className="grid size-8 place-items-center rounded-full bg-primary text-white shadow-sm transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Tăng 1 người"
            >
              <span className="font-bold text-sm" aria-hidden="true">+</span>
            </button>
          </div>
        </div>
      </section>

      {/* Companion Tip Card */}
      {tip && (
        <div className="flex items-start gap-3 rounded-card bg-accent-tint/40 p-4 border border-accent/20">
          <span aria-hidden="true" className="text-xl text-accent">💡</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Lời khuyên cho đoàn
            </span>
            <p className="text-sm leading-relaxed text-ink">
              {tip}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

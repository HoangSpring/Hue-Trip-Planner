import type { Pace, Budget, Transport } from '@shared/schemas'
import { vi } from '@/lib/strings/vi'

interface Step4StyleProps {
  pace: Pace
  budget: Budget | null
  transport: Transport | null
  onChangePace: (pace: Pace) => void
  onChangeBudget: (budget: Budget | null) => void
  onChangeTransport: (transport: Transport | null) => void
  error?: string | null
}

const paceIcons: Record<Pace, string> = {
  relaxed: '🍃',
  moderate: '⚖️',
  packed: '⚡',
}

const budgetIcons: Record<Budget, string> = {
  budget: '🪙',
  mid: '💳',
  comfortable: '💎',
}

const transportIcons: Record<Transport, string> = {
  motorbike: '🛵',
  taxi: '🚕',
  walk_bike: '🚲',
  tour: '🚐',
}

export function Step4Style({
  pace,
  budget,
  transport,
  onChangePace,
  onChangeBudget,
  onChangeTransport,
  error,
}: Step4StyleProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          {vi.wizard.step4Title}
        </h2>
        <p className="text-sm leading-relaxed text-ink-muted">
          {vi.wizard.step4Subtitle}
        </p>
      </div>

      {/* Section 1: Pace (Required) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-serif font-semibold text-ink">
            {vi.wizard.paceTitle}
          </h3>
          <span className="text-xs text-primary font-medium">Bắt buộc</span>
        </div>

        <div
          role="radiogroup"
          aria-label={vi.wizard.paceTitle}
          className="flex flex-col gap-3"
        >
          {(['relaxed', 'moderate', 'packed'] as const).map((type) => {
            const item = vi.wizard.paces[type]
            const isSelected = pace === type
            return (
              <div
                key={type}
                role="radio"
                tabIndex={0}
                aria-checked={isSelected}
                onClick={() => onChangePace(type)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault()
                    onChangePace(type)
                  }
                }}
                className={`group relative flex cursor-pointer items-start gap-4 rounded-card p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-surface shadow-card border-2 border-primary ring-1 ring-primary/20'
                    : 'bg-surface/80 hover:bg-surface border border-line shadow-sm'
                }`}
              >
                <div
                  className={`grid size-11 shrink-0 place-items-center rounded-control text-xl transition-colors ${
                    isSelected ? 'bg-primary/10 text-primary' : 'bg-bg text-ink'
                  }`}
                  aria-hidden="true"
                >
                  {paceIcons[type]}
                </div>

                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2">
                    <span className={`font-serif text-base font-semibold ${
                      isSelected ? 'text-primary' : 'text-ink'
                    }`}>
                      {item.title}
                    </span>
                    <span className="rounded-full bg-bg px-2 py-0.5 text-[11px] font-medium text-ink-muted border border-line">
                      {item.count}
                    </span>
                    {type === 'moderate' && (
                      <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-ink">
                        {vi.wizard.recommended}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    {item.desc}
                  </p>
                </div>

                <div
                  className={`absolute right-4 top-4 grid size-5 place-items-center rounded-full border transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary text-white'
                      : 'border-line bg-surface text-transparent'
                  }`}
                  aria-hidden="true"
                >
                  <span className="text-[10px] font-bold">✓</span>
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
      </section>

      {/* Section 2: Budget (Optional) */}
      <section className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card border border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">
              {vi.wizard.budgetTitle}
            </h3>
            <span className="text-xs text-ink-muted">
              ({vi.wizard.budgetOptional})
            </span>
          </div>
          <span className="text-xs text-ink-muted hidden sm:inline">
            {vi.wizard.budgetSubtitle}
          </span>
        </div>

        <div
          role="radiogroup"
          aria-label={vi.wizard.budgetTitle}
          className="grid grid-cols-3 gap-2.5"
        >
          {(['budget', 'mid', 'comfortable'] as const).map((type) => {
            const item = vi.wizard.budgets[type]
            const isSelected = budget === type
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChangeBudget(isSelected ? null : type)}
                className={`relative flex flex-col items-center rounded-card p-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-primary/5 border-2 border-primary shadow-sm'
                    : 'bg-bg hover:bg-line/30 border border-line shadow-xs'
                }`}
              >
                {isSelected && (
                  <div className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] text-white">
                    ✓
                  </div>
                )}
                <span className="text-2xl mb-1" aria-hidden="true">
                  {budgetIcons[type]}
                </span>
                <span className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-ink'}`}>
                  {item.title}
                </span>
                <span className="mt-0.5 text-[11px] font-medium text-ink-muted">
                  {item.range}
                </span>
                <span className="text-[10px] text-ink-muted/80">
                  {item.unit}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Section 3: Transport (Optional) */}
      <section className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card border border-line">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">
              {vi.wizard.transportTitle}
            </h3>
            <span className="text-xs text-ink-muted">
              ({vi.wizard.transportOptional})
            </span>
          </div>
        </div>

        <div
          role="radiogroup"
          aria-label={vi.wizard.transportTitle}
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
        >
          {(['motorbike', 'taxi', 'walk_bike', 'tour'] as const).map((type) => {
            const item = vi.wizard.transports[type]
            const isSelected = transport === type
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChangeTransport(isSelected ? null : type)}
                className={`relative flex flex-col items-center rounded-card p-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-secondary/10 border-2 border-secondary text-secondary shadow-sm'
                    : 'bg-bg hover:bg-line/30 border border-line shadow-xs'
                }`}
              >
                {isSelected && (
                  <div className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-secondary text-[10px] text-white">
                    ✓
                  </div>
                )}
                <span className="text-2xl mb-1" aria-hidden="true">
                  {transportIcons[type]}
                </span>
                <span className={`text-xs font-semibold ${isSelected ? 'text-secondary' : 'text-ink'}`}>
                  {item.title}
                </span>
                <span className="mt-0.5 line-clamp-1 text-[10px] text-ink-muted">
                  {item.desc}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

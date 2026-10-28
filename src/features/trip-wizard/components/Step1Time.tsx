import { vi } from '@/lib/strings/vi'

interface Step1TimeProps {
  numDays: number
  startDate: string
  onChangeDays: (days: number) => void
  onChangeStartDate: (date: string) => void
  error?: string | null
}

const dayHints: Record<number, string> = {
  1: '1 ngày tinh gọn: vừa vặn khám phá Đại Nội buổi sáng, ngắm hoàng hôn chùa Thiên Mụ và nếm đặc sản tối.',
  2: vi.wizard.curatorHint,
  3: '3 ngày thư thái: thêm thời gian ngắm lăng Tự Đức, Khải Định và tận hưởng nhịp sống chậm bên sông Hương.',
  4: '4 ngày sâu lắng: thảnh thơi dạo bước các điện thờ cổ kính, làng hương Thủy Xuân và các ngôi chùa thanh tịnh.',
  5: '5 ngày trọn vẹn: hòa mình sâu vào di sản Cố Đô, thưởng thức trọn vẹn ẩm thực cung đình lẫn dân gian.',
}

export function Step1Time({
  numDays,
  startDate,
  onChangeDays,
  onChangeStartDate,
  error,
}: Step1TimeProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          {vi.wizard.step1Title}
        </h2>
        <p className="text-sm leading-relaxed text-ink-muted">
          {vi.wizard.step1Subtitle}
        </p>
      </div>

      {/* Days Selection Section */}
      <section className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card border border-line">
        <div className="flex items-center justify-between">
          <label htmlFor="days-stepper" className="text-sm font-semibold text-ink">
            {vi.wizard.daysLabel}
          </label>
          <span className="text-xs text-ink-muted">1 – 5 {vi.wizard.dayUnit}</span>
        </div>

        {/* Counter Display and Controls */}
        <div className="flex items-center justify-between rounded-control bg-bg p-3 border border-line/60">
          <div className="flex flex-col">
            <span className="font-serif text-3xl font-bold text-primary" id="days-stepper">
              {numDays} <span className="font-sans text-base font-normal text-ink-muted">{vi.wizard.dayUnit}</span>
            </span>
            <span className="text-xs text-ink-muted">
              {numDays === 2 ? vi.wizard.recommended : `${numDays} ngày tham quan`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={numDays <= 1}
              onClick={() => onChangeDays(Math.max(1, numDays - 1))}
              className="grid size-10 place-items-center rounded-full bg-surface text-ink shadow-sm transition-all hover:bg-line/40 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Giảm 1 ngày"
            >
              <span className="text-lg font-bold" aria-hidden="true">−</span>
            </button>
            <button
              type="button"
              disabled={numDays >= 5}
              onClick={() => onChangeDays(Math.min(5, numDays + 1))}
              className="grid size-10 place-items-center rounded-full bg-primary text-white shadow-sm transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Tăng 1 ngày"
            >
              <span className="text-lg font-bold" aria-hidden="true">+</span>
            </button>
          </div>
        </div>

        {/* Quick Pill Buttons */}
        <div
          role="radiogroup"
          aria-label={vi.wizard.daysLabel}
          className="flex flex-wrap items-center gap-2 pt-1"
        >
          {[1, 2, 3, 4, 5].map((d) => {
            const isSelected = numDays === d
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChangeDays(d)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm ring-1 ring-primary'
                    : 'bg-bg text-ink hover:bg-line/40 border border-line'
                }`}
              >
                <span>{d} {vi.wizard.dayUnit}</span>
                {d === 2 && (
                  <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-medium ${
                    isSelected ? 'bg-accent text-ink font-semibold' : 'bg-primary/10 text-primary'
                  }`}>
                    {vi.wizard.recommended}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {error && (
          <p className="text-xs font-medium text-danger" role="alert">
            {error}
          </p>
        )}
      </section>

      {/* Curator Hint Box */}
      <div className="flex items-start gap-3 rounded-card bg-secondary/10 p-4 border border-secondary/20">
        <span aria-hidden="true" className="text-xl text-secondary">✦</span>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
            {vi.wizard.curatorHintTitle}
          </span>
          <p className="text-sm leading-relaxed text-ink">
            {dayHints[numDays] || vi.wizard.curatorHint}
          </p>
        </div>
      </div>

      {/* Start Date Section */}
      <section className="flex flex-col gap-3 rounded-card bg-surface p-5 shadow-card border border-line">
        <div className="flex items-center justify-between">
          <label htmlFor="start-date-input" className="text-sm font-semibold text-ink">
            {vi.wizard.startDateLabel}
          </label>
          <span className="text-xs text-ink-muted">
            {vi.wizard.startDateHint}
          </span>
        </div>

        <div className="relative">
          <input
            id="start-date-input"
            type="date"
            value={startDate}
            onChange={(e) => onChangeStartDate(e.target.value)}
            className="w-full rounded-control border border-line bg-bg px-4 py-3 text-sm text-ink transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={vi.wizard.startDatePlaceholder}
          />
        </div>

        <p className="text-xs leading-relaxed text-ink-muted">
          {vi.wizard.curatorAdvice}
        </p>
      </section>
    </div>
  )
}

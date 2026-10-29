import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'

export function GuestBanner() {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-primary-tint/30 border border-primary/20 p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </span>
        <p className="text-sm font-medium text-ink">
          {vi.tripEditor.guestBanner}
        </p>
      </div>
      <Link
        to={`${paths.login}?next=${encodeURIComponent(paths.tripDraft)}`}
        className="inline-flex shrink-0 items-center justify-center rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
      >
        {vi.tripEditor.loginAction}
      </Link>
    </div>
  )
}

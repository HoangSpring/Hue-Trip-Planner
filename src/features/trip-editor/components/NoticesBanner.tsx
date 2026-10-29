import type { Notice } from '@shared/schemas'

export function NoticesBanner({ notices }: { notices: Notice[] }) {
  if (!notices || notices.length === 0) return null

  return (
    <div className="mb-6 flex flex-col gap-2">
      {notices.map((notice, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 rounded-2xl bg-secondary/10 border border-secondary/25 px-4 py-3 text-sm text-secondary shadow-sm"
          role="status"
        >
          <span aria-hidden="true" className="text-lg leading-none">ℹ️</span>
          <div className="flex flex-col">
            <span className="font-semibold text-xs tracking-wide uppercase">{notice.code}</span>
            <span className="text-xs text-ink mt-0.5">{notice.message}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

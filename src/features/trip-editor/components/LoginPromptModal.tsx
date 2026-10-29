import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'

interface LoginPromptModalProps {
  isOpen: boolean
  onClose: () => void
  actionLabel?: string
}

export function LoginPromptModal({
  isOpen,
  onClose,
  actionLabel = 'Lưu lịch trình',
}: LoginPromptModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-prompt-title"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-line">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-ink-muted hover:text-ink text-lg font-bold"
          aria-label="Đóng"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-tint/30 text-primary text-2xl">
            🔒
          </div>

          <h3 id="login-prompt-title" className="mt-4 font-serif text-xl font-bold text-ink">
            Đăng nhập để {actionLabel.toLowerCase()}
          </h3>

          <p className="mt-2 text-sm text-ink-muted leading-relaxed">
            {vi.tripEditor.guestBanner}
          </p>

          <div className="mt-6 flex w-full flex-col gap-2">
            <Link
              to={`${paths.login}?next=${encodeURIComponent(paths.tripDraft)}`}
              className="inline-flex w-full items-center justify-center rounded-control bg-primary py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover transition-colors"
            >
              {vi.tripEditor.loginAction}
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-control py-2 text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface-high transition-colors"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

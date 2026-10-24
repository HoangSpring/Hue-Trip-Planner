import type { ReactNode } from 'react'

export function Toast({ message, action }: { message: string; action?: ReactNode }) {
  return <div role="status" aria-live="polite" className="fixed bottom-20 left-1/2 z-50 flex min-h-12 -translate-x-1/2 items-center gap-5 rounded-button bg-ink px-5 py-3 text-white shadow-card md:bottom-6">{message}{action}</div>
}

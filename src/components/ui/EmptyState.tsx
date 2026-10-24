import type { ReactNode } from 'react'

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <section className="flex flex-col items-center rounded-card border border-dashed border-line px-6 py-12 text-center"><div aria-hidden="true" className="mb-4 grid size-14 place-items-center rounded-full bg-surface-muted text-primary">✦</div><h2 className="font-heading text-2xl">{title}</h2><p className="mt-2 max-w-md text-ink-muted">{children}</p>{action && <div className="mt-5">{action}</div>}</section>
}

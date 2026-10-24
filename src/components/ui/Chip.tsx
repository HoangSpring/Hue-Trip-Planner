import type { ButtonHTMLAttributes, ReactNode } from 'react'

export function Chip({ selected = false, className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean; children: ReactNode }) {
  return <button type="button" aria-pressed={selected} {...props} className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${selected ? 'border-primary bg-primary text-white' : 'border-line bg-white text-ink hover:border-primary'} ${className}`}>{children}</button>
}

export function ChipGroup({ label, children }: { label: string; children: ReactNode }) {
  return <div role="group" aria-label={label} className="flex flex-wrap gap-2">{children}</div>
}

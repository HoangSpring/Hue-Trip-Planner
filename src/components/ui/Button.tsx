import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger'
  size?: 'md' | 'sm'
  loading?: boolean
  children: ReactNode
}

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  secondary: 'border border-primary text-primary hover:bg-primary/5',
  tertiary: 'text-primary hover:bg-primary/5',
  danger: 'bg-danger text-white hover:brightness-95',
} as const

export function Button({ variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props }: Props) {
  const sizeClass = size === 'md' ? 'min-h-12 px-5' : 'min-h-11 px-4'
  return <button {...props} disabled={disabled || loading} aria-busy={loading || undefined}
    className={`inline-flex items-center justify-center gap-2 rounded-button font-semibold transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${sizeClass} ${variants[variant]} ${className}`}>
    {loading && <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />}{children}
  </button>
}

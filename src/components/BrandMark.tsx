
import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'

interface BrandMarkProps {
  inverse?: boolean
  asLink?: boolean
}

export function BrandMark({
  inverse = false,
  asLink = true,
}: BrandMarkProps) {
  const content = (
    <img
      src="/images/logo-hue-trip.png"
      alt="Hue Trip Planner"
      className={`block h-20 w-auto max-w-[320px] object-contain ${inverse ? 'brightness-110' : ''
        }`}
    />
  )

  if (!asLink) {
    return (
      <span className="inline-flex min-h-11 items-center">
        {content}
      </span>
    )
  }

  return (
    <Link
      to={paths.home}
      aria-label="Hue Trip Planner - Trang chủ"
      className="inline-flex min-h-11 items-center"
    >
      {content}
    </Link>
  )
}

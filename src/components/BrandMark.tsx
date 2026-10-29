import { Link } from 'react-router-dom'
import { paths } from '@/app/paths'
import { brand } from '@/lib/brand'

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return <Link to={paths.home} className={`inline-flex min-h-11 items-center gap-2 font-serif text-xl font-semibold ${inverse ? 'text-white' : 'text-primary'}`} aria-label={brand.name}>
    <span aria-hidden="true" className={`grid size-9 place-items-center rounded-full text-sm ${inverse ? 'bg-white text-primary' : 'bg-primary text-surface'}`}>H</span><span>{brand.name}</span>
  </Link>
}

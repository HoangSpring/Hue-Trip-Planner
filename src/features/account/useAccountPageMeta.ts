import { useEffect } from 'react'
import { brand } from '@/lib/brand'

export function useAccountPageMeta(title: string) {
  useEffect(() => {
    const previousTitle = document.title
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]')
    const createdRobots = !robots
    if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots) }
    const previousRobots = robots.content
    document.title = `${title} · ${brand.name}`
    robots.content = 'noindex,nofollow'
    return () => {
      document.title = previousTitle
      if (createdRobots) robots?.remove()
      else if (previousRobots) robots!.content = previousRobots
      else robots?.removeAttribute('content')
    }
  }, [title])
}

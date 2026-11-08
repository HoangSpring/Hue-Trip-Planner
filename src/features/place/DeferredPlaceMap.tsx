import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import type { PlaceMapItemDto } from '@shared/schemas'

const MapView = lazy(() => import('@/features/map/MapView').then(module => ({ default: module.MapView })))

export function DeferredPlaceMap({ place, height = '250px' }: { place: PlaceMapItemDto; height?: string }) {
  const container = useRef<HTMLDivElement>(null)
  const [shouldLoad, setShouldLoad] = useState(false)

  useEffect(() => {
    const element = container.current
    if (!element || shouldLoad) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setShouldLoad(true)
        observer.disconnect()
      }
    }, { rootMargin: '300px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [shouldLoad])

  return (
    <div ref={container} style={{ height }} className="w-full">
      {shouldLoad ? (
        <Suspense fallback={<div role="status" aria-label="Đang tải bản đồ" className="h-full w-full animate-pulse bg-[#e8e4d8] motion-reduce:animate-none" />}>
          <MapView places={[place]} height={height} />
        </Suspense>
      ) : (
        <div role="img" aria-label="Bản đồ sẽ tải khi cần" className="h-full w-full bg-[#e8e4d8]" />
      )}
    </div>
  )
}

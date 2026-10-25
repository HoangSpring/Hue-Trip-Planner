import { describe, expect, it } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { PlaceCard } from './PlaceCard'
import { ImageCredit } from './ImageCredit'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

const place = {
  id: 'b5fcba36-8100-4b53-996b-2b3528f48645', slug: 'sample-place', name: 'Địa điểm mẫu', category: 'heritage' as const,
  shortDescription: null, area: 'Thuận Hóa', lat: 16.46, lng: 107.59, coverImageUrl: null, coverImageAlt: null,
  imageCredit: null, imageLicense: null, tags: [], verified: true,
}

describe('PlaceCard', () => {
  it('links to detail and uses internal placeholder for missing image', () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    act(() => root.render(<MemoryRouter><PlaceCard place={place}/></MemoryRouter>))
    expect(container.querySelector('a')?.getAttribute('href')).toBe('/place/sample-place')
    expect(container.textContent).toContain('Ảnh giữ chỗ minh họa · Không phải ảnh địa điểm')
    act(() => root.unmount())
  })
})

describe('ImageCredit', () => {
  it('shows photographer and license as a visible linked caption', () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    act(() => root.render(<ImageCredit credit="Tác giả" license="CC BY 4.0" sourceUrl="https://example.com/source" />))
    const credit = container.querySelector('a')
    expect(credit?.getAttribute('href')).toBe('https://example.com/source')
    expect(credit?.textContent).toBe('Ảnh: Tác giả · CC BY 4.0')
    act(() => root.unmount())
  })
})

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { placeListQuerySchema } from '@shared/schemas/placeQueries'
import { ExploreFilters } from './ExploreFilters'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

describe('ExploreFilters', () => {
  it('updates category, tag, search and sorting through callbacks', () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const onChange = vi.fn()
    act(() => root.render(<ExploreFilters filters={placeListQuerySchema.parse({})} query="" tags={[{ slug: 'river', name: 'Bên sông', icon: null, imageUrl: null }]} onChange={onChange}/>))
    act(() => container.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(onChange).toHaveBeenCalledWith('category', 'heritage')
    const tagButton = [...container.querySelectorAll('button')].find((button) => button.textContent === 'Bên sông')
    act(() => tagButton?.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(onChange).toHaveBeenCalledWith('tag', ['river'])
    act(() => root.unmount())
  })
})

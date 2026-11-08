import { describe, expect, it } from 'vitest'
import { routeSeo } from './SeoBoundary'

describe('SEO route metadata', () => {
  it('sets noindex on private routes and shared pages', () => {
    for (const route of ['/account/trips', '/trip/draft', '/plan/generating', '/s/example', '/admin/import', '/login', '/register']) {
      expect(routeSeo(route).robots).toBe('noindex,follow')
    }
  })

  it('canonicalizes filtered explore queries to /explore', () => {
    expect(routeSeo('/explore', '?category=food&page=2').canonicalPath).toBe('/explore')
    expect(routeSeo('/explore', '?category=food&page=2').robots).toBe('noindex,follow')
  })
})

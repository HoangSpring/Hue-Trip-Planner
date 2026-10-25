import { describe, expect, it } from 'vitest'
import { normalizeHueSearch, parseExploreQuery } from './query'

describe('explore query', () => {
  it('validates and preserves supported filters and pagination', () => {
    const parsed = parseExploreQuery('?category=heritage&tag=unesco&tag=quiet&q=lang+tu+duc&sort=name&page=2')
    expect(parsed.success).toBe(true)
    if (parsed.success) expect(parsed.data).toMatchObject({ category: 'heritage', tag: ['unesco', 'quiet'], q: 'lang tu duc', sort: 'name', page: 2, pageSize: 24 })
  })
  it('rejects unknown values without throwing', () => {
    expect(parseExploreQuery('?category=unknown&page=-2').success).toBe(false)
  })
  it('normalizes Vietnamese diacritics for local comparison', () => {
    expect(normalizeHueSearch('Lăng Tự Đức')).toBe('lang tu duc')
  })
})

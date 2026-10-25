import { describe, expect, it } from 'vitest'
import { normalizePlaceSearch } from './placeService'

describe('place search normalization', () => {
  it('removes Vietnamese diacritics and folds case for search_text filters', () => {
    expect(normalizePlaceSearch('  LĂNG TỰ ĐỨC  ')).toBe('lang tu duc')
  })
})

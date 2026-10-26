import { afterEach, describe, expect, it } from 'vitest'
import { paths } from '@/app/paths'
import { readResumeDraft } from './HomePage'

afterEach(() => localStorage.clear())

describe('readResumeDraft', () => {
  it('returns a resume link only for schema-valid saved data', () => {
    localStorage.setItem('wizard_draft_v1', JSON.stringify({ step: 2, tripName: 'Huế thong thả' }))
    expect(readResumeDraft()).toEqual({ title: 'Huế thong thả', to: paths.planGenerating })
    localStorage.setItem('wizard_draft_v1', '{broken')
    expect(readResumeDraft()).toBeNull()
  })
})

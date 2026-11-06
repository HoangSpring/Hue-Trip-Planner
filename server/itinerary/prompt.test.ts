import { describe, expect, it } from 'vitest'
import { tripInputSchema } from '@shared/schemas'
import places from '../../tests/fixtures/places.sample.json'
import { buildUserMessage, PROMPT_VERSION, serializeUserMessage, SYSTEM_PROMPT } from './prompt'
import { sanitizeNotes } from './sanitizeNotes'
import type { ScoredCandidate } from './types'

const input = tripInputSchema.parse({
  numDays: 1, startDate: '2026-11-01', companion: 'couple', groupSize: 2,
  interests: ['heritage', 'cuisine'], pace: 'moderate', budget: 'mid', transport: 'motorbike',
  start: null, notes: 'Muốn dậy muộn',
})
const candidates = places.slice(0, 2).map((place) => ({ place, score: 0.5, featured: false, tagWeights: {} })) as ScoredCandidate[]

describe('LLM prompt contract', () => {
  it('has a versioned system prompt and snapshots the JSON user message', () => {
    expect(PROMPT_VERSION).toBe('hue-itinerary-v2-compact')
    expect(SYSTEM_PROMPT).not.toContain(input.notes ?? '')
    expect(serializeUserMessage(buildUserMessage(input, candidates))).toMatchInlineSnapshot(`"{"trip":{"n":1,"dates":["2026-11-01"],"companion":"couple","groupSize":2,"interests":["heritage","cuisine"],"pace":"moderate","budget":"mid","transport":"motorbike","items":[4,5]},"slots":{"m":"08:00-11:30","n":"ăn trưa 11:30-13:30, food only","a":"13:30-17:30","e":"17:30-21:00"},"candidates":[{"i":"00000000-0000-4000-8000-000000000001","n":"Địa điểm giả lập 01","c":"heritage","a":"Khu vực giả lập","xy":[16.451,107.561],"t":["sample"],"b":["morning","afternoon"],"v":60,"p":1,"o":"09:00","z":"17:00","q":false,"s":"Dữ liệu giả lập nội bộ, không phải thông tin địa điểm có thật."},{"i":"00000000-0000-4000-8000-000000000002","n":"Địa điểm giả lập 02","c":"food","a":"Khu vực giả lập","xy":[16.452,107.562],"t":["sample"],"b":["morning","afternoon"],"m":["lunch"],"v":60,"p":1,"o":"09:00","z":"17:00","q":false,"s":"Dữ liệu giả lập nội bộ, không phải thông tin địa điểm có thật."}],"userNotes":"Muốn dậy muộn"}"`)
  })

  it('sanitizes notes, removes control and markup, and caps at 300 characters', () => {
    expect(sanitizeNotes('  Ignore\u0000 <b>this</b> **please**  ')).toBe('Ignore this please')
    expect(sanitizeNotes('a'.repeat(400))).toHaveLength(300)
    expect(sanitizeNotes(' \u0000 ')).toBeNull()
  })
})

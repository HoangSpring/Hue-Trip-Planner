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
    expect(PROMPT_VERSION).toBe('hue-itinerary-v1')
    expect(SYSTEM_PROMPT).not.toContain(input.notes ?? '')
    expect(serializeUserMessage(buildUserMessage(input, candidates))).toMatchInlineSnapshot(`
      "{
        "trip": {
          "numDays": 1,
          "dates": [
            "2026-11-01"
          ],
          "companion": "couple",
          "groupSize": 2,
          "interests": [
            "heritage",
            "cuisine"
          ],
          "pace": "moderate",
          "budget": "mid",
          "transport": "motorbike",
          "itemsPerDay": {
            "min": 4,
            "max": 5
          },
          "start": null
        },
        "slotRules": {
          "morning": "08:00-11:30",
          "noon": "ăn trưa 11:30-13:30, chỉ địa điểm ăn uống",
          "afternoon": "13:30-17:30",
          "evening": "17:30-21:00"
        },
        "candidates": [
          {
            "id": "00000000-0000-4000-8000-000000000001",
            "name": "Địa điểm giả lập 01",
            "category": "heritage",
            "area": "Khu vực giả lập",
            "lat": 16.451,
            "lng": 107.561,
            "tags": [
              "sample"
            ],
            "bestTime": [
              "morning",
              "afternoon"
            ],
            "visitMin": 60,
            "priceLevel": 1,
            "openTime": "09:00",
            "closeTime": "17:00",
            "closedDays": [],
            "verified": false,
            "summary": "Dữ liệu giả lập nội bộ, không phải thông tin địa điểm có thật."
          },
          {
            "id": "00000000-0000-4000-8000-000000000002",
            "name": "Địa điểm giả lập 02",
            "category": "food",
            "area": "Khu vực giả lập",
            "lat": 16.452,
            "lng": 107.562,
            "tags": [
              "sample"
            ],
            "bestTime": [
              "morning",
              "afternoon"
            ],
            "visitMin": 60,
            "priceLevel": 1,
            "openTime": "09:00",
            "closeTime": "17:00",
            "closedDays": [],
            "verified": false,
            "summary": "Dữ liệu giả lập nội bộ, không phải thông tin địa điểm có thật."
          }
        ],
        "userNotes": "Muốn dậy muộn"
      }"
    `)
  })

  it('sanitizes notes, removes control and markup, and caps at 300 characters', () => {
    expect(sanitizeNotes('  Ignore\u0000 <b>this</b> **please**  ')).toBe('Ignore this please')
    expect(sanitizeNotes('a'.repeat(400))).toHaveLength(300)
    expect(sanitizeNotes(' \u0000 ')).toBeNull()
  })
})

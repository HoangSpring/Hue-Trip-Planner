import { describe, expect, it } from 'vitest'
import { tripInputSchema } from '@shared/schemas'
import samplePlaces from '../../tests/fixtures/places.sample.json'
import { FakeLlmClient, type FakeLlmScenario } from '../llm/fake'
import { llmItinerarySchema } from '@shared/schemas/llmItinerary'
import { validateLlmItinerary } from './validate'
import type { ScoredCandidate } from './types'

const input = tripInputSchema.parse({
  numDays: 2, startDate: null, companion: 'couple', groupSize: 2,
  interests: ['heritage', 'cuisine'], pace: 'moderate', budget: 'mid', transport: 'motorbike',
  start: null, notes: null,
})
const records = samplePlaces.slice(0, 15).map((place, index) => ({
  place: {
    ...place,
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    slug: `fixture-${index}`,
    category: index === 0 || index === 5 || index === 10 ? 'food' as const : 'heritage' as const,
    lat: 16.45,
    lng: 107.56 + index * 0.0001,
    visitDurationMin: 45,
    openTime: null,
    closeTime: null,
    closedDays: [],
    bestTime: [],
    mealType: index === 0 || index === 5 || index === 10 ? ['lunch'] as const : [],
    status: 'published' as const,
  },
  score: 1 - index / 100,
  featured: false,
  tagWeights: {},
})) as ScoredCandidate[]

function clientArgs(user: string, signal = new AbortController().signal) {
  return { system: 'system', user, schema: llmItinerarySchema, maxOutputTokens: 2500, temperature: 0.4, signal }
}

describe('validateLlmItinerary V1-V10', () => {
  it.each<FakeLlmScenario>([
    'valid', 'unknown_id', 'duplicate_id', 'missing_day', 'no_lunch', 'url_html_reason',
  ])('repairs scenario %s into candidate-only scheduled days', async (scenario) => {
    const fake = new FakeLlmClient(scenario)
    const response = await fake.completeJson(clientArgs(JSON.stringify({
      trip: { n: input.numDays },
      candidates: records.map(({ place }) => ({ i: place.id, c: place.category, m: place.mealType })),
    })))
    const result = await validateLlmItinerary(response.json, { input, candidates: records })
    expect(result.accepted).toBe(true)
    expect(result.days).toHaveLength(2)
    const ids = result.days.flatMap(({ items }) => items.map(({ placeId }) => placeId))
    expect(ids.every((id) => records.some(({ place }) => place.id === id))).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
    for (const day of result.days) {
      expect(day.items.filter(({ slot, candidate }) => slot === 'noon' && candidate.place.category === 'food')).toHaveLength(1)
      expect(day.items.filter(({ slot }) => slot === 'noon').every(({ candidate }) => candidate.place.category === 'food')).toBe(true)
    }
  })

  it.each<FakeLlmScenario>(['invalid_slot', 'invalid_json', 'too_long', 'extra_field'])(
    'allows only one fast repair for invalid schema scenario %s', async (scenario) => {
      const fake = new FakeLlmClient(scenario)
      const bad = await fake.completeJson(clientArgs(JSON.stringify({
        trip: { n: input.numDays },
        candidates: records.map(({ place }) => ({ i: place.id, c: place.category, m: place.mealType })),
      })))
      let current = 100
      const result = await validateLlmItinerary(bad.json, {
        input, candidates: records, now: () => current, startedAt: 0,
        repair: async () => { current += 50; return { days: [] } },
      })
      expect(result.repairs).toBe(1)
      expect(result.accepted).toBe(false)
      const lateResult = await validateLlmItinerary(bad.json, {
        input, candidates: records, now: () => 9000, startedAt: 0,
        repair: async () => ({ days: [] }),
      })
      expect(lateResult.repairs).toBe(0)
    },
  )

  it('never accepts an unknown ID into the result', async () => {
    const result = await validateLlmItinerary({ days: [{ dayIndex: 1, items: [{
      placeId: '00000000-0000-4000-8000-999999999999', slot: 'morning', reason: 'Một lựa chọn phù hợp.'
    }] }] }, { input, candidates: records })
    expect(result.issues).toContain('unknown_id:00000000-0000-4000-8000-999999999999')
    expect(result.days.flatMap(({ items }) => items).some(({ placeId }) => placeId.endsWith('999999999999'))).toBe(false)
  })

  it('rejects low coverage when no submitted candidates can complete the itinerary', async () => {
    const result = await validateLlmItinerary({ days: [{ dayIndex: 1, items: [{
      placeId: '00000000-0000-4000-8000-999999999999', slot: 'morning', reason: 'Một lựa chọn phù hợp.'
    }] }] }, { input, candidates: [] })
    expect(result.accepted).toBe(false)
    expect(result.reason).toBe('low_coverage')
  })

  it('does not emit markup or links from the model reason', async () => {
    const client = new FakeLlmClient('url_html_reason')
    const response = await client.completeJson(clientArgs(JSON.stringify({ trip: { n: 2 }, candidates: records.map(({ place }) => ({ i: place.id, c: place.category, m: place.mealType })) })))
    const result = await validateLlmItinerary(response.json, { input, candidates: records })
    expect(result.days.flatMap(({ items }) => items).every(({ reason }) => !/<|https?:\/\//i.test(reason))).toBe(true)
  })
})

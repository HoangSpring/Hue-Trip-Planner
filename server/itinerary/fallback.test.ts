import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { placeDetailSchema, tripInputSchema, type TripInput } from '@shared/schemas'
import { FixturePlacesRepo } from './placesRepo'
import { generateTrip, NoCandidatesError } from './fallback'
import type { CandidateRecord } from './types'
import { itineraryEvalCases } from './evalCases'

const placeFixture = placeDetailSchema.array().parse(JSON.parse(readFileSync(resolve('tests/fixtures/places.sample.json'), 'utf8')))
const records: CandidateRecord[] = placeFixture.map((place, index) => ({
  place: {
    ...place,
    lat: 16.45 + (index % 8) * 0.001,
    lng: 107.56 + Math.floor(index / 8) * 0.001,
    openTime: null,
    closeTime: null,
    bestTime: [],
    mealType: place.category === 'food' ? ['lunch'] : [],
    suitableFor: ['solo', 'couple', 'family_kids', 'friends', 'seniors'],
    walkingIntensity: 1,
    visitDurationMin: 60,
  },
  tagWeights: {},
  featured: index % 7 === 0,
}))

const input = (overrides: Partial<TripInput> = {}): TripInput => tripInputSchema.parse({
  numDays: 2, startDate: '2026-10-26', companion: 'couple', groupSize: 2, interests: ['cuisine', 'heritage'],
  pace: 'moderate', budget: null, transport: 'motorbike', start: null, notes: null, ...overrides,
})
const now = new Date('2026-10-20T12:00:00.000Z')

describe('fallback itinerary generator', () => {
  it('defines the ten requested manual evaluation scenarios with valid wizard inputs', () => {
    expect(itineraryEvalCases).toHaveLength(10)
    expect(new Set(itineraryEvalCases.map(({ id }) => id)).size).toBe(10)
    expect(itineraryEvalCases[0].input.interests).toContain('cuisine')
    expect(itineraryEvalCases[2].input.companion).toBe('seniors')
    expect(itineraryEvalCases[3].input.pace).toBe('packed')
  })

  it('returns the same draft for the same input, time, and seed', async () => {
    const repo = new FixturePlacesRepo(records)
    const first = await generateTrip(repo, input({ numDays: 1, pace: 'relaxed' }), { now, seed: 'golden' })
    const second = await generateTrip(repo, input({ numDays: 1, pace: 'relaxed' }), { now, seed: 'golden' })
    const signature = (result: typeof first) => result.draft.days[0].items.map(({ placeId, slot, startTime }) => ({ placeId, slot, startTime }))
    expect(signature(first)).toEqual(signature(second))
    expect(signature(first)).toMatchInlineSnapshot(`
      [
        {
          "placeId": "00000000-0000-4000-8000-000000000001",
          "slot": "morning",
          "startTime": "08:30",
        },
        {
          "placeId": "00000000-0000-4000-8000-000000000022",
          "slot": "noon",
          "startTime": "11:30",
        },
        {
          "placeId": "00000000-0000-4000-8000-000000000036",
          "slot": "afternoon",
          "startTime": "13:00",
        },
        {
          "placeId": "00000000-0000-4000-8000-000000000008",
          "slot": "evening",
          "startTime": "17:30",
        },
      ]
    `)
    expect(first.notices.map(({ code }) => code)).toContain('FALLBACK_USED')
  })

  it('returns no candidates distinctly for an empty published repository', async () => {
    await expect(generateTrip(new FixturePlacesRepo([]), input(), { now, seed: 7 })).rejects.toBeInstanceOf(NoCandidatesError)
  })

  it('satisfies trip invariants over ten generated input cases', async () => {
    const repo = new FixturePlacesRepo(records)
    const paceArb = fc.constantFrom('relaxed', 'moderate', 'packed')
    const companionArb = fc.constantFrom('solo', 'couple', 'family_kids', 'friends', 'seniors')
    await fc.assert(fc.asyncProperty(fc.integer({ min: 1, max: 5 }), paceArb, companionArb, fc.integer(), async (numDays, pace, companion, seed) => {
      const request = input({ numDays, pace, companion })
      const result = await generateTrip(repo, request, { now, seed })
      const allItems = result.draft.days.flatMap(({ items }) => items)
      const bounds = { relaxed: [3, 4], moderate: [4, 5], packed: [6, 7] }[pace]
      const reduction = companion === 'seniors' || companion === 'family_kids' ? 1 : 0
      expect(new Set(allItems.map(({ placeId }) => placeId)).size).toBe(allItems.length)
      expect(allItems.every(({ placeId }) => records.some(({ place }) => place.id === placeId && place.status === 'published'))).toBe(true)
      for (const day of result.draft.days) {
        expect(day.items.length, `${numDays}/${pace}/${companion}/${seed} day ${day.dayIndex}: ${JSON.stringify(day.items.map(({ placeId, slot }) => ({ placeId, slot })))}`).toBeGreaterThanOrEqual(Math.max(3, bounds[0] - reduction))
        expect(day.items.length).toBeLessThanOrEqual(bounds[1] - reduction)
        expect(day.items.map(({ position }) => position)).toEqual(day.items.map((_, index) => index))
        expect(day.items.every(({ startTime, durationMin }) => {
          const [hours, minutes] = startTime!.split(':').map(Number)
          return hours * 60 + minutes + durationMin! <= 21 * 60 + 30
        })).toBe(true)
      }
    }), { numRuns: 10, seed: 1457833871 })
  })
})

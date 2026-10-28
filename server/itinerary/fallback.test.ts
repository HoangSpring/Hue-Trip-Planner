import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { placeDetailSchema, tripInputSchema, type TripInput } from '@shared/schemas'
import { FixturePlacesRepo } from './placesRepo'
import { generateTrip, NoCandidatesError } from './fallback'
import { dateAtOffset, vietnamDate } from '../../shared/itinerary/calendar'
import { buildReason } from './reasons'
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
          "placeId": "00000000-0000-4000-8000-000000000006",
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
    await fc.assert(fc.asyncProperty(fc.integer({ min: 1, max: 5 }), paceArb, companionArb, fc.integer(), fc.integer({ min: 0, max: 364 }), async (numDays, pace, companion, seed, dayOffset) => {
      const requestStartDate = dateAtOffset('2026-01-01', dayOffset)
      const request = input({ numDays, pace, companion, startDate: requestStartDate })
      const result = await generateTrip(repo, request, { now, seed })
      const allItems = result.draft.days.flatMap(({ items }) => items)
      const bounds = { relaxed: [3, 4], moderate: [4, 5], packed: [6, 7] }[pace]
      const reduction = companion === 'seniors' || companion === 'family_kids' ? 1 : 0
      expect(new Set(allItems.map(({ placeId }) => placeId)).size).toBe(allItems.length)
      expect(allItems.every(({ placeId }) => records.some(({ place }) => place.id === placeId && place.status === 'published'))).toBe(true)
      expect(new Set(result.draft.days.map(({ date }) => date)).size).toBe(numDays)
      expect(result.draft.days.map(({ date }) => date)).toEqual(
        Array.from({ length: numDays }, (_, index) => dateAtOffset(requestStartDate, index)),
      )
      const lunchCandidateCount = records.filter(({ place }) => place.category === 'food' &&
        (place.mealType.length === 0 || place.mealType.includes('lunch'))).length
      for (const day of result.draft.days) {
        const minimum = Math.max(3, bounds[0] - reduction)
        if (day.items.length < minimum) {
          expect(result.notices.some(({ code, message }) => code === 'FEW_CANDIDATES' && message.includes(`Ngày ${day.dayIndex} (`))).toBe(true)
        }
        if (lunchCandidateCount >= numDays) {
          const lunches = day.items.filter(({ slot, place }) => slot === 'noon' && place?.category === 'food')
          expect(lunches, `${numDays}/${pace}/${companion}/${seed} day ${day.dayIndex}`).toHaveLength(1)
        }
        expect(day.items.filter(({ slot }) => slot === 'noon').every(({ place }) => place?.category === 'food')).toBe(true)
        expect(day.items.length).toBeLessThanOrEqual(bounds[1] - reduction)
        expect(day.items.map(({ position }) => position)).toEqual(day.items.map((_, index) => index))
        expect(day.items.every(({ startTime, durationMin }) => {
          const [hours, minutes] = startTime!.split(':').map(Number)
          return hours * 60 + minutes + durationMin! <= 21 * 60 + 30
        })).toBe(true)
      }
    }), { numRuns: 20, seed: 1457833871 })
  })

  it('keeps Vietnam calendar dates across month and year boundaries', () => {
    expect(dateAtOffset('2026-12-30', 0)).toBe('2026-12-30')
    expect(dateAtOffset('2026-12-30', 1)).toBe('2026-12-31')
    expect(dateAtOffset('2026-12-30', 2)).toBe('2027-01-01')
    expect(dateAtOffset('2026-12-30', 4)).toBe('2027-01-03')
    expect(vietnamDate(new Date('2026-10-26T17:30:00.000Z'))).toBe('2026-10-27')
  })

  it.each(['v2', 'v3', 'v6', 'v7', 'v8'])('regresses %s on a reduced fixture', async (caseId) => {
    const entry = itineraryEvalCases.find(({ id }) => id === caseId)
    if (!entry) throw new Error(`Missing eval case ${caseId}`)
    const reduced = records.slice(0, 24)
    const result = await generateTrip(new FixturePlacesRepo(reduced), entry.input, { now, seed: `regression-${caseId}` })
    const minimum = Math.max(3, ({ relaxed: 3, moderate: 4, packed: 6 } as const)[entry.input.pace] -
      (entry.input.companion === 'seniors' || entry.input.companion === 'family_kids' ? 1 : 0))
    expect(result.draft.days).toHaveLength(entry.input.numDays)
    expect(new Set(result.draft.days.flatMap(({ items }) => items.map(({ placeId }) => placeId))).size)
      .toBe(result.draft.days.flatMap(({ items }) => items).length)
    for (const day of result.draft.days) {
      expect(day.items.filter(({ slot, place }) => slot === 'noon' && place?.category === 'food')).toHaveLength(1)
      if (day.items.length < minimum) {
        expect(result.notices.some(({ code, message }) => code === 'FEW_CANDIDATES' && message.includes(`Ngày ${day.dayIndex} (`))).toBe(true)
      }
    }
  })

  it('uses category-first varied reasons and never calls a market visit a meal', () => {
    const market = records.find(({ place }) => place.category === 'shopping')
    if (!market) throw new Error('Missing shopping fixture')
    const cuisineInput = input({ interests: ['cuisine', 'heritage'] })
    const scoredMarket = { ...market, score: 1 }
    const reasonA = buildReason(scoredMarket, cuisineInput, 'afternoon', 0)
    const reasonB = buildReason(scoredMarket, cuisineInput, 'afternoon', 1)
    expect(reasonA).not.toContain('bữa ăn tại')
    expect(reasonB).not.toContain('bữa ăn tại')
    expect(reasonA).not.toBe(reasonB)
    expect(reasonA).toContain('mua sắm')
  })

  it('provides three distinct category-based reason variants for every place category', () => {
    for (const category of ['heritage', 'food', 'cafe', 'sightseeing', 'shopping'] as const) {
      const candidate = records.find(({ place }) => place.category === category)
      if (!candidate) throw new Error(`Missing ${category} fixture`)
      const reasons = [0, 1, 2].map((variant) => buildReason({ ...candidate, score: 1 }, input(), 'afternoon', variant))
      expect(new Set(reasons).size, category).toBe(3)
    }
  })
})

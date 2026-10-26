import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { placeDetailSchema, tripInputSchema } from '@shared/schemas'
import { ITINERARY_CONFIG } from '../../shared/itinerary/config'
import { filterCandidates } from './candidates'
import { FixturePlacesRepo } from './placesRepo'
import { buildCandidatePool } from './pool'
import { rankCandidates, scoreCandidate } from './scoring'
import type { CandidateRecord } from './types'

const places = placeDetailSchema.array().parse(JSON.parse(readFileSync(resolve('tests/fixtures/places.sample.json'), 'utf8')))
const input = tripInputSchema.parse({
  numDays: 1, startDate: null, companion: 'couple', groupSize: 2, interests: ['cuisine', 'heritage'],
  pace: 'moderate', budget: 'mid', transport: 'motorbike', start: { label: 'fixture', lat: 16.451, lng: 107.561 }, notes: null,
})
const records: CandidateRecord[] = places.map((place) => ({
  place: { ...place, tags: [{ slug: place.category === 'food' ? 'cuisine' : 'heritage', name: 'Mẫu' }] },
  tagWeights: { [place.category === 'food' ? 'cuisine' : 'heritage']: 3 },
  featured: false,
}))

describe('candidate scoring', () => {
  it('uses configured weights, known tag weights, and bounded scores', () => {
    expect(Object.values(ITINERARY_CONFIG.weights).reduce((a, b) => a + b, 0)).toBe(1)
    const scored = scoreCandidate(records[1], input)
    expect(scored.score).toBeGreaterThan(0)
    expect(scored.score).toBeLessThanOrEqual(1)
  })

  it('breaks ties by slug consistently', () => {
    const tied = ['z-tie', 'a-tie'].map((slug, index) => ({
      ...records[0],
      place: { ...records[0].place, id: `00000000-0000-4000-8000-00000000000${index + 1}`, slug },
    }))
    const ranked = rankCandidates(tied, input)
    expect(ranked.map(({ place }) => place.slug)).toEqual([...ranked.map(({ place }) => place.slug)].sort())
  })
})

describe('candidate filtering and relaxation', () => {
  it('drops unpublished data, applies hard required-field filtering at the repository, and reports empty input', async () => {
    const archived = { ...records[0], place: { ...records[0].place, status: 'archived' as const } }
    const repo = new FixturePlacesRepo([records[0], archived])
    const published = await repo.listPublished()
    expect(published).toHaveLength(1)
    expect(filterCandidates([], input).candidates).toEqual([])
  })

  it('relaxes sensitive walking restrictions and reports the relaxation', () => {
    const highIntensity = records.slice(0, 5).map((record) => ({ ...record, place: { ...record.place, walkingIntensity: 3 as const } }))
    const result = filterCandidates(highIntensity, { ...input, companion: 'seniors' })
    expect(result.candidates).toHaveLength(5)
    expect(result.notices.map(({ code }) => code)).toContain('FILTER_RELAXED')
  })

  it('expands radius to the configured relaxed distance when needed', () => {
    const outsideDefault = records.slice(0, 5).map((record) => ({
      ...record,
      place: { ...record.place, lat: 16.9 },
    }))
    const result = filterCandidates(outsideDefault, input)
    expect(result.candidates).toHaveLength(5)
    expect(result.notices.map(({ code }) => code)).toContain('FILTER_RELAXED')
  })
})

describe('candidate pool', () => {
  it('keeps a deterministic pool with lunch/evening candidates and category balance', () => {
    const ranked = filterCandidates(records, input).candidates
    const pool = buildCandidatePool(ranked, 1, 4)
    expect(pool.length).toBe(12)
    expect(pool.some(({ place }) => place.category === 'food' && (place.mealType.length === 0 || place.mealType.includes('lunch') || place.mealType.includes('dinner')))).toBe(true)
    expect(pool.some(({ place }) => place.bestTime.includes('evening') || ['cafe', 'sightseeing'].includes(place.category))).toBe(true)
    const counts = new Map<string, number>()
    for (const candidate of pool) counts.set(candidate.place.category, (counts.get(candidate.place.category) ?? 0) + 1)
    expect(Math.max(...counts.values())).toBeLessThanOrEqual(Math.ceil(pool.length / 2))
    expect(buildCandidatePool(ranked, 1, 4).map(({ place }) => place.id)).toEqual(pool.map(({ place }) => place.id))
  })
})

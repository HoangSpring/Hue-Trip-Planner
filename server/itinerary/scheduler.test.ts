import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { placeDetailSchema, tripInputSchema } from '@shared/schemas'
import { filterCandidates } from './candidates'
import { scheduleDay } from './scheduler'
import type { ScoredCandidate } from './types'

const places = placeDetailSchema.array().parse(JSON.parse(readFileSync(resolve('tests/fixtures/places.sample.json'), 'utf8')))
const candidates = places.map((place, index): ScoredCandidate => ({
  place: { ...place, tags: [], bestTime: [], visitDurationMin: 60 }, tagWeights: {}, featured: false, score: 1 - index / 100,
}))
const input = tripInputSchema.parse({
  numDays: 1, startDate: '2026-10-27', companion: 'couple', groupSize: 2, interests: ['cuisine', 'heritage'],
  pace: 'moderate', budget: null, transport: 'motorbike', start: null, notes: null,
})

describe('itinerary scheduler', () => {
  it('uses the gentle start for seniors and relaxed pace', () => {
    const selected = filterCandidates(candidates, input).candidates
    const withoutHours = { ...selected[0], place: { ...selected[0].place, openTime: null, closeTime: null } }
    const result = scheduleDay([{ candidate: withoutHours, slot: 'morning' }], {
      input: { ...input, pace: 'relaxed' }, dayIndex: 1,
    })
    expect(result.items[0]?.startTime).toBe('08:30')
  })

  it('moves an arrival to opening time and keeps it inside known hours', () => {
    const lateOpen = { ...candidates[0], place: { ...candidates[0].place, openTime: '10:00', closeTime: '15:00' } }
    const result = scheduleDay([{ candidate: lateOpen, slot: 'morning' }], { input, dayIndex: 1 })
    expect(result.items[0]?.startTime).toBe('10:00')
  })

  it('drops closed-day locations, schedules a different candidate, and keeps positions continuous', () => {
    const mondayClosed = { ...candidates[0], place: { ...candidates[0].place, closedDays: [1], openTime: '09:00', closeTime: '17:00' } }
    const open = { ...candidates[1], place: { ...candidates[1].place, closedDays: [], openTime: '09:00', closeTime: '17:00' } }
    const result = scheduleDay([
      { candidate: mondayClosed, slot: 'morning', alternatives: [open] },
      { candidate: candidates[2], slot: 'afternoon' },
    ], { input: { ...input, startDate: '2026-10-26' }, dayIndex: 1 })
    expect(result.items.map(({ candidate }) => candidate.place.id)).not.toContain(mondayClosed.place.id)
    expect(result.items.map(({ position }) => position)).toEqual(result.items.map((_, index) => index))
  })

  it('never ends after 21:30 and handles overnight businesses', () => {
    const late = { ...candidates[0], place: { ...candidates[0].place, openTime: '17:00', closeTime: '01:00', visitDurationMin: 60 } }
    const result = scheduleDay([{ candidate: late, slot: 'evening' }], { input, dayIndex: 1 })
    expect(result.items).toHaveLength(1)
    const [hour, minute] = result.items[0].startTime.split(':').map(Number)
    expect(hour * 60 + minute + result.items[0].durationMin).toBeLessThanOrEqual(21 * 60 + 30)
  })

  it('optimizes order within a slot using nearest neighbor, then assigns continuous positions', () => {
    const origin = { ...candidates[0], place: { ...candidates[0].place, lat: 16.45, lng: 107.56 } }
    const far = { ...candidates[1], place: { ...candidates[1].place, lat: 16.50, lng: 107.56 } }
    const near = { ...candidates[2], place: { ...candidates[2].place, lat: 16.451, lng: 107.56 } }
    const result = scheduleDay([
      { candidate: origin, slot: 'morning' }, { candidate: far, slot: 'morning' }, { candidate: near, slot: 'morning' },
    ], { input, dayIndex: 1 })
    expect(result.items.map(({ candidate }) => candidate.place.id)).toEqual([origin.place.id, near.place.id, far.place.id])
    expect(result.items.map(({ position }) => position)).toEqual([0, 1, 2])
  })
})

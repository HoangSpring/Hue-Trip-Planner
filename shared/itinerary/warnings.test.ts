import { describe, expect, it } from 'vitest'
import { computeWarnings, type WarningTrip } from './warnings'

const place = (overrides: Partial<NonNullable<WarningTrip['days'][number]['items'][number]['place']>> = {}) => ({
  id: 'p1', category: 'heritage' as const, status: 'published' as const, lat: 16.46, lng: 107.59,
  openTime: '09:00', closeTime: '17:00', closedDays: [], ...overrides,
})
const item = (overrides: Partial<WarningTrip['days'][number]['items'][number]> = {}) => ({
  id: 'i1', placeId: 'p1', place: place(), position: 0, slot: 'morning' as const, startTime: '10:00',
  durationMin: 60, travelMinFromPrev: 0, travelDistanceM: 0, ...overrides,
})
const trip = (items: WarningTrip['days'][number]['items'], overrides: Partial<WarningTrip> = {}): WarningTrip => ({
  days: [{ dayIndex: 1, date: null, items }], transport: 'motorbike', startDate: '2026-10-26', pace: 'relaxed', ...overrides,
})

describe('computeWarnings', () => {
  it('warns when a place is closed on the day, but does not duplicate a time warning', () => {
    const warnings = computeWarnings(trip([item({ place: place({ closedDays: [1] }) })]))
    expect(warnings.map(({ code }) => code)).toContain('CLOSED_ON_DAY')
    expect(warnings.map(({ code }) => code)).not.toContain('CLOSED_AT_TIME')
    expect(computeWarnings(trip([item()])).map(({ code }) => code)).not.toContain('CLOSED_ON_DAY')
  })

  it('warns when arrival is outside known hours and stays quiet within hours', () => {
    expect(computeWarnings(trip([item({ startTime: '17:00' })])).map(({ code }) => code)).toContain('CLOSED_AT_TIME')
    expect(computeWarnings(trip([item({ startTime: '10:00' })])).map(({ code }) => code)).not.toContain('CLOSED_AT_TIME')
  })

  it('warns when hours are missing and not when they are complete', () => {
    expect(computeWarnings(trip([item({ place: place({ openTime: null, closeTime: null }) })])).map(({ code }) => code)).toContain('MISSING_HOURS')
    expect(computeWarnings(trip([item()])).map(({ code }) => code)).not.toContain('MISSING_HOURS')
  })

  it('deduplicates MISSING_HOURS by place and retains one item id', () => {
    const repeatedPlace = place({ openTime: null, closeTime: null })
    const warnings = computeWarnings(trip([
      item({ id: 'item-1', place: repeatedPlace }),
      item({ id: 'item-2', place: repeatedPlace, placeId: repeatedPlace.id, position: 1, slot: 'afternoon' }),
    ]))
    const missingHours = warnings.filter(({ code }) => code === 'MISSING_HOURS')
    expect(missingHours).toHaveLength(1)
    expect(missingHours[0].itemId).toBe('item-1')
  })

  it('warns for an overlong leg using distance and travel time, but not a short leg', () => {
    const long = item({ travelDistanceM: 12_000, travelMinFromPrev: 40 })
    expect(computeWarnings(trip([long], { start: { label: 'start', lat: 16.46, lng: 107.59 } })).map(({ code }) => code)).toContain('TOO_FAR')
    expect(computeWarnings(trip([item()])).map(({ code }) => code)).not.toContain('TOO_FAR')
  })

  it('warns when a day has too many items and stays quiet inside the pace limit', () => {
    const five = [0, 1, 2, 3, 4].map((index) => item({ id: `i${index}`, position: index }))
    expect(computeWarnings(trip(five)).map(({ code }) => code)).toContain('TOO_MANY_ITEMS')
    expect(computeWarnings(trip(five.slice(0, 4))).map(({ code }) => code)).not.toContain('TOO_MANY_ITEMS')
  })

  it('warns on overlap and not on sequential visits', () => {
    const next = item({ id: 'i2', position: 1, startTime: '10:30', travelMinFromPrev: 10 })
    expect(computeWarnings(trip([item(), next])).map(({ code }) => code)).toContain('TIME_OVERLAP')
    expect(computeWarnings(trip([item(), { ...next, startTime: '11:15' }])).map(({ code }) => code)).not.toContain('TIME_OVERLAP')
  })

  it('warns when a place is archived and when lunch is missing', () => {
    const warnings = computeWarnings(trip([item({ place: place({ status: 'archived' }) })]))
    expect(warnings.map(({ code }) => code)).toContain('PLACE_ARCHIVED')
    expect(warnings.map(({ code }) => code)).toContain('LUNCH_MISSING')
    expect(computeWarnings(trip([item({ slot: 'noon', place: place({ category: 'food' }) })])).map(({ code }) => code)).not.toContain('LUNCH_MISSING')
    expect(computeWarnings(trip([item()])).map(({ code }) => code)).not.toContain('PLACE_ARCHIVED')
  })
})

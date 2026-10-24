import { describe, expect, it } from 'vitest'
import { haversine } from './geo'
import { isOpenAt } from './openHours'
import { estimateTravel, parseTransport } from './travel'

const hours = (openTime: string | null, closeTime: string | null, closedDays: number[] = []) => ({ openTime, closeTime, closedDays })
const hue = { lat: 16.4637, lng: 107.5909 }
const nearby = { lat: 16.4737, lng: 107.5909 }

describe('haversine and travel estimates', () => {
  it('returns zero for identical coordinates and a plausible short distance', () => {
    expect(haversine(hue, hue)).toBe(0)
    expect(haversine(hue, nearby)).toBeGreaterThan(1)
    expect(haversine(hue, nearby)).toBeLessThan(1.2)
  })

  it('applies circuity, mode speed, buffer and motorbike default', () => {
    const distance = haversine(hue, nearby) * 1.3
    expect(estimateTravel(hue, nearby).travelMin).toBe(Math.ceil(distance / 25 * 60) + 3)
    expect(estimateTravel(hue, nearby, 'taxi').travelMin).toBe(Math.ceil(distance / 22 * 60) + 5)
    expect(parseTransport('walk_bike')).toBe('walk_bike')
    expect(parseTransport('plane')).toBeNull()
  })
})

describe('opening hours', () => {
  it('returns unknown when hours are missing', () => {
    expect(isOpenAt(hours(null, null), '2026-10-26', '10:00')).toBe('unknown')
    expect(isOpenAt(hours('09:00', null), null, '10:00')).toBe('unknown')
  })

  it('closes at the close-minus-30-minute boundary', () => {
    const daily = hours('09:00', '17:00')
    expect(isOpenAt(daily, null, '16:30')).toBe('open')
    expect(isOpenAt(daily, null, '16:31')).toBe('closed')
  })

  it('uses the ISO weekday from the date and detects closed days', () => {
    expect(isOpenAt(hours('09:00', '17:00', [1]), '2026-10-26', '10:00')).toBe('closed')
    expect(isOpenAt(hours('09:00', '17:00', [1]), '2026-10-27', '10:00')).toBe('open')
    expect(isOpenAt(hours('09:00', '17:00'), '2026-02-30', '10:00')).toBe('unknown')
  })

  it('handles an overnight closing time', () => {
    const night = hours('17:00', '01:00')
    expect(isOpenAt(night, null, '00:30')).toBe('open')
    expect(isOpenAt(night, null, '00:31')).toBe('closed')
    expect(isOpenAt(night, null, '16:00')).toBe('closed')
  })
})

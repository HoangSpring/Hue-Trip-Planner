import { ITINERARY_CONFIG } from './config'

type OpeningHours = { openTime: string | null; closeTime: string | null; closedDays: number[] }
type OpenResult = 'open' | 'closed' | 'unknown'

function minuteOfDay(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : null
}

function isoWeekday(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const utcDate = new Date(Date.UTC(year, month - 1, day))
  if (utcDate.getUTCFullYear() !== year || utcDate.getUTCMonth() !== month - 1 || utcDate.getUTCDate() !== day) return null
  return utcDate.getUTCDay() || 7
}

/** Check arrival time against local Hue opening hours, using ISO weekdays (Mon=1). */
export function isOpenAt(place: OpeningHours, date: string | null, arrival: string): OpenResult {
  if (place.openTime === null || place.closeTime === null) return 'unknown'
  const opening = minuteOfDay(place.openTime)
  const closing = minuteOfDay(place.closeTime)
  const arrivalMinute = minuteOfDay(arrival)
  if (opening === null || closing === null || arrivalMinute === null) return 'unknown'

  if (date !== null) {
    const weekday = isoWeekday(date)
    if (weekday === null) return 'unknown'
    if (place.closedDays.includes(weekday)) return 'closed'
  }

  const overnight = closing <= opening
  const normalizedArrival = overnight && arrivalMinute < opening ? arrivalMinute + 1440 : arrivalMinute
  const normalizedClosing = overnight ? closing + 1440 : closing
  return normalizedArrival > normalizedClosing - ITINERARY_CONFIG.closeBufferMin ? 'closed' : 'open'
}

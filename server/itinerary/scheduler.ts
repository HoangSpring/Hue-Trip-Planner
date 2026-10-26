import type { Slot, TripInput } from '@shared/schemas'
import { estimateTravel } from '../../shared/itinerary/travel'
import { ITINERARY_CONFIG } from '../../shared/itinerary/config'
import { isOpenAt } from '../../shared/itinerary/openHours'
import { haversine } from '../../shared/itinerary/geo'
import type { Coordinates } from '../../shared/itinerary/geo'
import type { ScoredCandidate } from './types'

const slotOrder: readonly Slot[] = ['morning', 'noon', 'afternoon', 'evening']
const windows: Record<Slot, { start: number; end: number }> = {
  morning: { start: 8 * 60, end: 11 * 60 + 30 },
  noon: { start: 11 * 60 + 30, end: 12 * 60 + 30 },
  afternoon: { start: 13 * 60, end: 17 * 60 },
  evening: { start: 17 * 60 + 30, end: 21 * 60 + 30 },
}

export type ScheduleRequest = {
  candidate: ScoredCandidate
  slot: Slot
  alternatives?: readonly ScoredCandidate[]
}

export type ScheduledPlace = {
  candidate: ScoredCandidate
  slot: Slot
  position: number
  startTime: string
  durationMin: number
  travelMinFromPrev: number
  travelDistanceM: number
}

export type ScheduleResult = { items: ScheduledPlace[]; droppedPlaceIds: string[] }

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function toTime(value: number): string {
  const minute = Math.max(0, Math.floor(value))
  return `${String(Math.floor(minute / 60) % 24).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}

function dayDate(startDate: string | null, dayIndex: number): string | null {
  if (!startDate) return null
  const date = new Date(`${startDate}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + dayIndex - 1)
  return date.toISOString().slice(0, 10)
}

function dayStart(input: TripInput): number {
  return toMinutes(input.companion === 'seniors' || input.companion === 'family_kids' || input.pace === 'relaxed'
    ? ITINERARY_CONFIG.dayStart.gentle
    : ITINERARY_CONFIG.dayStart.default)
}

function slotChoices(candidate: ScoredCandidate, preferred: Slot): Slot[] {
  const preferredIndex = slotOrder.indexOf(preferred)
  const bestTime = candidate.place.bestTime
  const allowed = bestTime.length ? slotOrder.filter((slot) => bestTime.includes(slot)) : [...slotOrder]
  const forward = allowed.filter((slot) => slotOrder.indexOf(slot) >= preferredIndex)
  const earlier = allowed.filter((slot) => slotOrder.indexOf(slot) < preferredIndex)
  return [preferred, ...forward, ...earlier].filter((slot, index, all) => all.indexOf(slot) === index)
}

function scheduleCandidate(
  candidate: ScoredCandidate,
  slot: Slot,
  cursor: number,
  previous: Coordinates | null,
  start: Coordinates | null,
  date: string | null,
  firstItem: boolean,
  input: TripInput,
): ScheduledPlace | null {
  const place = candidate.place
  const duration = place.visitDurationMin
  if (duration === null) return null
  const from = previous ?? (firstItem ? start : null)
  const travel = from ? estimateTravel(from, place, input.transport) : { distanceKm: 0, travelMin: 0 }
  const window = windows[slot]
  let arrival = Math.max(cursor + travel.travelMin, window.start)
  if (arrival > window.end || arrival + duration > toMinutes(ITINERARY_CONFIG.latestEnd)) return null

  const { openTime, closeTime } = place
  if (openTime && closeTime) {
    const opening = toMinutes(openTime)
    const closingRaw = toMinutes(closeTime)
    const closesNextDay = closingRaw <= opening
    const closing = closesNextDay ? closingRaw + 1440 : closingRaw
    if (closesNextDay && arrival < opening) arrival += 1440
    if (arrival < opening) arrival = opening
    if (arrival > closing - ITINERARY_CONFIG.closeBufferMin || arrival + duration > closing) return null
    if (isOpenAt(place, date, toTime(arrival)) === 'closed') return null
  } else if (isOpenAt(place, date, toTime(arrival)) === 'closed') {
    return null
  }
  if (slot === 'noon' && (arrival < 11 * 60 + 30 || arrival > 12 * 60 + 30)) return null
  if (arrival + duration > toMinutes(ITINERARY_CONFIG.latestEnd)) return null
  return {
    candidate,
    slot,
    position: 0,
    startTime: toTime(arrival),
    durationMin: duration,
    travelMinFromPrev: travel.travelMin,
    travelDistanceM: Math.round(travel.distanceKm * 1000),
  }
}

function requestCandidates(request: ScheduleRequest): ScoredCandidate[] {
  return [request.candidate, ...(request.alternatives ?? []).filter((candidate) =>
    candidate.place.category === request.candidate.place.category)]
}

/** Schedule all slots in order and pick the nearest available stop within each slot. */
export function scheduleDay(
  requests: readonly ScheduleRequest[],
  options: { input: TripInput; dayIndex: number },
): ScheduleResult {
  const date = dayDate(options.input.startDate, options.dayIndex)
  const usedIds = new Set<string>()
  const scheduled: ScheduledPlace[] = []
  const dropped = new Set<string>()
  let cursor = dayStart(options.input)
  let previous: Coordinates | null = null

  for (const slot of slotOrder) {
    const pending = requests.filter((request) => request.slot === slot && !usedIds.has(request.candidate.place.id))
    while (pending.length) {
      const sortedByProximity = [...pending].sort((a, b) => {
        const aDistance = previous ? haversine(previous, a.candidate.place) : 0
        const bDistance = previous ? haversine(previous, b.candidate.place) : 0
        return aDistance - bDistance || b.candidate.score - a.candidate.score || a.candidate.place.slug.localeCompare(b.candidate.place.slug, 'en')
      })
      let selected: ScheduledPlace | null = null
      let selectedRequest: ScheduleRequest | null = null
      for (const request of sortedByProximity) {
        for (const candidate of requestCandidates(request)) {
          if (usedIds.has(candidate.place.id)) continue
          const choices = slotChoices(candidate, request.slot)
          for (const choice of choices) {
            selected = scheduleCandidate(candidate, choice, cursor, previous, options.input.start, date, scheduled.length === 0, options.input)
            if (selected) break
          }
          if (selected) { selectedRequest = request; break }
        }
        if (selected) break
      }
      if (!selected || !selectedRequest) {
        for (const request of pending) dropped.add(request.candidate.place.id)
        break
      }
      selected.position = scheduled.length
      scheduled.push(selected)
      usedIds.add(selected.candidate.place.id)
      pending.splice(pending.findIndex((request) => request === selectedRequest), 1)
      cursor = toMinutes(selected.startTime) + selected.durationMin
      previous = selected.candidate.place
    }
  }
  return { items: scheduled.map((item, position) => ({ ...item, position })), droppedPlaceIds: [...dropped] }
}

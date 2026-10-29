import type {
  Notice,
  RegenerateDayRequest,
  RegenerateDayResponse,
  Slot,
  TripDay,
  TripItem,
} from '@shared/schemas'
import { ITINERARY_CONFIG } from '../../shared/itinerary/config'
import { dateAtOffset, vietnamDate } from '../../shared/itinerary/calendar'
import { estimateTravel } from '../../shared/itinerary/travel'
import { computeWarnings } from '../../shared/itinerary/warnings'
import { AppError } from '../lib/errors'
import { loadCandidates } from './candidates'
import type { PlacesRepo } from './placesRepo'
import { buildReason } from './reasons'
import { scheduleDay, type ScheduleRequest } from './scheduler'
import type { CandidateRecord, ScoredCandidate } from './types'

function stableUuid(seed: string | number, salt: string): string {
  const input = `${seed}:${salt}`
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0')
  return `${hex.slice(0, 8)}-0000-4000-8000-000000000001`
}

function maximumItemsForDay(input: RegenerateDayRequest['input']): number {
  const pace = input.pace ?? 'moderate'
  const max = ITINERARY_CONFIG.itemsPerDay[pace][1]
  const reduce =
    input.companion === 'seniors' || input.companion === 'family_kids'
      ? ITINERARY_CONFIG.itemsPerDay.reduceForSensitiveBy
      : 0
  return Math.max(ITINERARY_CONFIG.itemsPerDay.floor, max - reduce)
}

function slotsForPace(pace: 'relaxed' | 'moderate' | 'packed'): Slot[] {
  switch (pace) {
    case 'relaxed':
      return ['morning', 'noon', 'afternoon']
    case 'packed':
      return ['morning', 'morning', 'noon', 'afternoon', 'afternoon', 'evening', 'evening']
    case 'moderate':
    default:
      return ['morning', 'noon', 'afternoon', 'evening']
  }
}

export async function regenerateDay(
  repo: PlacesRepo,
  req: RegenerateDayRequest,
  options: { now: Date; seed?: string; signal?: AbortSignal }
): Promise<RegenerateDayResponse> {
  const startTime = Date.now()
  const { input, dayIndex, date, lockedItems, excludePlaceIds } = req
  const seed = options.seed ?? `${dayIndex}-${Date.now()}`

  const effectiveDate =
    date ??
    (input.startDate
      ? dateAtOffset(input.startDate, dayIndex - 1)
      : vietnamDate(options.now))

  // Load candidate selection
  const selection = await loadCandidates(repo, input, options.signal)
  const allRecords = await repo.listPublished(options.signal)

  if (options.signal?.aborted) throw new DOMException('Đã hủy yêu cầu.', 'AbortError')
  const recordsById = new Map(allRecords.map((record) => [record.place.id, record]))
  const seenLockedIds = new Set<string>()
  const lockedHydrated: { record: CandidateRecord; slot: Slot; isLocked: true }[] = []

  for (const locked of lockedItems) {
    const found = recordsById.get(locked.placeId)
    if (!found) throw new AppError(400, 'VALIDATION_ERROR', 'Một địa điểm đã khóa không còn được xuất bản.')
    if (seenLockedIds.has(found.place.id) || excludePlaceIds.includes(found.place.id)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Danh sách địa điểm khóa bị trùng với chính nó hoặc ngày khác.')
    }
    seenLockedIds.add(found.place.id)
    lockedHydrated.push({ record: found, slot: locked.slot, isLocked: true })
  }

  const targetCount = maximumItemsForDay(input)
  const paceSlots = slotsForPace(input.pace).slice(0, targetCount)
  const remainingSlots: Slot[] = []

  // Locked stops consume one occurrence of their slot, but packed days can contain
  // multiple stops in the same slot.
  const lockedSlotCounts = new Map<Slot, number>()
  for (const locked of lockedHydrated) {
    lockedSlotCounts.set(locked.slot, (lockedSlotCounts.get(locked.slot) ?? 0) + 1)
  }
  for (const slot of paceSlots) {
    if (lockedHydrated.length + remainingSlots.length >= targetCount) break
    const countForSlot = remainingSlots.filter((remaining) => remaining === slot).length
    if (countForSlot < Math.max(0, paceSlots.filter((paceSlot) => paceSlot === slot).length - (lockedSlotCounts.get(slot) ?? 0))) {
      remainingSlots.push(slot)
    }
  }

  // Need lunch check: if no locked item in noon with food, prioritize noon food
  const hasNoonFood = lockedHydrated.some(
    (l) => l.slot === 'noon' && l.record.place.category === 'food'
  )

  // Only exclusions that still resolve to a published place are honored. This
  // prevents blindly using arbitrary client IDs while allowing stale draft IDs.
  const knownExclusions = new Set(excludePlaceIds.filter((id) => recordsById.has(id)))
  const usedIds = new Set<string>([...knownExclusions, ...seenLockedIds])
  const availablePool = selection.candidates.filter((c) => !usedIds.has(c.place.id))

  const selectedAdditional: ScheduleRequest[] = []

  // Fill noon slot first if missing
  const notices: Notice[] = [
    { code: 'FALLBACK_USED', message: 'Lịch trình ngày đã được tạo lại theo thuật toán dự phòng.' },
  ]
  if (!hasNoonFood) {
    const lunchOptions = availablePool.filter((c) => c.place.category === 'food' &&
      (c.place.mealType.length === 0 || c.place.mealType.includes('lunch')))
    const lunchCand = lunchOptions[0]
    if (lunchCand) {
      selectedAdditional.push({ candidate: lunchCand, slot: 'noon', alternatives: lunchOptions.slice(1) })
      usedIds.add(lunchCand.place.id)
      const noonIdx = remainingSlots.indexOf('noon')
      if (noonIdx !== -1) remainingSlots.splice(noonIdx, 1)
    } else {
      notices.push({ code: 'LUNCH_MISSING', message: `Không còn địa điểm ăn trưa phù hợp cho ngày ${dayIndex}.` })
    }
  }

  // Fill remaining slots from candidate pool
  for (const slot of remainingSlots) {
    if (slot === 'noon' && selectedAdditional.some((item) => item.slot === 'noon')) continue
    const nextCand = availablePool.find((c) => {
      if (usedIds.has(c.place.id)) return false
      if (c.place.category === 'food' && slot !== 'noon') return false
      if (slot === 'noon' && (c.place.mealType.length > 0 && !c.place.mealType.includes('lunch'))) return false
      return true
    })

    if (nextCand) {
      selectedAdditional.push({ candidate: nextCand, slot })
      usedIds.add(nextCand.place.id)
    }
  }

  // Build scheduler requests
  const scheduleRequests: ScheduleRequest[] = [
    ...lockedHydrated.map((l) => ({
      candidate: {
        place: l.record.place,
        tagWeights: l.record.tagWeights,
        featured: l.record.featured,
        score: 1.0,
      },
      slot: l.slot,
      locked: true,
    })),
    ...selectedAdditional,
  ]

  const scheduledResult = scheduleDay(scheduleRequests, {
    input: { ...input, startDate: effectiveDate },
    dayIndex,
  })

  // Assemble TripItem array
  const lockedPlaceIdSet = new Set(lockedItems.map((l) => l.placeId))

  const scheduledLockedIds = new Set(scheduledResult.items.filter((entry) => lockedPlaceIdSet.has(entry.candidate.place.id))
    .map((entry) => entry.candidate.place.id))
  const dayItems: TripItem[] = scheduledResult.items.map((entry, index) => {
    const isLocked = lockedPlaceIdSet.has(entry.candidate.place.id)
    const reason = buildReason(entry.candidate, input, entry.slot)

    return {
      id: stableUuid(seed, `item-${index}`),
      placeId: entry.candidate.place.id,
      place: entry.candidate.place,
      position: index,
      slot: entry.slot,
      startTime: entry.startTime,
      durationMin: entry.durationMin,
      travelMinFromPrev: null,
      travelDistanceM: null,
      reason,
      note: null,
      isLocked,
      addedBy: isLocked ? 'user' : 'fallback',
    }
  })

  // Keep a locked place and slot even if current hours/route constraints make
  // it impossible to assign a time. The warning calculation can then report
  // the known issue without silently deleting the user's locked stop.
  for (const locked of lockedHydrated) {
    if (scheduledLockedIds.has(locked.record.place.id)) continue
    const candidate: ScoredCandidate = {
      place: locked.record.place,
      tagWeights: locked.record.tagWeights,
      featured: locked.record.featured,
      score: 1,
    }
    dayItems.push({
      id: stableUuid(seed, `locked-${locked.record.place.id}`),
      placeId: locked.record.place.id,
      place: locked.record.place,
      position: dayItems.length,
      slot: locked.slot,
      startTime: null,
      durationMin: locked.record.place.visitDurationMin,
      travelMinFromPrev: null,
      travelDistanceM: null,
      reason: buildReason(candidate, input, locked.slot),
      note: null,
      isLocked: true,
      addedBy: 'user',
    })
  }
  dayItems.forEach((item, index) => { item.position = index })

  // Calculate travel times
  for (let i = 1; i < dayItems.length; i++) {
    const prevPlace = dayItems[i - 1].place
    const currPlace = dayItems[i].place
    if (
      prevPlace?.lat != null &&
      prevPlace?.lng != null &&
      currPlace?.lat != null &&
      currPlace?.lng != null
    ) {
      const est = estimateTravel(
        { lat: prevPlace.lat, lng: prevPlace.lng },
        { lat: currPlace.lat, lng: currPlace.lng },
        input.transport
      )
      dayItems[i].travelMinFromPrev = est.travelMin
      dayItems[i].travelDistanceM = Math.round(est.distanceKm * 1000)
    }
  }

  const day: TripDay = {
    id: stableUuid(seed, `day-${dayIndex}`),
    dayIndex,
    date: effectiveDate,
    note: null,
    items: dayItems,
  }

  const warnings = computeWarnings({
    days: [day],
    transport: input.transport,
    startDate: effectiveDate,
    pace: input.pace,
    companion: input.companion,
    start: input.start,
  })

  const durationMs = Date.now() - startTime

  return {
    day,
    warnings,
    notices,
    generation: {
      by: 'fallback',
      model: null,
      durationMs,
    },
  }
}

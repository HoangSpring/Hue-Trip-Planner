import type { Notice, TripDay, TripInput, TripItem, Warning } from '@shared/schemas'
import { ITINERARY_CONFIG } from '../../shared/itinerary/config'
import { dateAtOffset, isoWeekday, vietnamDate } from '../../shared/itinerary/calendar'
import { estimateTravel } from '../../shared/itinerary/travel'
import { buildCandidatePool } from './pool'
import { loadCandidates, type CandidateSelection } from './candidates'
import type { PlacesRepo } from './placesRepo'
import { buildReason } from './reasons'
import { scheduleDay, type ScheduleRequest, type ScheduleResult } from './scheduler'
import type { ScoredCandidate } from './types'
import { computeWarnings } from '../../shared/itinerary/warnings'

export class NoCandidatesError extends Error {
  readonly code = 'NO_CANDIDATES'
  constructor() { super('Không có địa điểm phù hợp để tạo lịch trình.'); this.name = 'NoCandidatesError' }
}

export type DayCandidateDiagnostics = {
  dayIndex: number
  date: string
  available: number
  excluded: {
    alreadyUsed: number
    closed: number
    outsideBestTime: number
    walkingIntensity: number
    tooFar: number
    schedulerRejected: number
    missingCoordinates: number
    missingVisitDuration: number
  }
  scheduled: number
  minimum: number
}

export type GenerateTripResult = {
  draft: ReturnType<typeof makeDraft>
  warnings: Warning[]
  notices: Notice[]
  diagnostics?: DayCandidateDiagnostics[]
}
export type GenerateTripOptions = { now: Date; seed: string | number; signal?: AbortSignal; clientDraftId?: string; explain?: boolean }

function hash32(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function stableUuid(seed: string | number, key: string): string {
  const source = `${seed}:${key}`
  const first = hash32(source).toString(16).padStart(8, '0')
  const second = hash32(`${source}:second`).toString(16).padStart(8, '0')
  const third = hash32(`${source}:third`).toString(16).padStart(8, '0')
  return `${first}-${second.slice(0, 4)}-4${second.slice(5, 8)}-a${third.slice(1, 4)}-${third}${first.slice(0, 4)}`
}

function startDate(input: TripInput, now: Date): string {
  return input.startDate ?? vietnamDate(now)
}

function itemBounds(input: TripInput): [number, number] {
  const [min, max] = ITINERARY_CONFIG.itemsPerDay[input.pace]
  const reduction = input.companion === 'seniors' || input.companion === 'family_kids'
    ? ITINERARY_CONFIG.itemsPerDay.reduceForSensitiveBy
    : 0
  return [Math.max(ITINERARY_CONFIG.itemsPerDay.floor, min - reduction), Math.max(ITINERARY_CONFIG.itemsPerDay.floor, max - reduction)]
}

function targetForDay(input: TripInput, dayIndex: number, seed: string | number): number {
  const [minimum, maximum] = itemBounds(input)
  return minimum + (hash32(`${seed}:day:${dayIndex}`) % (maximum - minimum + 1))
}

function slotsForTarget(input: TripInput, target: number): Array<'morning' | 'noon' | 'afternoon' | 'evening'> {
  const slots: Array<'morning' | 'noon' | 'afternoon' | 'evening'> = input.pace === 'packed'
    ? ['morning', 'morning', 'noon', 'afternoon', 'afternoon', 'evening']
    : ['morning', 'noon', 'afternoon', 'evening']
  if (input.pace === 'relaxed' && target === 3) slots.pop()
  while (slots.length < target) slots.push(input.pace === 'packed' ? 'evening' : 'afternoon')
  return slots.slice(0, target)
}

function isLunch(candidate: ScoredCandidate): boolean {
  return candidate.place.category === 'food' &&
    (candidate.place.mealType.length === 0 || candidate.place.mealType.includes('lunch'))
}

function rankForSlot(
  candidate: ScoredCandidate,
  slot: 'morning' | 'noon' | 'afternoon' | 'evening',
  previous: ScoredCandidate | null,
  input: TripInput,
  relaxBestTime = false,
): number {
  if (slot === 'noon' && !isLunch(candidate)) return Number.NEGATIVE_INFINITY
  if (slot !== 'noon' && candidate.place.category === 'food') return Number.NEGATIVE_INFINITY
  if (slot !== 'noon' && candidate.place.bestTime.length > 0 && !candidate.place.bestTime.includes(slot) && !relaxBestTime) {
    return Number.NEGATIVE_INFINITY
  }
  const distancePenalty = previous
    ? 0.15 * Math.min(estimateTravel(previous.place, candidate.place, input.transport).distanceKm / 5, 1)
    : 0
  const categoryPenalty = previous?.place.category === candidate.place.category ? 0.1 : 0
  return candidate.score - distancePenalty - categoryPenalty
}

function toTripItem(candidate: ScoredCandidate, slot: ScheduleRequest['slot'], position: number, startTime: string,
  durationMin: number, travelMinFromPrev: number, travelDistanceM: number, reason: string, seed: string | number, key: string): TripItem {
  return {
    id: stableUuid(seed, key), placeId: candidate.place.id, place: candidate.place, position, slot, startTime,
    durationMin, travelMinFromPrev, travelDistanceM, reason, note: null, isLocked: false, addedBy: 'fallback',
  }
}

function makeDraft(input: TripInput, days: TripDay[], now: Date, seed: string | number, clientDraftId?: string) {
  return {
    clientDraftId: clientDraftId ?? stableUuid(seed, 'draft'),
    title: `Lịch trình Huế ${input.startDate ?? vietnamDate(now)}`,
    startDate: input.startDate,
    numDays: input.numDays,
    input,
    generatedBy: 'fallback' as const,
    llmModel: null,
    start: input.start,
    days,
  }
}

function scheduleOptions(input: TripInput, effectiveStartDate: string, dayIndex: number): { input: TripInput; dayIndex: number } {
  return { input: { ...input, startDate: effectiveStartDate }, dayIndex }
}

type LunchPlan = { lunch: ScoredCandidate; morningAnchor: ScoredCandidate | null }

function lunchOptions(
  candidates: readonly ScoredCandidate[],
  input: TripInput,
  effectiveStartDate: string,
): Map<number, LunchPlan> {
  const lunches = candidates.filter(isLunch)
  const possibleByDay = new Map<number, LunchPlan[]>()
  for (let dayIndex = 1; dayIndex <= input.numDays; dayIndex++) {
    const possible: LunchPlan[] = []
    const options = scheduleOptions(input, effectiveStartDate, dayIndex)
    for (const lunch of lunches) {
      const direct = scheduleDay([{ candidate: lunch, slot: 'noon' }], options)
      if (direct.items.some((item) => item.slot === 'noon' && item.candidate.place.id === lunch.place.id)) {
        possible.push({ lunch, morningAnchor: null })
        continue
      }
      const morningAnchors = candidates.filter((candidate) => candidate.place.category !== 'food' &&
        candidate.place.id !== lunch.place.id &&
        (candidate.place.bestTime.length === 0 || candidate.place.bestTime.includes('morning')))
      for (const anchor of morningAnchors) {
        const paired = scheduleDay([{ candidate: anchor, slot: 'morning' }, { candidate: lunch, slot: 'noon' }], options)
        const ids = new Set(paired.items.map(({ candidate: item }) => item.place.id))
        if (ids.has(anchor.place.id) && ids.has(lunch.place.id) && paired.items.some((item) => item.slot === 'noon')) {
          possible.push({ lunch, morningAnchor: anchor })
        }
      }
    }
    possibleByDay.set(dayIndex, possible)
  }

  // Assign the most constrained dates first; reserve both the restaurant and any route anchor.
  const orderedDays = [...possibleByDay.keys()].sort((a, b) =>
    (possibleByDay.get(a)?.length ?? 0) - (possibleByDay.get(b)?.length ?? 0) || a - b)
  let bestAssignment = new Map<number, LunchPlan>()
  let searchNodes = 0
  const search = (index: number, usedIds: Set<string>, assigned: Map<number, LunchPlan>) => {
    if (++searchNodes > 100_000) return
    if (bestAssignment.size === orderedDays.length) return
    if (assigned.size > bestAssignment.size) bestAssignment = new Map(assigned)
    if (index >= orderedDays.length || assigned.size + orderedDays.length - index <= bestAssignment.size) return
    const dayIndex = orderedDays[index]
    for (const plan of possibleByDay.get(dayIndex) ?? []) {
      const ids = [plan.lunch.place.id, ...(plan.morningAnchor ? [plan.morningAnchor.place.id] : [])]
      if (ids.some((id) => usedIds.has(id))) continue
      for (const id of ids) usedIds.add(id)
      assigned.set(dayIndex, plan)
      search(index + 1, usedIds, assigned)
      assigned.delete(dayIndex)
      for (const id of ids) usedIds.delete(id)
    }
    search(index + 1, usedIds, assigned)
  }
  search(0, new Set(), new Map())
  return bestAssignment
}

function dayDiagnostics(
  selection: CandidateSelection,
  repo: PlacesRepo,
  input: TripInput,
  dayIndex: number,
  date: string,
  slots: readonly ('morning' | 'afternoon' | 'evening')[],
  usedBefore: ReadonlySet<string>,
  scheduled: ScheduleResult,
): DayCandidateDiagnostics {
  const weekday = isoWeekday(date)
  const excluded = {
    alreadyUsed: 0, closed: 0, outsideBestTime: 0, walkingIntensity: selection.walkingExcludedCount, tooFar: 0,
    schedulerRejected: scheduled.droppedPlaceIds.length,
    missingCoordinates: repo.getDataQuality?.().missingCoordinates ?? 0,
    missingVisitDuration: repo.getDataQuality?.().missingVisitDuration ?? 0,
  }
  for (const candidate of selection.diagnosticCandidates) {
    if (usedBefore.has(candidate.place.id)) { excluded.alreadyUsed++; continue }
    if (input.start && selection.effectiveRadiusKm !== null &&
      estimateTravel(input.start, candidate.place, input.transport).distanceKm > selection.effectiveRadiusKm) {
      excluded.tooFar++
      continue
    }
    if (weekday !== null && candidate.place.closedDays.includes(weekday)) { excluded.closed++; continue }
    if ((input.companion === 'seniors' || input.companion === 'family_kids') &&
      candidate.place.walkingIntensity === 3 && !selection.walkingRelaxed) continue
    if (candidate.place.bestTime.length > 0 && !slots.some((slot) => candidate.place.bestTime.includes(slot))) {
      excluded.outsideBestTime++
    }
  }
  return {
    dayIndex, date, available: selection.candidates.length, excluded,
    scheduled: scheduled.items.length, minimum: itemBounds(input)[0],
  }
}

function underfillReason(diagnostics: DayCandidateDiagnostics): string {
  const parts = [
    diagnostics.excluded.alreadyUsed > 0 ? `${diagnostics.excluded.alreadyUsed} điểm đã dùng` : '',
    diagnostics.excluded.closed > 0 ? `${diagnostics.excluded.closed} điểm nghỉ ngày này` : '',
    diagnostics.excluded.outsideBestTime > 0 ? `${diagnostics.excluded.outsideBestTime} điểm ngoài khung giờ gợi ý` : '',
    diagnostics.excluded.walkingIntensity > 0 ? `${diagnostics.excluded.walkingIntensity} điểm có cường độ đi bộ cao` : '',
    diagnostics.excluded.tooFar > 0 ? `${diagnostics.excluded.tooFar} điểm quá xa` : '',
    diagnostics.excluded.schedulerRejected > 0 ? `${diagnostics.excluded.schedulerRejected} điểm không xếp được theo giờ/di chuyển` : '',
  ].filter(Boolean)
  return parts.length ? parts.join(', ') : 'không còn ứng viên đủ giờ và khoảng cách'
}

/** Fully local fallback generator: its only external dependency is the injected read-only PlacesRepo. */
export async function generateTrip(repo: PlacesRepo, input: TripInput, options: GenerateTripOptions): Promise<GenerateTripResult> {
  if (options.signal?.aborted) throw new DOMException('Đã hủy yêu cầu.', 'AbortError')
  const selection = await loadCandidates(repo, input, options.signal)
  if (!selection.candidates.length) throw new NoCandidatesError()
  const bounds = itemBounds(input)
  const pool = buildCandidatePool(selection.candidates, input.numDays, bounds[1])
  const effectiveStartDate = startDate(input, options.now)
  const lunchByDay = lunchOptions(selection.candidates, input, effectiveStartDate)
  const allocatedLunchIds = new Set([...lunchByDay.values()].map(({ lunch }) => lunch.place.id))
  const allocatedAnchorIds = new Set([...lunchByDay.values()].flatMap(({ morningAnchor }) => morningAnchor ? [morningAnchor.place.id] : []))
  const usedIds = new Set<string>()
  const days: TripDay[] = []
  const notices: Notice[] = [
    { code: 'FALLBACK_USED', message: 'Lịch trình được tạo bằng thuật toán dự phòng.' },
    ...selection.notices.filter(({ code }) => code !== 'FEW_CANDIDATES'),
  ]
  const diagnostics: DayCandidateDiagnostics[] = []

  for (let dayIndex = 1; dayIndex <= input.numDays; dayIndex++) {
    if (options.signal?.aborted) throw new DOMException('Đã hủy yêu cầu.', 'AbortError')
    const date = dateAtOffset(effectiveStartDate, dayIndex - 1)
    const target = targetForDay(input, dayIndex, options.seed)
    const slots = slotsForTarget(input, target)
    const requests: ScheduleRequest[] = []
    const reservedIds = new Set([...usedIds, ...allocatedLunchIds, ...allocatedAnchorIds])
    const assignedLunch = lunchByDay.get(dayIndex)
    if (assignedLunch) {
      const alternatives = selection.candidates.filter((candidate) => isLunch(candidate) &&
        candidate.place.id !== assignedLunch.lunch.place.id && !allocatedLunchIds.has(candidate.place.id) && !usedIds.has(candidate.place.id))
      if (assignedLunch.morningAnchor) requests.push({ candidate: assignedLunch.morningAnchor, slot: 'morning' })
      requests.push({ candidate: assignedLunch.lunch, slot: 'noon', alternatives })
    }
    let scheduled = scheduleDay(requests, scheduleOptions(input, effectiveStartDate, dayIndex))
    const requiredLunch = lunchByDay.get(dayIndex)?.lunch.place.id
    const currentIds = () => new Set(scheduled.items.map(({ candidate }) => candidate.place.id))
    const minimum = bounds[0]
    const rejectedCandidates = new Set<string>()
    const orderedCandidates = [...new Map([...pool, ...selection.candidates].map((candidate) => [candidate.place.id, candidate])).values()]
    const addSlot = (slot: 'morning' | 'afternoon' | 'evening'): boolean => {
      const beforeIds = currentIds()
      const candidates = orderedCandidates.filter((candidate) => candidate.place.category !== 'food' &&
        !reservedIds.has(candidate.place.id) && !beforeIds.has(candidate.place.id))
      const strict = candidates.filter((candidate) => Number.isFinite(rankForSlot(candidate, slot, null, input)))
      const relaxed = candidates.filter((candidate) => Number.isFinite(rankForSlot(candidate, slot, null, input, true)) &&
        !strict.some((compatible) => compatible.place.id === candidate.place.id))
      const ranked = [...strict, ...relaxed].sort((a, b) => b.score - a.score || a.place.slug.localeCompare(b.place.slug, 'en'))
      for (const candidate of ranked) {
        const isRelaxed = relaxed.some(({ place }) => place.id === candidate.place.id)
        const alternatives = selection.candidates.filter((other) => other.place.category === candidate.place.category &&
          other.place.id !== candidate.place.id && !reservedIds.has(other.place.id) && !beforeIds.has(other.place.id) &&
          Number.isFinite(rankForSlot(other, slot, null, input, true)))
        const request: ScheduleRequest = { candidate, slot, alternatives }
        const result = scheduleDay([...requests, request], scheduleOptions(input, effectiveStartDate, dayIndex))
        const afterIds = new Set(result.items.map(({ candidate: itemCandidate }) => itemCandidate.place.id))
        const preservesExisting = [...beforeIds].every((id) => afterIds.has(id))
        const preservesLunch = !requiredLunch || afterIds.has(requiredLunch)
        const addsCandidate = result.items.some(({ candidate: itemCandidate }) => itemCandidate.place.id === candidate.place.id)
        if (result.items.length > scheduled.items.length && preservesExisting && preservesLunch && addsCandidate) {
          requests.push(request)
          for (const id of afterIds) reservedIds.add(id)
          scheduled = result
          if (isRelaxed) notices.push({ code: 'FILTER_RELAXED', message: `Ngày ${dayIndex}: đã nới khung giờ gợi ý để đủ địa điểm.` })
          return true
        }
        rejectedCandidates.add(candidate.place.id)
      }
      return false
    }

    for (const slot of slots.filter((candidateSlot): candidateSlot is 'morning' | 'afternoon' | 'evening' => candidateSlot !== 'noon')) {
      addSlot(slot)
    }
    while (scheduled.items.length < minimum && scheduled.items.length < bounds[1]) {
      let added = false
      for (const slot of ['morning', 'afternoon', 'evening'] as const) {
        if (addSlot(slot)) { added = true; break }
      }
      if (!added) break
    }

    const dayUsedBefore = new Set(usedIds)
    for (const item of scheduled.items) usedIds.add(item.candidate.place.id)
    const dayDiagnosticsResult = dayDiagnostics(selection, repo, input, dayIndex, date,
      slots.filter((slot): slot is 'morning' | 'afternoon' | 'evening' => slot !== 'noon'), dayUsedBefore, scheduled)
    dayDiagnosticsResult.excluded.schedulerRejected = Math.max(dayDiagnosticsResult.excluded.schedulerRejected, rejectedCandidates.size)
    if (options.explain) diagnostics.push(dayDiagnosticsResult)
    const hasLunch = scheduled.items.filter(({ slot, candidate }) => slot === 'noon' && isLunch(candidate)).length === 1
    if (!hasLunch) {
      notices.push({ code: 'LUNCH_MISSING', message: `Ngày ${dayIndex} (${date}) không còn quán ăn trưa chưa dùng có thể xếp đúng giờ mở cửa và khoảng cách.` })
    }
    if (scheduled.items.length < minimum) {
      notices.push({ code: 'FEW_CANDIDATES', message: `Ngày ${dayIndex} (${date}) có ${scheduled.items.length}/${minimum} địa điểm tối thiểu; ${underfillReason(dayDiagnosticsResult)}.` })
    }

    const items = scheduled.items.map((item, position) => toTripItem(
      item.candidate, item.slot, position, item.startTime, item.durationMin,
      item.travelMinFromPrev, item.travelDistanceM,
      buildReason(item.candidate, input, item.slot, dayIndex * 8 + position), options.seed,
      `day:${dayIndex}:item:${position}`,
    ))
    days.push({
      id: stableUuid(options.seed, `day:${dayIndex}`), dayIndex,
      date: input.startDate ? date : null, note: null, items,
    })
  }

  if (!days.some((day) => day.items.length > 0)) throw new NoCandidatesError()
  const draft = makeDraft(input, days, options.now, options.seed, options.clientDraftId)
  const warnings = computeWarnings({
    days, transport: input.transport, startDate: effectiveStartDate,
    pace: input.pace, companion: input.companion, start: input.start,
  })
  return { draft, warnings, notices, ...(options.explain ? { diagnostics } : {}) }
}

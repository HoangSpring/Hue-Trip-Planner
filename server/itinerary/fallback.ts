import type { Notice, TripDay, TripInput, TripItem, Warning } from '@shared/schemas'
import { ITINERARY_CONFIG } from '../../shared/itinerary/config'
import { estimateTravel } from '../../shared/itinerary/travel'
import { buildCandidatePool } from './pool'
import { loadCandidates } from './candidates'
import type { PlacesRepo } from './placesRepo'
import { buildReason } from './reasons'
import { scheduleDay, type ScheduleRequest } from './scheduler'
import type { ScoredCandidate } from './types'

export class NoCandidatesError extends Error {
  readonly code = 'NO_CANDIDATES'
  constructor() { super('Không có địa điểm phù hợp để tạo lịch trình.'); this.name = 'NoCandidatesError' }
}

export type GenerateTripResult = { draft: ReturnType<typeof makeDraft>; warnings: Warning[]; notices: Notice[] }
export type GenerateTripOptions = { now: Date; seed: string | number; signal?: AbortSignal }

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

function dayStartDate(input: TripInput, now: Date): string | null {
  return input.startDate ?? now.toISOString().slice(0, 10)
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
  const span = maximum - minimum + 1
  return minimum + (hash32(`${seed}:day:${dayIndex}`) % span)
}

function slotsForTarget(input: TripInput, target: number): Array<'morning' | 'noon' | 'afternoon' | 'evening'> {
  const slots: Array<'morning' | 'noon' | 'afternoon' | 'evening'> = input.pace === 'packed'
    ? ['morning', 'morning', 'noon', 'afternoon', 'afternoon', 'evening']
    : ['morning', 'noon', 'afternoon', 'evening']
  if (input.pace === 'relaxed' && target === 3) slots.pop()
  while (slots.length < target) slots.push(input.pace === 'packed' ? 'evening' : 'afternoon')
  return slots.slice(0, target)
}

function rankForSlot(
  candidate: ScoredCandidate,
  slot: 'morning' | 'noon' | 'afternoon' | 'evening',
  previous: ScoredCandidate | null,
  input: TripInput,
): number {
  const compatible = candidate.place.bestTime.length === 0 || candidate.place.bestTime.includes(slot)
  if (!compatible) return Number.NEGATIVE_INFINITY
  if (slot === 'noon' && (candidate.place.category !== 'food' ||
    (candidate.place.mealType.length > 0 && !candidate.place.mealType.includes('lunch')))) return Number.NEGATIVE_INFINITY
  if (slot !== 'noon' && candidate.place.category === 'food') return Number.NEGATIVE_INFINITY
  const distancePenalty = previous
    ? 0.15 * Math.min(estimateTravel(previous.place, candidate.place, input.transport).distanceKm / 5, 1)
    : 0
  const categoryPenalty = previous?.place.category === candidate.place.category ? 0.1 : 0
  return candidate.score - distancePenalty - categoryPenalty
}

function chooseCandidate(
  pool: readonly ScoredCandidate[],
  used: ReadonlySet<string>,
  slot: 'morning' | 'noon' | 'afternoon' | 'evening',
  previous: ScoredCandidate | null,
  input: TripInput,
): ScoredCandidate | null {
  const ranked = pool.map((candidate) => ({ candidate, score: rankForSlot(candidate, slot, previous, input) }))
    .filter(({ candidate, score }) => !used.has(candidate.place.id) && Number.isFinite(score))
    .sort((a, b) => b.score - a.score || a.candidate.place.slug.localeCompare(b.candidate.place.slug, 'en'))
  return ranked[0]?.candidate ?? null
}

function toTripItem(candidate: ScoredCandidate, slot: ScheduleRequest['slot'], position: number, startTime: string,
  durationMin: number, travelMinFromPrev: number, travelDistanceM: number, reason: string, seed: string | number, key: string): TripItem {
  return {
    id: stableUuid(seed, key), placeId: candidate.place.id, place: candidate.place, position, slot, startTime,
    durationMin, travelMinFromPrev, travelDistanceM, reason, note: null, isLocked: false, addedBy: 'fallback',
  }
}

function makeDraft(input: TripInput, days: TripDay[], now: Date, seed: string | number) {
  return {
    clientDraftId: stableUuid(seed, 'draft'),
    title: `Lịch trình Huế ${input.startDate ?? now.toISOString().slice(0, 10)}`,
    startDate: input.startDate,
    numDays: input.numDays,
    input,
    generatedBy: 'fallback' as const,
    llmModel: null,
    start: input.start,
    days,
  }
}

/** Fully local fallback generator: its only external dependency is the injected read-only PlacesRepo. */
export async function generateTrip(repo: PlacesRepo, input: TripInput, options: GenerateTripOptions): Promise<GenerateTripResult> {
  if (options.signal?.aborted) throw new DOMException('Đã hủy yêu cầu.', 'AbortError')
  const selection = await loadCandidates(repo, input, options.signal)
  if (!selection.candidates.length) throw new NoCandidatesError()
  const bounds = itemBounds(input)
  const pool = buildCandidatePool(selection.candidates, input.numDays, bounds[1])
  const usedIds = new Set<string>()
  const days: TripDay[] = []
  for (let dayIndex = 1; dayIndex <= input.numDays; dayIndex++) {
    if (options.signal?.aborted) throw new DOMException('Đã hủy yêu cầu.', 'AbortError')
    const target = targetForDay(input, dayIndex, options.seed)
    const slots = slotsForTarget(input, target)
    const requests: ScheduleRequest[] = []
    let previous: ScoredCandidate | null = null
    for (const slot of slots) {
      const preferred = chooseCandidate(pool, usedIds, slot, previous, input)
      if (!preferred) continue
      const alternatives = pool.filter((candidate) => !usedIds.has(candidate.place.id) &&
        candidate.place.category === preferred.place.category && candidate.place.id !== preferred.place.id &&
        Number.isFinite(rankForSlot(candidate, slot, previous, input)))
      requests.push({ candidate: preferred, slot, alternatives })
      usedIds.add(preferred.place.id)
      previous = preferred
    }
    // The scheduler may replace an item; reserve only the places it actually uses globally.
    for (const request of requests) usedIds.delete(request.candidate.place.id)
    const scheduled = scheduleDay(requests, { input: { ...input, startDate: dayStartDate(input, options.now) }, dayIndex })
    const items = scheduled.items.map((item, position) => {
      usedIds.add(item.candidate.place.id)
      return toTripItem(item.candidate, item.slot, position, item.startTime, item.durationMin,
        item.travelMinFromPrev, item.travelDistanceM, buildReason(item.candidate, input, item.slot), options.seed,
        `day:${dayIndex}:item:${position}`)
    })
    const id = stableUuid(options.seed, `day:${dayIndex}`)
    days.push({ id, dayIndex, date: input.startDate ? dayStartDate(input, options.now) : null, note: null, items })
  }

  const notices: Notice[] = [
    { code: 'FALLBACK_USED', message: 'Lịch trình được tạo bằng thuật toán dự phòng.' },
    ...selection.notices,
  ]
  return { draft: makeDraft(input, days, options.now, options.seed), warnings: [], notices }
}

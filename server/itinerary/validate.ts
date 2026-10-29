import type { TripInput } from '@shared/schemas'
import { llmItinerarySchema, type LlmItinerary } from '@shared/schemas/llmItinerary'
import { estimateTravel } from '../../shared/itinerary/travel'
import { ITINERARY_CONFIG } from '../../shared/itinerary/config'
import { scheduleDay, type ScheduleRequest } from './scheduler'
import { buildReason } from './reasons'
import type { ScoredCandidate } from './types'

export type ValidatedLlmItem = LlmItinerary['days'][number]['items'][number] & { candidate: ScoredCandidate }
export type ValidatedLlmDay = { dayIndex: number; items: ValidatedLlmItem[] }
export type LlmValidationResult = {
  accepted: boolean
  days: ValidatedLlmDay[]
  coverage: number
  repairs: number
  issues: string[]
  reason: 'invalid_json' | 'low_coverage' | null
}

export type LlmValidationOptions = {
  input: TripInput
  candidates: readonly ScoredCandidate[]
  now?: () => number
  startedAt?: number
  repair?: () => Promise<unknown>
}

function targetRange(input: TripInput): [number, number] {
  const [baseMin, baseMax] = ITINERARY_CONFIG.itemsPerDay[input.pace]
  const reduction = input.companion === 'seniors' || input.companion === 'family_kids' ? 1 : 0
  return [Math.max(ITINERARY_CONFIG.itemsPerDay.floor, baseMin - reduction),
    Math.max(ITINERARY_CONFIG.itemsPerDay.floor, baseMax - reduction)]
}

function isLunch(candidate: ScoredCandidate): boolean {
  return candidate.place.category === 'food' &&
    (candidate.place.mealType.length === 0 || candidate.place.mealType.includes('lunch'))
}

function plainVietnameseReason(reason: string): boolean {
  return reason.length > 0 && reason.length <= 240 &&
    !/(https?:\/\/|www\.|<[^>]*>|[#>*_~`]|\[[^\]]+\]\(|[\r\n])/i.test(reason) &&
    /[À-ỹ]/u.test(reason)
}

function nearestOrder(items: ValidatedLlmItem[], previous: ScoredCandidate | null, transport: TripInput['transport']): ValidatedLlmItem[] {
  const remaining = [...items]
  const ordered: ValidatedLlmItem[] = []
  let from = previous
  while (remaining.length) {
    remaining.sort((a, b) => {
      const distanceA = from ? estimateTravel(from.place, a.candidate.place, transport).distanceKm : 0
      const distanceB = from ? estimateTravel(from.place, b.candidate.place, transport).distanceKm : 0
      return distanceA - distanceB || b.candidate.score - a.candidate.score || a.candidate.place.slug.localeCompare(b.candidate.place.slug, 'en')
    })
    const next = remaining.shift()
    if (!next) break
    ordered.push(next)
    from = next.candidate
  }
  return ordered
}

/** Validates, repairs, fills and schedules model-selected candidate IDs. Never returns an unsubmitted ID. */
export async function validateLlmItinerary(raw: unknown, options: LlmValidationOptions): Promise<LlmValidationResult> {
  let parsed = llmItinerarySchema.safeParse(raw)
  let repairs = 0
  const now = options.now ?? Date.now
  const startedAt = options.startedAt ?? now()
  if (!parsed.success && options.repair && now() - startedAt < ITINERARY_CONFIG.llm.repairIfElapsedUnderMs) {
    repairs = 1
    parsed = llmItinerarySchema.safeParse(await options.repair())
  }
  if (!parsed.success) return { accepted: false, days: [], coverage: 0, repairs, issues: ['invalid_schema'], reason: 'invalid_json' }

  const candidateById = new Map(options.candidates.map((candidate) => [candidate.place.id, candidate]))
  const responseDays = new Map(parsed.data.days.map((day) => [day.dayIndex, day]))
  const [minimum, maximum] = targetRange(options.input)
  const output: ValidatedLlmDay[] = []
  const issues: string[] = []
  const usedIds = new Set<string>()
  let targetItems = 0
  let previousGlobal: ScoredCandidate | null = null

  for (let dayIndex = 1; dayIndex <= options.input.numDays; dayIndex++) {
    const sourceDay = responseDays.get(dayIndex)
    const items: ValidatedLlmItem[] = []
    if (!sourceDay) issues.push(`missing_day:${dayIndex}`)
    for (const proposed of sourceDay?.items ?? []) {
      const candidate = candidateById.get(proposed.placeId)
      if (!candidate) { issues.push(`unknown_id:${proposed.placeId}`); continue }
      if (usedIds.has(proposed.placeId)) { issues.push(`duplicate_id:${proposed.placeId}`); continue }
      let slot = proposed.slot
      if (slot === 'noon' && !isLunch(candidate)) {
        const fallbackSlot = candidate.place.bestTime.find((value) => value !== 'noon') ?? 'morning'
        slot = fallbackSlot
        issues.push(`noon_non_food:${proposed.placeId}`)
      }
      if (slot === 'noon' && !isLunch(candidate)) continue
      const reason = plainVietnameseReason(proposed.reason)
        ? proposed.reason.slice(0, 240)
        : buildReason(candidate, options.input, slot, dayIndex + items.length)
      if (reason !== proposed.reason) issues.push(`reason_replaced:${proposed.placeId}`)
      items.push({ ...proposed, slot, reason, candidate })
      usedIds.add(proposed.placeId)
    }

    // V6: reserve exactly one eligible lunch before filling any other gaps.
    const lunches = items.filter(({ slot, candidate }) => slot === 'noon' && isLunch(candidate))
    const lunchCandidates = options.candidates.filter((candidate) => isLunch(candidate) && !usedIds.has(candidate.place.id))
    if (lunches.length > 1) {
      for (const excess of lunches.slice(1)) { items.splice(items.indexOf(excess), 1); usedIds.delete(excess.placeId) }
      issues.push(`multiple_lunches:${dayIndex}`)
    }
    if (lunches.length === 0) {
      const existingFood = items.find(({ candidate }) => candidate.place.category === 'food')
      if (existingFood) {
        existingFood.slot = 'noon'
        issues.push(`lunch_moved:${dayIndex}`)
      } else if (lunchCandidates[0]) {
        const candidate = lunchCandidates[0]
        items.push({ placeId: candidate.place.id, slot: 'noon', reason: buildReason(candidate, options.input, 'noon', dayIndex), candidate })
        usedIds.add(candidate.place.id)
        issues.push(`lunch_added:${dayIndex}`)
      }
    }

    // V5: trim excess non-lunch items by score, then fill shortages from submitted candidates.
    const nonLunch = items.filter(({ slot }) => slot !== 'noon')
    if (items.length > maximum) {
      const removable = [...nonLunch].sort((a, b) => a.candidate.score - b.candidate.score || b.candidate.place.slug.localeCompare(a.candidate.place.slug, 'en'))
      while (items.length > maximum && removable.length) {
        const remove = removable.shift()
        if (remove) { items.splice(items.indexOf(remove), 1); usedIds.delete(remove.placeId); issues.push(`trimmed:${dayIndex}`) }
      }
    }
    const rankedFill = [...options.candidates].sort((a, b) => b.score - a.score || a.place.slug.localeCompare(b.place.slug, 'en'))
    while (items.length < minimum) {
      const candidate = rankedFill.find((value) => !usedIds.has(value.place.id) && value.place.category !== 'food')
      if (!candidate) break
      const slot = candidate.place.bestTime.find((value) => value !== 'noon') ?? 'morning'
      items.push({ placeId: candidate.place.id, slot, reason: buildReason(candidate, options.input, slot, dayIndex + items.length), candidate })
      usedIds.add(candidate.place.id)
      issues.push(`filled:${dayIndex}`)
    }
    const lunchCount = items.filter(({ slot, candidate }) => slot === 'noon' && isLunch(candidate)).length
    if (lunchCount !== 1) issues.push(`lunch_missing:${dayIndex}`)

    // V7: noon contains food only. Any repaired non-food noon item was moved above.
    const slotOrder = ['morning', 'noon', 'afternoon', 'evening']
    items.sort((a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot))
    const requests: ScheduleRequest[] = items.map((item) => ({ candidate: item.candidate, slot: item.slot }))
    const scheduled = scheduleDay(requests, { input: options.input, dayIndex })
    if (!sourceDay) issues.push(`day_filled_from_fallback:${dayIndex}`)
    if (scheduled.droppedPlaceIds.length > 0 || scheduled.items.length !== items.length) issues.push(`unschedulable:${dayIndex}`)
    const totalTravel = scheduled.items.reduce((sum, item) => sum + item.travelMinFromPrev, 0)
    if (totalTravel > ITINERARY_CONFIG.maxDayTravelMin) issues.push(`travel_limit:${dayIndex}`)
    if (scheduled.items.length !== items.length || totalTravel > ITINERARY_CONFIG.maxDayTravelMin || lunchCount !== 1) {
      output.push({ dayIndex, items: [] })
      previousGlobal = null
      targetItems += minimum
      continue
    }

    // V10: optimize order within each slot by nearest-neighbour while preserving slot order.
    const scheduledById = new Map(scheduled.items.map((item) => [item.candidate.place.id, item]))
    const sorted: ValidatedLlmItem[] = []
    let previous = previousGlobal
    for (const slot of slotOrder) {
      const group = items.filter((item) => item.slot === slot)
      for (const item of nearestOrder(group, previous, options.input.transport)) {
        sorted.push(item)
        previous = item.candidate
      }
    }
    // V9 uses the scheduler as the authoritative opening-hours / closed-day check.
    if (sorted.some(({ placeId }) => !scheduledById.has(placeId))) issues.push(`schedule_mismatch:${dayIndex}`)
    previousGlobal = sorted.at(-1)?.candidate ?? previousGlobal
    output.push({ dayIndex, items: sorted })
    targetItems += Math.max(minimum, Math.min(maximum, sourceDay?.items.length ?? minimum))
  }

  const kept = output.reduce((total, day) => total + day.items.length, 0)
  const coverage = targetItems ? Math.min(1, kept / targetItems) : 0
  const hasEmptyDay = output.some((day) => day.items.length === 0)
  const accepted = coverage >= ITINERARY_CONFIG.llm.minCoverage && !hasEmptyDay
  return {
    accepted,
    days: output,
    coverage,
    repairs,
    issues,
    reason: accepted ? null : 'low_coverage',
  }
}

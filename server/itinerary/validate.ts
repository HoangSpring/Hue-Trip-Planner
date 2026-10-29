import type { TripInput } from '@shared/schemas'
import { llmItinerarySchema, type LlmItinerary } from '@shared/schemas/llmItinerary'
import { estimateTravel } from '../../shared/itinerary/travel'
import { ITINERARY_CONFIG } from '../../shared/itinerary/config'
import { scheduleDay } from './scheduler'
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
  replacedDayIndexes: number[]
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
  if (!parsed.success) return { accepted: false, days: [], coverage: 0, repairs, issues: ['invalid_schema'], replacedDayIndexes: [], reason: 'invalid_json' }

  const candidateById = new Map(options.candidates.map((candidate) => [candidate.place.id, candidate]))
  const responseDays = new Map(parsed.data.days.map((day) => [day.dayIndex, day]))
  const [minimum, maximum] = targetRange(options.input)
  const output: ValidatedLlmDay[] = []
  const issues: string[] = []
  const replacedDayIndexes: number[] = []
  const usedIds = new Set<string>()
  let targetItems = 0
  let previousGlobal: ScoredCandidate | null = null

  for (let dayIndex = 1; dayIndex <= options.input.numDays; dayIndex++) {
    const sourceDay = responseDays.get(dayIndex)
    const items: ValidatedLlmItem[] = []
    if (!sourceDay) issues.push(`missing_day:${dayIndex}`)
    for (const proposed of sourceDay?.items ?? []) {
      const candidate = candidateById.get(proposed.placeId)
      if (!candidate) { issues.push(`unknown_id:${dayIndex}:${proposed.placeId}`); continue }
      if (usedIds.has(proposed.placeId)) { issues.push(`duplicate_id:${dayIndex}:${proposed.placeId}`); continue }
      let slot = proposed.slot
      if (slot === 'noon' && !isLunch(candidate)) {
        const fallbackSlot = candidate.place.bestTime.find((value) => value !== 'noon') ?? 'morning'
        slot = fallbackSlot
        issues.push(`noon_non_food:${dayIndex}:${proposed.placeId}`)
      }
      if (slot === 'noon' && !isLunch(candidate)) continue
      const reason = plainVietnameseReason(proposed.reason)
        ? proposed.reason.slice(0, 240)
        : buildReason(candidate, options.input, slot, dayIndex + items.length)
      if (reason !== proposed.reason) issues.push(`reason_replaced:${dayIndex}:${proposed.placeId}`)
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
      const existingFood = items.find(({ candidate }) => isLunch(candidate))
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
    for (const item of items) {
      if (item.candidate.place.bestTime.length && !item.candidate.place.bestTime.includes(item.slot)) {
        issues.push(`best_time_relaxed:${dayIndex}:${item.placeId}`)
      }
    }

    // V7: noon contains food only. Any repaired non-food noon item was moved above.
    const slotOrder = ['morning', 'noon', 'afternoon', 'evening']
    const scheduleCurrentDay = () => {
      items.sort((a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot))
      return scheduleDay(items.map((item) => ({ candidate: item.candidate, slot: item.slot, locked: item.slot === 'noon' })),
        { input: options.input, dayIndex })
    }
    let scheduled = scheduleCurrentDay()
    // V9/V10: repair only this day. Drop an unschedulable/farthest non-lunch stop,
    // then fill from the submitted pool by score; never expand beyond sent IDs.
    for (let attempt = 0; attempt < options.candidates.length && attempt < maximum + 3; attempt++) {
      let removed = false
      const droppedId = scheduled.droppedPlaceIds[0]
      if (droppedId) {
        const index = items.findIndex(({ placeId }) => placeId === droppedId)
        if (index >= 0) {
          if (items[index]?.slot === 'noon') issues.push(`lunch_schedule_rejected:${dayIndex}`)
          items.splice(index, 1)
          usedIds.delete(droppedId)
          issues.push(`unschedulable_item:${dayIndex}:${droppedId}`)
          removed = true
        }
      }
      const currentTravel = scheduled.items.reduce((sum, item) => sum + item.travelMinFromPrev, 0)
      if (!removed && currentTravel > ITINERARY_CONFIG.maxDayTravelMin) {
        const removable = scheduled.items.filter(({ slot }) => slot !== 'noon')
          .sort((a, b) => b.travelDistanceM - a.travelDistanceM || a.candidate.score - b.candidate.score)[0]
        if (removable) {
          items.splice(items.findIndex(({ placeId }) => placeId === removable.candidate.place.id), 1)
          usedIds.delete(removable.candidate.place.id)
          issues.push(`travel_limit_item:${dayIndex}:${removable.candidate.place.id}`)
          removed = true
        }
      }
      if (removed) scheduled = scheduleCurrentDay()
      if (scheduled.items.length === items.length &&
        scheduled.items.reduce((sum, item) => sum + item.travelMinFromPrev, 0) <= ITINERARY_CONFIG.maxDayTravelMin &&
        items.length >= minimum && items.filter(({ slot, candidate }) => slot === 'noon' && isLunch(candidate)).length === 1) break

      if (items.length < minimum) {
        const hasLunchNow = items.some(({ slot, candidate }) => slot === 'noon' && isLunch(candidate))
        const fill = [...options.candidates].sort((a, b) => b.score - a.score || a.place.slug.localeCompare(b.place.slug, 'en'))
          .find((candidate) => !usedIds.has(candidate.place.id) && !items.some(({ placeId }) => placeId === candidate.place.id) &&
            (hasLunchNow ? candidate.place.category !== 'food' : isLunch(candidate)))
        if (fill) {
          const slot = isLunch(fill) ? 'noon' : fill.place.bestTime.find((value) => value !== 'noon') ?? 'morning'
          items.push({ placeId: fill.place.id, slot, reason: buildReason(fill, options.input, slot, dayIndex + items.length), candidate: fill })
          usedIds.add(fill.place.id)
          issues.push(`filled:${dayIndex}`)
          scheduled = scheduleCurrentDay()
          continue
        }
      }
      if (!removed) break
    }
    if (!sourceDay) {
      issues.push(`missing_day_replaced:${dayIndex}`)
      replacedDayIndexes.push(dayIndex)
    }
    if (scheduled.droppedPlaceIds.length > 0 || scheduled.items.length !== items.length) issues.push(`unschedulable:${dayIndex}`)
    const totalTravel = scheduled.items.reduce((sum, item) => sum + item.travelMinFromPrev, 0)
    const lunchCountAfterRepairs = items.filter(({ slot, candidate }) => slot === 'noon' && isLunch(candidate)).length
    if (totalTravel > ITINERARY_CONFIG.maxDayTravelMin) issues.push(`travel_limit:${dayIndex}`)
    if (scheduled.items.length !== items.length || scheduled.droppedPlaceIds.length > 0 || totalTravel > ITINERARY_CONFIG.maxDayTravelMin ||
      lunchCountAfterRepairs !== 1 || items.length < minimum) {
      output.push({ dayIndex, items: [] })
      replacedDayIndexes.push(dayIndex)
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
  const unrepairable = new Set(replacedDayIndexes).size
  // Day-scoped fallback is itself a repair. Do not classify a single bad day
  // as low LLM coverage when healthy neighboring days can be retained.
  const coverage = targetItems ? Math.min(1, (kept + unrepairable * minimum) / targetItems) : 0
  const accepted = coverage >= ITINERARY_CONFIG.llm.minCoverage &&
    unrepairable < Math.ceil(options.input.numDays / 2)
  const repairOperations = issues.filter((issue) => /^(?:filled|trimmed|lunch_added|lunch_moved|unschedulable_item|travel_limit_item|reason_replaced|unknown_id|duplicate_id|noon_non_food):/.test(issue)).length
  return {
    accepted,
    days: output,
    coverage,
    repairs: Math.max(repairs, repairOperations + unrepairable),
    issues,
    replacedDayIndexes,
    reason: accepted ? null : 'low_coverage',
  }
}

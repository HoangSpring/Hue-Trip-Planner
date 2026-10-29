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
import type { LlmClient } from '../llm/client'
import { buildCandidatePool } from './pool'
import { buildUserMessage, serializeUserMessage, SYSTEM_PROMPT } from './prompt'
import { llmItinerarySchema } from '@shared/schemas/llmItinerary'
import { validateLlmItinerary } from './validate'
import type { LlmAttempt } from './pipeline'
import { GeminiApiError } from '../llm/providers/gemini'
import { PROMPT_VERSION } from './prompt'

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
  options: {
    now: Date; seed?: string; signal?: AbortSignal
    llm?: {
      client: LlmClient; enabled: boolean; dailyCallCount: number; dailyCallCap: number; timeoutMs: number
      totalTimeoutMs?: number
      onAttempt?: (attempt: LlmAttempt) => Promise<void>
      onMetrics?: (metrics: { promptVersion: string; poolSize: number; repairs: number; coverage: number | null; fallbackReason: string | null; llmCalls: number; model: string | null; inputTokens: number; outputTokens: number; thinkingTokens: number }) => void
    }
  }
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
  const llmReasons = new Map<string, string>()
  let generatedBy: 'llm' | 'fallback' = 'fallback'
  let llmModel: string | null = null
  let fallbackReason: 'llm_disabled' | 'cap_reached' | 'timeout' | 'invalid_json' | 'low_coverage' | 'llm_error' | 'quota' | null = null
  let llmCalls = 0
  let repairs = 0
  let coverage: number | null = null
  let inputTokens = 0
  let outputTokens = 0
  let thinkingTokens = 0

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

  if (!options.llm?.enabled) fallbackReason = 'llm_disabled'
  else if (options.llm.dailyCallCount >= options.llm.dailyCallCap) fallbackReason = 'cap_reached'
  else if (options.llm.enabled && availablePool.length === 0) fallbackReason = 'low_coverage'
  if (options.llm?.enabled && options.llm.dailyCallCount < options.llm.dailyCallCap && availablePool.length > 0) {
    const lockedCandidates: ScoredCandidate[] = lockedHydrated.map(({ record }) => ({
      place: record.place, tagWeights: record.tagWeights, featured: record.featured, score: 1,
    }))
    const available = buildCandidatePool(availablePool, 1, targetCount)
    const llmCandidates = [...available, ...lockedCandidates]
    const dayInput = { ...input, numDays: 1, startDate: effectiveDate }
    const message = {
      ...buildUserMessage(dayInput, llmCandidates),
      locked: lockedHydrated.map(({ record, slot }) => ({ placeId: record.place.id, slot })),
    }
    const started = Date.now()
    let model: string | null = null
    const complete = async (user: string) => {
      const attemptStart = Date.now()
      const remainingMs = (options.llm?.totalTimeoutMs ?? 15_000) - (Date.now() - started)
      if (remainingMs <= 0) throw new DOMException('Pipeline timeout', 'TimeoutError')
      llmCalls++
      const controller = new AbortController()
      const abortParent = () => controller.abort(options.signal?.reason)
      if (options.signal?.aborted) abortParent()
      else options.signal?.addEventListener('abort', abortParent, { once: true })
      const timer = setTimeout(() => controller.abort(new DOMException('LLM timeout', 'TimeoutError')),
        Math.min(options.llm?.timeoutMs ?? 12_000, remainingMs))
      let error: unknown = null
      let result: Awaited<ReturnType<LlmClient['completeJson']>> | null = null
      try {
        result = await options.llm!.client.completeJson({
          system: `${SYSTEM_PROMPT} Locked items in the JSON locked block must remain at their exact slots.`,
          user, schema: llmItinerarySchema, maxOutputTokens: ITINERARY_CONFIG.llm.maxOutputTokens, signal: controller.signal,
        })
        model = result.model
        inputTokens += result.usage.inputTokens
        outputTokens += result.usage.outputTokens
        thinkingTokens += result.usage.thinkingTokens
        return result
      } catch (caught) {
        error = caught
        throw caught
      } finally {
        clearTimeout(timer)
        options.signal?.removeEventListener('abort', abortParent)
        await options.llm?.onAttempt?.({
          result: error ? 'error' : 'success', model: result?.model ?? null,
          inputTokens: result?.usage.inputTokens ?? 0, outputTokens: result?.usage.outputTokens ?? 0,
          thinkingTokens: result?.usage.thinkingTokens ?? 0, durationMs: Date.now() - attemptStart,
          errorCode: error instanceof Error ? error.name : null,
        })
      }
    }
    try {
      let first: Awaited<ReturnType<LlmClient['completeJson']>>
      try {
        first = await complete(serializeUserMessage(message))
      } catch (error) {
        if (!(error instanceof GeminiApiError && error.kind === 'bad_json' &&
          Date.now() - started < ITINERARY_CONFIG.llm.repairIfElapsedUnderMs &&
          options.llm.dailyCallCount + llmCalls < options.llm.dailyCallCap)) throw error
        repairs = 1
        first = await complete(JSON.stringify({
          task: 'The previous response was not valid JSON. Generate the requested itinerary again as strict JSON only.',
          originalRequest: message,
        }))
      }
      const validated = await validateLlmItinerary(first.json, {
        input: dayInput,
        candidates: llmCandidates,
        startedAt: started,
        now: Date.now,
        repair: repairs > 0 ? undefined : async () => (await complete(JSON.stringify({
          task: 'Repair the previous output as strict itinerary JSON. Keep locked item ids and slots.',
          request: message,
          previousOutput: first.json,
        }))).json,
      })
      repairs = Math.max(repairs, validated.repairs)
      coverage = validated.coverage
      if (!validated.accepted) fallbackReason = validated.reason ?? 'low_coverage'
      if (validated.accepted) {
        const lockedIds = new Set(lockedCandidates.map(({ place }) => place.id))
        const acceptedItems = validated.days[0]?.items.filter(({ placeId }) => !lockedIds.has(placeId)) ?? []
        const maximumAdditional = Math.max(0, targetCount - lockedHydrated.length)
        const trimmed = acceptedItems.filter(({ slot }) => slot === 'noon').concat(
          acceptedItems.filter(({ slot }) => slot !== 'noon')
            .sort((a, b) => b.candidate.score - a.candidate.score)
            .slice(0, Math.max(0, maximumAdditional - acceptedItems.filter(({ slot }) => slot === 'noon').length)),
        )
        const hasLunch = hasNoonFood || trimmed.some(({ slot, candidate }) => slot === 'noon' && candidate.place.category === 'food')
        const minCount = Math.max(ITINERARY_CONFIG.itemsPerDay.floor,
          ITINERARY_CONFIG.itemsPerDay[input.pace][0] - (input.companion === 'seniors' || input.companion === 'family_kids' ? 1 : 0))
        if (trimmed.length + lockedHydrated.length >= minCount && hasLunch) {
          selectedAdditional.splice(0, selectedAdditional.length, ...trimmed.map((item) => ({ candidate: item.candidate, slot: item.slot })))
          trimmed.forEach((item) => llmReasons.set(item.placeId, item.reason))
          generatedBy = 'llm'
          llmModel = model
          fallbackReason = null
          notices.splice(0, notices.length, ...selection.notices)
        }
      }
    } catch (error) {
      // Fail closed to the deterministic fallback; no provider response/error body is logged.
      fallbackReason = error instanceof GeminiApiError && (error.kind === 'quota' || error.kind === 'quota_zero')
        ? 'quota' : error instanceof GeminiApiError && error.kind === 'timeout' ||
          error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')
          ? 'timeout' : 'llm_error'
    }
  }
  if (fallbackReason === 'llm_disabled' && !notices.some(({ code }) => code === 'LLM_DISABLED')) {
    notices.push({ code: 'LLM_DISABLED', message: 'AI đang tắt; ngày được tạo bằng phương án dự phòng.' })
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
    const reason = llmReasons.get(entry.candidate.place.id) ?? buildReason(entry.candidate, input, entry.slot)

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
      addedBy: isLocked ? 'user' : generatedBy === 'llm' ? 'ai' : 'fallback',
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

  options.llm?.onMetrics?.({
    promptVersion: PROMPT_VERSION, poolSize: availablePool.length, repairs, coverage, fallbackReason,
    llmCalls, model: llmModel, inputTokens, outputTokens, thinkingTokens,
  })

  return {
    day,
    warnings,
    notices,
    generation: {
      by: generatedBy,
      model: llmModel,
      durationMs,
    },
  }
}

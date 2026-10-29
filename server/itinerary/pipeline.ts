import type { Notice, TripDay, TripDraft, TripInput, TripItem, Warning } from '@shared/schemas'
import { dateAtOffset, vietnamDate } from '../../shared/itinerary/calendar'
import { ITINERARY_CONFIG } from '../../shared/itinerary/config'
import { computeWarnings } from '../../shared/itinerary/warnings'
import { llmItinerarySchema } from '../../shared/schemas/llmItinerary'
import type { LlmClient, LlmCompletion } from '../llm/client'
import { GeminiApiError } from '../llm/providers/gemini'
import { buildCandidatePool } from './pool'
import { loadCandidates } from './candidates'
import { FixturePlacesRepo, type PlacesRepo } from './placesRepo'
import { buildUserMessage, PROMPT_VERSION, serializeUserMessage, SYSTEM_PROMPT } from './prompt'
import { generateTrip, type GenerateTripOptions, type GenerateTripResult } from './fallback'
import { scheduleDay, type ScheduleRequest } from './scheduler'
import { validateLlmItinerary } from './validate'
import type { ScoredCandidate } from './types'

export type FallbackReason = 'llm_disabled' | 'cap_reached' | 'timeout' | 'invalid_json' | 'low_coverage' | 'llm_error' | 'quota'
export type LlmAttempt = {
  result: 'success' | 'error'
  model: string | null
  inputTokens: number
  outputTokens: number
  thinkingTokens: number
  durationMs: number
  errorCode: string | null
}
export type PipelineMetrics = {
  promptVersion: string
  poolSize: number
  repairs: number
  coverage: number | null
  fallbackReason: FallbackReason | null
  llmCalls: number
  model: string | null
  inputTokens: number
  outputTokens: number
  thinkingTokens: number
  replacedDayIndexes: number[]
  validationIssues: string[]
}
export type PipelineResult = Omit<GenerateTripResult, 'draft'> & { draft: TripDraft } & {
  generation: { by: 'llm' | 'fallback'; model: string | null; durationMs: number; repairs: number; replacedDayIndexes: number[] }
  metrics: PipelineMetrics
}

export type GenerateTripPipelineOptions = GenerateTripOptions & {
  llm: LlmClient
  enabled: boolean
  dailyCallCount: number
  dailyCallCap: number
  timeoutMs: number
  totalTimeoutMs?: number
  allowRepair?: boolean
  onAttempt?: (attempt: LlmAttempt) => Promise<void>
  onMetrics?: (metrics: PipelineMetrics) => void
}

function maxItemsPerDay(input: TripInput): number {
  const maximum = ITINERARY_CONFIG.itemsPerDay[input.pace][1]
  return Math.max(ITINERARY_CONFIG.itemsPerDay.floor,
    maximum - (input.companion === 'seniors' || input.companion === 'family_kids' ? 1 : 0))
}

function stableUuid(seed: string | number, key: string): string {
  let hash = 2166136261
  const value = `${seed}:${key}`
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619)
  const hex = (hash >>> 0).toString(16).padStart(8, '0')
  return `${hex}-0000-4000-8000-${hex.padEnd(12, '0')}`
}

function reasonForError(error: unknown): FallbackReason {
  if (error instanceof GeminiApiError) {
    if (error.kind === 'timeout') return 'timeout'
    if (error.kind === 'quota' || error.kind === 'quota_zero') return 'quota'
    if (error.kind === 'bad_json') return 'invalid_json'
  }
  if (error instanceof DOMException && (error.name === 'TimeoutError' || error.name === 'AbortError')) return 'timeout'
  return 'llm_error'
}

function fallbackNotice(code: 'FALLBACK_USED' | 'LLM_DISABLED', message: string): Notice {
  return { code, message }
}

function telemetryLog(metrics: PipelineMetrics): void {
  // Telemetry intentionally excludes user notes, prompts, candidate names, and model output.
  console.info(JSON.stringify({ event: 'itinerary_generation', ...metrics }))
}

function withCallTimeout(parent: AbortSignal | undefined, timeoutMs: number): { signal: AbortSignal; timedOut: () => boolean; cleanup: () => void } {
  const controller = new AbortController()
  let timedOut = false
  const onAbort = () => controller.abort(parent?.reason)
  if (parent?.aborted) onAbort()
  else parent?.addEventListener('abort', onAbort, { once: true })
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort(new DOMException('LLM request timed out', 'TimeoutError'))
  }, Math.max(1, timeoutMs))
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    cleanup: () => { clearTimeout(timer); parent?.removeEventListener('abort', onAbort) },
  }
}

function metricsLog(options: GenerateTripPipelineOptions, metrics: PipelineMetrics): void {
  options.onMetrics?.(metrics)
  if (!options.onMetrics) telemetryLog(metrics)
}

export async function generateTripPipeline(
  repo: PlacesRepo,
  input: TripInput,
  options: GenerateTripPipelineOptions,
): Promise<PipelineResult> {
  const startedAt = Date.now()
  const totalDeadline = startedAt + (options.totalTimeoutMs ?? 15_000)
  const metrics: PipelineMetrics = {
    promptVersion: PROMPT_VERSION, poolSize: 0, repairs: 0, coverage: null,
    fallbackReason: null, llmCalls: 0, model: null, inputTokens: 0, outputTokens: 0, thinkingTokens: 0,
    replacedDayIndexes: [],
    validationIssues: [],
  }
  const candidateSelection = await loadCandidates(repo, input, options.signal)
  const candidates = buildCandidatePool(candidateSelection.candidates, input.numDays, maxItemsPerDay(input))
  metrics.poolSize = candidates.length

  const fallback = async (reason: FallbackReason): Promise<PipelineResult> => {
    metrics.fallbackReason = reason
    metricsLog(options, metrics)
    const aborted = options.signal?.aborted === true
    const result = await generateTrip(repo, input, {
      ...options,
      signal: aborted ? undefined : options.signal,
    })
    const notices = [...result.notices]
    if (reason === 'llm_disabled') notices.push(fallbackNotice('LLM_DISABLED', 'AI đang tắt; lịch trình được tạo bằng phương án dự phòng.'))
    if (!notices.some(({ code }) => code === 'FALLBACK_USED')) {
      notices.unshift(fallbackNotice('FALLBACK_USED', 'Lịch trình được tạo bằng thuật toán dự phòng.'))
    }
    return {
      ...result,
      notices,
      draft: { ...result.draft, generatedBy: 'fallback', llmModel: null },
      generation: { by: 'fallback', model: null, durationMs: Date.now() - startedAt, repairs: metrics.repairs, replacedDayIndexes: [] },
      metrics: { ...metrics },
    }
  }

  if (options.signal?.aborted) return fallback('timeout')
  if (!options.enabled) return fallback('llm_disabled')
  if (options.dailyCallCount >= options.dailyCallCap) return fallback('cap_reached')
  if (candidates.length === 0) return fallback('low_coverage')

  const userMessage = serializeUserMessage(buildUserMessage(input, candidates))
  let attemptBudget = Math.max(0, options.dailyCallCap - options.dailyCallCount)
  const call = async (user: string): Promise<LlmCompletion> => {
    if (attemptBudget <= 0) throw new Error('LLM_CALL_CAP_REACHED')
    const remainingMs = totalDeadline - Date.now()
    if (remainingMs <= 0) throw new DOMException('Pipeline timed out', 'TimeoutError')
    attemptBudget--
    metrics.llmCalls++
    const controller = withCallTimeout(options.signal, Math.min(options.timeoutMs, remainingMs))
    const callStartedAt = Date.now()
    let result: LlmCompletion | null = null
    let callError: unknown = null
    try {
      result = await options.llm.completeJson({
        system: SYSTEM_PROMPT, user, schema: llmItinerarySchema,
        maxOutputTokens: ITINERARY_CONFIG.llm.maxOutputTokens, signal: controller.signal,
      })
      metrics.model = result.model
      metrics.inputTokens += result.usage.inputTokens
      metrics.outputTokens += result.usage.outputTokens
      metrics.thinkingTokens += result.usage.thinkingTokens
      return result
    } catch (error) {
      callError = error
      if (controller.timedOut() || options.signal?.aborted) {
        callError = new DOMException('LLM request timed out or aborted', 'TimeoutError')
      }
      throw callError
    } finally {
      controller.cleanup()
      await options.onAttempt?.({
        result: callError ? 'error' : 'success',
        model: result?.model ?? null,
        inputTokens: result?.usage.inputTokens ?? 0,
        outputTokens: result?.usage.outputTokens ?? 0,
        thinkingTokens: result?.usage.thinkingTokens ?? 0,
        durationMs: Math.max(0, Date.now() - callStartedAt),
        errorCode: callError instanceof GeminiApiError ? callError.kind
          : callError instanceof Error ? callError.name : null,
      })
    }
  }

  let completion: LlmCompletion
  try {
    completion = await call(userMessage)
  } catch (error) {
    if (error instanceof Error && error.message === 'LLM_CALL_CAP_REACHED') return fallback('cap_reached')
    const elapsed = Date.now() - startedAt
    if (error instanceof GeminiApiError && error.kind === 'bad_json' && options.allowRepair !== false &&
      elapsed < ITINERARY_CONFIG.llm.repairIfElapsedUnderMs && attemptBudget > 0 && Date.now() < totalDeadline) {
      metrics.repairs = 1
      try {
        completion = await call(JSON.stringify({
          task: 'The previous response was not valid JSON. Generate the requested itinerary again as strict JSON only.',
          originalRequest: JSON.parse(userMessage) as unknown,
        }))
      } catch (repairError) {
        if (repairError instanceof Error && repairError.message === 'LLM_CALL_CAP_REACHED') return fallback('cap_reached')
        return fallback(reasonForError(repairError))
      }
    } else {
      return fallback(reasonForError(error))
    }
  }

  const validation = await validateLlmItinerary(completion.json, {
    input,
    candidates,
    startedAt,
    now: Date.now,
    repair: options.allowRepair === false || metrics.repairs > 0 ? undefined : async () => {
      const remaining = totalDeadline - Date.now()
      if (attemptBudget <= 0) throw new Error('LLM_CALL_CAP_REACHED')
      if (remaining <= 0) throw new DOMException('Pipeline timed out', 'TimeoutError')
      metrics.repairs = 1
      const repairUser = JSON.stringify({
        task: 'Return valid JSON only. Repair the previous response to match the itinerary schema and hard rules.',
        originalRequest: JSON.parse(userMessage) as unknown,
        previousOutput: completion.json,
      })
      return (await call(repairUser)).json
    },
  }).catch((error: unknown) => {
    if (error instanceof Error && error.message === 'LLM_CALL_CAP_REACHED') metrics.fallbackReason = 'cap_reached'
    else metrics.fallbackReason = reasonForError(error)
    return null
  })
  if (!validation) return fallback(metrics.fallbackReason ?? 'invalid_json')
  metrics.repairs = Math.max(metrics.repairs, validation.repairs)
  metrics.coverage = validation.coverage
  metrics.replacedDayIndexes = [...validation.replacedDayIndexes]
  metrics.validationIssues = [...validation.issues]
  if (!validation.accepted) return fallback(validation.reason ?? 'low_coverage')

  const [baseMinimum] = ITINERARY_CONFIG.itemsPerDay[input.pace]
  const minimum = Math.max(ITINERARY_CONFIG.itemsPerDay.floor,
    baseMinimum - (input.companion === 'seniors' || input.companion === 'family_kids' ? 1 : 0))
  metrics.repairs += validation.replacedDayIndexes.length

  const scheduledDays: TripDay[] = []
  const used = new Set<string>()
  for (const day of validation.days) {
    let dayItems = day.items
    if (validation.replacedDayIndexes.includes(day.dayIndex)) {
      const keptIds = new Set(validation.days.filter((candidateDay) => candidateDay.dayIndex !== day.dayIndex)
        .flatMap((candidateDay) => candidateDay.items.map(({ placeId }) => placeId)))
      for (const id of used) keptIds.add(id)
      const date = dateAtOffset(input.startDate ?? vietnamDate(options.now), day.dayIndex - 1)
      const fallbackInput = { ...input, numDays: 1, startDate: date }
      const fallbackRepo = new FixturePlacesRepo(candidates
        .filter(({ place }) => !keptIds.has(place.id))
        .map(({ place, tagWeights, featured }) => ({ place, tagWeights, featured })))
      try {
        const replacement = await generateTrip(fallbackRepo, fallbackInput, {
          ...options, seed: `${options.seed ?? 'llm'}:replacement:${day.dayIndex}`,
        })
        const replacementDay = replacement.draft.days[0]
        if (replacementDay && replacementDay.items.length >= minimum && replacementDay.items.some(({ slot, place }) =>
          slot === 'noon' && place?.category === 'food')) {
          const replacementItems = replacementDay.items.map((item) => ({
            placeId: item.placeId, slot: item.slot, reason: item.reason ?? '',
            candidate: candidates.find(({ place }) => place.id === item.placeId),
          }))
          if (replacementItems.some(({ candidate }) => !candidate)) return fallback('low_coverage')
          dayItems = replacementItems.map(({ candidate, ...item }) => ({ ...item, candidate: candidate as ScoredCandidate }))
        } else {
          return fallback('low_coverage')
        }
      } catch {
        return fallback('low_coverage')
      }
    }
    const requests: ScheduleRequest[] = dayItems.map(({ candidate, slot }) => ({ candidate, slot, locked: slot === 'noon' }))
    const scheduled = scheduleDay(requests, { input: { ...input, startDate: input.startDate }, dayIndex: day.dayIndex })
    if (scheduled.droppedPlaceIds.length || scheduled.items.length !== requests.length) return fallback('low_coverage')
    const items: TripItem[] = scheduled.items.map((item, position) => {
      used.add(item.candidate.place.id)
      const validated = dayItems.find(({ placeId }) => placeId === item.candidate.place.id)
      return {
        id: stableUuid(options.seed, `llm:${day.dayIndex}:${position}`),
        placeId: item.candidate.place.id,
        place: item.candidate.place,
        position,
        slot: item.slot,
        startTime: item.startTime,
        durationMin: item.durationMin,
        travelMinFromPrev: item.travelMinFromPrev,
        travelDistanceM: item.travelDistanceM,
        reason: validated?.reason ?? null,
        note: null,
        isLocked: false,
        addedBy: 'ai',
      }
    })
    scheduledDays.push({
      id: stableUuid(options.seed, `llm:day:${day.dayIndex}`), dayIndex: day.dayIndex,
      date: input.startDate ? dateAtOffset(input.startDate, day.dayIndex - 1) : null,
      note: null, items,
    })
  }
  if (used.size !== scheduledDays.reduce((count, day) => count + day.items.length, 0)) return fallback('low_coverage')

  const warnings: Warning[] = computeWarnings({
    days: scheduledDays, transport: input.transport, startDate: input.startDate ?? vietnamDate(options.now),
    pace: input.pace, companion: input.companion, start: input.start,
  })
  const draft = {
    clientDraftId: options.clientDraftId ?? stableUuid(options.seed, 'draft'),
    title: `Lịch trình Huế ${input.startDate ?? vietnamDate(options.now)}`,
    startDate: input.startDate,
    numDays: input.numDays,
    input,
    generatedBy: 'llm' as const,
    llmModel: completion.model,
    start: input.start,
    days: scheduledDays,
  }
  const notices = [...candidateSelection.notices]
  if (validation.issues.some((issue) => issue.startsWith('best_time_relaxed:'))) {
    notices.push({ code: 'FILTER_RELAXED', message: 'Một số khung giờ được nới để bảo đảm các quy tắc cứng của lịch trình.' })
  }
  metrics.fallbackReason = null
  metrics.model = completion.model
  metricsLog(options, metrics)
  return {
    draft,
    warnings,
    notices,
    generation: { by: 'llm', model: completion.model, durationMs: Date.now() - startedAt,
      repairs: metrics.repairs, replacedDayIndexes: [...metrics.replacedDayIndexes] },
    metrics: { ...metrics },
  }
}

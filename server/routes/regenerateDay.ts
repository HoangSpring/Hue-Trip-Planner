import { createHmac } from 'node:crypto'
import { Hono, type Context } from 'hono'
import { regenerateDayRequestSchema } from '@shared/schemas'
import { env } from '../lib/env'
import { AppError } from '../lib/errors'
import { createPublicSupabaseClient, createServiceRoleSupabaseClient } from '../lib/supabase'
import type { ApiEnv } from '../types'
import { errorHandler } from '../middleware/errorHandler'
import { optionalAuth } from '../middleware/auth'
import { SupabasePlacesRepo, type PlacesRepo } from '../itinerary/placesRepo'
import {
  SupabaseGenerationStore,
  type GenerationEvent,
  type GenerationIdentity,
  type GenerationStore,
} from '../itinerary/generationStore'
import { regenerateDay } from '../itinerary/regenerateDay'
import type { LlmClient } from '../llm/client'
import { GeminiLlmClient } from '../llm/providers/gemini'

type RouteUser = { id: string; email: string | null } | null

export type RegenerateDayRouteDependencies = {
  auth?: typeof optionalAuth
  createPlacesRepo?: () => PlacesRepo
  createGenerationStore?: () => GenerationStore
  createLlmClient?: () => LlmClient
  llmEnabled?: boolean
  llmTimeoutMs?: number
  llmDailyCallCap?: number
  logTelemetry?: (metrics: Record<string, unknown>) => void
  now?: () => Date
  rateLimitSalt?: string
}

function clientAddress(context: Context<ApiEnv>): string {
  const forwarded = context.req.header('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || context.req.header('x-real-ip') || 'unknown'
}

function makeIdentity(
  user: RouteUser,
  ip: string,
  userAgent: string | undefined,
  salt = env.RATE_LIMIT_SALT
): GenerationIdentity {
  if (!salt) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Thiếu cấu hình giới hạn tần suất.')
  const subject = user ? `user:${user.id}` : `${ip}\n${userAgent ?? ''}`
  const clientKey = createHmac('sha256', salt).update(subject).digest('hex')
  return { userId: user?.id ?? null, clientKey, isGuest: user === null }
}

function checkRateLimit(identity: GenerationIdentity, events: string[], now: Date) {
  const hour = 60 * 60 * 1000
  // Guest: 6/hr; User: 20/hr
  const limit = identity.isGuest ? 6 : 20
  const nowMs = now.getTime()
  const hourly = events.map(Date.parse).filter((time) => time > nowMs - hour && time <= nowMs)
  const hourExceeded = hourly.length >= limit
  const retryAt = hourExceeded ? Math.min(...hourly) + hour : 0
  const remaining = Math.max(0, limit - hourly.length)
  const resetAt = retryAt || (hourly.length ? Math.min(...hourly) + hour : nowMs + hour)

  return {
    allowed: !hourExceeded,
    retryAfter: Math.max(1, Math.ceil((resetAt - nowMs) / 1000)),
    limit,
    remaining,
    resetAt,
  }
}

function createDefaultStore(): GenerationStore {
  try {
    return new SupabaseGenerationStore(createServiceRoleSupabaseClient())
  } catch {
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Dịch vụ tạo lịch trình chưa sẵn sàng.')
  }
}

export function createRegenerateDayRoute(deps: RegenerateDayRouteDependencies = {}) {
  const router = new Hono<ApiEnv>()
  router.onError(errorHandler)

  const authMiddleware = deps.auth ?? optionalAuth
  const createPlacesRepo =
    deps.createPlacesRepo ?? (() => new SupabasePlacesRepo(createPublicSupabaseClient()))
  const createStore = deps.createGenerationStore ?? createDefaultStore

  router.post('/trips/regenerate-day', authMiddleware, async (c) => {
    c.header('Cache-Control', 'no-store')
    const requestSignal = c.req.raw.signal ?? new AbortController().signal
    const now = deps.now ? deps.now() : new Date()
    const started = now.getTime()
    const user = (c.get('user') ?? null) as RouteUser
    const identity = makeIdentity(
      user,
      clientAddress(c),
      c.req.header('user-agent'),
      deps.rateLimitSalt
    )
    const store = createStore()

    let eventAttempted = false
    const record = async (status: GenerationEvent['status'], errorCode: string | null, extra: Partial<GenerationEvent> = {}) => {
      eventAttempted = true
      await store.record({
        ...identity,
        ...extra,
        status,
        durationMs: Math.max(0, Date.now() - started),
        errorCode,
      })
    }

    try {
      let rawBody: unknown
      try {
        rawBody = await c.req.json()
      } catch {
        throw new AppError(400, 'VALIDATION_ERROR', 'Nội dung yêu cầu không phải JSON hợp lệ.')
      }

      const parsed = regenerateDayRequestSchema.safeParse(rawBody)
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Dữ liệu tạo lại ngày chưa hợp lệ.',
          parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
        )
      }

      // Check rate limit
      const recentEvents = await store.listRecent(
        identity,
        new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        requestSignal
      )
      const quota = checkRateLimit(identity, recentEvents, now)
      c.header('X-RateLimit-Limit', String(quota.limit))
      c.header('X-RateLimit-Remaining', String(quota.remaining))
      c.header('X-RateLimit-Reset', String(Math.floor(quota.resetAt / 1000)))

      if (!quota.allowed) {
        await record('rate_limited', 'RATE_LIMITED')
        c.header('Retry-After', String(quota.retryAfter))
        return c.json(
          {
            error: {
              code: 'RATE_LIMITED' as const,
              message: `Bạn đã đạt giới hạn tạo lại ngày (${quota.limit} lần/giờ). Vui lòng thử lại sau ${quota.retryAfter} giây.`,
              requestId: c.get('requestId') ?? 'req_unavailable',
            },
          },
          429
        )
      }

      const dayStart = new Date(now)
      dayStart.setUTCHours(0, 0, 0, 0)
      const llmCallEvents = await store.listRecentLlmCalls(identity, dayStart.toISOString(), requestSignal)

      const repo = createPlacesRepo()
      const telemetry: { promptVersion: string; poolSize: number; repairs: number; coverage: number | null; fallbackReason: string | null; llmCalls: number; model: string | null; inputTokens: number; outputTokens: number; thinkingTokens: number } = {
        promptVersion: 'hue-itinerary-v2-compact', poolSize: 0, repairs: 0, coverage: null,
        fallbackReason: null, llmCalls: 0, model: null, inputTokens: 0, outputTokens: 0, thinkingTokens: 0,
      }
      const result = await regenerateDay(repo, parsed.data, {
        now,
        signal: requestSignal,
        llm: {
          client: deps.createLlmClient?.() ?? new GeminiLlmClient(),
          enabled: deps.llmEnabled ?? env.LLM_ENABLED === 'true',
          dailyCallCount: llmCallEvents.length,
          dailyCallCap: deps.llmDailyCallCap ?? env.LLM_DAILY_CALL_CAP,
          timeoutMs: deps.llmTimeoutMs ?? env.LLM_TIMEOUT_MS,
          totalTimeoutMs: 15_000,
          onAttempt: async (attempt) => store.record({
            ...identity,
            llmCallEvent: true,
            generatedBy: 'llm',
            status: attempt.result === 'success' ? 'success' : 'error',
            llmModel: attempt.model,
            inputTokens: attempt.inputTokens,
            outputTokens: attempt.outputTokens,
            thinkingTokens: attempt.thinkingTokens,
            durationMs: attempt.durationMs,
            errorCode: attempt.errorCode,
          }),
          onMetrics: (metrics) => { Object.assign(telemetry, metrics) },
        },
      })

      const safeTelemetry = { event: 'itinerary_regenerate_day', ...telemetry }
      deps.logTelemetry?.(safeTelemetry)
      if (!deps.logTelemetry) console.info(JSON.stringify(safeTelemetry))
      await record(result.generation.by === 'llm' ? 'success' : 'fallback', telemetry.fallbackReason, {
        generatedBy: result.generation.by === 'llm' ? 'llm' : 'fallback',
        llmModel: result.generation.model,
        promptVersion: telemetry.promptVersion,
        poolSize: telemetry.poolSize,
        repairs: telemetry.repairs,
        coverage: telemetry.coverage,
        fallbackReason: telemetry.fallbackReason,
        inputTokens: telemetry.inputTokens,
        outputTokens: telemetry.outputTokens,
        thinkingTokens: telemetry.thinkingTokens,
      })
      return c.json(result)
    } catch (error) {
      if (!eventAttempted) {
        const errorCode = error instanceof AppError ? error.code : 'INTERNAL_ERROR'
        await record('error', errorCode)
      }
      throw error
    }
  })

  return router
}

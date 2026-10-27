import { createHmac } from 'node:crypto'
import { Hono, type Context } from 'hono'
import { generateTripRequestSchema } from '@shared/schemas'
import { env } from '../lib/env'
import { AppError } from '../lib/errors'
import { createPublicSupabaseClient, createServiceRoleSupabaseClient } from '../lib/supabase'
import type { ApiEnv } from '../types'
import { errorHandler } from '../middleware/errorHandler'
import { optionalAuth } from '../middleware/auth'
import { NoCandidatesError, generateTrip } from '../itinerary/fallback'
import { SupabasePlacesRepo, type PlacesRepo } from '../itinerary/placesRepo'
import { SupabaseGenerationStore, type GenerationEvent, type GenerationIdentity, type GenerationStore } from '../itinerary/generationStore'

type RouteUser = { id: string; email: string | null } | null

export type GenerateTripRouteDependencies = {
  auth?: typeof optionalAuth
  createPlacesRepo?: () => PlacesRepo
  createGenerationStore?: () => GenerationStore
  validateInterests?: (slugs: string[], signal?: AbortSignal) => Promise<boolean>
  now?: () => Date
  rateLimitSalt?: string
}

function clientAddress(context: Context<ApiEnv>): string {
  const forwarded = context.req.header('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || context.req.header('x-real-ip') || 'unknown'
}

function makeIdentity(user: RouteUser, ip: string, userAgent: string | undefined, salt = env.RATE_LIMIT_SALT): GenerationIdentity {
  if (!salt) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Thiếu cấu hình giới hạn tần suất.')
  const subject = user ? `user:${user.id}` : `${ip}\n${userAgent ?? ''}`
  const clientKey = createHmac('sha256', salt).update(subject).digest('hex')
  return { userId: user?.id ?? null, clientKey, isGuest: user === null }
}

function rateLimit(identity: GenerationIdentity, events: string[], now: Date) {
  const hour = 60 * 60 * 1000
  const day = 24 * hour
  const guestLimits = { hour: env.RATE_LIMIT_GUEST_GENERATE_PER_HOUR, day: env.RATE_LIMIT_GUEST_GENERATE_PER_DAY }
  const userLimits = { hour: env.RATE_LIMIT_USER_GENERATE_PER_HOUR, day: env.RATE_LIMIT_USER_GENERATE_PER_DAY }
  const limits = identity.isGuest ? guestLimits : userLimits
  const nowMs = now.getTime()
  const hourly = events.map(Date.parse).filter((time) => time > nowMs - hour && time <= nowMs)
  const daily = events.map(Date.parse).filter((time) => time > nowMs - day && time <= nowMs)
  const hourExceeded = hourly.length >= limits.hour
  const dayExceeded = daily.length >= limits.day
  const retryAt = Math.max(
    hourExceeded ? Math.min(...hourly) + hour : 0,
    dayExceeded ? Math.min(...daily) + day : 0,
  )
  const limit = hourExceeded ? limits.hour : dayExceeded ? limits.day : limits.hour
  const remaining = Math.max(0, Math.min(limits.hour - hourly.length, limits.day - daily.length))
  const resetAt = retryAt || (hourly.length ? Math.min(...hourly) + hour : nowMs + hour)
  return { allowed: !hourExceeded && !dayExceeded, retryAfter: Math.max(1, Math.ceil((resetAt - nowMs) / 1000)), limit, remaining, resetAt }
}

async function validInterestSlugs(slugs: string[], signal?: AbortSignal): Promise<boolean> {
  if (!slugs.length) return false
  const client = createPublicSupabaseClient()
  let query = client.from('tags').select('slug').eq('kind', 'interest').in('slug', slugs)
  if (signal) query = query.abortSignal(signal)
  const { data, error } = await query
  return !error && data !== null && new Set(data.map(({ slug }) => slug)).size === new Set(slugs).size
}

function validationError(issues: Array<{ path: PropertyKey[]; message: string }>): AppError {
  return new AppError(400, 'VALIDATION_ERROR', 'Dữ liệu tạo lịch trình chưa hợp lệ.', issues.map((issue) => ({
    path: issue.path.join('.'), message: issue.message,
  })))
}

function createStore(): GenerationStore {
  try {
    return new SupabaseGenerationStore(createServiceRoleSupabaseClient())
  } catch {
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Dịch vụ tạo lịch trình chưa sẵn sàng.')
  }
}

export function createGenerateTripRoutes(dependencies: GenerateTripRouteDependencies = {}) {
  const routes = new Hono<ApiEnv>()
  routes.onError(errorHandler)
  routes.post('/trips/generate', dependencies.auth ?? optionalAuth, async (context) => {
    context.header('Cache-Control', 'no-store')
    const now = dependencies.now ?? (() => new Date())
    const started = now().getTime()
    const user = (context.get('user') ?? null) as RouteUser
    const identity = makeIdentity(user, clientAddress(context), context.req.header('user-agent'), dependencies.rateLimitSalt)
    const store = dependencies.createGenerationStore?.() ?? createStore()
    let eventAttempted = false
    const record = async (status: GenerationEvent['status'], errorCode: string | null) => {
      eventAttempted = true
      await store.record({ ...identity, status, durationMs: Math.max(0, now().getTime() - started), errorCode })
    }

    try {
      let body: unknown
      let rawBody: string
      try { rawBody = await context.req.text() } catch {
        throw new AppError(400, 'VALIDATION_ERROR', 'Nội dung yêu cầu không phải JSON hợp lệ.')
      }
      if (new TextEncoder().encode(rawBody).byteLength > 256 * 1024) {
        throw new AppError(413, 'PAYLOAD_TOO_LARGE', 'Dữ liệu gửi lên vượt quá giới hạn cho phép.')
      }
      try { body = JSON.parse(rawBody) as unknown } catch {
        throw new AppError(400, 'VALIDATION_ERROR', 'Nội dung yêu cầu không phải JSON hợp lệ.')
      }
      const parsed = generateTripRequestSchema.safeParse(body)
      if (!parsed.success) throw validationError(parsed.error.issues)

      const checkedAt = now()
      const recentEvents = await store.listRecent(identity, new Date(checkedAt.getTime() - 24 * 60 * 60 * 1000).toISOString(), context.req.raw.signal)
      const quota = rateLimit(identity, recentEvents, checkedAt)
      context.header('X-RateLimit-Limit', String(quota.limit))
      context.header('X-RateLimit-Remaining', String(quota.remaining))
      context.header('X-RateLimit-Reset', String(Math.floor(quota.resetAt / 1000)))
      if (!quota.allowed) {
        await record('rate_limited', 'RATE_LIMITED')
        context.header('Retry-After', String(quota.retryAfter))
        return context.json({ error: { code: 'RATE_LIMITED', message: 'Bạn đã tạo nhiều lịch trình trong thời gian ngắn.', requestId: context.get('requestId') } }, 429)
      }

      const checkInterests = dependencies.validateInterests ?? validInterestSlugs
      if (!(await checkInterests(parsed.data.input.interests, context.req.raw.signal))) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Có sở thích không hợp lệ.', [{ path: 'input.interests', message: 'Chỉ dùng tag sở thích đã được cấu hình.' }])
      }
      const repo = dependencies.createPlacesRepo?.() ?? new SupabasePlacesRepo(createPublicSupabaseClient())
      const generated = await generateTrip(repo, parsed.data.input, {
        now: checkedAt,
        seed: parsed.data.clientDraftId ?? context.get('requestId'),
        clientDraftId: parsed.data.clientDraftId,
        signal: context.req.raw.signal,
      })
      const placeIds = generated.draft.days.flatMap((day) => day.items.map((item) => item.placeId))
      const selectedRecords = await repo.listPublished(context.req.raw.signal)
      const publishedIds = new Set(selectedRecords.map(({ place }) => place.id))
      if (placeIds.some((id) => !publishedIds.has(id))) throw new AppError(500, 'INTERNAL_ERROR', 'Kết quả có địa điểm không còn được xuất bản.')
      await record('fallback', null)
      return context.json({
        draft: generated.draft,
        warnings: generated.warnings,
        notices: generated.notices,
        generation: { by: 'fallback', model: null, durationMs: Math.max(0, now().getTime() - started) },
      })
    } catch (error) {
      if (!eventAttempted) {
        const errorCode = error instanceof NoCandidatesError ? 'NO_CANDIDATES' : error instanceof AppError ? error.code : 'INTERNAL_ERROR'
        try { await record('error', errorCode) } catch { /* Preserve the original request error. */ }
      }
      if (error instanceof NoCandidatesError) throw new AppError(422, 'NO_CANDIDATES', 'Chưa có đủ địa điểm phù hợp để tạo lịch trình.')
      throw error
    }
  })
  return routes
}

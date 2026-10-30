import { createHmac } from 'node:crypto'
import { Hono, type Context, type MiddlewareHandler } from 'hono'
import { shareTokenSchema, setShareRequestSchema } from '@shared/schemas'
import { env } from '../lib/env'
import { AppError } from '../lib/errors'
import { errorHandler } from '../middleware/errorHandler'
import { requireAuth } from '../middleware/auth'
import { createServiceRoleSupabaseClient, createUserSupabaseClient } from '../lib/supabase'
import { createPublicSupabaseClient } from '../lib/supabase'
import { SupabaseTripRepository } from '../services/supabaseTripRepository'
import { SupabaseTripSharingRepository, type TripSharingRepository } from '../services/tripSharingRepository'
import { TripSharingService } from '../services/tripSharingService'
import type { TripRepository } from '../services/tripService'
import type { ApiEnv } from '../types'

type Bucket = { startedAt: number; count: number }
export type TripSharingRouteDependencies = {
  auth?: MiddlewareHandler<ApiEnv>
  createSharingRepository?: (accessToken?: string) => TripSharingRepository
  createTripRepository?: (accessToken: string) => TripRepository
  rateLimitSalt?: string
  publicLimit?: number
  now?: () => number
  appBaseUrl?: string
}

function clientAddress(context: Context<ApiEnv>): string {
  return context.req.header('x-real-ip')?.trim() || context.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

function validTokenOrThrow(value: string): string {
  const parsed = shareTokenSchema.safeParse(value)
  if (!parsed.success) throw new AppError(404, 'NOT_FOUND', 'Lịch trình không còn được chia sẻ.')
  return parsed.data
}

export function createTripSharingRoutes(dependencies: TripSharingRouteDependencies = {}) {
  const routes = new Hono<ApiEnv>()
  const buckets = new Map<string, Bucket>()
  routes.onError(errorHandler)
  const defaultSharingRepository = (accessToken?: string) => {
    const serviceClient = createServiceRoleSupabaseClient()
    const userClient = accessToken ? createUserSupabaseClient(accessToken) : createPublicSupabaseClient()
    return new SupabaseTripSharingRepository(userClient, serviceClient)
  }

  routes.put('/trips/:id/share', dependencies.auth ?? requireAuth, async (context) => {
    context.header('Cache-Control', 'private, no-store')
    let payload: unknown
    try { payload = await context.req.json() as unknown } catch { throw new AppError(400, 'VALIDATION_ERROR', 'Nội dung yêu cầu không phải JSON hợp lệ.') }
    const parsed = setShareRequestSchema.safeParse(payload)
    if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Yêu cầu chia sẻ chưa hợp lệ.', parsed.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })))
    const id = context.req.param('id')
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy chuyến đi.')
    const token = context.get('accessToken')
    const repository = dependencies.createSharingRepository?.(token) ?? defaultSharingRepository(token)
    const service = new TripSharingService(repository)
    const shareToken = await service.setEnabled(id, parsed.data.enabled)
    const base = (dependencies.appBaseUrl ?? env.APP_BASE_URL ?? new URL(context.req.url).origin).replace(/\/$/, '')
    return context.json({ isShared: parsed.data.enabled, shareToken, shareUrl: shareToken ? `${base}/s/${shareToken}` : null })
  })

  routes.get('/shared/:token', async (context) => {
    context.header('Cache-Control', 'no-store')
    context.header('X-Robots-Tag', 'noindex')
    const salt = dependencies.rateLimitSalt ?? env.RATE_LIMIT_SALT
    if (!salt) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Dịch vụ chia sẻ chưa sẵn sàng.')
    const key = createHmac('sha256', salt).update(clientAddress(context)).digest('hex')
    const now = dependencies.now ?? Date.now
    const current = now()
    const limit = dependencies.publicLimit ?? 120
    let bucket = buckets.get(key)
    if (!bucket || current - bucket.startedAt >= 60_000) bucket = { startedAt: current, count: 0 }
    bucket.count += 1
    buckets.set(key, bucket)
    if (buckets.size > 10_000) for (const [entry, value] of buckets) if (current - value.startedAt >= 60_000) buckets.delete(entry)
    if (bucket.count > limit) {
      context.header('Retry-After', String(Math.max(1, Math.ceil((bucket.startedAt + 60_000 - current) / 1000))))
      return context.json({ error: { code: 'RATE_LIMITED', message: 'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau.', requestId: context.get('requestId') } }, 429)
    }
    const token = validTokenOrThrow(context.req.param('token'))
    const repository = dependencies.createSharingRepository?.() ?? defaultSharingRepository()
    const view = await new TripSharingService(repository).getView(token)
    return context.json(view)
  })

  routes.post('/shared/:token/copy', dependencies.auth ?? requireAuth, async (context) => {
    context.header('Cache-Control', 'private, no-store')
    const token = validTokenOrThrow(context.req.param('token'))
    const accessToken = context.get('accessToken')
    const sharingRepository = dependencies.createSharingRepository?.(accessToken) ?? defaultSharingRepository(accessToken)
    const tripRepository = dependencies.createTripRepository?.(accessToken) ?? new SupabaseTripRepository(createUserSupabaseClient(accessToken))
    const trip = await new TripSharingService(sharingRepository, tripRepository, env.MAX_TRIPS_PER_USER).copy(token)
    return context.json(trip, 201)
  })

  return routes
}

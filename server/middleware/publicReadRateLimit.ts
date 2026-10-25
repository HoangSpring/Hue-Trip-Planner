import type { MiddlewareHandler } from 'hono'
import type { ApiEnv } from '../types'

type Bucket = { startedAt: number; count: number }

export function publicReadRateLimit(limit = 120, windowMs = 60_000, clock: () => number = Date.now): MiddlewareHandler<ApiEnv> {
  const buckets = new Map<string, Bucket>()

  return async (context, next) => {
    const now = clock()
    const forwardedFor = context.req.header('x-forwarded-for')?.split(',')[0]?.trim()
    const key = context.req.header('x-real-ip')?.trim() || forwardedFor || 'unknown'
    let bucket = buckets.get(key)
    if (!bucket || now - bucket.startedAt >= windowMs) {
      bucket = { startedAt: now, count: 0 }
      buckets.set(key, bucket)
    }
    bucket.count += 1

    const remaining = Math.max(0, limit - bucket.count)
    const resetAt = Math.ceil((bucket.startedAt + windowMs) / 1000)
    context.header('X-RateLimit-Limit', String(limit))
    context.header('X-RateLimit-Remaining', String(remaining))
    context.header('X-RateLimit-Reset', String(resetAt))

    if (bucket.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((bucket.startedAt + windowMs - now) / 1000))
      context.header('Retry-After', String(retryAfter))
      return context.json({
        error: {
          code: 'RATE_LIMITED' as const,
          message: 'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau.',
          requestId: context.get('requestId') ?? 'req_unavailable',
        },
      }, 429)
    }

    await next()
  }
}

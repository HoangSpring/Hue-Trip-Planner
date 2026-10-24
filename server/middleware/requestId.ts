import type { MiddlewareHandler } from 'hono'
import type { ApiEnv } from '../types'

export const requestIdMiddleware: MiddlewareHandler<ApiEnv> = async (context, next) => {
  const supplied = context.req.header('X-Request-Id')
  const requestId = supplied && /^[A-Za-z0-9._-]{1,100}$/.test(supplied) ? supplied : `req_${crypto.randomUUID()}`
  context.set('requestId', requestId)
  await next()
  context.header('X-Request-Id', requestId)
}

import type { MiddlewareHandler } from 'hono'

export const privateNoStore: MiddlewareHandler = async (context, next) => {
  await next()
  context.header('Cache-Control', 'private, no-store')
}

export const publicCache: MiddlewareHandler = async (context, next) => {
  await next()
  context.header('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
}

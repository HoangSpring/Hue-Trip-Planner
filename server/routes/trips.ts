import { Hono, type Context, type ErrorHandler } from 'hono'
import { uuidSchema } from '@shared/schemas'
import type { MiddlewareHandler } from 'hono'
import { createUserSupabaseClient } from '../lib/supabase'
import { env } from '../lib/env'
import { AppError } from '../lib/errors'
import { errorHandler } from '../middleware/errorHandler'
import { requireAuth } from '../middleware/auth'
import { SupabaseTripRepository, TripRepositoryError } from '../services/supabaseTripRepository'
import { TripService, type TripRepository } from '../services/tripService'
import type { ApiEnv } from '../types'

export type TripRouteDependencies = {
  auth?: MiddlewareHandler<ApiEnv>
  createRepository?: (accessToken: string) => TripRepository
  maxTrips?: number
}

const routeError: ErrorHandler<ApiEnv> = (error, context) => {
  console.error('--- RAW TRIP ROUTE ERROR ---', error) // <--- Thêm dòng này để in lỗi thật

  if (!(error instanceof AppError) && error instanceof TripRepositoryError) {
    if (error.code === 'PT404' || error.code === '42501') error = new AppError(404, 'NOT_FOUND', 'Không tìm thấy chuyến đi.')
    else if (error.code === 'PT401') error = new AppError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập để tiếp tục.')
    else if (error.code === 'PT409') error = new AppError(409, 'CONFLICT', 'Lịch trình đã thay đổi ở nơi khác. Tải lại?')
    else if (error.code === 'PT422' || ['23505', '23503', '23514'].includes(error.code)) error = new AppError(422, 'BUSINESS_RULE_VIOLATION', 'Dữ liệu chuyến đi vi phạm quy tắc nghiệp vụ.')
  }
  return errorHandler(error, context)
}

function parseId(value: string): string {
  const parsed = uuidSchema.safeParse(value)
  if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Mã chuyến đi không hợp lệ.', [{ path: 'id', message: 'Cần mã UUID hợp lệ.' }])
  return parsed.data
}

async function readJson(context: Context<ApiEnv>): Promise<unknown> {
  const contentType = context.req.header('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) throw new AppError(400, 'VALIDATION_ERROR', 'Content-Type phải là application/json.')
  const body = await context.req.text()
  if (new TextEncoder().encode(body).byteLength > 256 * 1024) throw new AppError(413, 'PAYLOAD_TOO_LARGE', 'Dữ liệu gửi lên vượt quá giới hạn cho phép.')
  try { return JSON.parse(body) as unknown } catch { throw new AppError(400, 'VALIDATION_ERROR', 'Nội dung yêu cầu không phải JSON hợp lệ.') }
}

export function createTripRoutes(dependencies: TripRouteDependencies = {}) {
  const routes = new Hono<ApiEnv>()
  routes.onError(routeError)
  routes.use('*', async (context, next) => {
    context.header('Cache-Control', 'private, no-store')
    await next()
  })
  routes.use('*', dependencies.auth ?? requireAuth)
  const service = (token: string) => new TripService(
    dependencies.createRepository?.(token) ?? new SupabaseTripRepository(createUserSupabaseClient(token)),
    dependencies.maxTrips ?? env.MAX_TRIPS_PER_USER,
  )

  routes.get('/trips', async (context) => context.json({ items: await service(context.get('accessToken')).list() }))
  routes.post('/trips', async (context) => {
    const result = await service(context.get('accessToken')).create(await readJson(context))
    return context.json(result.trip, result.created ? 201 : 200)
  })
  routes.get('/trips/:id', async (context) => context.json(await service(context.get('accessToken')).get(parseId(context.req.param('id')))))
  routes.put('/trips/:id', async (context) => {
    const result = await service(context.get('accessToken')).replace(parseId(context.req.param('id')), await readJson(context))
    return context.json(result)
  })
  routes.patch('/trips/:id', async (context) => context.json(await service(context.get('accessToken')).patch(parseId(context.req.param('id')), await readJson(context))))
  routes.delete('/trips/:id', async (context) => {
    await service(context.get('accessToken')).remove(parseId(context.req.param('id')))
    return context.body(null, 204)
  })
  routes.post('/trips/:id/duplicate', async (context) => context.json(await service(context.get('accessToken')).duplicate(parseId(context.req.param('id'))), 201))
  return routes
}

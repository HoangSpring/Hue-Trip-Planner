import { Hono, type Context, type ErrorHandler, type MiddlewareHandler } from 'hono'
import type { ZodType } from 'zod'
import {
  adminBulkRequestSchema,
  adminPlaceIdSchema,
  adminPlaceListQuerySchema,
  adminPlaceStatusRequestSchema,
  adminVerifyRequestSchema,
} from '@shared/schemas/adminPlace'
import { importCommitRequestSchema } from '@shared/schemas/placeImport'
import { AppError } from '../lib/errors'
import { createServiceRoleSupabaseClient, createUserSupabaseClient } from '../lib/supabase'
import { errorHandler } from '../middleware/errorHandler'
import { requireAdmin, requireAuth } from '../middleware/auth'
import { AdminPlaceService, type AdminPlaceRepository } from '../services/adminPlaceService'
import { SupabaseAdminPlaceRepository } from '../services/supabaseAdminPlaceRepository'
import { ImportService, type PlaceImportRepository } from '../services/importService'
import { SupabasePlaceImportRepository } from '../services/supabasePlaceImportRepository'
import type { ApiEnv } from '../types'

export type AdminRouteDependencies = {
  auth?: MiddlewareHandler<ApiEnv>
  authorizeAdmin?: MiddlewareHandler<ApiEnv>
  createRepository?: (accessToken: string) => AdminPlaceRepository
  createImportRepository?: (accessToken: string) => PlaceImportRepository
  now?: () => Date
  listAudit?: (placeId: string) => Promise<{ id: number; action: string; changes: unknown; created_at: string; actor_id: string | null }[]>
}

type AuditRow = { id: number; action: string; changes: unknown; created_at: string; actor_id: string | null }
type AuditQueryResult = { data: AuditRow[] | null; error: unknown }
type AuditQueryClient = {
  from: (table: 'place_audit_log') => {
    select: (columns: 'id,action,changes,created_at,actor_id') => {
      eq: (column: 'place_id', value: string) => {
        order: (column: 'created_at', options: { ascending: false }) => { limit: (count: number) => Promise<AuditQueryResult> }
      }
    }
  }
}

function routeError(error: Error, context: Parameters<ErrorHandler<ApiEnv>>[1]): Response | Promise<Response> {
  if (error instanceof AppError) return errorHandler(error, context)
  const repositoryError = error as Error & { code?: string }
  if (repositoryError.code === '23505') error = new AppError(409, 'CONFLICT', 'Slug địa điểm đã tồn tại.')
  else if (repositoryError.code === '23514') error = new AppError(400, 'VALIDATION_ERROR', 'Một trường địa điểm không đạt điều kiện dữ liệu.')
  else if (repositoryError.code === '42501') error = new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.')
  else if (repositoryError.code === 'PT404') error = new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.')
  return errorHandler(error, context)
}

function validationError(message: string, path?: string): AppError {
  return new AppError(400, 'VALIDATION_ERROR', message, path ? [{ path, message }] : undefined)
}

async function readJson(context: Context<ApiEnv>, maxBytes = 1024 * 1024): Promise<unknown> {
  if (!(context.req.header('content-type') ?? '').toLowerCase().includes('application/json')) {
    throw validationError('Content-Type phải là application/json.')
  }
  const body = await context.req.text()
  if (new TextEncoder().encode(body).byteLength > maxBytes) throw new AppError(413, 'PAYLOAD_TOO_LARGE', 'Dữ liệu gửi lên vượt quá giới hạn cho phép.')
  try { return JSON.parse(body) as unknown } catch { throw validationError('Nội dung yêu cầu không phải JSON hợp lệ.') }
}

function parseOrThrow<T>(schema: ZodType<T>, value: unknown, label: string): T {
  const parsed = schema.safeParse(value)
  if (parsed.success) return parsed.data
  throw new AppError(400, 'VALIDATION_ERROR', label, parsed.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })))
}

export function createAdminRoutes(dependencies: AdminRouteDependencies = {}) {
  const routes = new Hono<ApiEnv>()
  const routeErrorHandler: ErrorHandler<ApiEnv> = (error, context) => routeError(error, context)
  routes.onError(routeErrorHandler)
  const privateCache: MiddlewareHandler<ApiEnv> = async (context, next) => {
    context.header('Cache-Control', 'private, no-store')
    await next()
  }
  routes.use('/admin/*', privateCache, dependencies.auth ?? requireAuth, dependencies.authorizeAdmin ?? requireAdmin)
  const service = (token: string) => new AdminPlaceService(
    dependencies.createRepository?.(token) ?? new SupabaseAdminPlaceRepository(createUserSupabaseClient(token), createServiceRoleSupabaseClient()),
  )
  const importService = (token: string) => new ImportService(
    dependencies.createImportRepository?.(token) ?? new SupabasePlaceImportRepository(createUserSupabaseClient(token)),
  )
  const importBuckets = new Map<string, { startedAt: number; count: number }>()
  const importRateLimit: MiddlewareHandler<ApiEnv> = async (context, next) => {
    const now = Date.now()
    const actorId = context.get('user').id
    let bucket = importBuckets.get(actorId)
    if (!bucket || now - bucket.startedAt >= 60 * 60 * 1000) {
      bucket = { startedAt: now, count: 0 }
      importBuckets.set(actorId, bucket)
    }
    bucket.count += 1
    if (bucket.count > 10) {
      const retryAfter = Math.max(1, Math.ceil((bucket.startedAt + 60 * 60 * 1000 - now) / 1000))
      context.header('Retry-After', String(retryAfter))
      return context.json({ error: { code: 'RATE_LIMITED' as const, message: 'Đã vượt giới hạn import. Thử lại sau.', requestId: context.get('requestId') ?? 'req_unavailable' } }, 429)
    }
    await next()
  }

  routes.get('/admin/places', async (context) => {
    const query = context.req.query()
    const parsed = parseOrThrow(adminPlaceListQuerySchema, query, 'Bộ lọc danh sách địa điểm chưa hợp lệ.')
    return context.json(await service(context.get('accessToken')).list(parsed))
  })

  routes.post('/admin/places', async (context) => {
    const created = await service(context.get('accessToken')).create(await readJson(context), context.get('user').id)
    return context.json(created, 201)
  })

  routes.get('/admin/places/:id', async (context) => {
    const id = parseOrThrow(adminPlaceIdSchema, context.req.param('id'), 'Mã địa điểm không hợp lệ.')
    return context.json(await service(context.get('accessToken')).get(id))
  })

  routes.get('/admin/places/:id/audit', async (context) => {
    const id = parseOrThrow(adminPlaceIdSchema, context.req.param('id'), 'Mã địa điểm không hợp lệ.')
    if (dependencies.listAudit) return context.json({ items: await dependencies.listAudit(id) })
    const auditClient = createServiceRoleSupabaseClient() as unknown as AuditQueryClient
    const { data, error } = await auditClient.from('place_audit_log')
      .select('id,action,changes,created_at,actor_id').eq('place_id', id).order('created_at', { ascending: false }).limit(50)
    if (error) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể tải lịch sử thay đổi lúc này.')
    return context.json({ items: data })
  })

  routes.put('/admin/places/:id', async (context) => {
    const id = parseOrThrow(adminPlaceIdSchema, context.req.param('id'), 'Mã địa điểm không hợp lệ.')
    return context.json(await service(context.get('accessToken')).update(id, await readJson(context), context.get('user').id))
  })

  routes.post('/admin/places/:id/status', async (context) => {
    const id = parseOrThrow(adminPlaceIdSchema, context.req.param('id'), 'Mã địa điểm không hợp lệ.')
    const body = parseOrThrow(adminPlaceStatusRequestSchema, await readJson(context), 'Trạng thái địa điểm chưa hợp lệ.')
    return context.json(await service(context.get('accessToken')).changeStatus(id, body.status, context.get('user').id))
  })

  routes.post('/admin/places/:id/verify', async (context) => {
    const id = parseOrThrow(adminPlaceIdSchema, context.req.param('id'), 'Mã địa điểm không hợp lệ.')
    const body = parseOrThrow(adminVerifyRequestSchema, await readJson(context), 'Thông tin duyệt địa điểm chưa hợp lệ.')
    const result = await service(context.get('accessToken')).verify(id, body.verified, body.confirmedFields, context.get('user').id)
    return context.json(result)
  })

  routes.post('/admin/places/bulk', async (context) => {
    const body = parseOrThrow(adminBulkRequestSchema, await readJson(context), 'Thao tác hàng loạt chưa hợp lệ.')
    return context.json(await service(context.get('accessToken')).bulk(body.ids, body.action, context.get('user').id))
  })

  routes.post('/admin/import/preview', importRateLimit, async (context) => {
    const contentType = context.req.header('content-type') ?? ''
    if (!contentType.toLowerCase().startsWith('text/csv')) throw validationError('Content-Type phải là text/csv.')
    const rawRequest = context.req.raw as Request
    const bytes = typeof rawRequest.arrayBuffer === 'function'
      ? await rawRequest.arrayBuffer()
      : new TextEncoder().encode(await context.req.text()).buffer
    if (bytes.byteLength > 2 * 1024 * 1024) throw new AppError(413, 'PAYLOAD_TOO_LARGE', 'CSV vượt giới hạn 2 MB.')
    let csv: string
    try { csv = new TextDecoder('utf-8', { fatal: true }).decode(bytes) } catch {
      throw validationError('CSV phải được mã hóa UTF-8.')
    }
    return context.json(await importService(context.get('accessToken')).preview(csv))
  })

  routes.post('/admin/import/commit', importRateLimit, async (context) => {
    const input = parseOrThrow(importCommitRequestSchema, await readJson(context, 5 * 1024 * 1024), 'Yêu cầu import chưa hợp lệ.')
    return context.json(await importService(context.get('accessToken')).commit(input.csv, input.overwriteVerified ?? false))
  })

  return routes
}

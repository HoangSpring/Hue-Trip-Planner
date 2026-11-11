import { Hono, type ErrorHandler, type MiddlewareHandler } from 'hono'
import type { ZodType } from 'zod'
import {
  adminDashboardSchema,
  adminUserDeleteSchema,
  adminUserIdSchema,
  adminUserListQuerySchema,
  adminUserListSchema,
  adminUserRoleUpdateSchema,
  adminUserSchema,
  adminUserSuspendSchema,
} from '@shared/schemas/adminUser'
import { AppError } from '../lib/errors'
import { errorHandler } from '../middleware/errorHandler'
import { requireAdmin, requireAuth } from '../middleware/auth'
import { SupabaseAdminUserRepository, type AdminUserRepository } from '../services/adminUserRepository'
import type { ApiEnv } from '../types'

export type AdminUserRouteDependencies = {
  auth?: MiddlewareHandler<ApiEnv>
  authorizeAdmin?: MiddlewareHandler<ApiEnv>
  createRepository?: (accessToken: string) => AdminUserRepository
}

function parseJson(raw: string): unknown {
  if (new TextEncoder().encode(raw).byteLength > 1024) throw new AppError(413, 'PAYLOAD_TOO_LARGE', 'Dữ liệu gửi lên vượt quá giới hạn cho phép.')
  try { return JSON.parse(raw) as unknown } catch { throw new AppError(400, 'VALIDATION_ERROR', 'Nội dung yêu cầu không phải JSON hợp lệ.') }
}

function parse<T>(schema: ZodType<T>, value: unknown, message: string): T {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  throw new AppError(400, 'VALIDATION_ERROR', message, result.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })))
}

export function createAdminUserRoutes(dependencies: AdminUserRouteDependencies = {}) {
  const routes = new Hono<ApiEnv>()
  const routeErrorHandler: ErrorHandler<ApiEnv> = (error, context) => errorHandler(error, context)
  routes.onError(routeErrorHandler)
  const privateNoStore: MiddlewareHandler<ApiEnv> = async (context, next) => {
    context.header('Cache-Control', 'private, no-store')
    await next()
  }
  routes.use('/admin/dashboard', privateNoStore, dependencies.auth ?? requireAuth, dependencies.authorizeAdmin ?? requireAdmin)
  routes.use('/admin/users/*', privateNoStore, dependencies.auth ?? requireAuth, dependencies.authorizeAdmin ?? requireAdmin)

  const repository = (token: string) => dependencies.createRepository?.(token) ?? new SupabaseAdminUserRepository(token)
  const ensureEnabled = () => {
    if (process.env.ADMIN_USER_MANAGEMENT_ENABLED !== 'true') {
      throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Quản lý người dùng chưa sẵn sàng. Cần áp dụng migration 14 và bật cấu hình ADMIN_USER_MANAGEMENT_ENABLED.')
    }
  }

  routes.get('/admin/dashboard', async (context) => {
    return context.json(parse(adminDashboardSchema, await repository(context.get('accessToken')).dashboard(), 'Dữ liệu tổng quan không hợp lệ.'))
  })

  routes.get('/admin/users', async (context) => {
    ensureEnabled()
    const query = parse(adminUserListQuerySchema, context.req.query(), 'Tham số trang người dùng không hợp lệ.')
    return context.json(parse(adminUserListSchema, await repository(context.get('accessToken')).list(query), 'Danh sách người dùng không hợp lệ.'))
  })

  routes.patch('/admin/users/:id/role', async (context) => {
    ensureEnabled()
    const userId = parse(adminUserIdSchema, context.req.param('id'), 'Mã người dùng không hợp lệ.')
    const body = parse(adminUserRoleUpdateSchema, parseJson(await context.req.text()), 'Vai trò không hợp lệ.')
    const updated = await repository(context.get('accessToken')).updateRole(userId, context.get('user').id, body.role)
    return context.json(parse(adminUserSchema, updated, 'Thông tin người dùng không hợp lệ.'))
  })

  routes.post('/admin/users/:id/suspension', async (context) => {
    ensureEnabled()
    const userId = parse(adminUserIdSchema, context.req.param('id'), 'Mã người dùng không hợp lệ.')
    const body = parse(adminUserSuspendSchema, parseJson(await context.req.text()), 'Trạng thái khóa không hợp lệ.')
    const updated = await repository(context.get('accessToken')).setSuspended(userId, context.get('user').id, body.suspended)
    return context.json(parse(adminUserSchema, updated, 'Thông tin người dùng không hợp lệ.'))
  })

  routes.delete('/admin/users/:id', async (context) => {
    ensureEnabled()
    const userId = parse(adminUserIdSchema, context.req.param('id'), 'Mã người dùng không hợp lệ.')
    parse(adminUserDeleteSchema, parseJson(await context.req.text()), 'Cần xác nhận xóa tài khoản.')
    await repository(context.get('accessToken')).delete(userId, context.get('user').id)
    return context.body(null, 204)
  })

  return routes
}

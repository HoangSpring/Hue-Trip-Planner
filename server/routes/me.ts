import { Hono, type Context, type ErrorHandler, type MiddlewareHandler } from 'hono'
import { deleteAccountRequestSchema, profileSchema, profileUpdateSchema } from '@shared/schemas'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../lib/errors'
import { createServiceRoleSupabaseClient, createUserSupabaseClient } from '../lib/supabase'
import { errorHandler } from '../middleware/errorHandler'
import { requireAuth } from '../middleware/auth'
import type { ApiEnv } from '../types'

export type MeRouteDependencies = {
  auth?: MiddlewareHandler<ApiEnv>
  createUserClient?: (token: string) => SupabaseClient
  createAdminClient?: () => SupabaseClient
  now?: () => Date
  logDeletion?: (userId: string, at: string) => void
}

async function readJson(context: Context<ApiEnv>): Promise<unknown> {
  if (!(context.req.header('content-type') ?? '').toLowerCase().includes('application/json')) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Content-Type phải là application/json.')
  }
  try { return JSON.parse(await context.req.text()) as unknown } catch {
    throw new AppError(400, 'VALIDATION_ERROR', 'Nội dung yêu cầu không phải JSON hợp lệ.')
  }
}

const routeError: ErrorHandler<ApiEnv> = (error, context) => errorHandler(error, context)

export function createMeRoutes(dependencies: MeRouteDependencies = {}) {
  const routes = new Hono<ApiEnv>()
  routes.onError(routeError)
  routes.use('*', async (context, next) => {
    context.header('Cache-Control', 'private, no-store')
    await next()
  })
  routes.use('*', dependencies.auth ?? requireAuth)
  const userClient = (token: string) => dependencies.createUserClient?.(token) ?? createUserSupabaseClient(token)

  routes.get('/me', async (context) => {
    const user = context.get('user')
    const { data, error } = await userClient(context.get('accessToken')).from('profiles')
      .select('display_name, avatar_url, role').eq('id', user.id).maybeSingle()
    if (error || !data) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể tải hồ sơ lúc này.')
    return context.json(profileSchema.parse({ id: user.id, email: user.email, displayName: data.display_name, avatarUrl: data.avatar_url, role: data.role }))
  })

  routes.patch('/me', async (context) => {
    const parsed = profileUpdateSchema.safeParse(await readJson(context))
    if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Tên hiển thị chưa hợp lệ.', parsed.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })))
    const user = context.get('user')
    const { data, error } = await userClient(context.get('accessToken')).from('profiles')
      .update({ display_name: parsed.data.displayName }).eq('id', user.id).select('display_name, avatar_url, role').maybeSingle()
    if (error || !data) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể cập nhật hồ sơ lúc này.')
    return context.json(profileSchema.parse({ id: user.id, email: user.email, displayName: data.display_name, avatarUrl: data.avatar_url, role: data.role }))
  })

  routes.delete('/me', async (context) => {
    const parsed = deleteAccountRequestSchema.safeParse(await readJson(context))
    if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Để xóa tài khoản, hãy nhập chính xác XOA.')
    const userId = context.get('user').id
    const adminClient = dependencies.createAdminClient?.() ?? createServiceRoleSupabaseClient()
    const { error } = await adminClient.auth.admin.deleteUser(userId)
    if (error) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể xóa tài khoản lúc này.')
    ;(dependencies.logDeletion ?? ((id, at) => console.info('account_deleted', { userId: id, at })))(userId, (dependencies.now ?? (() => new Date()))().toISOString())
    return context.body(null, 204)
  })

  return routes
}

import type { MiddlewareHandler } from 'hono'
import { AppError } from '../lib/errors'
import { createUserSupabaseClient } from '../lib/supabase'
import type { ApiEnv } from '../types'

export type { AuthUser } from '../types'

const unauthorized = () => new AppError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập để tiếp tục.')

export const requireAuth: MiddlewareHandler<ApiEnv> = async (context, next) => {
  const authorization = context.req.header('Authorization')
  const match = authorization?.match(/^Bearer\s+(.+)$/i)
  if (!match) throw unauthorized()

  let client
  try {
    client = createUserSupabaseClient(match[1])
  } catch {
    throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Dịch vụ xác thực chưa sẵn sàng.')
  }

  const { data, error } = await client.auth.getUser(match[1])
  if (error || !data.user) throw unauthorized()
  context.set('user', { id: data.user.id, email: data.user.email ?? null })
  context.set('accessToken', match[1])
  await next()
}

export const requireAdmin: MiddlewareHandler<ApiEnv> = async (context, next) => {
  const client = createUserSupabaseClient(context.get('accessToken'))
  const { data, error } = await client.from('profiles').select('role').eq('id', context.get('user').id).single()
  if (error) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể kiểm tra quyền quản trị.')
  if (data?.role !== 'admin') throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền thực hiện thao tác này.')
  await next()
}

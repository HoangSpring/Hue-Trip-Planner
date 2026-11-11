import type { AdminUser, adminUserListQuerySchema } from '@shared/schemas/adminUser'
import type { z } from 'zod'
import { AppError } from '../lib/errors'
import { createServiceRoleSupabaseClient, createUserSupabaseClient } from '../lib/supabase'

export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>
export type AdminUserList = { items: AdminUser[]; page: number; pageSize: number; hasNext: boolean }
export type AdminDashboard = { users: number; places: { total: number; published: number; draft: number }; trips: number }

export interface AdminUserRepository {
  dashboard(): Promise<AdminDashboard>
  list(query: AdminUserListQuery): Promise<AdminUserList>
  updateRole(userId: string, actorId: string, role: 'user' | 'admin'): Promise<AdminUser>
  setSuspended(userId: string, actorId: string, suspended: boolean): Promise<AdminUser>
  delete(userId: string, actorId: string): Promise<void>
}

type ProfileRow = { id: string; display_name: string | null; role: 'user' | 'admin'; is_suspended: boolean }

function unavailable(): AppError {
  return new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể thực hiện thao tác quản lý người dùng lúc này.')
}

function notFound(): AppError {
  return new AppError(404, 'NOT_FOUND', 'Không tìm thấy người dùng.')
}

function conflict(message: string): AppError {
  return new AppError(409, 'CONFLICT', message)
}

function serviceClient() {
  try { return createServiceRoleSupabaseClient() } catch { throw unavailable() }
}

function toAdminUser(user: {
  id: string
  email?: string
  created_at: string
  last_sign_in_at?: string
  banned_until?: string
}, profile?: ProfileRow): AdminUser {
  return {
    id: user.id,
    email: user.email ?? null,
    displayName: profile?.display_name ?? null,
    role: profile?.role ?? 'user',
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    suspended: profile?.is_suspended ?? false,
    bannedUntil: user.banned_until ?? null,
  }
}

export class SupabaseAdminUserRepository implements AdminUserRepository {
  constructor(private readonly accessToken: string) {}

  async dashboard(): Promise<AdminDashboard> {
    const client = serviceClient()
    const [users, places, published, draft, trips] = await Promise.all([
      client.from('profiles').select('id', { count: 'exact', head: true }),
      client.from('places').select('id', { count: 'exact', head: true }),
      client.from('places').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      client.from('places').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
      client.from('trips').select('id', { count: 'exact', head: true }),
    ])
    if ([users, places, published, draft, trips].some(result => result.error)) throw unavailable()
    return {
      users: users.count ?? 0,
      places: { total: places.count ?? 0, published: published.count ?? 0, draft: draft.count ?? 0 },
      trips: trips.count ?? 0,
    }
  }

  async list(query: AdminUserListQuery): Promise<AdminUserList> {
    const auth = serviceClient()
    const profiles = createUserSupabaseClient(this.accessToken)
    const { data, error } = await auth.auth.admin.listUsers({ page: query.page, perPage: query.pageSize + 1 })
    if (error) throw unavailable()
    const hasNext = data.users.length > query.pageSize
    const users = data.users.slice(0, query.pageSize)
    const profileResult = users.length
      ? await profiles.from('profiles').select('id,display_name,role,is_suspended').in('id', users.map(user => user.id))
      : { data: [], error: null }
    if (profileResult.error) throw unavailable()
    const profileMap = new Map((profileResult.data ?? []).map(profile => [profile.id, profile as ProfileRow]))
    return { items: users.map(user => toAdminUser(user, profileMap.get(user.id))), page: query.page, pageSize: query.pageSize, hasNext }
  }

  async updateRole(userId: string, actorId: string, role: 'user' | 'admin'): Promise<AdminUser> {
    const client = createUserSupabaseClient(this.accessToken)
    const auth = serviceClient()
    const { data: authUser, error: authError } = await auth.auth.admin.getUserById(userId)
    if (authError || !authUser.user) throw notFound()
    const { error } = await client.rpc('admin_set_user_role', { p_user_id: userId, p_role: role })
    if (error?.code === '42501') throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền đổi vai trò người dùng.')
    if (error?.code === 'PT404') throw notFound()
    if (error?.code === 'PT409') throw conflict(error.message.includes('LAST_ADMIN_REQUIRED')
      ? 'Không thể hạ quyền quản trị viên cuối cùng.'
      : 'Không thể tự thay đổi vai trò của tài khoản đang đăng nhập.')
    if (error) throw unavailable()
    const { data: updated, error: profileError } = await client.from('profiles')
      .select('id,display_name,role,is_suspended').eq('id', userId).single()
    if (profileError || !updated) throw unavailable()
    if (userId === actorId && updated.role !== role) throw conflict('Không thể tự thay đổi vai trò của tài khoản đang đăng nhập.')
    return toAdminUser(authUser.user, updated as ProfileRow)
  }

  async setSuspended(userId: string, actorId: string, suspended: boolean): Promise<AdminUser> {
    if (userId === actorId) throw conflict('Không thể tự khóa tài khoản đang đăng nhập.')
    const auth = serviceClient()
    const { data: target, error: targetError } = await auth.auth.admin.getUserById(userId)
    if (targetError || !target.user) throw notFound()
    const profiles = createUserSupabaseClient(this.accessToken)
    const { data: current, error: currentError } = await profiles.from('profiles')
      .select('id,display_name,role,is_suspended').eq('id', userId).maybeSingle()
    if (currentError) throw unavailable()
    if (!current) throw notFound()

    if (suspended) {
      const { error: profileError } = await profiles.from('profiles').update({ is_suspended: true }).eq('id', userId)
      if (profileError) throw unavailable()
      const { error: banError } = await auth.auth.admin.updateUserById(userId, { ban_duration: '876000h' })
      if (banError) {
        await profiles.from('profiles').update({ is_suspended: false }).eq('id', userId)
        throw unavailable()
      }
    } else {
      const { error: unbanError } = await auth.auth.admin.updateUserById(userId, { ban_duration: 'none' })
      if (unbanError) throw unavailable()
      const { error: profileError } = await profiles.from('profiles').update({ is_suspended: false }).eq('id', userId)
      if (profileError) {
        await auth.auth.admin.updateUserById(userId, { ban_duration: '876000h' })
        throw unavailable()
      }
    }
    const { data: refreshed, error: refreshError } = await auth.auth.admin.getUserById(userId)
    if (refreshError || !refreshed.user) throw unavailable()
    return toAdminUser(refreshed.user, { ...current, is_suspended: suspended } as ProfileRow)
  }

  async delete(userId: string, actorId: string): Promise<void> {
    if (userId === actorId) throw conflict('Không thể xóa tài khoản đang đăng nhập.')
    const profiles = createUserSupabaseClient(this.accessToken)
    const { data: target, error: targetError } = await profiles.from('profiles')
      .select('id,role').eq('id', userId).maybeSingle()
    if (targetError) throw unavailable()
    if (!target) throw notFound()
    if (target.role === 'admin') throw conflict('Hãy hạ quyền quản trị viên trước khi xóa tài khoản.')
    const { error } = await serviceClient().auth.admin.deleteUser(userId)
    if (error) throw conflict('Không thể xóa tài khoản. Kiểm tra tài khoản có đang sở hữu tệp trong Storage không.')
  }
}

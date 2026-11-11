import type { MiddlewareHandler } from 'hono'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../lib/errors'
import type { AdminDashboard, AdminUserList, AdminUserRepository } from '../services/adminUserRepository'
import { createAdminUserRoutes } from './adminUsers'
import type { ApiEnv } from '../types'

const actorId = 'a0000000-0000-4000-8000-000000000001'
const userId = 'b0000000-0000-4000-8000-000000000002'
const timestamp = '2026-11-01T00:00:00.000Z'

const user = {
  id: userId, email: 'user@example.test', displayName: 'Người dùng', role: 'user' as const,
  createdAt: timestamp, lastSignInAt: null, suspended: false, bannedUntil: null,
}

class MemoryAdminUserRepository implements AdminUserRepository {
  deleted: string[] = []
  async dashboard(): Promise<AdminDashboard> { return { users: 2, places: { total: 8, published: 5, draft: 3 }, trips: 4 } }
  async list(): Promise<AdminUserList> { return { items: [user], page: 1, pageSize: 25, hasNext: false } }
  async updateRole(id: string, actor: string, role: 'user' | 'admin') {
    if (id === actor) throw new AppError(409, 'CONFLICT', 'Không thể tự thay đổi vai trò.')
    return { ...user, role }
  }
  async setSuspended(id: string, actor: string, suspended: boolean) {
    if (id === actor) throw new AppError(409, 'CONFLICT', 'Không thể tự khóa tài khoản.')
    return { ...user, suspended, bannedUntil: suspended ? '2126-11-01T00:00:00.000Z' : null }
  }
  async delete(id: string, actor: string) {
    if (id === actor) throw new AppError(409, 'CONFLICT', 'Không thể tự xóa tài khoản.')
    this.deleted.push(id)
  }
}

function api(repository = new MemoryAdminUserRepository()) {
  const auth: MiddlewareHandler<ApiEnv> = async (context, next) => {
    const token = context.req.header('authorization')?.replace(/^Bearer /i, '')
    if (!token) throw new AppError(401, 'UNAUTHENTICATED', 'Vui lòng đăng nhập.')
    context.set('user', { id: token === 'admin' ? actorId : userId, email: null })
    context.set('accessToken', token)
    await next()
  }
  const authorizeAdmin: MiddlewareHandler<ApiEnv> = async (context, next) => {
    if (context.get('accessToken') !== 'admin') throw new AppError(403, 'FORBIDDEN', 'Bạn không có quyền.')
    await next()
  }
  const routes = createAdminUserRoutes({ auth, authorizeAdmin, createRepository: () => repository })
  return { repository, request: (path: string, init: RequestInit = {}) => routes.request(path, init) }
}

const adminHeaders = { Authorization: 'Bearer admin' }

describe('admin user routes', () => {
  beforeEach(() => vi.stubEnv('ADMIN_USER_MANAGEMENT_ENABLED', 'true'))
  afterEach(() => vi.unstubAllEnvs())

  it('requires an admin for dashboard and user management', async () => {
    const testApi = api()
    expect((await testApi.request('/admin/dashboard')).status).toBe(401)
    expect((await testApi.request('/admin/users', { headers: { Authorization: 'Bearer user' } })).status).toBe(403)
  })

  it('returns dashboard counts and paginated users without private auth payloads', async () => {
    const testApi = api()
    const dashboard = await testApi.request('/admin/dashboard', { headers: adminHeaders })
    expect(dashboard.status).toBe(200)
    expect(await dashboard.json()).toEqual({ users: 2, places: { total: 8, published: 5, draft: 3 }, trips: 4 })
    expect(dashboard.headers.get('cache-control')).toBe('private, no-store')
    const users = await testApi.request('/admin/users?page=1', { headers: adminHeaders })
    expect(users.status).toBe(200)
    expect(await users.json()).toMatchObject({ items: [{ id: userId, role: 'user', suspended: false }], hasNext: false })
  })

  it('updates a user role and suspension using strict request bodies', async () => {
    const testApi = api()
    const role = await testApi.request(`/admin/users/${userId}/role`, { method: 'PATCH', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin' }) })
    expect(role.status).toBe(200)
    expect((await role.json()).role).toBe('admin')
    const suspended = await testApi.request(`/admin/users/${userId}/suspension`, { method: 'POST', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ suspended: true }) })
    expect(suspended.status).toBe(200)
    expect((await suspended.json()).suspended).toBe(true)
    const extra = await testApi.request(`/admin/users/${userId}/role`, { method: 'PATCH', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ role: 'admin', extra: true }) })
    expect(extra.status).toBe(400)
  })

  it('requires explicit delete confirmation and never deletes the acting admin', async () => {
    const testApi = api()
    const missingConfirm = await testApi.request(`/admin/users/${userId}`, { method: 'DELETE', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: 'no' }) })
    expect(missingConfirm.status).toBe(400)
    const deleted = await testApi.request(`/admin/users/${userId}`, { method: 'DELETE', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: 'DELETE' }) })
    expect(deleted.status).toBe(204)
    expect(testApi.repository.deleted).toEqual([userId])
    const selfDelete = await testApi.request(`/admin/users/${actorId}`, { method: 'DELETE', headers: { ...adminHeaders, 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: 'DELETE' }) })
    expect(selfDelete.status).toBe(409)
  })

  it('keeps user management disabled until the database migration is applied and configured', async () => {
    vi.stubEnv('ADMIN_USER_MANAGEMENT_ENABLED', 'false')
    const response = await api().request('/admin/users', { headers: adminHeaders })
    expect(response.status).toBe(503)
    expect((await response.json()).error.message).toContain('migration 14')
  })
})

import { Hono } from 'hono'
import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ApiEnv } from '../types'
import { createMeRoutes } from './me'

const userId = 'a0000000-0000-4000-8000-000000000001'
const profile = { display_name: 'Người đi Huế', avatar_url: null, role: 'user' as const }

function makeApp() {
  const builder = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
  }
  const userClient = { from: vi.fn().mockReturnValue(builder) } as unknown as SupabaseClient
  const deleteUser = vi.fn().mockResolvedValue({ error: null })
  const adminClient = { auth: { admin: { deleteUser } } } as unknown as SupabaseClient
  const auth = vi.fn(async (context, next) => {
    context.set('user', { id: userId, email: 'traveler@example.test' })
    context.set('accessToken', 'user-jwt')
    await next()
  })
  const logDeletion = vi.fn()
  const routes = createMeRoutes({
    auth: auth as never,
    createUserClient: vi.fn(() => userClient),
    createAdminClient: vi.fn(() => adminClient),
    now: () => new Date('2026-10-29T12:00:00.000Z'),
    logDeletion,
  })
  const app = new Hono<ApiEnv>().route('/api', routes)
  return { app, builder, deleteUser, logDeletion }
}

describe('account profile API', () => {
  it('returns the caller profile with private no-store caching', async () => {
    const { app } = makeApp()
    const response = await app.request('/api/me')
    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store')
    expect(await response.json()).toEqual({ id: userId, email: 'traveler@example.test', displayName: profile.display_name, avatarUrl: null, role: 'user' })
  })

  it('updates only a valid display name and rejects HTML or extra role fields', async () => {
    const { app, builder } = makeApp()
    const response = await app.request('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: '  Huế  ' }) })
    expect(response.status).toBe(200)
    expect(builder.update).toHaveBeenCalledWith({ display_name: 'Huế' })

    const html = await app.request('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: '<b>Admin</b>' }) })
    const role = await app.request('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: 'Tên', role: 'admin' }) })
    expect(html.status).toBe(400)
    expect(role.status).toBe(400)
    expect(builder.update).toHaveBeenCalledTimes(1)
  })

  it('requires exact account deletion confirmation and logs only user id and time', async () => {
    const { app, deleteUser, logDeletion } = makeApp()
    const invalid = await app.request('/api/me', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: 'delete' }) })
    expect(invalid.status).toBe(400)
    expect(deleteUser).not.toHaveBeenCalled()

    const valid = await app.request('/api/me', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirm: 'XOA' }) })
    expect(valid.status).toBe(204)
    expect(deleteUser).toHaveBeenCalledWith(userId)
    expect(logDeletion).toHaveBeenCalledWith(userId, '2026-10-29T12:00:00.000Z')
  })

  it('rejects a missing bearer token', async () => {
    const app = new Hono<ApiEnv>().route('/api', createMeRoutes())
    const response = await app.request('/api/me')
    expect(response.status).toBe(401)
  })
})

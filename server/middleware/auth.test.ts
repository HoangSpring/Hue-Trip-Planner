import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'
import { errorHandler } from './errorHandler'
import { requireAdmin, requireAuth } from './auth'
import { requestIdMiddleware } from './requestId'
import type { ApiEnv } from '../types'

const { createUserSupabaseClient } = vi.hoisted(() => ({ createUserSupabaseClient: vi.fn() }))
vi.mock('../lib/supabase', () => ({ createUserSupabaseClient }))

function createTestApp(role: 'user' | 'admin' = 'user', suspended = false) {
  createUserSupabaseClient.mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'test@example.com' } }, error: null }) },
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: { is_suspended: suspended }, error: null }),
    }) }) }),
  })
  const app = new Hono<ApiEnv>()
  app.use('*', requestIdMiddleware)
  app.onError(errorHandler)
  app.get('/private', requireAuth, (context) => context.json({ id: context.get('user').id }))
  app.get('/admin', requireAuth, requireAdmin, (context) => context.json({ ok: true }))
  app.get('/broken', () => { throw new Error('internal stack detail') })
  return app
}

describe('API auth middleware', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.unstubAllEnvs())

  it('returns a normalized 401 and request id when the token is missing', async () => {
    const response = await createTestApp().request('/private')
    expect(response.status).toBe(401)
    expect(response.headers.get('X-Request-Id')).toMatch(/^req_/)
    expect(await response.json()).toMatchObject({ error: { code: 'UNAUTHENTICATED' } })
  })

  it('returns 403 for a signed-in user without the admin role', async () => {
    const response = await createTestApp('user').request('/admin', { headers: { Authorization: 'Bearer valid-token' } })
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ error: { code: 'FORBIDDEN' } })
  })

  it('allows an admin and echoes a valid request id', async () => {
    const response = await createTestApp('admin').request('/admin', {
      headers: { Authorization: 'Bearer valid-token', 'X-Request-Id': 'req_client_1' },
    })
    expect(response.status).toBe(200)
    expect(response.headers.get('X-Request-Id')).toBe('req_client_1')
  })

  it('blocks a suspended user even with an otherwise valid access token when management is enabled', async () => {
    vi.stubEnv('ADMIN_USER_MANAGEMENT_ENABLED', 'true')
    const response = await createTestApp('user', true).request('/private', { headers: { Authorization: 'Bearer still-valid-token' } })
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ error: { code: 'FORBIDDEN', message: expect.stringContaining('đã bị khóa') } })
  })

  it('normalizes unexpected errors without exposing internal details', async () => {
    const response = await createTestApp().request('/broken')
    const body = await response.json()
    expect(response.status).toBe(500)
    expect(body).toMatchObject({ error: { code: 'INTERNAL_ERROR', message: 'Đã có lỗi xảy ra. Vui lòng thử lại.' } })
    expect(JSON.stringify(body)).not.toContain('internal stack detail')
  })
})

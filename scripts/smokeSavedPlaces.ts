import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/supabase'

function loadEnvironment(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
      if (!match || process.env[match[1]]) continue
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2').replace(/\s+#.*$/, '')
    }
  } catch { /* Missing configuration is reported below without exposing values. */ }
  process.env.SUPABASE_URL ||= process.env.VITE_SUPABASE_URL
  process.env.SUPABASE_ANON_KEY ||= process.env.VITE_SUPABASE_ANON_KEY
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function main(): Promise<void> {
  loadEnvironment()
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'TEST_USER_A_EMAIL', 'TEST_USER_A_PASSWORD'] as const
  const missing = required.filter((name) => !process.env[name])
  assert(missing.length === 0, `Thiếu biến môi trường: ${missing.join(', ')}`)

  const client = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: auth, error: authError } = await client.auth.signInWithPassword({
    email: process.env.TEST_USER_A_EMAIL!,
    password: process.env.TEST_USER_A_PASSWORD!,
  })
  if (authError || !auth.session) {
    const failed = authError as (typeof authError & { error_code?: string })
    throw new Error(`Đăng nhập tài khoản thử thất bại: HTTP ${failed?.status ?? 'unknown'}, error_code=${failed?.code ?? failed?.error_code ?? 'unknown'}`)
  }
  const token = auth.session.access_token
  const userClient = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: savedBefore, error: savedError } = await userClient.from('saved_places').select('place_id').eq('user_id', auth.user.id)
  assert(!savedError, `Không đọc được danh sách đã lưu (${savedError?.code ?? 'unknown'}).`)
  const existing = new Set((savedBefore ?? []).map((row) => row.place_id))
  const { data: places, error: placesError } = await client.from('places').select('id').eq('status', 'published').limit(100)
  assert(!placesError, `Không đọc được địa điểm công khai (${placesError?.code ?? 'unknown'}).`)
  const placeId = (places ?? []).find((place) => !existing.has(place.id))?.id
  assert(placeId, 'Không có địa điểm published chưa lưu để kiểm tra an toàn; không ghi dữ liệu.')

  const useVercelHandler = process.argv.includes('--vercel-handler')
  const requestApi = useVercelHandler
    ? async (path: string, init: RequestInit = {}) => {
        const { default: handler } = await import('../api/[[...route]].ts')
        return handler.fetch(new Request(new URL(path, 'http://localhost'), init))
      }
    : async (path: string, init: RequestInit = {}) => {
        const { app } = await import('../server/app')
        return app.request(path, init)
      }
  let putWasAttempted = false
  try {
    putWasAttempted = true
    const put = await requestApi(`/api/saved/${placeId}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } })
    await assertStatus(put, 204, 'PUT /api/saved')

    const list = await requestApi('/api/saved', { headers: { Authorization: `Bearer ${token}` } })
    await assertStatus(list, 200, 'GET /api/saved')
    const listBody: unknown = await list.json()
    assert(isSaved(listBody, placeId), 'GET /api/saved không trả địa điểm vừa lưu.')

    const remove = await requestApi(`/api/saved/${placeId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    await assertStatus(remove, 204, 'DELETE /api/saved')
    const afterDelete = await requestApi('/api/saved', { headers: { Authorization: `Bearer ${token}` } })
    await assertStatus(afterDelete, 200, 'GET /api/saved sau khi xóa')
    assert(!isSaved(await afterDelete.json(), placeId), 'Địa điểm vẫn còn trong danh sách sau khi bỏ lưu.')
    console.log(`smoke:saved PASS (${useVercelHandler ? 'Vercel handler' : 'Hono app'}) — PUT, GET, DELETE, danh sách sau xóa đều đúng; dữ liệu thử đã được dọn.`)
  } finally {
    if (putWasAttempted) {
      const cleanup = await requestApi(`/api/saved/${placeId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
      if (cleanup.status !== 204) {
        const { error } = await userClient.from('saved_places').delete().eq('user_id', auth.user.id).eq('place_id', placeId)
        console.error(error
          ? `smoke:saved cleanup thất bại: API HTTP ${cleanup.status}, database code=${error.code ?? 'unknown'}.`
          : `smoke:saved cleanup đã dùng đường dự phòng trực tiếp sau API HTTP ${cleanup.status}.`)
      }
    }
    await client.auth.signOut()
  }
}

async function errorCode(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null && 'error' in body) {
      const error = body.error
      if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') return `; code=${error.code}`
    }
  } catch { /* Do not print arbitrary server response bodies. */ }
  return ''
}

async function assertStatus(response: Response, expected: number, operation: string): Promise<void> {
  if (response.status === expected) return
  throw new Error(`${operation} trả HTTP ${response.status}${await errorCode(response)}.`)
}

function isSaved(value: unknown, placeId: string): boolean {
  if (typeof value !== 'object' || value === null || !('items' in value) || !Array.isArray(value.items)) return false
  return value.items.some((item: unknown) => typeof item === 'object' && item !== null && 'id' in item && item.id === placeId)
}

main().catch((error: unknown) => {
  console.error(`smoke:saved FAIL — ${error instanceof Error ? error.message : 'Lỗi không xác định'}`)
  process.exitCode = 1
})

import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { itineraryEvalCases } from '../server/itinerary/evalCases'
import { generateTrip } from '../server/itinerary/fallback'
import { SupabasePlacesRepo } from '../server/itinerary/placesRepo'

type Check = { name: string; status: 'PASS' | 'FAIL' | 'SKIP'; details: string }
type ApiResult = { status: number; body: unknown }

const checks: Check[] = []
const createdIds: string[] = []
let accessTokenA = ''
let baseUrl = process.env.SMOKE_TRIPS_API_URL ?? 'http://127.0.0.1:8787'

function record(name: string, status: Check['status'], details: string): void { checks.push({ name, status, details }) }
function jsonValue(value: unknown): Record<string, unknown> { return value as Record<string, unknown> }

function loadEnvironment(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
      if (!match || process.env[match[1]]) continue
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2').replace(/\s+#.*$/, '')
    }
  } catch { /* Configuration errors are reported without echoing file contents. */ }
  process.env.SUPABASE_URL ||= process.env.VITE_SUPABASE_URL
  process.env.SUPABASE_ANON_KEY ||= process.env.VITE_SUPABASE_ANON_KEY
  baseUrl = baseUrl.replace(/\/$/, '')
}

function remoteHasMigration10(): boolean {
  try {
    const output = execFileSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['exec', 'supabase', 'migration', 'list'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], shell: process.platform === 'win32' })
    return output.split(/\r?\n/).some((line) => {
      const [local, remote] = line.split('|').map((column) => column.replace(/`/g, '').trim())
      return local === '20261029000010' && remote === '20261029000010'
    })
  } catch { return false }
}

async function login(email: string, password: string): Promise<string> {
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('missing_supabase_config')
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await client.auth.signInWithPassword({ email, password })
  if (error || !data.session?.access_token) throw new Error('test_login_failed')
  return data.session.access_token
}

async function request(path: string, method: string, token: string, body?: unknown): Promise<ApiResult> {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const responseBody: unknown = response.status === 204 ? null : await response.json().catch(() => null)
  return { status: response.status, body: responseBody }
}

function tripId(result: ApiResult): string | null {
  const id = jsonValue(result.body).id
  return typeof id === 'string' ? id : null
}

function printResults(): void {
  console.log('\nKết quả smoke:trips')
  console.log('| Kiểm tra | Kết quả | Chi tiết |')
  console.log('|---|---|---|')
  for (const check of checks) console.log(`| ${check.name} | ${check.status} | ${check.details} |`)
  const pass = checks.filter(({ status }) => status === 'PASS').length
  const fail = checks.filter(({ status }) => status === 'FAIL').length
  const skip = checks.filter(({ status }) => status === 'SKIP').length
  console.log(`\nTổng: ${pass} đạt, ${fail} lỗi, ${skip} bỏ qua.`)
  if (fail > 0) process.exitCode = 1
}

async function main(): Promise<void> {
  loadEnvironment()
  if (!remoteHasMigration10()) {
    record('Migration 10 đã áp dụng trên remote', 'SKIP', 'Chưa thấy 20261029000010 trên remote; không tạo trip nào.')
    printResults()
    process.exitCode = 1
    return
  }
  record('Migration 10 đã áp dụng trên remote', 'PASS', '20261029000010 hiện diện.')

  const missing = ['TEST_USER_A_EMAIL', 'TEST_USER_A_PASSWORD', 'TEST_USER_B_EMAIL', 'TEST_USER_B_PASSWORD']
    .filter((name) => !process.env[name])
  if (missing.length) {
    record('Tài khoản thử A/B', 'SKIP', `Thiếu cấu hình: ${missing.join(', ')}; không gọi Auth/API.`)
    printResults()
    process.exitCode = 1
    return
  }

  try {
    const { data: health } = await fetch(`${baseUrl}/api/health`).then(async (response) => ({ data: response.status }))
    if (health !== 200) throw new Error('local_api_unavailable')
    record('API cục bộ', 'PASS', 'GET /api/health trả 200.')
    accessTokenA = await login(process.env.TEST_USER_A_EMAIL!, process.env.TEST_USER_A_PASSWORD!)
    const accessTokenB = await login(process.env.TEST_USER_B_EMAIL!, process.env.TEST_USER_B_PASSWORD!)
    record('Supabase Auth thử nghiệm', 'PASS', 'Hai tài khoản thử đăng nhập được; token không hiển thị.')

    const { createPublicSupabaseClient } = await import('../server/lib/supabase')
    const repo = new SupabasePlacesRepo(createPublicSupabaseClient())
    const generated = await generateTrip(repo, itineraryEvalCases[0].input, { now: new Date(), seed: randomUUID(), clientDraftId: randomUUID() })
    record('Tạo fixture trip bằng fallback', 'PASS', `${generated.draft.days.length} ngày, chỉ dùng place published; không gọi endpoint generate.`)

    const created = await request('/trips', 'POST', accessTokenA, generated.draft)
    const originalId = tripId(created)
    if (created.status !== 201 || !originalId) {
      console.error('SERVER ERROR RESPONSE:', created.status, JSON.stringify(created.body, null, 2))
      throw new Error('trip_create_failed')
    }
    createdIds.push(originalId)
    record('A tạo trip', 'PASS', 'POST trả 201.')

    const fetched = await request(`/trips/${originalId}`, 'GET', accessTokenA)
    if (fetched.status !== 200) throw new Error('trip_read_failed')
    record('A đọc trip', 'PASS', 'GET trả 200 và trả trip đã hydrate.')

    const renamed = await request(`/trips/${originalId}`, 'PATCH', accessTokenA, { title: 'Smoke test trip' })
    if (renamed.status !== 200) throw new Error('trip_patch_failed')
    let current = jsonValue(renamed.body)
    const initialUpdatedAt = String(jsonValue(fetched.body).updatedAt)
    const makePut = (expectedUpdatedAt: string) => ({ expectedUpdatedAt, title: String(current.title), startDate: current.startDate, days: current.days })

    const firstSave = await request(`/trips/${originalId}`, 'PUT', accessTokenA, makePut(String(current.updatedAt)))
    if (firstSave.status !== 200) throw new Error('trip_first_save_failed')
    current = jsonValue(jsonValue(firstSave.body).trip)
    const itemCount = Array.isArray((current.days as Array<{ items?: unknown[] }>)[0]?.items) ? (current.days as Array<{ items: unknown[] }>)[0].items.length : 0
    const secondSave = await request(`/trips/${originalId}`, 'PUT', accessTokenA, makePut(String(current.updatedAt)))
    if (secondSave.status !== 200) throw new Error('trip_second_save_failed')
    const secondTrip = jsonValue(jsonValue(secondSave.body).trip)
    const secondItemCount = Array.isArray((secondTrip.days as Array<{ items?: unknown[] }>)[0]?.items) ? (secondTrip.days as Array<{ items: unknown[] }>)[0].items.length : 0
    if (itemCount !== secondItemCount) throw new Error('repeat_save_duplicated_items')
    record('A PUT lưu hai lần', 'PASS', 'Cả hai trả 200; số item không tăng.')

    const conflict = await request(`/trips/${originalId}`, 'PUT', accessTokenA, makePut(initialUpdatedAt))
    if (conflict.status !== 409 || !jsonValue(jsonValue(conflict.body).error).details) throw new Error('trip_conflict_missing')
    record('PUT với phiên bản cũ', 'PASS', '409 CONFLICT kèm current.')

    const duplicate = await request(`/trips/${originalId}/duplicate`, 'POST', accessTokenA)
    const copyId = tripId(duplicate)
    if (duplicate.status !== 201 || !copyId) throw new Error('trip_duplicate_failed')
    createdIds.push(copyId)
    const copied = jsonValue(duplicate.body)
    const originalDays = jsonValue(fetched.body).days as Array<{ id: string; items: Array<{ id: string }> }>
    const copiedDays = copied.days as Array<{ id: string; items: Array<{ id: string }> }>
    if (copied.clientDraftId !== null || copied.shareToken !== null || copiedDays[0]?.id === originalDays[0]?.id || copiedDays[0]?.items[0]?.id === originalDays[0]?.items[0]?.id) {
      throw new Error('trip_duplicate_inherited_identity')
    }
    record('A nhân bản trip', 'PASS', '201; endpoint trả bản sao mới.')

    const bGet = await request(`/trips/${originalId}`, 'GET', accessTokenB)
    const bPut = await request(`/trips/${originalId}`, 'PUT', accessTokenB, makePut(String(current.updatedAt)))
    const bDelete = await request(`/trips/${originalId}`, 'DELETE', accessTokenB)
    if ([bGet.status, bPut.status, bDelete.status].some((status) => status !== 404)) throw new Error('user_isolation_failed')
    record('B không đọc/sửa/xóa trip của A', 'PASS', 'GET, PUT, DELETE đều trả 404.')

    for (const id of [...createdIds]) {
      const removed = await request(`/trips/${id}`, 'DELETE', accessTokenA)
      if (removed.status !== 204) throw new Error('trip_cleanup_failed')
      createdIds.splice(createdIds.indexOf(id), 1)
    }
    record('Dọn dữ liệu thử', 'PASS', 'Đã xóa toàn bộ trip được tạo bởi smoke.')
  } catch (error) {
    const label = error instanceof Error ? error.message : 'unknown_error'
    record('Luồng smoke', 'FAIL', label)
  } finally {
    for (const id of createdIds) {
      try {
        const result = await request(`/trips/${id}`, 'DELETE', accessTokenA)
        if (result.status !== 204) record('Dọn trip thử', 'FAIL', 'Không xóa được; cần chủ dự án kiểm tra thủ công.')
      } catch { record('Dọn trip thử', 'FAIL', 'Không thể xác nhận xóa; cần chủ dự án kiểm tra thủ công.') }
    }
    printResults()
  }
}

await main()

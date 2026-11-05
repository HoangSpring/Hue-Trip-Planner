import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/types/supabase'

type Result = { name: string; status: 'PASS' | 'FAIL' | 'SKIP'; detail: string }
const results: Result[] = []
const prefix = `zz-test-${randomUUID().slice(0, 8)}`
const placeIds = new Set<string>()
const slugs = new Set<string>()
const baseUrl = (process.env.SMOKE_ADMIN_API_URL ?? 'http://127.0.0.1:8787').replace(/\/$/, '')

function loadEnvironment(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
      if (!match || process.env[match[1]]) continue
      process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2').replace(/\s+#.*$/, '')
    }
  } catch { /* The missing configuration is reported by name only. */ }
}

function record(name: string, status: Result['status'], detail: string): void { results.push({ name, status, detail }) }
function report(): void {
  console.log('\nKết quả smoke:admin')
  console.log('| Kiểm tra | Kết quả | Chi tiết |\n|---|---|---|')
  for (const row of results) console.log(`| ${row.name} | ${row.status} | ${row.detail} |`)
  const pass = results.filter(({ status }) => status === 'PASS').length
  const fail = results.filter(({ status }) => status === 'FAIL').length
  const skip = results.filter(({ status }) => status === 'SKIP').length
  console.log(`\nTổng: ${pass} đạt, ${fail} lỗi, ${skip} bỏ qua.`)
  if (fail || skip) process.exitCode = 1
}

async function getToken(email: string, password: string, url: string, anonKey: string): Promise<string> {
  const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await auth.auth.signInWithPassword({ email, password })
  if (error || !data.session?.access_token) {
    const authError = error as (typeof error & { error_code?: string })
    const code = authError?.code ?? authError?.error_code ?? 'not_returned'
    const status = authError?.status ?? 'not_returned'
    throw new Error(`Đăng nhập tài khoản thử thất bại: HTTP ${status}, error_code=${code}. Kiểm tra tên biến môi trường; nguyên nhân thường gặp: thiếu cấu hình/tài khoản thử, tài khoản không tồn tại, email chưa xác nhận hoặc sai mật khẩu.`)
  }
  return data.session.access_token
}

async function main(): Promise<void> {
  loadEnvironment()
  const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'ADMIN_TEST_EMAIL', 'ADMIN_TEST_PASSWORD', 'TEST_USER_A_EMAIL', 'TEST_USER_A_PASSWORD']
  const missing = required.filter((name) => !process.env[name])
  if (missing.length) {
    record('Cấu hình smoke', 'SKIP', `Thiếu biến: ${missing.join(', ')}; chưa gọi Auth/API.`)
    report()
    return
  }
  let migrationOutput = ''
  try {
    migrationOutput = execFileSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', ['exec', 'supabase', 'migration', 'list'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], shell: process.platform === 'win32',
    })
  } catch { /* Summarize the missing prerequisite without exposing environment output. */ }
  const migrationHasLocalAndRemote = (version: string) => {
    const row = migrationOutput.split(/\r?\n/).find((line) => line.includes(version))
    return (row?.match(new RegExp(version, 'g'))?.length ?? 0) >= 2
  }
  if (!migrationHasLocalAndRemote('20261104000011') || !migrationHasLocalAndRemote('20261104000012')) {
    record('Migration 11–12 đã áp dụng', 'SKIP', 'Không xác nhận được migration 11 và 12 ở cả cột local/remote; không tạo dữ liệu thử.')
    report()
    return
  }
  record('Migration 11–12 đã áp dụng', 'PASS', 'Cả hai phiên bản hiện diện ở local và remote.')
  const importRpcApplied = migrationHasLocalAndRemote('20261105000013')

  const supabaseUrl = process.env.VITE_SUPABASE_URL!
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY!
  const admin = createClient<Database>(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  try {
    const health = await fetch(`${baseUrl}/api/health`)
    if (!health.ok) throw new Error('local_api_unavailable')
    record('API cục bộ', 'PASS', 'GET /api/health trả 200.')
    const [adminToken, userToken] = await Promise.all([
      getToken(process.env.ADMIN_TEST_EMAIL!, process.env.ADMIN_TEST_PASSWORD!, supabaseUrl, anonKey),
      getToken(process.env.TEST_USER_A_EMAIL!, process.env.TEST_USER_A_PASSWORD!, supabaseUrl, anonKey),
    ])
    record('Supabase Auth thử nghiệm', 'PASS', 'Admin và user thường đăng nhập được; token không hiển thị.')

    const request = async (path: string, token: string, method = 'GET', body?: unknown, contentType = 'application/json') => {
      const response = await fetch(`${baseUrl}/api${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { 'Content-Type': contentType }) },
        ...(body === undefined ? {} : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
      })
      return { status: response.status, body: response.status === 204 ? null : await response.json().catch(() => null) as unknown }
    }
    const forbidden = await request('/admin/places', userToken)
    if (forbidden.status !== 403) throw new Error('regular_user_not_forbidden')
    record('User thường bị chặn', 'PASS', 'GET /api/admin/places trả 403.')

    const slug = `${prefix}-place`
    slugs.add(slug)
    const input = {
      slug, name: 'Smoke địa điểm', category: 'heritage', shortDescription: 'Dữ liệu thử tự dọn sau khi chạy.',
      description: null, address: null, area: 'Huế', lat: 16.46, lng: 107.59, openTime: null, closeTime: null,
      closedDays: [], openingNote: null, visitDurationMin: 30, priceLevel: null, ticketPriceVnd: null, priceNote: null,
      bestTime: [], mealType: [], suitableFor: [], walkingIntensity: null, phone: null, website: null,
      coverImageUrl: null, coverImageAlt: null, imageCredit: null, imageLicense: null, imageSourceUrl: null,
      source: 'smoke-admin', sourceUrl: null, osmId: null, googlePlaceId: null, featured: false, sortOrder: 0, status: 'draft', tags: [],
    }
    const created = await request('/admin/places', adminToken, 'POST', input)
    const place = created.body as { id?: string }
    if (created.status !== 201 || !place.id) throw new Error('admin_place_create_failed')
    placeIds.add(place.id)
    record('Tạo địa điểm nháp', 'PASS', 'POST trả 201 với slug zz-test-* .')
    const updated = await request(`/admin/places/${place.id}`, adminToken, 'PUT', { ...input, name: 'Smoke địa điểm đã sửa' })
    if (updated.status !== 200) throw new Error('admin_place_update_failed')
    const publish = await request(`/admin/places/${place.id}/status`, adminToken, 'POST', { status: 'published' })
    if (publish.status !== 422) throw new Error('incomplete_place_publish_not_blocked')
    record('Xuất bản thiếu ảnh bị chặn', 'PASS', 'Trạng thái nháp không thể xuất bản khi thiếu ảnh/ghi công.')
    const verified = await request(`/admin/places/${place.id}/verify`, adminToken, 'POST', { verified: true })
    if (verified.status !== 200) throw new Error('admin_place_verify_failed')
    const archived = await request(`/admin/places/${place.id}/status`, adminToken, 'POST', { status: 'archived' })
    if (archived.status !== 200) throw new Error('admin_place_archive_failed')

    const importCsv = [
      'slug,name,category,short_description,lat,lng',
      ...[1, 2, 3].map((n) => `${prefix}-import-${n},Smoke import ${n},heritage,Mẫu kiểm thử,16.46,107.59`),
    ].join('\n')
    for (const n of [1, 2, 3]) slugs.add(`${prefix}-import-${n}`)
    const preview = await request('/admin/import/preview', adminToken, 'POST', importCsv, 'text/csv')
    if (preview.status !== 200) throw new Error('admin_import_preview_failed')
    const committed = await request('/admin/import/commit', adminToken, 'POST', { csv: importCsv })
    if (importRpcApplied) {
      const result = committed.body as { created?: number }
      if (committed.status !== 200 || result.created !== 3) throw new Error('admin_import_commit_failed')
      record('Import preview/commit', 'PASS', 'Ba dòng zz-test-* được preview rồi import nguyên tử; sẽ được dọn sạch.')
    } else {
      const error = committed.body as { error?: { message?: string } }
      if (committed.status !== 503 || !error.error?.message?.includes('migration RPC import nguyên tử')) {
        throw new Error('missing_import_migration_not_reported_clearly')
      }
      record('Import commit chưa có migration 13', 'PASS', 'Preview đạt; commit trả 503 nêu rõ migration RPC còn thiếu, không ghi place/tag/audit.')
    }
  } catch (error) {
    record('Luồng smoke admin', 'FAIL', error instanceof Error ? error.message : 'admin_smoke_failed')
  } finally {
    const discovered = await admin.from('places').select('id,slug').in('slug', [...slugs])
    for (const row of discovered.data ?? []) placeIds.add(row.id)
    const ids = [...placeIds]
    let clean = true
    if (ids.length) {
      const audit = await admin.from('place_audit_log').delete().in('place_id', ids)
      const places = await admin.from('places').delete().in('id', ids)
      clean = !audit.error && !places.error
    }
    const remaining = await admin.from('places').select('id', { count: 'exact', head: true }).like('slug', `${prefix}%`)
    const remainingCount = remaining.count ?? -1
    clean = clean && !remaining.error && remainingCount === 0
    record('Dọn dữ liệu thử', clean ? 'PASS' : 'FAIL', clean
      ? `Đã xóa ${ids.length} địa điểm thử/audit; còn ${remainingCount} dòng zz-test-*.`
      : `Không xác nhận dọn sạch; còn ${remainingCount} dòng zz-test-*.`)
  }
  report()
}

void main().catch(() => {
  record('Luồng smoke admin', 'FAIL', 'Không thể chạy smoke; chi tiết nhạy cảm đã được ẩn.')
  report()
})

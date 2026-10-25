import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { z } from 'zod'
import { mapPlacesSchema, paginatedPlacesSchema, placeDetailResponseSchema, placeMetaSchema } from '../shared/schemas/placeApi'

type CheckStatus = 'PASS' | 'FAIL' | 'SKIP'
type Check = { name: string; status: CheckStatus; detail: string }

const checks: Check[] = []

function record(name: string, status: CheckStatus, detail: string): void {
  checks.push({ name, status, detail })
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function parseEnvValue(raw: string): string {
  const trimmed = raw.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

async function loadSupabaseConfig(): Promise<void> {
  const envFile = await readFile(resolve(process.cwd(), '.env.local'), 'utf8')
  const values = new Map<string, string>()
  for (const line of envFile.split(/\r?\n/)) {
    const match = /^\s*(SUPABASE_URL|SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)\s*=\s*(.*)\s*$/.exec(line)
    if (match) values.set(match[1], parseEnvValue(match[2]))
  }

  process.env.SUPABASE_URL ??= values.get('SUPABASE_URL') ?? values.get('VITE_SUPABASE_URL')
  process.env.SUPABASE_ANON_KEY ??= values.get('SUPABASE_ANON_KEY') ?? values.get('VITE_SUPABASE_ANON_KEY')
  process.env.SUPABASE_SERVICE_ROLE_KEY ??= values.get('SUPABASE_SERVICE_ROLE_KEY')
  assert(Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY), 'Thiếu cấu hình Supabase URL/anon key trong .env.local')
}

async function run(name: string, check: () => Promise<string>): Promise<void> {
  try {
    record(name, 'PASS', await check())
  } catch (error) {
    record(name, 'FAIL', error instanceof Error ? error.message : 'Lỗi không xác định')
  }
}

async function readSupabase<T>(url: string, key: string, table: string, query: URLSearchParams, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(new URL(`/rest/v1/${table}?${query.toString()}`, url), {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  assert(response.ok, `Supabase ${table} trả HTTP ${response.status}`)
  const parsed = schema.safeParse(await response.json())
  assert(parsed.success, `Supabase ${table} trả dữ liệu không hợp lệ`)
  return parsed.data
}

async function main(): Promise<void> {
  await loadSupabaseConfig()
  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!url || !anonKey) throw new Error('Thiếu cấu hình Supabase URL/anon key trong .env.local')
  const { app } = await import('../server/app')

  let publishedSlugs: string[] = []
  let firstPage: ReturnType<typeof paginatedPlacesSchema.parse> | undefined
  const visiblePublished = await readSupabase(
    url,
    anonKey,
    'places',
    new URLSearchParams({ select: 'slug', status: 'eq.published' }),
    z.array(z.object({ slug: z.string() })),
  )
  publishedSlugs = visiblePublished.map((place) => place.slug)

  await run('GET /api/meta: 10 tag và startPoints', async () => {
    const response = await app.request('/api/meta')
    assert(response.status === 200, `HTTP ${response.status}`)
    const parsed = placeMetaSchema.safeParse(await response.json())
    assert(parsed.success, 'Response không đúng schema meta')
    assert(parsed.data.tags.length === 10, `Số tag=${parsed.data.tags.length}, mong đợi 10`)
    assert(parsed.data.startPoints.length > 0, `tags=${parsed.data.tags.length}; startPoints=0`)
    return `HTTP 200; tags=${parsed.data.tags.length}; startPoints=${parsed.data.startPoints.length}`
  })

  await run('GET /api/places: 200, phân trang và chỉ published', async () => {
    const response = await app.request('/api/places?page=1&pageSize=2')
    assert(response.status === 200, `HTTP ${response.status}`)
    const parsed = paginatedPlacesSchema.safeParse(await response.json())
    assert(parsed.success, 'Response không đúng schema phân trang')
    assert(parsed.data.page === 1 && parsed.data.pageSize === 2, 'Thông tin trang không khớp query')
    assert(parsed.data.items.length <= 2 && parsed.data.total >= parsed.data.items.length, 'Số lượng trang không hợp lệ')
    firstPage = parsed.data

    if (publishedSlugs.length === 0) {
      assert(parsed.data.items.length === 0 && parsed.data.total === 0, 'API phải trả danh sách rỗng khi Supabase không có địa điểm published')
      return 'HTTP 200; 0 published; danh sách rỗng như mong đợi'
    }

    const ids = parsed.data.items.map((item) => item.id)
    const allPageIds = [...ids]

    if (parsed.data.total > parsed.data.pageSize) {
      const secondResponse = await app.request('/api/places?page=2&pageSize=2')
      assert(secondResponse.status === 200, `Trang 2 trả HTTP ${secondResponse.status}`)
      const second = paginatedPlacesSchema.safeParse(await secondResponse.json())
      assert(second.success, 'Trang 2 không đúng schema phân trang')
      assert(second.data.page === 2 && second.data.total === parsed.data.total, 'Metadata trang 2 không khớp')
      assert(second.data.items.length > 0, 'Trang 2 rỗng dù total lớn hơn pageSize')
      assert(!second.data.items.some((item) => ids.includes(item.id)), 'Hai trang có địa điểm trùng nhau')
      allPageIds.push(...second.data.items.map((item) => item.id))
    } else {
      record('GET /api/places pagination: trang kế tiếp', 'SKIP', 'Chỉ có một trang dữ liệu published')
    }

    if (allPageIds.length > 0) {
      const rows = await readSupabase(
        url,
        anonKey,
        'places',
        new URLSearchParams({ select: 'id,status', id: `in.(${allPageIds.join(',')})` }),
        z.array(z.object({ id: z.string().uuid(), status: z.string() })),
      )
      assert(rows.length === allPageIds.length && rows.every((place) => place.status === 'published'), 'Danh sách API có địa điểm không published')
    }

    assert(parsed.data.total === publishedSlugs.length, `API total=${parsed.data.total}, Supabase published=${publishedSlugs.length}`)
    return `HTTP 200; total published=${parsed.data.total}; page 1=${parsed.data.items.length}; trang 2 hợp lệ`
  })

  if (publishedSlugs.length === 0) {
    record('GET /api/places pagination: trang kế tiếp', 'SKIP', 'Không có published data để kiểm tra phân trang')
  }

  await run('GET /api/places?category=<sai>: 400', async () => {
    const response = await app.request('/api/places?category=invalid-category')
    assert(response.status === 400, `HTTP ${response.status}`)
    return `HTTP ${response.status}`
  })

  await run('GET /api/places/map: schema dữ liệu nhẹ', async () => {
    const response = await app.request('/api/places/map')
    assert(response.status === 200, `HTTP ${response.status}`)
    const body: unknown = await response.json()
    const parsed = mapPlacesSchema.safeParse(body)
    assert(parsed.success, 'Response không đúng schema map')
    const expectedKeys = ['category', 'coverImageUrl', 'id', 'lat', 'lng', 'name', 'slug'].sort().join(',')
    const rawItems = (body as { items: Array<Record<string, unknown>> }).items
    assert(rawItems.every((item) => Object.keys(item).sort().join(',') === expectedKeys), 'Map trả về trường ngoài DTO nhẹ')
    return `HTTP 200; items=${parsed.data.items.length}; chỉ có trường DTO map`
  })

  if (publishedSlugs.length > 0) {
    const slug = firstPage?.items[0]?.slug
    if (slug) {
      await run('GET /api/places/:slug: nearby RPC hoạt động, không có chính nó', async () => {
        const response = await app.request(`/api/places/${encodeURIComponent(slug)}`)
        assert(response.status === 200, `HTTP ${response.status}`)
        const parsed = placeDetailResponseSchema.safeParse(await response.json())
        assert(parsed.success, 'Response không đúng schema chi tiết')
        assert(parsed.data.place.slug === slug, 'Slug chi tiết không khớp')
        assert(parsed.data.nearby.every((place) => place.id !== parsed.data.place.id), 'Nearby chứa chính địa điểm hiện tại')
        return `HTTP 200; nearby=${parsed.data.nearby.length}; không có chính nó`
      })
    } else {
      record('GET /api/places/:slug: nearby RPC hoạt động, không có chính nó', 'FAIL', 'Có published data nhưng trang đầu API không trả địa điểm')
    }
  } else {
    record('GET /api/places/:slug: nearby RPC hoạt động, không có chính nó', 'SKIP', 'Không có địa điểm published để kiểm tra')
  }

  await run('GET /api/places/:slug không tồn tại: 404', async () => {
    const response = await app.request('/api/places/__smoke-place-that-does-not-exist__')
    assert(response.status === 404, `HTTP ${response.status}`)
    return `HTTP ${response.status}`
  })

  const draftLookupKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const draftPlaces = await readSupabase(
    url,
    draftLookupKey ?? anonKey,
    'places',
    new URLSearchParams({ select: 'slug', status: 'eq.draft', limit: '1' }),
    z.array(z.object({ slug: z.string() })),
  ).catch(() => null)
  if (!draftPlaces) {
    record('GET draft slug: 404, không lộ dữ liệu', 'FAIL', 'Không truy vấn được draft để kiểm tra')
  } else if (draftPlaces.length > 0) {
    await run('GET draft slug: 404, không lộ dữ liệu', async () => {
      const response = await app.request(`/api/places/${encodeURIComponent(draftPlaces[0].slug)}`)
      assert(response.status === 404, `HTTP ${response.status}`)
      return `HTTP ${response.status}`
    })
  } else {
    record('GET draft slug: 404, không lộ dữ liệu', 'SKIP', 'Không tìm thấy draft để kiểm tra')
  }

  const widths = { PASS: 'PASS', FAIL: 'FAIL', SKIP: 'SKIP' } satisfies Record<CheckStatus, string>
  console.log('\nKết quả smoke:api')
  console.log('| Kiểm tra | Kết quả | Chi tiết |')
  console.log('|---|---|---|')
  for (const check of checks) console.log(`| ${check.name} | ${widths[check.status]} | ${check.detail.replaceAll('|', '\\|')} |`)
  const failures = checks.filter((check) => check.status === 'FAIL').length
  const skips = checks.filter((check) => check.status === 'SKIP').length
  console.log(`\nTổng: ${checks.length - failures - skips} đạt, ${failures} lỗi, ${skips} bỏ qua.`)
  if (failures > 0) process.exitCode = 1
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Lỗi khởi chạy smoke test'
  console.error(`Không thể chạy smoke:api: ${message}`)
  process.exitCode = 1
})

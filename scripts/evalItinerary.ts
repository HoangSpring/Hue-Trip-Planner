import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { placeDetailSchema } from '@shared/schemas'
import { itineraryEvalCases } from '../server/itinerary/evalCases'
import { filterCandidates } from '../server/itinerary/candidates'
import { generateTrip } from '../server/itinerary/fallback'
import { FixturePlacesRepo, SupabasePlacesRepo } from '../server/itinerary/placesRepo'

function loadLocalEnvironment(): void {
  try {
    const contents = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
    for (const line of contents.split(/\r?\n/)) {
      const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
      if (!match || match[1].startsWith('#') || process.env[match[1]]) continue
      const value = match[2].replace(/^(['"])(.*)\1$/, '$2').replace(/\s+#.*$/, '')
      process.env[match[1]] = value
    }
  } catch {
    // Do not print configuration values or filesystem details.
  }
  process.env.SUPABASE_URL ||= process.env.VITE_SUPABASE_URL
  process.env.SUPABASE_ANON_KEY ||= process.env.VITE_SUPABASE_ANON_KEY
}

function slotLabel(slot: string): string {
  return { morning: 'Sáng', noon: 'Trưa', afternoon: 'Chiều', evening: 'Tối' }[slot] ?? slot
}

function formatEvaluation(input: {
  generatedAt: string
  quality: { published: number; eligible: number; dropped: number; missingCoordinates: number; missingVisitDuration: number }
  optionalMissing: { hours: number; bestTime: number; suitableFor: number; priceLevel: number }
  startPointLabel: string
  results: Array<{
    id: string; label: string; candidates: number; result: Awaited<ReturnType<typeof generateTrip>>
  }>
}): string {
  const lines = [
    '# Đánh giá thủ công — thuật toán dự phòng', '',
    `- Ngày chạy: ${input.generatedAt}`,
    '- Thuật toán: `fallback-v1` (không dùng LLM)',
    '- Nguồn địa điểm: Supabase production API/table đọc bằng anon client; không ghi dữ liệu.',
    `- Điểm xuất phát đọc từ DB: ${input.startPointLabel || 'không có; lịch trình không dùng điểm xuất phát'}`,
    '', '## Chất lượng dữ liệu địa điểm', '',
    '| Chỉ số | Số lượng |', '|---|---:|',
    `| Published đọc được | ${input.quality.published} |`,
    `| Đủ tọa độ và thời lượng để xét | ${input.quality.eligible} |`,
    `| Bị loại do thiếu tọa độ hoặc thời lượng | ${input.quality.dropped} |`,
    `| Thiếu lat hoặc lng | ${input.quality.missingCoordinates} |`,
    `| Thiếu visit_duration_min | ${input.quality.missingVisitDuration} |`,
    `| Thiếu open_time hoặc close_time (không loại, hạ ưu tiên) | ${input.optionalMissing.hours} |`,
    `| Thiếu best_time | ${input.optionalMissing.bestTime} |`,
    `| Thiếu suitable_for | ${input.optionalMissing.suitableFor} |`,
    `| Thiếu price_level | ${input.optionalMissing.priceLevel} |`,
    '', '> Các số thiếu tọa độ/thời lượng có thể giao nhau; tổng bị loại là số bản ghi bị thiếu ít nhất một trường bắt buộc.',
    '', '## Kết quả 10 đầu vào', '',
  ]
  for (const entry of input.results) {
    lines.push(`### ${entry.id.toUpperCase()} — ${entry.label}`, '', `Ứng viên sau lọc: ${entry.candidates}.`, '')
    for (const notice of entry.result.notices) lines.push(`- Thông báo: **${notice.code}** — ${notice.message}`)
    if (!entry.result.draft.days.some((day) => day.items.length)) lines.push('- Không tạo được mục nào.')
    lines.push('')
    for (const day of entry.result.draft.days) {
      lines.push(`#### Ngày ${day.dayIndex}${day.date ? ` · ${day.date}` : ''}`, '')
      if (!day.items.length) {
        lines.push('_Không có địa điểm được xếp vào ngày này._', '')
        continue
      }
      lines.push('| Khung | Giờ đến | Địa điểm | Di chuyển từ điểm trước | Lý do |', '|---|---|---|---:|---|')
      for (const item of day.items) {
        const travel = item.position === 0 ? '—' : `~${item.travelMinFromPrev ?? 0} phút`
        lines.push(`| ${slotLabel(item.slot)} | ${item.startTime ?? '—'} | ${item.place?.name ?? item.placeId} | ${travel} | ${item.reason ?? '—'} |`)
      }
      lines.push('')
    }
    lines.push('Cảnh báo:', '')
    if (entry.result.warnings.length) {
      for (const warning of entry.result.warnings) lines.push(`- ${warning.code} (ngày ${warning.dayIndex}): ${warning.message}`)
    } else lines.push('- Không có cảnh báo được phát hiện.')
    lines.push('', '| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |', '|---|---|',
      '| Đường đi hợp lý |  |', '| Bữa trưa đúng |  |', '| Giờ mở cửa đúng |  |', '| Đa dạng |  |', '| Lý do tự nhiên và đúng dữ liệu |  |', '')
  }
  return `${lines.join('\n')}\n`
}

async function main(): Promise<void> {
  loadLocalEnvironment()
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Không có Supabase URL/anon key để đọc dữ liệu đánh giá.')
  }
  const { createPublicSupabaseClient } = await import('../server/lib/supabase')
  const client = createPublicSupabaseClient()
  const repo = new SupabasePlacesRepo(client)
  const records = await repo.listPublished()
  const quality = repo.getDataQuality()
  const { data: startPoints, error } = await client.from('start_points').select('slug,name,lat,lng').order('sort_order').limit(1)
  if (error) throw new Error('Không thể đọc điểm xuất phát để chạy đánh giá.')
  const startPoint = startPoints?.[0]
  const placeFixture = records.map(({ place }) => placeDetailSchema.parse(place))
  const fixtureRepo = new FixturePlacesRepo(records)
  const now = new Date('2026-10-26T00:00:00.000Z')
  const results: Array<{ id: string; label: string; candidates: number; result: Awaited<ReturnType<typeof generateTrip>> }> = []
  for (const entry of itineraryEvalCases) {
    const input = { ...entry.input, start: startPoint ? { label: startPoint.name, lat: startPoint.lat, lng: startPoint.lng } : null }
    const candidates = filterCandidates(records, input).candidates.length
    const result = await generateTrip(fixtureRepo, input, { now, seed: `phase2a-${entry.id}` })
    results.push({ id: entry.id, label: entry.label, candidates, result })
  }
  const optionalMissing = {
    hours: placeFixture.filter((place) => place.openTime === null || place.closeTime === null).length,
    bestTime: placeFixture.filter((place) => place.bestTime.length === 0).length,
    suitableFor: placeFixture.filter((place) => place.suitableFor.length === 0).length,
    priceLevel: placeFixture.filter((place) => place.priceLevel === null).length,
  }
  const today = new Date().toISOString().slice(0, 10)
  const outputPath = resolve(process.cwd(), 'docs/eval', `${today}-fallback.md`)
  mkdirSync(resolve(process.cwd(), 'docs/eval'), { recursive: true })
  writeFileSync(outputPath, formatEvaluation({
    generatedAt: new Date().toISOString(), quality, optionalMissing,
    startPointLabel: startPoint?.name ?? '', results,
  }), 'utf8')
  console.info(`Đã ghi ${results.length} kịch bản vào docs/eval/${today}-fallback.md.`)
  console.info(`Dữ liệu: ${quality.published} published, ${quality.eligible} đủ điều kiện, ${quality.dropped} bị loại vì thiếu dữ liệu bắt buộc.`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(() => {
    console.error('eval:itinerary thất bại; kiểm tra cấu hình Supabase và khả năng đọc dữ liệu (không in biến môi trường).')
    process.exitCode = 1
  })
}

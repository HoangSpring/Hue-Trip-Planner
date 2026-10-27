import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { placeDetailSchema } from '@shared/schemas'
import { ITINERARY_CONFIG } from '../shared/itinerary/config'
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

function minimumItems(pace: 'relaxed' | 'moderate' | 'packed', companion: string): number {
  const reduction = companion === 'seniors' || companion === 'family_kids'
    ? ITINERARY_CONFIG.itemsPerDay.reduceForSensitiveBy : 0
  return Math.max(ITINERARY_CONFIG.itemsPerDay.floor, ITINERARY_CONFIG.itemsPerDay[pace][0] - reduction)
}

type EvaluationEntry = {
  id: string
  label: string
  candidates: number
  result: Awaited<ReturnType<typeof generateTrip>>
}

function countV1(markdown: string): { missingLunchDays: number; underMinimumDays: number; warningCount: number } {
  let missingLunchDays = 0
  let underMinimumDays = 0
  let warningCount = 0
  for (const entry of itineraryEvalCases) {
    const start = markdown.indexOf(`### ${entry.id.toUpperCase()} —`)
    if (start < 0) continue
    const next = markdown.indexOf('\n### ', start + 1)
    const section = markdown.slice(start, next < 0 ? undefined : next)
    const daySections = section.split(/(?=#### Ngày \d+)/).slice(1)
    const minimum = minimumItems(entry.input.pace, entry.input.companion)
    for (const day of daySections) {
      const table = day.slice(0, day.indexOf('\nCảnh báo:') < 0 ? undefined : day.indexOf('\nCảnh báo:'))
      const rows = table.split('\n').filter((line) => /^\| (Sáng|Trưa|Chiều|Tối) \|/.test(line))
      if (!rows.some((line) => line.startsWith('| Trưa |'))) missingLunchDays++
      if (rows.length < minimum) underMinimumDays++
    }
    warningCount += [...section.matchAll(/^\- (?:CLOSED_ON_DAY|CLOSED_AT_TIME|MISSING_HOURS|TOO_FAR|TOO_MANY_ITEMS|TIME_OVERLAP|PLACE_ARCHIVED|LUNCH_MISSING)\b/gm)].length
  }
  return { missingLunchDays, underMinimumDays, warningCount }
}

function missingHoursNames(results: readonly EvaluationEntry[]): string[] {
  const names = new Set<string>()
  for (const { result } of results) {
    const itemById = new Map(result.draft.days.flatMap(({ items }) => items.map((item) => [item.id, item] as const)))
    for (const warning of result.warnings) {
      if (warning.code !== 'MISSING_HOURS' || !warning.itemId) continue
      const item = itemById.get(warning.itemId)
      if (item?.place?.name) names.add(item.place.name)
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'vi'))
}

function summarizeV2(results: readonly EvaluationEntry[]): { missingLunchDays: number; underMinimumDays: number; warningCount: number } {
  const dayEntries = results.flatMap(({ result }) => result.draft.days.map((day) => ({
    day, minimum: minimumItems(result.draft.input.pace, result.draft.input.companion),
  })))
  return {
    missingLunchDays: dayEntries.filter(({ day }) =>
      !day.items.some((item) => item.slot === 'noon' && item.place?.category === 'food')).length,
    underMinimumDays: dayEntries.filter(({ day, minimum }) => day.items.length < minimum).length,
    warningCount: results.reduce((total, { result }) => total + result.warnings.length, 0),
  }
}

function formatEvaluation(input: {
  generatedAt: string
  quality: { published: number; eligible: number; dropped: number; missingCoordinates: number; missingVisitDuration: number; lunchEligible: number }
  optionalMissing: { hours: number; bestTime: number; suitableFor: number; priceLevel: number }
  startPointLabel: string
  results: EvaluationEntry[]
  v1: { missingLunchDays: number; underMinimumDays: number; warningCount: number }
}): string {
  const v2 = summarizeV2(input.results)
  const missingNames = missingHoursNames(input.results)
  const lines = [
    '# Đánh giá thủ công — thuật toán dự phòng V2', '',
    `- Ngày chạy: ${input.generatedAt}`,
    '- Thuật toán: `fallback-v2` (không dùng LLM) ở nhánh sửa T-020. `--explain` in bộ đếm loại ứng viên theo ngày. ',
    '- Nguồn địa điểm: Supabase production đọc bằng anon client; không ghi dữ liệu.',
    `- Điểm xuất phát đọc từ DB: ${input.startPointLabel || 'không có; lịch trình không dùng điểm xuất phát'}`,
    '', '## So sánh V1 → V2', '',
    '| Chỉ số | V1 | V2 |', '|---|---:|---:|',
    `| Số ngày thiếu bữa trưa | ${input.v1.missingLunchDays} | ${v2.missingLunchDays} |`,
    `| Số ngày dưới sàn nhịp độ | ${input.v1.underMinimumDays} | ${v2.underMinimumDays} |`,
    `| Tổng số cảnh báo | ${input.v1.warningCount} | ${v2.warningCount} |`,
    '', '## Chất lượng dữ liệu địa điểm', '',
    '| Chỉ số | Số lượng |', '|---|---:|',
    `| Published đọc được | ${input.quality.published} |`,
    `| Địa điểm food có meal_type lunch hoặc rỗng | ${input.quality.lunchEligible} |`,
    `| Đủ tọa độ và thời lượng để xét | ${input.quality.eligible} |`,
    `| Bị loại do thiếu tọa độ hoặc thời lượng | ${input.quality.dropped} |`,
    `| Thiếu lat hoặc lng | ${input.quality.missingCoordinates} |`,
    `| Thiếu visit_duration_min | ${input.quality.missingVisitDuration} |`,
    `| Thiếu open_time hoặc close_time (không loại, hạ ưu tiên) | ${input.optionalMissing.hours} |`,
    `| Thiếu best_time | ${input.optionalMissing.bestTime} |`,
    `| Thiếu suitable_for | ${input.optionalMissing.suitableFor} |`,
    `| Thiếu price_level | ${input.optionalMissing.priceLevel} |`,
    '', '> Số thiếu tọa độ/thời lượng có thể giao nhau; tổng bị loại là số bản ghi thiếu ít nhất một trường bắt buộc.',
    '', '## Địa điểm thiếu giờ mở cửa', '',
  ]
  if (missingNames.length) lines.push(...missingNames.map((name) => `- ${name}`))
  else lines.push('- Không có địa điểm thiếu giờ trong lịch trình đánh giá.')
  lines.push('', `Tổng: ${missingNames.length} địa điểm duy nhất.`, '', '## Kết quả 10 đầu vào', '')

  for (const entry of input.results) {
    lines.push(`### ${entry.id.toUpperCase()} — ${entry.label}`, '', `Ứng viên sau lọc: ${entry.candidates}.`, '')
    for (const notice of entry.result.notices) lines.push(`- Thông báo: **${notice.code}** — ${notice.message}`)
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
      const diagnostics = entry.result.diagnostics?.find(({ dayIndex }) => dayIndex === day.dayIndex)
      if (diagnostics) {
        const { excluded } = diagnostics
        lines.push('', `Giải thích ngày ${day.dayIndex}: available=${diagnostics.available}; đã dùng=${excluded.alreadyUsed}; đóng cửa=${excluded.closed}; ngoài best_time=${excluded.outsideBestTime}; cường độ đi bộ=${excluded.walkingIntensity}; quá xa=${excluded.tooFar}; scheduler loại=${excluded.schedulerRejected}; thiếu tọa độ=${excluded.missingCoordinates}; thiếu thời lượng=${excluded.missingVisitDuration}; kết quả=${diagnostics.scheduled}/${diagnostics.minimum} tối thiểu.`, '')
      } else lines.push('')
    }
    lines.push('Cảnh báo khác (MISSING_HOURS được tổng hợp ở mục riêng):', '')
    const otherWarnings = entry.result.warnings.filter(({ code }) => code !== 'MISSING_HOURS')
    if (otherWarnings.length) {
      for (const warning of otherWarnings) lines.push(`- ${warning.code} (ngày ${warning.dayIndex}): ${warning.message}`)
    } else lines.push('- Không có cảnh báo khác được phát hiện.')
    lines.push('', '| Tiêu chí chấm | Điểm / ghi chú của chủ dự án |', '|---|---|',
      '| Đường đi hợp lý |  |', '| Bữa trưa đúng |  |', '| Giờ mở cửa đúng |  |', '| Đa dạng |  |', '| Lý do tự nhiên và đúng dữ liệu |  |', '')
  }
  return `${lines.join('\n')}\n`
}

async function main(): Promise<void> {
  const explain = process.argv.includes('--explain')
  loadLocalEnvironment()
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('Không có Supabase URL/anon key để đọc dữ liệu đánh giá.')
  }
  const { createPublicSupabaseClient } = await import('../server/lib/supabase')
  const client = createPublicSupabaseClient()
  const repo = new SupabasePlacesRepo(client)
  const records = await repo.listPublished()
  const baseQuality = repo.getDataQuality()
  const { data: startPoints, error } = await client.from('start_points').select('slug,name,lat,lng').order('sort_order').limit(1)
  if (error) throw new Error('Không thể đọc điểm xuất phát để chạy đánh giá.')
  const startPoint = startPoints?.[0]
  const placeFixture = records.map(({ place }) => placeDetailSchema.parse(place))
  const quality = {
    ...baseQuality,
    lunchEligible: placeFixture.filter((place) => place.category === 'food' &&
      (place.mealType.length === 0 || place.mealType.includes('lunch'))).length,
  }
  const fixtureRepo = new FixturePlacesRepo(records)
  const now = new Date('2026-10-26T00:00:00.000Z')
  const results: EvaluationEntry[] = []
  for (const entry of itineraryEvalCases) {
    const input = { ...entry.input, start: startPoint ? { label: startPoint.name, lat: startPoint.lat, lng: startPoint.lng } : null }
    const candidates = filterCandidates(records, input).candidates.length
    const result = await generateTrip(fixtureRepo, input, { now, seed: `phase2a-v2-${entry.id}`, explain })
    results.push({ id: entry.id, label: entry.label, candidates, result })
    if (explain) {
      for (const diagnostic of result.diagnostics ?? []) {
        console.info(`--explain ${entry.id.toUpperCase()} ngày ${diagnostic.dayIndex} (${diagnostic.date}): ` +
          `available=${diagnostic.available}; ${JSON.stringify(diagnostic.excluded)}; ` +
          `scheduled=${diagnostic.scheduled}; minimum=${diagnostic.minimum}`)
      }
    }
  }
  const optionalMissing = {
    hours: placeFixture.filter((place) => place.openTime === null || place.closeTime === null).length,
    bestTime: placeFixture.filter((place) => place.bestTime.length === 0).length,
    suitableFor: placeFixture.filter((place) => place.suitableFor.length === 0).length,
    priceLevel: placeFixture.filter((place) => place.priceLevel === null).length,
  }
  const today = new Date().toISOString().slice(0, 10)
  const evalDirectory = resolve(process.cwd(), 'docs/eval')
  const v1File = readdirSync(evalDirectory).filter((file) => /^\d{4}-\d{2}-\d{2}-fallback\.md$/.test(file)).sort().at(-1)
  if (!v1File) throw new Error('Không tìm thấy báo cáo fallback V1 để so sánh.')
  const v1 = countV1(readFileSync(resolve(evalDirectory, v1File), 'utf8'))
  const outputPath = resolve(evalDirectory, `${today}-fallback-v2.md`)
  mkdirSync(evalDirectory, { recursive: true })
  writeFileSync(outputPath, formatEvaluation({
    generatedAt: new Date().toISOString(), quality, optionalMissing,
    startPointLabel: startPoint?.name ?? '', results, v1,
  }), 'utf8')
  console.info(`Đã ghi ${results.length} kịch bản vào docs/eval/${today}-fallback-v2.md.`)
  console.info(`Dữ liệu: ${quality.published} published, ${quality.eligible} đủ điều kiện, ${quality.dropped} bị loại vì dữ liệu bắt buộc.`)
  const v2 = summarizeV2(results)
  console.info(`So sánh V1 → V2: thiếu trưa ${v1.missingLunchDays} → ${v2.missingLunchDays}; dưới sàn ${v1.underMinimumDays} → ${v2.underMinimumDays}; cảnh báo ${v1.warningCount} → ${v2.warningCount}.`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error: unknown) => {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error'
    console.error(`eval:itinerary thất bại (${detail}); không in biến môi trường.`)
    process.exitCode = 1
  })
}

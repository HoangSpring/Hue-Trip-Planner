import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { z } from 'zod'
import samplePlaces from '../tests/fixtures/places.sample.json'
import { GeminiApiError } from '../server/llm/providers/gemini'
import { tripInputSchema } from '../shared/schemas'
import { llmItinerarySchema } from '../shared/schemas/llmItinerary'
import { buildUserMessage, PROMPT_VERSION, serializeUserMessage, SYSTEM_PROMPT } from '../server/itinerary/prompt'
import type { ScoredCandidate } from '../server/itinerary/types'

type PingOptions = { timeoutMs: number; model?: string }

function parseValue(raw: string): string {
  const value = raw.trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value.replace(/\s+#.*$/, '')
}

function parseArgs(args: string[]): PingOptions {
  const options: PingOptions = { timeoutMs: 40_000 }
  for (const arg of args) {
    if (arg.startsWith('--timeout=')) {
      options.timeoutMs = Number(arg.slice('--timeout='.length))
      if (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs < 1000 || options.timeoutMs > 600_000) {
        throw new Error('--timeout phải trong khoảng 1000–600000 ms')
      }
    } else if (arg.startsWith('--model=')) {
      const model = arg.slice('--model='.length).trim()
      if (!model) throw new Error('--model cần tên model')
      options.model = model
    } else {
      throw new Error('Tham số không hỗ trợ; dùng --timeout=<ms> hoặc --model=<name>')
    }
  }
  return options
}

async function loadLlmConfig(): Promise<void> {
  let contents: string
  try {
    contents = await readFile(resolve(process.cwd(), '.env.local'), 'utf8')
  } catch {
    throw new Error('Cấu hình LLM không đọc được từ .env.local')
  }
  for (const line of contents.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?(LLM_API_KEY|LLM_MODEL|LLM_ENABLED)\s*=\s*(.*)\s*$/.exec(line)
    if (match && !process.env[match[1]]) process.env[match[1]] = parseValue(match[2])
  }
  if (!process.env.LLM_API_KEY || !process.env.LLM_MODEL) throw new Error('Thiếu cấu hình LLM_API_KEY hoặc LLM_MODEL')
  if (process.env.LLM_ENABLED !== 'false') throw new Error('Ping chỉ chạy khi LLM_ENABLED=false')
}

const pingSchema = z.object({ ok: z.boolean(), candidateId: z.string() }).strict()

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))
  await loadLlmConfig()
  const model = options.model ?? process.env.LLM_MODEL
  if (!model) throw new Error('Thiếu cấu hình model')
  const { GeminiLlmClient } = await import('../server/llm/providers/gemini')
  const client = new GeminiLlmClient({
    apiKey: process.env.LLM_API_KEY ?? '',
    model,
    timeoutMs: options.timeoutMs,
  })
  const start = performance.now()
  try {
    const result = await client.completeJson({
      system: 'Return only JSON matching the supplied schema. Echo the candidateId from the single candidate.',
      user: JSON.stringify({ candidate: { id: 'demo-candidate-1' } }),
      schema: pingSchema,
      maxOutputTokens: 3500,
      signal: AbortSignal.timeout(options.timeoutMs + 1000),
    })
    const elapsedMs = Math.round(performance.now() - start)
    const parsed = pingSchema.safeParse(result.json)
    const { inputTokens, outputTokens, thinkingTokens } = result.usage
    const output = [
      `model=${result.model}`,
      `response_ms=${elapsedMs}`,
      `http_status=${result.httpStatus}`,
      `input_tokens=${inputTokens}`,
      `output_tokens=${outputTokens}`,
      `thinking_tokens=${thinkingTokens}`,
      `total_tokens=${inputTokens + outputTokens + thinkingTokens}`,
      'calls=1',
      'api_key=not displayed',
    ]
    if (!parsed.success || parsed.data.ok !== true || parsed.data.candidateId !== 'demo-candidate-1') {
      process.stdout.write(['Gemini LLM ping: FAIL', ...output, 'error_kind=bad_json', 'json_schema=FAIL'].join('\n') + '\n')
      process.exitCode = 1
      return
    }
    process.stdout.write([
      'Gemini LLM ping: PASS',
      ...output,
      'error_kind=none',
      'json_schema=PASS',
    ].join('\n') + '\n')

    const fullInput = tripInputSchema.parse({
      numDays: 2, startDate: '2026-11-02', companion: 'couple', groupSize: 2,
      interests: ['heritage', 'cuisine'], pace: 'moderate', budget: 'mid', transport: 'motorbike',
      start: { label: 'Điểm xuất phát mẫu', lat: 16.4637, lng: 107.5909 }, notes: null,
    })
    const candidates = samplePlaces.slice(0, 40).map((place, index) => ({
      place, score: 1 - index / 100, featured: false, tagWeights: {},
    })) as ScoredCandidate[]
    const fullStartedAt = performance.now()
    try {
      const fullResult = await client.completeJson({
        system: SYSTEM_PROMPT,
        user: serializeUserMessage(buildUserMessage(fullInput, candidates)),
        schema: llmItinerarySchema,
        maxOutputTokens: 3500,
        signal: AbortSignal.timeout(options.timeoutMs + 1000),
      })
      const fullElapsedMs = Math.round(performance.now() - fullStartedAt)
      const fullParsed = llmItinerarySchema.safeParse(fullResult.json)
      const candidateIds = new Set(candidates.map(({ place }) => place.id))
      const candidateOnly = fullParsed.success && fullParsed.data.days.every((day) => day.items.every(({ placeId }) => candidateIds.has(placeId)))
      const usage = fullResult.usage
      process.stdout.write([
        `full_sample_prompt=${PROMPT_VERSION}`,
        `full_sample_candidates=${candidates.length}`,
        'full_sample_days=2',
        `full_sample_model=${fullResult.model}`,
        `full_sample_response_ms=${fullElapsedMs}`,
        `full_sample_http_status=${fullResult.httpStatus}`,
        `full_sample_input_tokens=${usage.inputTokens}`,
        `full_sample_output_tokens=${usage.outputTokens}`,
        `full_sample_thinking_tokens=${usage.thinkingTokens}`,
        `full_sample_total_tokens=${usage.inputTokens + usage.outputTokens + usage.thinkingTokens}`,
        `full_sample_json_schema=${fullParsed.success ? 'PASS' : 'FAIL'}`,
        `full_sample_candidate_ids=${candidateOnly ? 'PASS' : 'FAIL'}`,
        'calls_this_run=2',
      ].join('\n') + '\n')
      if (!fullParsed.success || !candidateOnly) process.exitCode = 1
    } catch (error) {
      const fullElapsedMs = Math.round(performance.now() - fullStartedAt)
      const providerError = error instanceof GeminiApiError ? error : null
      const kind = providerError?.kind ?? (error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'network')
      process.stderr.write([
        'Gemini full-size sample: FAIL',
        `model=${model}`,
        `response_ms=${fullElapsedMs}`,
        `http_status=${providerError?.status ?? 'n/a'}`,
        `error_kind=${kind}`,
        'calls_this_run=2',
        'usage=unavailable',
        'api_key=not displayed',
      ].join('\n') + '\n')
      process.exitCode = 1
    }
  } catch (error) {
    const elapsedMs = Math.round(performance.now() - start)
    const providerError = error instanceof GeminiApiError ? error : null
    const kind = providerError?.kind ?? (error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'network')
    process.stderr.write([
      'Gemini LLM ping: FAIL',
      `model=${model}`,
      `response_ms=${elapsedMs}`,
      `http_status=${providerError?.status ?? 'n/a'}`,
      `error_kind=${kind}`,
      'calls=1',
      'usage=unavailable',
      'api_key=not displayed',
    ].join('\n') + '\n')
    process.exitCode = 1
  }
}

await main()

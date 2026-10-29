import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
import { z } from 'zod'

function parseValue(raw: string): string {
  const value = raw.trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value.replace(/\s+#.*$/, '')
}

async function loadLlmConfig(): Promise<void> {
  let contents: string
  try {
    contents = await readFile(resolve(process.cwd(), '.env.local'), 'utf8')
  } catch {
    throw new Error('Cấu hình LLM không đọc được từ .env.local')
  }
  for (const line of contents.split(/\r?\n/)) {
    const match = /^\s*(?:export\s+)?(LLM_API_KEY|LLM_MODEL|LLM_ENABLED|LLM_TIMEOUT_MS)\s*=\s*(.*)\s*$/.exec(line)
    if (match && !process.env[match[1]]) process.env[match[1]] = parseValue(match[2])
  }
  if (!process.env.LLM_API_KEY || !process.env.LLM_MODEL) throw new Error('Thiếu cấu hình LLM_API_KEY hoặc LLM_MODEL')
  if (process.env.LLM_ENABLED !== 'false') throw new Error('Ping chỉ chạy khi LLM_ENABLED=false')
}

const pingSchema = z.object({ ok: z.boolean(), candidateId: z.string() }).strict()

async function main(): Promise<void> {
  await loadLlmConfig()
  const { GeminiLlmClient, GeminiApiError } = await import('../server/llm/providers/gemini')
  const client = new GeminiLlmClient()
  const start = performance.now()
  try {
    const result = await client.completeJson({
      system: 'Return only JSON matching the supplied schema. Echo the candidateId from the single candidate.',
      user: JSON.stringify({ candidate: { id: 'demo-candidate-1' } }),
      schema: pingSchema,
      maxOutputTokens: 64,
      temperature: 0,
      signal: AbortSignal.timeout(Number(process.env.LLM_TIMEOUT_MS ?? 12_000) + 1000),
    })
    const elapsedMs = Math.round(performance.now() - start)
    const parsed = pingSchema.safeParse(result.json)
    if (!parsed.success || parsed.data.ok !== true || parsed.data.candidateId !== 'demo-candidate-1') {
      throw new GeminiApiError('invalid_response')
    }
    process.stdout.write([
      'Gemini LLM ping: PASS',
      `model=${result.model}`,
      'calls=1',
      `elapsed_ms=${elapsedMs}`,
      `input_tokens=${result.usage.inputTokens}`,
      `output_tokens=${result.usage.outputTokens}`,
      'json_schema=PASS',
      'api_key=not displayed',
    ].join('\n') + '\n')
  } catch (error) {
    const elapsedMs = Math.round(performance.now() - start)
    if (error instanceof GeminiApiError) {
      process.stderr.write(`Gemini LLM ping: FAIL; kind=${error.kind}; http_status=${error.status ?? 'n/a'}; elapsed_ms=${elapsedMs}; calls=1\n`)
    } else if (error instanceof DOMException && error.name === 'TimeoutError') {
      process.stderr.write(`Gemini LLM ping: FAIL; kind=timeout; elapsed_ms=${elapsedMs}; calls=1\n`)
    } else {
      process.stderr.write(`Gemini LLM ping: FAIL; kind=network_or_runtime; elapsed_ms=${elapsedMs}; calls=1\n`)
    }
    process.exitCode = 1
  }
}

await main()

import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { GeminiLlmClient } from './gemini'

const outputSchema = z.object({ ok: z.boolean(), candidateId: z.string() }).strict()
const baseArgs = (signal = new AbortController().signal) => ({
  system: 'Return a small JSON object.',
  user: JSON.stringify({ candidate: { id: 'demo-place' } }),
  schema: outputSchema,
  maxOutputTokens: 64,
  temperature: 0.4,
  signal,
})

function fakeFetch(status: number, body: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch
}

describe('GeminiLlmClient (HTTP mocked)', () => {
  it('sends structured JSON without logging and maps result and token usage', async () => {
    let sent: RequestInit | undefined
    const fetchImpl = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      sent = init
      return new Response(JSON.stringify({
        model: 'gemini-test-model',
        steps: [{ type: 'model_output', content: [{ type: 'text', text: '{"ok":true,"candidateId":"demo-place"}' }] }],
        usage: { total_input_tokens: 23, total_output_tokens: 9, total_thought_tokens: 7 },
      }), { status: 200 })
    }) as typeof fetch
    const client = new GeminiLlmClient({ apiKey: 'test-key', model: 'test-model', timeoutMs: 1000, fetchImpl })
    const result = await client.completeJson(baseArgs())
    const request = JSON.parse(String(sent?.body)) as Record<string, unknown>
    const schema = (request.response_format as { schema: Record<string, unknown> }).schema
    expect(sent?.headers).toMatchObject({ 'x-goog-api-key': 'test-key' })
    expect(request).toMatchObject({
      model: 'test-model', input: baseArgs().user, system_instruction: baseArgs().system,
      response_format: { type: 'text', mime_type: 'application/json' },
      generation_config: { max_output_tokens: 3500, thinking_level: 'low' }, store: false,
    })
    expect(request.generation_config).not.toHaveProperty('temperature')
    expect(schema).toMatchObject({ type: 'object', additionalProperties: false })
    expect(schema).not.toHaveProperty('$schema')
    expect(result).toEqual({
      json: { ok: true, candidateId: 'demo-place' },
      usage: { inputTokens: 23, outputTokens: 9, thinkingTokens: 7 }, model: 'gemini-test-model', httpStatus: 200,
    })
  })

  it.each([
    [400, 'bad_request'], [401, 'authentication'], [403, 'authentication'], [408, 'timeout'], [429, 'quota'], [404, 'model_not_found'], [500, 'http_error'],
  ] as const)('classifies HTTP %s without surfacing the response body', async (status, kind) => {
    const fetchImpl = fakeFetch(status, { error: { message: 'sensitive server response' } })
    const client = new GeminiLlmClient({ apiKey: 'not-printed', model: 'bad-model', timeoutMs: 100, fetchImpl })
    await expect(client.completeJson(baseArgs())).rejects.toMatchObject({ name: 'GeminiApiError', kind, status })
  })

  it('recognizes zero quota from 429 metadata without exposing its message', async () => {
    const fetchImpl = fakeFetch(429, { error: { message: 'Quota limit: 0 for this model' } })
    const client = new GeminiLlmClient({ apiKey: 'not-printed', model: 'free-tier-model', timeoutMs: 100, fetchImpl })
    await expect(client.completeJson(baseArgs())).rejects.toMatchObject({ kind: 'quota_zero', status: 429 })
  })

  it('does not expose provider error body details', async () => {
    const fetchImpl = fakeFetch(400, { error: { message: 'private details and input excerpt' } })
    const client = new GeminiLlmClient({ apiKey: 'not-printed', model: 'bad-model', timeoutMs: 100, fetchImpl })
    const error = await client.completeJson(baseArgs()).catch((caught: unknown) => caught)
    expect(error).toMatchObject({ kind: 'bad_request', status: 400 })
    expect(error).not.toHaveProperty('message', expect.stringContaining('private details'))
  })

  it('classifies fetch failures as network errors', async () => {
    const fetchImpl = (async () => { throw new TypeError('network failed with private data') }) as typeof fetch
    const client = new GeminiLlmClient({ apiKey: 'not-printed', model: 'test-model', timeoutMs: 100, fetchImpl })
    await expect(client.completeJson(baseArgs())).rejects.toMatchObject({ kind: 'network' })
  })

  it('aborts in-flight fetch at LLM_TIMEOUT_MS', async () => {
    const fetchImpl = ((_, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true })
    })) as typeof fetch
    const client = new GeminiLlmClient({ apiKey: 'test-key', model: 'test-model', timeoutMs: 5, fetchImpl })
    await expect(client.completeJson(baseArgs())).rejects.toMatchObject({ name: 'GeminiApiError', kind: 'timeout' })
  })

  it('honors a caller AbortSignal independently of the provider timeout', async () => {
    const fetchImpl = ((_, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true })
    })) as typeof fetch
    const controller = new AbortController()
    const client = new GeminiLlmClient({ apiKey: 'test-key', model: 'test-model', timeoutMs: 1000, fetchImpl })
    const pending = client.completeJson(baseArgs(controller.signal))
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('fails closed when JSON cannot be decoded', async () => {
    const client = new GeminiLlmClient({ apiKey: 'test-key', model: 'test-model', timeoutMs: 100, fetchImpl: fakeFetch(200, { steps: [] }) })
    await expect(client.completeJson(baseArgs())).rejects.toMatchObject({ name: 'GeminiApiError', kind: 'bad_json' })
  })
})

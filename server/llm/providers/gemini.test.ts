import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { GeminiApiError, GeminiLlmClient } from './gemini'

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
        usage: { total_input_tokens: 23, total_output_tokens: 9 },
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
      generation_config: { max_output_tokens: 64 }, store: false,
    })
    expect(schema).toMatchObject({ type: 'object', additionalProperties: false })
    expect(schema).not.toHaveProperty('$schema')
    expect(result).toEqual({
      json: { ok: true, candidateId: 'demo-place' },
      usage: { inputTokens: 23, outputTokens: 9 }, model: 'gemini-test-model',
    })
  })

  it.each([
    [401, 'authentication'], [403, 'authentication'], [429, 'quota'], [404, 'model_not_found'], [500, 'http_error'],
  ] as const)('classifies HTTP %s without surfacing the response body', async (status, kind) => {
    const fetchImpl = fakeFetch(status, { error: { message: 'sensitive server response' } })
    const client = new GeminiLlmClient({ apiKey: 'not-printed', model: 'bad-model', timeoutMs: 100, fetchImpl })
    await expect(client.completeJson(baseArgs())).rejects.toMatchObject({ name: 'GeminiApiError', kind, status })
  })

  it('aborts in-flight fetch at LLM_TIMEOUT_MS', async () => {
    const fetchImpl = ((_, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true })
    })) as typeof fetch
    const client = new GeminiLlmClient({ apiKey: 'test-key', model: 'test-model', timeoutMs: 5, fetchImpl })
    await expect(client.completeJson(baseArgs())).rejects.toMatchObject({ name: 'TimeoutError' })
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
    await expect(client.completeJson(baseArgs())).rejects.toBeInstanceOf(GeminiApiError)
  })
})

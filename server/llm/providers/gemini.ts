import { z } from 'zod'
import type { LlmClient, LlmCompletion } from '../client'

const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions'

export type GeminiProviderConfig = {
  apiKey: string
  model: string
  timeoutMs: number
  fetchImpl?: typeof fetch
}

export type GeminiApiFailureKind = 'timeout' | 'authentication' | 'quota' | 'quota_zero' | 'model_not_found' | 'bad_request' | 'network' | 'bad_json' | 'http_error'

export class GeminiApiError extends Error {
  constructor(readonly kind: GeminiApiFailureKind, readonly status?: number) {
    super(`Gemini API request failed (${kind}${status ? `, HTTP ${status}` : ''})`)
    this.name = 'GeminiApiError'
  }
}

type InteractionResponse = {
  model?: unknown
  steps?: Array<{ type?: unknown; content?: Array<{ type?: unknown; text?: unknown }> }>
  usage?: { total_input_tokens?: unknown; total_output_tokens?: unknown; total_thought_tokens?: unknown }
}

function geminiSchema(schema: z.ZodType): Record<string, unknown> {
  const converted = z.toJSONSchema(schema)
  const providerSchema = { ...converted }
  delete providerSchema.$schema
  return providerSchema as Record<string, unknown>
}

function responseText(body: InteractionResponse): string | null {
  for (const step of body.steps ?? []) {
    if (step.type !== 'model_output') continue
    for (const content of step.content ?? []) {
      if (content.type === 'text' && typeof content.text === 'string') return content.text
    }
  }
  return null
}

function tokenCount(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0
}

export class GeminiLlmClient implements LlmClient {
  private readonly fetchImpl: typeof fetch

  constructor(private readonly config: GeminiProviderConfig = {
    apiKey: process.env.LLM_API_KEY ?? '',
    model: process.env.LLM_MODEL ?? '',
    timeoutMs: Number(process.env.LLM_TIMEOUT_MS ?? '12000'),
  }) {
    this.fetchImpl = config.fetchImpl ?? fetch
  }

  async completeJson(args: Parameters<LlmClient['completeJson']>[0]): Promise<LlmCompletion> {
    if (!this.config.apiKey) throw new GeminiApiError('authentication')
    if (!this.config.model) throw new GeminiApiError('model_not_found')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(new DOMException('LLM request timed out', 'TimeoutError')),
      Math.max(1, this.config.timeoutMs))
    const onCallerAbort = () => controller.abort(args.signal.reason)
    if (args.signal.aborted) onCallerAbort()
    else args.signal.addEventListener('abort', onCallerAbort, { once: true })

    try {
      let response: Response
      try {
        response = await this.fetchImpl(GEMINI_INTERACTIONS_URL, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-goog-api-key': this.config.apiKey,
          },
          body: JSON.stringify({
            model: this.config.model,
            input: args.user,
            system_instruction: args.system,
            response_format: {
              type: 'text',
              mime_type: 'application/json',
              schema: geminiSchema(args.schema),
            },
            // Gemini 3 docs advise its default temperature; thinking_level low reduces latency.
            // max_output_tokens includes thinking tokens, so reserve room for reasoning and JSON.
            generation_config: { max_output_tokens: Math.max(3500, args.maxOutputTokens), thinking_level: 'low' },
            store: false,
          }),
          signal: controller.signal,
        })
      } catch {
        if (controller.signal.aborted) {
          if (args.signal.aborted) throw new DOMException('LLM request aborted', 'AbortError')
          throw new GeminiApiError('timeout')
        }
        throw new GeminiApiError('network')
      }

      if (!response.ok) {
        let errorBody = ''
        if (response.status === 429) {
          try { errorBody = await response.text() } catch {
            if (controller.signal.aborted) {
              if (args.signal.aborted) throw new DOMException('LLM request aborted', 'AbortError')
              throw new GeminiApiError('timeout')
            }
          }
        }
        const kind: GeminiApiFailureKind = response.status === 401 || response.status === 403
          ? 'authentication'
          : response.status === 429 ? (/limit\s*[:=]\s*0|"limit"\s*:\s*0/i.test(errorBody) ? 'quota_zero' : 'quota')
          : response.status === 408 || response.status === 504 ? 'timeout'
            : response.status === 404 ? 'model_not_found'
              : response.status === 400 ? 'bad_request' : 'http_error'
        throw new GeminiApiError(kind, response.status)
      }

      let body: InteractionResponse
      try {
        body = await response.json() as InteractionResponse
      } catch {
        if (controller.signal.aborted) {
          if (args.signal.aborted) throw new DOMException('LLM request aborted', 'AbortError')
          throw new GeminiApiError('timeout')
        }
        throw new GeminiApiError('bad_json', response.status)
      }
      const text = responseText(body)
      if (!text) throw new GeminiApiError('bad_json', response.status)
      let json: unknown
      try {
        json = JSON.parse(text) as unknown
      } catch {
        throw new GeminiApiError('bad_json', response.status)
      }
      return {
        json,
        usage: {
          inputTokens: tokenCount(body.usage?.total_input_tokens),
          outputTokens: tokenCount(body.usage?.total_output_tokens),
          thinkingTokens: tokenCount(body.usage?.total_thought_tokens),
        },
        model: typeof body.model === 'string' ? body.model : this.config.model,
        httpStatus: response.status,
      }
    } finally {
      clearTimeout(timeout)
      args.signal.removeEventListener('abort', onCallerAbort)
    }
  }
}

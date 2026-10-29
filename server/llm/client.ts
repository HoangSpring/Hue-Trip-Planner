import type { z } from 'zod'

/** JSON-only contract shared by provider implementations and deterministic test doubles. */
export interface LlmClient {
  completeJson(args: {
    system: string
    user: string
    schema: z.ZodType
    maxOutputTokens: number
    temperature: number
    signal: AbortSignal
  }): Promise<LlmCompletion>
}

export type LlmCompletion = {
  json: unknown
  usage: { inputTokens: number; outputTokens: number }
  model: string
}

export class LlmTimeoutError extends Error {
  constructor() {
    super('LLM request timed out')
    this.name = 'LlmTimeoutError'
  }
}

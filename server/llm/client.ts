import type { z } from 'zod'

/** JSON-only contract shared by provider implementations and deterministic test doubles. */
export interface LlmClient {
  completeJson(args: {
    system: string
    user: string
    schema: z.ZodType
    maxOutputTokens: number
    /** Optional for providers that expose sampling; Gemini 3 omits it and uses model defaults. */
    temperature?: number
    signal: AbortSignal
  }): Promise<LlmCompletion>
}

export type LlmCompletion = {
  json: unknown
  usage: { inputTokens: number; outputTokens: number; thinkingTokens: number }
  model: string
  httpStatus: number
}

export class LlmTimeoutError extends Error {
  constructor() {
    super('LLM request timed out')
    this.name = 'LlmTimeoutError'
  }
}

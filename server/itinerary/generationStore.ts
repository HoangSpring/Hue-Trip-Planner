import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/types/supabase'
import { AppError } from '../lib/errors'

export type GenerationIdentity = { userId: string | null; clientKey: string; isGuest: boolean }
export type GenerationEvent = GenerationIdentity & {
  status: 'success' | 'fallback' | 'error' | 'rate_limited'
  generatedBy?: 'llm' | 'fallback' | null
  llmModel?: string | null
  inputTokens?: number | null
  outputTokens?: number | null
  thinkingTokens?: number | null
  durationMs: number
  errorCode: string | null
  promptVersion?: string | null
  poolSize?: number | null
  repairs?: number | null
  coverage?: number | null
  fallbackReason?: string | null
  llmCallEvent?: boolean
}

export interface GenerationStore {
  listRecent(identity: GenerationIdentity, since: string, signal?: AbortSignal): Promise<string[]>
  listRecentLlmCalls(identity: GenerationIdentity, since: string, signal?: AbortSignal): Promise<string[]>
  record(event: GenerationEvent): Promise<void>
}

export class SupabaseGenerationStore implements GenerationStore {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listRecent(identity: GenerationIdentity, since: string, signal?: AbortSignal): Promise<string[]> {
    let query = this.client.from('generation_events').select('created_at').gte('created_at', since)
    query = identity.userId ? query.eq('user_id', identity.userId) : query.eq('client_key', identity.clientKey)
    query = query.or('error_code.is.null,error_code.not.like.LLM_CALL:%')
    if (signal) query = query.abortSignal(signal)
    const { data, error } = await query.order('created_at', { ascending: true })
    if (error || !data) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể kiểm tra hạn mức tạo lịch trình.')
    return data.map(({ created_at }) => created_at)
  }

  async listRecentLlmCalls(identity: GenerationIdentity, since: string, signal?: AbortSignal): Promise<string[]> {
    let query = this.client.from('generation_events').select('created_at').gte('created_at', since)
      .eq('generated_by', 'llm').like('error_code', 'LLM_CALL:%')
    // LLM_DAILY_CALL_CAP is a server-wide cost fuse, unlike the per-user/API rate limit.
    void identity
    if (signal) query = query.abortSignal(signal)
    const { data, error } = await query.order('created_at', { ascending: true })
    if (error || !data) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể kiểm tra hạn mức gọi AI.')
    return data.map(({ created_at }) => created_at)
  }

  async record(event: GenerationEvent): Promise<void> {
    const { error } = await this.client.from('generation_events').insert({
      user_id: event.userId,
      client_key: event.clientKey,
      is_guest: event.isGuest,
      status: event.status,
      generated_by: event.llmCallEvent ? 'llm' : event.generatedBy ?? (event.status === 'fallback' ? 'fallback' : null),
      llm_model: event.llmModel ?? null,
      input_tokens: event.inputTokens ?? null,
      output_tokens: event.outputTokens ?? null,
      duration_ms: event.durationMs,
      error_code: event.llmCallEvent ? `LLM_CALL:${event.errorCode ?? 'success'}` : event.errorCode,
    })
    if (error) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể ghi nhận lượt tạo lịch trình.')
  }
}

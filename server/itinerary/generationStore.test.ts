import { describe, expect, it } from 'vitest'
import { generationInsertRow, type GenerationEvent } from './generationStore'

const event: GenerationEvent = {
  userId: null, clientKey: 'hashed-client-key', isGuest: true, status: 'fallback', generatedBy: 'fallback',
  durationMs: 123, errorCode: null, promptVersion: 'prompt-v2', poolSize: 24, repairs: 2,
  coverage: 0.875, fallbackReason: 'low_coverage', thinkingTokens: 17,
}

describe('generation event telemetry schema compatibility', () => {
  it('writes only legacy columns until the optional migration is enabled', () => {
    const row = generationInsertRow(event, false)
    expect(row).toMatchObject({ status: 'fallback', generated_by: 'fallback', duration_ms: 123 })
    expect(row).not.toHaveProperty('prompt_version')
    expect(row).not.toHaveProperty('thinking_tokens')
  })

  it('adds nullable telemetry fields only after the migration flag is enabled', () => {
    expect(generationInsertRow(event, true)).toMatchObject({
      prompt_version: 'prompt-v2', pool_size: 24, repairs: 2, coverage: 0.875,
      fallback_reason: 'low_coverage', thinking_tokens: 17,
    })
  })
})

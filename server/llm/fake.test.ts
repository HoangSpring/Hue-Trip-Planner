import { describe, expect, it } from 'vitest'
import { FakeLlmClient, type FakeLlmScenario } from './fake'

const candidates = [
  { id: 'food-id', category: 'food', mealType: ['lunch'] },
  { id: 'place-id', category: 'heritage' },
]
const args = (signal = new AbortController().signal) => ({
  system: 'system', user: JSON.stringify({ trip: { numDays: 1 }, candidates }),
  schema: { parse: (value: unknown) => value } as never, maxOutputTokens: 2500, temperature: 0.4, signal,
})

describe('FakeLlmClient', () => {
  it.each<FakeLlmScenario>([
    'valid', 'unknown_id', 'duplicate_id', 'missing_day', 'no_lunch', 'invalid_slot',
    'invalid_json', 'too_long', 'url_html_reason', 'extra_field',
  ])('returns deterministic scenario %s and tracks token usage', async (scenario) => {
    const client = new FakeLlmClient(scenario)
    const result = await client.completeJson(args())
    expect(result.usage.inputTokens).toBeGreaterThan(0)
    expect(result.usage.outputTokens).toBeGreaterThan(0)
    expect(client.calls).toEqual([result.usage])
    expect(result.model).toBe('fake')
    if (scenario === 'valid') expect(result.json).toMatchObject({ days: [{ dayIndex: 1 }] })
    if (scenario === 'extra_field') expect(result.json).toHaveProperty('unexpected', true)
  })

  it('honors AbortSignal for the timeout scenario', async () => {
    const controller = new AbortController()
    const client = new FakeLlmClient('timeout', 1000)
    const pending = client.completeJson(args(controller.signal))
    controller.abort()
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' })
  })
})

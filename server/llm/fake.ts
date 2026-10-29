import type { LlmClient, LlmCompletion } from './client'

export type FakeLlmScenario =
  | 'valid' | 'unknown_id' | 'duplicate_id' | 'missing_day' | 'no_lunch' | 'invalid_slot'
  | 'invalid_json' | 'timeout' | 'too_long' | 'url_html_reason' | 'extra_field'

type Candidate = { id?: string; category?: string; mealType?: string[]; bestTime?: string[] }

function completionFor(userText: string, scenario: FakeLlmScenario): LlmCompletion {
  let user: { trip?: { numDays?: number }; candidates?: Candidate[] } = {}
  try {
    user = JSON.parse(userText) as typeof user
  } catch {
    // This fake returns a deliberately malformed result when its input isn't JSON.
  }
  const numDays = Math.max(1, Math.min(5, user.trip?.numDays ?? 1))
  const candidates = user.candidates ?? []
  const availableIds = candidates.map(({ id }) => id).filter((id): id is string => typeof id === 'string')
  const lunchId = candidates.find(({ category, mealType }) => category === 'food' && (!mealType?.length || mealType.includes('lunch')))?.id
  const nonFoodId = availableIds.find((id) => candidates.find((candidate) => candidate.id === id)?.category !== 'food')
  const days = Array.from({ length: numDays }, (_, index) => ({
    dayIndex: index + 1,
    items: [
      ...(lunchId ? [{ placeId: lunchId, slot: 'noon', reason: 'Lựa chọn phù hợp với sở thích của bạn.' }] : []),
      ...(nonFoodId ? [{ placeId: nonFoodId, slot: 'morning', reason: 'Điểm dừng phù hợp trong hành trình.' }] : []),
    ],
  }))
  const response: Record<string, unknown> = { days }
  switch (scenario) {
    case 'unknown_id': {
      const firstItem = days[0]?.items[0]
      if (firstItem) firstItem.placeId = '00000000-0000-4000-8000-000000000000'
      break
    }
    case 'duplicate_id': if (days[0]) days[0].items.push(...days[0].items.slice(0, 1)); break
    case 'missing_day': response.days = days.slice(0, -1); break
    case 'no_lunch': for (const day of days) day.items = day.items.filter(({ slot }) => slot !== 'noon'); break
    case 'invalid_slot': if (days[0]?.items[0]) days[0].items[0].slot = 'midnight'; break
    case 'invalid_json': response.days = 'broken'; break
    case 'too_long': response.padding = 'x'.repeat(100_000); break
    case 'url_html_reason': if (days[0]?.items[0]) days[0].items[0].reason = '<b>https://example.com</b>';
      break
    case 'extra_field': response.unexpected = true; break
    case 'timeout': break
    case 'valid': break
  }
  return {
    json: response,
    usage: { inputTokens: Math.ceil(userText.length / 4), outputTokens: Math.ceil(JSON.stringify(response).length / 4), thinkingTokens: 0 },
    model: 'fake',
    httpStatus: 200,
  }
}

export class FakeLlmClient implements LlmClient {
  readonly calls: Array<{ inputTokens: number; outputTokens: number; thinkingTokens: number }> = []

  constructor(private readonly scenario: FakeLlmScenario = 'valid', private readonly timeoutMs = 25) {}

  async completeJson(args: Parameters<LlmClient['completeJson']>[0]): Promise<LlmCompletion> {
    if (this.scenario === 'timeout') {
      await new Promise<never>((_, reject) => {
        const onAbort = () => reject(new DOMException('Aborted', 'AbortError'))
        if (args.signal.aborted) onAbort()
        else args.signal.addEventListener('abort', onAbort, { once: true })
        setTimeout(() => reject(new DOMException('Fake timeout', 'TimeoutError')), this.timeoutMs)
      })
    }
    if (args.signal.aborted) throw new DOMException('Aborted', 'AbortError')
    const result = completionFor(args.user, this.scenario)
    this.calls.push(result.usage)
    return result
  }
}

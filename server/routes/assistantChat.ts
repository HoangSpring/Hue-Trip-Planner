import { Hono } from 'hono'
import { z } from 'zod'
import {
  assistantChatRequestSchema,
  type AssistantChatResponse,
} from '@shared/schemas'
import { getAssistantResponse } from '@shared/assistant/assistantKnowledge'
import { env } from '../lib/env'
import type { ApiEnv } from '../types'
import type { LlmClient } from '../llm/client'
import { GeminiLlmClient } from '../llm/providers/gemini'

export const ASSISTANT_SYSTEM_PROMPT = `Bạn là "Trợ lý Cố Đô" — trợ lý AI thông minh, am hiểu sâu sắc và duyên dáng về du lịch Huế của website Hue Trip Planner (Cố Đô).

Nhiệm vụ của bạn:
1. Trả lời MỌI câu hỏi của người dùng một cách chính xác, thân thiện, mang đậm nét văn hóa Huế mến khách ("dạ", "thưa", "bạn ơi", dùng ngôn từ ấm áp, lịch thiệp).
2. Ưu tiên tư vấn chuyên sâu về du lịch Huế: các điểm tham quan (Đại Nội, lăng tẩm các vua triều Nguyễn, chùa Thiên Mụ, làng hương Thủy Xuân, đồi Vọng Cảnh, phố đi bộ...), ẩm thực (bún bò, bánh bèo, nậm, lọc, ram ít, cơm hến, chè Huế, bánh khoái, cà phê muối...), gợi ý lịch trình, phương tiện di chuyển, thời tiết, kinh nghiệm thực tế.
3. Khi người dùng hỏi bất kỳ câu hỏi nào khác (câu hỏi mở, văn hóa, đời sống, kiến thức chung...), bạn vẫn trả lời thông minh, súc tích, nhiệt tình và liên hệ một cách khéo léo, tự nhiên đến vẻ đẹp hoặc trải nghiệm khám phá Huế nếu hợp lý.
4. Trình bày đẹp mắt và dễ đọc: dùng gạch đầu dòng, in đậm tên địa danh/món ăn, chia thành 2-4 đoạn ngắn gọn để người dùng đọc thuận tiện trên cả điện thoại di động.
5. Khi phù hợp với ngữ cảnh, bạn có thể gợi ý các liên kết nội bộ trong website:
   - Tạo lịch trình tự động tối ưu: /plan/new
   - Mở bản đồ du lịch tương tác: /map
   - Khám phá và lọc danh sách địa điểm: /explore
`

export const llmAssistantResponseSchema = z.object({
  text: z.string().describe('Câu trả lời bằng tiếng Việt đầy đủ, thân thiện, format markdown.'),
  suggestedActions: z.array(z.object({
    label: z.string().describe('Tên nút bấm ngắn gọn (tối đa 25 ký tự)'),
    to: z.string().optional().describe('Đường dẫn nội bộ trang web nếu phù hợp (/plan/new, /map, /explore)'),
    prompt: z.string().optional().describe('Câu hỏi gợi ý tiếp theo nếu người dùng muốn hỏi thêm'),
  })).max(3).optional().describe('1-3 gợi ý hành động hoặc câu hỏi liên quan tiếp theo'),
})

export type AssistantChatRouteDependencies = {
  createLlmClient?: () => LlmClient
  llmEnabled?: boolean
  llmTimeoutMs?: number
}

function buildChatUserPrompt(
  message: string,
  history?: Array<{ sender: 'user' | 'assistant'; text: string }>
): string {
  if (!history || history.length === 0) return message
  const recentHistory = history.slice(-8)
  const formattedHistory = recentHistory
    .map((h) => `${h.sender === 'user' ? 'Người dùng' : 'Trợ lý Cố Đô'}: ${h.text}`)
    .join('\n\n')
  return `Lịch sử cuộc trò chuyện:\n${formattedHistory}\n\nNgười dùng vừa hỏi: ${message}\n\nHãy trả lời câu hỏi này:`
}

export function createAssistantChatRoute(deps: AssistantChatRouteDependencies = {}) {
  const router = new Hono<ApiEnv>()
  const llmEnabled = deps.llmEnabled ?? env.LLM_ENABLED
  const llmTimeoutMs = deps.llmTimeoutMs ?? env.LLM_TIMEOUT_MS
  const getLlmClient = deps.createLlmClient ?? (() => new GeminiLlmClient({
    apiKey: env.LLM_API_KEY ?? '',
    model: env.LLM_MODEL ?? '',
    timeoutMs: llmTimeoutMs,
  }))

  router.post('/assistant/chat', async (context) => {
    const rawBody = await context.req.json().catch(() => ({}))
    const parsed = assistantChatRequestSchema.safeParse(rawBody)

    if (!parsed.success) {
      return context.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.',
          },
        },
        400
      )
    }

    const { message, history } = parsed.data

    // If LLM is enabled and client/API key is configured, call the AI model
    const canCallLlm = llmEnabled && Boolean(deps.createLlmClient || env.LLM_API_KEY)
    if (canCallLlm) {
      try {
        const client = getLlmClient()
        const userPrompt = buildChatUserPrompt(message, history)
        const abortController = new AbortController()
        const timeout = setTimeout(() => abortController.abort(), llmTimeoutMs)

        const completion = await client.completeJson({
          system: ASSISTANT_SYSTEM_PROMPT,
          user: userPrompt,
          schema: llmAssistantResponseSchema,
          maxOutputTokens: 1500,
          signal: abortController.signal,
        })
        clearTimeout(timeout)

        const parsedOutput = llmAssistantResponseSchema.safeParse(completion.json)
        if (parsedOutput.success) {
          const res: AssistantChatResponse = {
            text: parsedOutput.data.text,
            actions: parsedOutput.data.suggestedActions,
            source: 'ai',
          }
          return context.json(res)
        }
      } catch (err) {
        // Fall through to curated knowledge base on LLM errors/timeouts
        console.warn('[AssistantChat] LLM call failed, using knowledge fallback:', err instanceof Error ? err.message : err)
      }
    }

    // Fallback: rule-based knowledge engine
    const fallback = getAssistantResponse(message)
    const res: AssistantChatResponse = {
      text: fallback.text,
      actions: fallback.actions,
      source: 'knowledge_base',
    }
    return context.json(res)
  })

  return router
}

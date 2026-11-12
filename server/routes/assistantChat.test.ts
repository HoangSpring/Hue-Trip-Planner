import { describe, expect, it, vi } from 'vitest'
import { Hono } from 'hono'
import type { LlmClient } from '../llm/client'
import { createAssistantChatRoute } from './assistantChat'

function makeMockLlm(responseText: string): LlmClient {
  return {
    completeJson: vi.fn().mockResolvedValue({
      json: {
        text: responseText,
        suggestedActions: [
          { label: 'Tạo lịch trình', to: '/plan/new' },
        ],
      },
      usage: { inputTokens: 50, outputTokens: 30, thinkingTokens: 0 },
      model: 'mock-model',
      httpStatus: 200,
    }),
  }
}

describe('POST /api/assistant/chat', () => {
  it('returns 400 when message is empty', async () => {
    const app = new Hono()
    app.route('/api', createAssistantChatRoute({ llmEnabled: false }))

    const res = await app.request('/api/assistant/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    })

    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error.code).toBe('VALIDATION_ERROR')
  })

  it('uses LLM when enabled and returns ai response', async () => {
    const mockLlm = makeMockLlm('Chào bạn, đây là câu trả lời được sinh từ AI cho câu hỏi bất kỳ!')
    const app = new Hono()
    app.route(
      '/api',
      createAssistantChatRoute({
        createLlmClient: () => mockLlm,
        llmEnabled: true,
      })
    )

    const res = await app.request('/api/assistant/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: 'Tôi muốn tìm hiểu về kiến trúc nhà vườn Huế xưa',
        history: [
          { sender: 'user', text: 'Chào bạn' },
          { sender: 'assistant', text: 'Chào bạn, mình có thể giúp gì?' },
        ],
      }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.source).toBe('ai')
    expect(data.text).toContain('được sinh từ AI')
    expect(data.actions?.length).toBe(1)
    expect(mockLlm.completeJson).toHaveBeenCalled()
  })

  it('falls back to knowledge base when LLM encounters an error', async () => {
    const failingLlm: LlmClient = {
      completeJson: vi.fn().mockRejectedValue(new Error('LLM timeout or quota error')),
    }
    const app = new Hono()
    app.route(
      '/api',
      createAssistantChatRoute({
        createLlmClient: () => failingLlm,
        llmEnabled: true,
      })
    )

    const res = await app.request('/api/assistant/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: 'Bún bò Huế ở đâu ngon?',
      }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.source).toBe('knowledge_base')
    expect(data.text).toContain('O Cương Điệp')
  })

  it('uses knowledge base directly when llm is disabled', async () => {
    const app = new Hono()
    app.route(
      '/api',
      createAssistantChatRoute({
        llmEnabled: false,
      })
    )

    const res = await app.request('/api/assistant/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: 'Nên đi lăng vua nào?',
      }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.source).toBe('knowledge_base')
    expect(data.text).toContain('Khải Định')
  })
})

import { z } from 'zod'

export const assistantChatActionSchema = z.object({
  label: z.string(),
  to: z.string().optional(),
  prompt: z.string().optional(),
})

export const assistantChatMessageSchema = z.object({
  sender: z.enum(['user', 'assistant']),
  text: z.string().max(4000),
})

export const assistantChatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Tin nhắn không được để trống').max(1000, 'Tin nhắn quá dài (tối đa 1000 ký tự)'),
  history: z.array(assistantChatMessageSchema).max(20).optional(),
})

export const assistantChatResponseSchema = z.object({
  text: z.string(),
  actions: z.array(assistantChatActionSchema).optional(),
  source: z.enum(['ai', 'knowledge_base']),
})

export type AssistantChatAction = z.infer<typeof assistantChatActionSchema>
export type AssistantChatMessage = z.infer<typeof assistantChatMessageSchema>
export type AssistantChatRequest = z.infer<typeof assistantChatRequestSchema>
export type AssistantChatResponse = z.infer<typeof assistantChatResponseSchema>

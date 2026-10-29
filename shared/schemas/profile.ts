import { z } from 'zod'

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  role: z.enum(['user', 'admin']),
}).strict()

export const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(60).refine(value => !/[\u0000-\u001f\u007f]/.test(value), 'Tên hiển thị không hợp lệ.').refine(value => !/<\/?[a-z][\s\S]*>/i.test(value), 'Tên hiển thị chỉ nhận văn bản thuần.'),
}).strict()

export const deleteAccountRequestSchema = z.object({ confirm: z.literal('XOA') }).strict()

export type Profile = z.infer<typeof profileSchema>

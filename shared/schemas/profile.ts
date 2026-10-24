import { z } from 'zod'

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  role: z.enum(['user', 'admin']),
}).strict()

export type Profile = z.infer<typeof profileSchema>

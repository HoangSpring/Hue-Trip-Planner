import { z } from 'zod'

export const adminUserRoleSchema = z.enum(['user', 'admin'])
export const adminUserIdSchema = z.string().uuid()

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

export const adminUserSchema = z.object({
  id: adminUserIdSchema,
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  role: adminUserRoleSchema,
  createdAt: z.string().datetime(),
  lastSignInAt: z.string().datetime().nullable(),
  suspended: z.boolean(),
  bannedUntil: z.string().datetime().nullable(),
}).strict()

export const adminUserListSchema = z.object({
  items: z.array(adminUserSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  hasNext: z.boolean(),
}).strict()

export const adminUserRoleUpdateSchema = z.object({ role: adminUserRoleSchema }).strict()
export const adminUserSuspendSchema = z.object({ suspended: z.boolean() }).strict()
export const adminUserDeleteSchema = z.object({ confirm: z.literal('DELETE') }).strict()

export const adminDashboardSchema = z.object({
  users: z.number().int().nonnegative(),
  places: z.object({ total: z.number().int().nonnegative(), published: z.number().int().nonnegative(), draft: z.number().int().nonnegative() }).strict(),
  trips: z.number().int().nonnegative(),
}).strict()

export type AdminUser = z.infer<typeof adminUserSchema>

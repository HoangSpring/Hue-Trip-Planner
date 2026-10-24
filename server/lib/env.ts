import { z } from 'zod'

const optionalUrl = z.string().url().optional()

export const envSchema = z.object({
  SUPABASE_URL: optionalUrl,
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  LLM_API_KEY: z.string().min(1).optional(),
  LLM_MODEL: z.string().min(1).optional(),
  LLM_ENABLED: z.enum(['true', 'false']).default('true'),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(12_000),
  LLM_DAILY_CALL_CAP: z.coerce.number().int().nonnegative().default(500),
  RATE_LIMIT_SALT: z.string().min(1).optional(),
  APP_BASE_URL: optionalUrl,
})

export const env = envSchema.parse(process.env)

export function requireSupabasePublicConfig(): { url: string; anonKey: string } {
  const parsed = z.object({ url: z.string().url(), anonKey: z.string().min(1) }).safeParse({
    url: env.SUPABASE_URL,
    anonKey: env.SUPABASE_ANON_KEY,
  })
  if (!parsed.success) throw new Error('Supabase chưa được cấu hình')
  return parsed.data
}

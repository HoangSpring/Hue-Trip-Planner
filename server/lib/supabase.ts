import { createClient } from '@supabase/supabase-js'
import { requireSupabasePublicConfig } from './env'
import type { Database } from '../../src/types/supabase'

export function createPublicSupabaseClient() {
  const { url, anonKey } = requireSupabasePublicConfig()
  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function createUserSupabaseClient(accessToken: string) {
  const { url, anonKey } = requireSupabasePublicConfig()
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function createServiceRoleSupabaseClient() {
  const { url } = requireSupabasePublicConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) throw new Error('Thiếu cấu hình service role của Supabase.')
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

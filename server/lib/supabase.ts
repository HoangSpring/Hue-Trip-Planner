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

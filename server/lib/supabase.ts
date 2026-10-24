import { createClient } from '@supabase/supabase-js'
import { requireSupabasePublicConfig } from './env'

export function createUserSupabaseClient(accessToken: string) {
  const { url, anonKey } = requireSupabasePublicConfig()
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

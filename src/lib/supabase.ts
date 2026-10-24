import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Local builds and CI may run without credentials; AuthProvider then stays guest-only.
export const supabaseClient: SupabaseClient | null = url && anonKey
  ? createClient(url, anonKey, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } })
  : null

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient
}

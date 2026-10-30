import { vi } from '@/lib/strings/vi'

export type SafeAuthErrorDetails = {
  code: string | null
  status: number | null
}

export function safeAuthErrorDetails(error: unknown): SafeAuthErrorDetails {
  if (!error || typeof error !== 'object') return { code: null, status: null }
  const value = error as Record<string, unknown>
  const rawCode = typeof value.code === 'string'
    ? value.code
    : typeof value.error_code === 'string'
      ? value.error_code
      : null
  return {
    code: rawCode,
    status: typeof value.status === 'number' ? value.status : null,
  }
}

export function authErrorMessage(error: unknown, networkFailure = false): string {
  if (networkFailure) return vi.auth.networkFailed
  const code = safeAuthErrorDetails(error).code?.toLowerCase()
  if (code === 'email_address_not_authorized' || code === 'over_email_send_rate_limit') return vi.auth.emailDeliveryFailed
  if (code === 'weak_password') return vi.auth.weakPassword
  if (code === 'signup_disabled') return vi.auth.signupDisabled
  if (code === 'invalid_credentials') return vi.auth.invalidCredentials
  if (code === 'email_not_confirmed') return vi.auth.emailNotConfirmed
  return vi.auth.requestFailed
}

export function warnAuthFailure(error: unknown): void {
  if (!import.meta.env.DEV) return
  const { code, status } = safeAuthErrorDetails(error)
  console.warn('[auth] Supabase request failed', { code, status })
}

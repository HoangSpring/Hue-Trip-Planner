import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPasswordRequestSchema } from '@shared/schemas'
import { paths, safeNextPath } from '@/app/paths'
import { AuthAlert, AuthPageFrame, AuthSubmitButton, AuthTextField } from '../components/AuthPageFrame'
import { supabaseClient } from '@/lib/supabase'
import { vi } from '@/lib/strings/vi'

export default function ForgotPasswordPage() {
  const [params] = useSearchParams()
  const next = safeNextPath(params.get('next'))
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const input = resetPasswordRequestSchema.safeParse({ email })
    if (!input.success) { setError(vi.auth.invalidEmail); return }
    if (!supabaseClient) { setError(vi.auth.unavailable); return }
    setBusy(true)
    try {
      const { error: authError } = await supabaseClient.auth.resetPasswordForEmail(input.data.email, {
        redirectTo: `${window.location.origin}${paths.resetPassword}?next=${encodeURIComponent(next)}`,
      })
      if (authError) setError(vi.auth.resetRequestFailed)
      else setSent(true)
    } catch { setError(vi.auth.unavailable) } finally { setBusy(false) }
  }

  return <AuthPageFrame title={sent ? vi.auth.checkEmailTitle : vi.auth.forgotTitle} intro={sent ? vi.auth.resetNeutral : vi.auth.forgotIntro}
    onSubmit={sent ? undefined : submit}
    footer={<Link className="font-semibold text-primary underline" to={`${paths.login}?next=${encodeURIComponent(next)}`}>{vi.auth.backToLogin}</Link>}>
    {sent ? <AuthAlert success>{vi.auth.resetNeutral}</AuthAlert> : <>
      <AuthTextField label={vi.auth.email} type="email" value={email} onChange={setEmail} autoComplete="email" />
      {error && <AuthAlert>{error}</AuthAlert>}
      <AuthSubmitButton busy={busy}>{vi.auth.sendResetLink}</AuthSubmitButton>
    </>}
  </AuthPageFrame>
}

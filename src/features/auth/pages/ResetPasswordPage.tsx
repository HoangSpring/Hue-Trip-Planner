import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { updatePasswordSchema } from '@shared/schemas'
import { paths, safeNextPath } from '@/app/paths'
import { AuthAlert, AuthPageFrame, AuthSubmitButton, AuthTextField } from '../components/AuthPageFrame'
import { supabaseClient } from '@/lib/supabase'
import { vi } from '@/lib/strings/vi'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const next = safeNextPath(params.get('next'))
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const input = updatePasswordSchema.safeParse({ password, confirmPassword })
    if (!input.success) { setError(input.error.issues[0]?.message === 'passwords_differ' ? vi.auth.passwordMismatch : vi.auth.invalidForm); return }
    if (!supabaseClient) { setError(vi.auth.unavailable); return }
    setBusy(true)
    try {
      const { error: authError } = await supabaseClient.auth.updateUser({ password: input.data.password })
      if (authError) setError(vi.auth.resetPasswordFailed)
      else setSaved(true)
    } catch { setError(vi.auth.unavailable) } finally { setBusy(false) }
  }

  if (saved) return <AuthPageFrame title={vi.auth.passwordChangedTitle} intro={vi.auth.passwordChangedBody}>
    <AuthAlert success>{vi.auth.passwordChangedBody}</AuthAlert>
    <button className="min-h-12 w-full rounded-control bg-primary px-5 font-semibold text-white" onClick={() => navigate(next, { replace: true })}>{vi.auth.continue}</button>
  </AuthPageFrame>

  return <AuthPageFrame title={vi.auth.resetTitle} intro={vi.auth.resetIntro} onSubmit={submit}
    footer={<Link className="font-semibold text-primary underline" to={`${paths.forgotPassword}?next=${encodeURIComponent(next)}`}>{vi.auth.requestNewLink}</Link>}>
    <AuthTextField label={vi.auth.newPassword} type="password" value={password} onChange={setPassword} autoComplete="new-password" />
    <AuthTextField label={vi.auth.confirmPassword} type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
    <p className="-mt-2 text-xs text-ink-muted">{vi.auth.passwordHint}</p>
    {error && <AuthAlert>{error}</AuthAlert>}
    <AuthSubmitButton busy={busy}>{vi.auth.changePassword}</AuthSubmitButton>
  </AuthPageFrame>
}

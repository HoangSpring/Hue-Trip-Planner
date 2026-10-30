import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { signUpSchema } from '@shared/schemas'
import { paths, safeNextPath } from '@/app/paths'
import { AuthAlert, AuthPageFrame, AuthSubmitButton, AuthTextField } from '../components/AuthPageFrame'
import { supabaseClient } from '@/lib/supabase'
import { vi } from '@/lib/strings/vi'
import { authErrorMessage, warnAuthFailure } from '../authError'

export default function RegisterPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const next = safeNextPath(params.get('next'))
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmationNeeded, setConfirmationNeeded] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const input = signUpSchema.safeParse({ displayName, email, password })
    if (!input.success) { setError(vi.auth.invalidForm); return }
    if (!supabaseClient) { setError(vi.auth.unavailable); return }
    setBusy(true)
    try {
      const { data, error: authError } = await supabaseClient.auth.signUp({
        email: input.data.email,
        password: input.data.password,
        options: {
          data: { display_name: input.data.displayName },
          emailRedirectTo: `${window.location.origin}${paths.authCallback}?next=${encodeURIComponent(next)}`,
        },
      })
      if (authError) { warnAuthFailure(authError); setError(authErrorMessage(authError)) }
      else if (data.session) navigate(`${paths.authCallback}?next=${encodeURIComponent(next)}`, { replace: true })
      else setConfirmationNeeded(true)
    } catch (requestError) { warnAuthFailure(requestError); setError(authErrorMessage(requestError, true)) } finally { setBusy(false) }
  }

  if (confirmationNeeded) return <AuthPageFrame title={vi.auth.checkEmailTitle} intro={vi.auth.checkEmailBody} footer={<Link className="font-semibold text-primary underline" to={`${paths.login}?next=${encodeURIComponent(next)}`}>{vi.auth.backToLogin}</Link>}>
    <div className="rounded-control bg-secondary-tint p-4 text-sm leading-6 text-secondary">{vi.auth.confirmationNeutral}</div>
  </AuthPageFrame>

  return <AuthPageFrame title={vi.auth.registerTitle} intro={vi.auth.registerIntro}
    onSubmit={submit}
    footer={<>{vi.auth.hasAccount} <Link className="font-semibold text-primary underline" to={`${paths.login}?next=${encodeURIComponent(next)}`}>{vi.auth.loginLink}</Link></>}>
    <AuthTextField label={vi.auth.displayName} type="text" value={displayName} onChange={setDisplayName} autoComplete="name" />
    <AuthTextField label={vi.auth.email} type="email" value={email} onChange={setEmail} autoComplete="email" />
    <AuthTextField label={vi.auth.password} type="password" value={password} onChange={setPassword} autoComplete="new-password" />
    <p className="-mt-2 text-xs text-ink-muted">{vi.auth.passwordHint}</p>
    {error && <AuthAlert>{error}</AuthAlert>}
    <AuthSubmitButton busy={busy}>{vi.auth.registerSubmit}</AuthSubmitButton>
    <p className="text-center text-xs leading-5 text-ink-muted">{vi.auth.privacyLead} <Link className="underline" to={paths.privacy}>{vi.layout.privacy}</Link>.</p>
  </AuthPageFrame>
}

import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { signInSchema } from '@shared/schemas'
import { paths, safeNextPath } from '@/app/paths'
import { AuthAlert, AuthPageFrame, AuthSubmitButton, AuthTextField } from '../components/AuthPageFrame'
import { supabaseClient } from '@/lib/supabase'
import { vi } from '@/lib/strings/vi'
import { authErrorMessage, warnAuthFailure } from '../authError'

export default function LoginPage() {
  const [params] = useSearchParams()
  const next = safeNextPath(params.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const input = signInSchema.safeParse({ email, password })
    if (!input.success) { setError(vi.auth.invalidForm); return }
    if (!supabaseClient) { setError(vi.auth.unavailable); return }
    setBusy(true)
    try {
      const { error: authError } = await supabaseClient.auth.signInWithPassword(input.data)
      if (authError) { warnAuthFailure(authError); setError(authErrorMessage(authError)) }
    } catch (requestError) { warnAuthFailure(requestError); setError(authErrorMessage(requestError, true)) } finally { setBusy(false) }
  }

  return <AuthPageFrame title={vi.auth.loginTitle} intro={vi.auth.loginIntro}
    onSubmit={submit}
    footer={<>{vi.auth.noAccount} <Link className="font-semibold text-primary underline" to={`${paths.register}?next=${encodeURIComponent(next)}`}>{vi.auth.registerLink}</Link></>}>
    <AuthTextField label={vi.auth.email} type="email" value={email} onChange={setEmail} autoComplete="email" />
    <AuthTextField label={vi.auth.password} type="password" value={password} onChange={setPassword} autoComplete="current-password" />
    <div className="-mt-1 text-right"><Link className="text-sm font-semibold text-primary underline" to={`${paths.forgotPassword}?next=${encodeURIComponent(next)}`}>{vi.auth.forgotLink}</Link></div>
    {error && <AuthAlert>{error}</AuthAlert>}
    <AuthSubmitButton busy={busy}>{vi.auth.loginSubmit}</AuthSubmitButton>
    <p className="text-center text-xs leading-5 text-ink-muted">{vi.auth.privacyLead} <Link className="underline" to={paths.privacy}>{vi.layout.privacy}</Link>.</p>
  </AuthPageFrame>
}

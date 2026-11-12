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

  async function signInWithGoogle() {
    setError('')
    if (!supabaseClient) { setError(vi.auth.unavailable); return }
    setBusy(true)
    try {
      const { error: authError } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}${paths.authCallback}?next=${encodeURIComponent(next)}` },
      })
      if (authError) { warnAuthFailure(authError); setError(authErrorMessage(authError)) }
    } catch (requestError) { warnAuthFailure(requestError); setError(authErrorMessage(requestError, true)) } finally { setBusy(false) }
  }

  return <AuthPageFrame title={vi.auth.loginTitle} intro={vi.auth.loginIntro}
    onSubmit={submit}
    footer={<>{vi.auth.noAccount} <Link className="font-semibold text-primary underline" to={`${paths.register}?next=${encodeURIComponent(next)}`}>{vi.auth.registerLink}</Link></>}>
    <button
      type="button"
      disabled={busy}
      onClick={() => void signInWithGoogle()}
      className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-control border border-line bg-white px-5 font-semibold text-ink transition hover:bg-surface-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span aria-hidden="true" className="font-sans text-xl font-bold text-[#4285F4]">G</span>
      {busy ? vi.auth.submitting : vi.auth.continueWithGoogle}
    </button>
    <div className="flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs italic text-ink-muted">{vi.auth.orContinueWithEmail}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
    <AuthTextField label={vi.auth.email} type="email" value={email} onChange={setEmail} autoComplete="email" />
    <AuthTextField label={vi.auth.password} type="password" value={password} onChange={setPassword} autoComplete="current-password" />
    <div className="-mt-1 text-right"><Link className="text-sm font-semibold text-primary underline" to={`${paths.forgotPassword}?next=${encodeURIComponent(next)}`}>{vi.auth.forgotLink}</Link></div>
    {error && <AuthAlert>{error}</AuthAlert>}
    <AuthSubmitButton busy={busy}>{vi.auth.loginSubmit}</AuthSubmitButton>
    <p className="text-center text-xs leading-5 text-ink-muted">{vi.auth.privacyLead} <Link className="underline" to={paths.privacy}>{vi.layout.privacy}</Link>.</p>
  </AuthPageFrame>
}

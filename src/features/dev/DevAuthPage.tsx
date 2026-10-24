import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui'
import { useProfile } from '@/features/auth/hooks/useProfile'
import { useSession } from '@/features/auth/hooks/useSession'
import { supabaseClient } from '@/lib/supabase'
import { vi } from '@/lib/strings/vi'

export default function DevAuthPage() {
  const session = useSession()
  const profile = useProfile()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabaseClient) return

    setSubmitting(true)
    setMessage('')
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password })
      setMessage(error?.message ?? vi.devAuth.signInSuccess)
    } catch {
      setMessage(vi.system.serviceConnectionError)
    } finally {
      setSubmitting(false)
    }
  }

  async function signOut() {
    if (!supabaseClient) return
    try {
      const { error } = await supabaseClient.auth.signOut()
      setMessage(error?.message ?? '')
    } catch {
      setMessage(vi.system.serviceConnectionError)
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-5 py-10 md:px-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">{vi.devAuth.note}</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">{vi.devAuth.title}</h1>
      </header>

      {!supabaseClient ? (
        <p role="alert" className="rounded-control border border-danger p-4 text-danger">{vi.devAuth.notConfigured}</p>
      ) : session.isLoading ? (
        <p role="status" className="text-ink-muted">{vi.devAuth.loading}</p>
      ) : session.isAuthenticated ? (
        <section className="space-y-4 rounded-control border border-line bg-surface p-5">
          <p>{vi.devAuth.signedInAs} <strong>{session.user?.email}</strong></p>
          <Button variant="secondary" onClick={() => void signOut()}>{vi.devAuth.signOut}</Button>
          <div>
            <h2 className="font-semibold">{vi.devAuth.profileTitle}</h2>
            {profile.isPending && <p role="status">{vi.devAuth.profileLoading}</p>}
            {profile.isError && <p role="alert">{vi.devAuth.profileError} {profile.error.message}</p>}
            {profile.data && <pre className="mt-2 overflow-auto rounded-control bg-bg p-4 text-sm">{JSON.stringify(profile.data, null, 2)}</pre>}
          </div>
        </section>
      ) : (
        <form className="space-y-4 rounded-control border border-line bg-surface p-5" onSubmit={signIn}>
          <label className="block space-y-1">
            <span className="font-medium">{vi.devAuth.email}</span>
            <input autoComplete="username" className="min-h-12 w-full rounded-control border border-line px-3" type="email" required value={email} onChange={event => setEmail(event.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="font-medium">{vi.devAuth.password}</span>
            <input autoComplete="current-password" className="min-h-12 w-full rounded-control border border-line px-3" type="password" required value={password} onChange={event => setPassword(event.target.value)} />
          </label>
          <Button type="submit" loading={submitting}>{vi.devAuth.signIn}</Button>
          {message && <p role="status">{message}</p>}
        </form>
      )}
    </main>
  )
}

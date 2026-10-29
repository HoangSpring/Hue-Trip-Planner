import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { paths, safeNextPath } from '@/app/paths'
import { useSession } from '../hooks/useSession'
import { AuthAlert, AuthPageFrame } from '../components/AuthPageFrame'
import { supabaseClient } from '@/lib/supabase'
import { vi } from '@/lib/strings/vi'

export default function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const session = useSession()
  const next = safeNextPath(params.get('next'))
  const callbackError = params.has('error') || params.has('error_description')
  const [failed, setFailed] = useState(callbackError || !supabaseClient)

  useEffect(() => {
    if (session.status === 'authenticated') navigate(next, { replace: true })
    else if (session.status === 'anonymous') setFailed(true)
  }, [navigate, next, session.status])

  return <AuthPageFrame title={failed ? vi.auth.callbackFailedTitle : vi.auth.callbackTitle} intro={failed ? vi.auth.callbackFailedBody : vi.auth.callbackBody}>
    {failed ? <>
      <AuthAlert>{vi.auth.callbackFailedBody}</AuthAlert>
      <Link className="inline-flex min-h-12 w-full items-center justify-center rounded-control bg-primary px-5 font-semibold text-white" to={`${paths.login}?next=${encodeURIComponent(next)}`}>{vi.auth.backToLogin}</Link>
    </> : <p role="status" className="rounded-control bg-secondary-tint p-4 text-sm text-secondary">{vi.system.loading}</p>}
  </AuthPageFrame>
}

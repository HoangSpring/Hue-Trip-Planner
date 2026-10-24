import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { supabaseClient } from '@/lib/supabase'

export type AuthState = {
  status: 'loading' | 'anonymous' | 'authenticated'
  session: Session | null
  user: User | null
}

const anonymousState: AuthState = { status: 'anonymous', session: null, user: null }
const AuthContext = createContext<AuthState>({ status: 'loading', session: null, user: null })

function stateFromSession(session: Session | null): AuthState {
  return session
    ? { status: 'authenticated', session, user: session.user }
    : anonymousState
}

export function AuthProvider({ children, client = supabaseClient }: PropsWithChildren<{ client?: SupabaseClient | null }>) {
  const [state, setState] = useState<AuthState>(() => client
    ? { status: 'loading', session: null, user: null }
    : anonymousState)

  useEffect(() => {
    if (!client) {
      setState(anonymousState)
      return
    }

    let authEventReceived = false
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true
      setState(stateFromSession(session))
    })

    void client.auth.getSession().then(({ data, error }) => {
      if (!authEventReceived) setState(error ? anonymousState : stateFromSession(data.session))
    }).catch(() => {
      if (!authEventReceived) setState(anonymousState)
    })

    return () => subscription.unsubscribe()
  }, [client])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuthState(): AuthState {
  return useContext(AuthContext)
}

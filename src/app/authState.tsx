import { createContext, useContext, useState, type PropsWithChildren } from 'react'

export type AuthState = { status: 'loading' | 'anonymous' | 'authenticated'; userId: string | null; role: 'user' | 'admin' | null }
const AuthContext = createContext<AuthState>({ status: 'anonymous', userId: null, role: null })

export function AuthProvider({ children }: PropsWithChildren) {
  const [state] = useState<AuthState>({ status: 'anonymous', userId: null, role: null })
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuthState() { return useContext(AuthContext) }

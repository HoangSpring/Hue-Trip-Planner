import { useAuthState } from '@/app/authState'

export function useSession() {
  const state = useAuthState()
  return {
    ...state,
    isLoading: state.status === 'loading',
    isAuthenticated: state.status === 'authenticated',
  }
}

import { useQuery } from '@tanstack/react-query'
import { profileSchema } from '@shared/schemas'
import { apiRequest } from '@/lib/api'
import { useSession } from './useSession'

export function useProfile() {
  const { session, user } = useSession()
  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: Boolean(session),
    queryFn: () => {
      if (!session) throw new Error('Phiên đăng nhập không còn hiệu lực.')
      return apiRequest('/me', profileSchema, { accessToken: session.access_token })
    },
    staleTime: 60_000,
  })
}

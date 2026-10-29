import { Hono } from 'hono'
import { errorHandler } from './middleware/errorHandler'
import { requestIdMiddleware } from './middleware/requestId'
import { publicCache } from './middleware/cache'
import { requireAuth } from './middleware/auth'
import { createUserSupabaseClient } from './lib/supabase'
import { AppError } from './lib/errors'
import { profileSchema } from '@shared/schemas'
import type { ApiEnv } from './types'
import { createPublicPlaceRoutes } from './routes/publicPlaces'
import { createGenerateTripRoutes } from './routes/generateTrip'
import { createAlternativesRoute } from './routes/alternatives'

export const app = new Hono<ApiEnv>()

app.use('*', requestIdMiddleware)
app.onError(errorHandler)
app.notFound((context) => context.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy nội dung.', requestId: context.get('requestId') ?? 'req_unavailable' } }, 404))

app.get('/api/health', publicCache, (context) => context.json({ status: 'ok' as const }))
app.route('/api', createPublicPlaceRoutes())
app.route('/api', createGenerateTripRoutes())
app.route('/api', createAlternativesRoute())

app.get('/api/me', requireAuth, async (context) => {
  const user = context.get('user')
  const client = createUserSupabaseClient(context.get('accessToken'))
  const { data, error } = await client.from('profiles')
    .select('display_name, avatar_url, role')
    .eq('id', user.id)
    .maybeSingle()
  if (error || !data) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Không thể tải hồ sơ lúc này.')

  return context.json(profileSchema.parse({
    id: user.id,
    email: user.email,
    displayName: data.display_name,
    avatarUrl: data.avatar_url,
    role: data.role,
  }))
})

import { Hono } from 'hono'
import { errorHandler } from './middleware/errorHandler'
import { requestIdMiddleware } from './middleware/requestId'
import { publicCache } from './middleware/cache'
import type { ApiEnv } from './types'
import { createPublicPlaceRoutes } from './routes/publicPlaces'
import { createGenerateTripRoutes } from './routes/generateTrip'
import { createAlternativesRoute } from './routes/alternatives'
import { createRegenerateDayRoute } from './routes/regenerateDay'
import { createTripRoutes } from './routes/trips'
import { createMeRoutes } from './routes/me'
import { createSavedPlacesRoutes } from './routes/savedPlaces'
import { createTripSharingRoutes } from './routes/tripSharing'
import { createAdminRoutes } from './routes/admin'
import { createAdminUserRoutes } from './routes/adminUsers'
import { createSeoRoutes } from './routes/seo'
import { createAssistantChatRoute } from './routes/assistantChat'

export const app = new Hono<ApiEnv>()

app.use('*', requestIdMiddleware)
app.onError(errorHandler)
app.notFound((context) => context.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy nội dung.', requestId: context.get('requestId') ?? 'req_unavailable' } }, 404))

app.get('/api/health', publicCache, (context) => context.json({ status: 'ok' as const }))
app.route('/api', createPublicPlaceRoutes())
app.route('/api', createSeoRoutes())
app.route('/api', createGenerateTripRoutes())
app.route('/api', createAlternativesRoute())
app.route('/api', createRegenerateDayRoute())
app.route('/api', createTripRoutes())
app.route('/api', createMeRoutes())
app.route('/api', createSavedPlacesRoutes())
app.route('/api', createTripSharingRoutes())
app.route('/api', createAdminRoutes())
app.route('/api', createAdminUserRoutes())
app.route('/api', createAssistantChatRoute())

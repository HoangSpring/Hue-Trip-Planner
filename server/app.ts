import { Hono } from 'hono'
import { errorHandler } from './middleware/errorHandler'
import { requestIdMiddleware } from './middleware/requestId'
import { publicCache } from './middleware/cache'
import type { ApiEnv } from './types'

export const app = new Hono<ApiEnv>()

app.use('*', requestIdMiddleware)
app.onError(errorHandler)
app.notFound((context) => context.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy nội dung.', requestId: context.get('requestId') ?? 'req_unavailable' } }, 404))

app.get('/api/health', publicCache, (context) => context.json({ status: 'ok' as const }))

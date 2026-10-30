import { Hono, type MiddlewareHandler } from 'hono'
import { savedPlaceIdSchema, savedPlacesQuerySchema } from '@shared/schemas'
import type { ApiEnv } from '../types'
import { AppError } from '../lib/errors'
import { errorHandler } from '../middleware/errorHandler'
import { requireAuth } from '../middleware/auth'
import { createUserSupabaseClient } from '../lib/supabase'
import { SavedPlacesService, type SavedPlacesRepository } from '../services/savedPlacesService'
import { SupabaseSavedPlacesRepository } from '../services/supabaseSavedPlacesRepository'

export type SavedPlacesRouteDependencies = {
  auth?: MiddlewareHandler<ApiEnv>
  createRepository?: (accessToken: string) => SavedPlacesRepository
}

export function createSavedPlacesRoutes(dependencies: SavedPlacesRouteDependencies = {}) {
  const routes = new Hono<ApiEnv>()
  routes.onError(errorHandler)
  const privateCache: MiddlewareHandler<ApiEnv> = async (context, next) => {
    context.header('Cache-Control', 'private, no-store')
    await next()
  }
  routes.use('/saved/*', privateCache, dependencies.auth ?? requireAuth)
  const service = (token: string) => new SavedPlacesService(
    dependencies.createRepository?.(token) ?? new SupabaseSavedPlacesRepository(createUserSupabaseClient(token)),
  )

  routes.get('/saved', async (context) => {
    const rawCategory = context.req.query('category')
    const parsed = savedPlacesQuerySchema.safeParse(rawCategory ? { category: rawCategory } : {})
    if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Bộ lọc loại địa điểm không hợp lệ.')
    return context.json(await service(context.get('accessToken')).list(context.get('user').id, parsed.data.category))
  })

  routes.put('/saved/:placeId', async (context) => {
    const parsed = savedPlaceIdSchema.safeParse(context.req.param('placeId'))
    if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Mã địa điểm không hợp lệ.')
    await service(context.get('accessToken')).save(context.get('user').id, parsed.data)
    return context.body(null, 204)
  })

  routes.delete('/saved/:placeId', async (context) => {
    const parsed = savedPlaceIdSchema.safeParse(context.req.param('placeId'))
    if (!parsed.success) throw new AppError(400, 'VALIDATION_ERROR', 'Mã địa điểm không hợp lệ.')
    await service(context.get('accessToken')).remove(context.get('user').id, parsed.data)
    return context.body(null, 204)
  })

  return routes
}

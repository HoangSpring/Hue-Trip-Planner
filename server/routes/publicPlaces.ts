import { Hono } from 'hono'
import { placeListQuerySchema, placeMapQuerySchema } from '../../shared/schemas/placeQueries'
import { AppError } from '../lib/errors'
import { createPublicSupabaseClient } from '../lib/supabase'
import { publicCache } from '../middleware/cache'
import { errorHandler } from '../middleware/errorHandler'
import { publicReadRateLimit } from '../middleware/publicReadRateLimit'
import { PlaceService } from '../services/placeService'
import type { ApiEnv } from '../types'

type PlaceReader = Pick<PlaceService, 'getMeta' | 'validateTagSlugs' | 'listPlaces' | 'listMapPlaces' | 'getPlaceBySlug'>

function validationError(issues: Array<{ path: PropertyKey[]; message: string }>): AppError {
  return new AppError(400, 'VALIDATION_ERROR', 'Bộ lọc địa điểm không hợp lệ.', issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  })))
}

export function createPublicPlaceRoutes(reader?: PlaceReader, rateLimit = publicReadRateLimit()) {
  const routes = new Hono<ApiEnv>()
  routes.onError(errorHandler)
  routes.use('*', publicCache)
  routes.use('*', rateLimit)
  const getReader = () => reader ?? new PlaceService(createPublicSupabaseClient())

  routes.get('/meta', async (context) => context.json(await getReader().getMeta()))

  routes.get('/places', async (context) => {
    const request = context.req
    const parsed = placeListQuerySchema.safeParse({
      category: request.query('category'),
      tag: request.queries('tag'),
      q: request.query('q')?.trim() || undefined,
      sort: request.query('sort'),
      featured: request.query('featured'),
      page: request.query('page'),
      pageSize: request.query('pageSize'),
    })
    if (!parsed.success) throw validationError(parsed.error.issues)
    const service = getReader()
    if (!(await service.validateTagSlugs(parsed.data.tag ?? []))) {
      throw validationError([{ path: ['tag'], message: 'Có tag không tồn tại hoặc không phải tag sở thích.' }])
    }
    return context.json(await service.listPlaces(parsed.data))
  })

  routes.get('/places/map', async (context) => {
    const parsed = placeMapQuerySchema.safeParse({ category: context.req.query('category') })
    if (!parsed.success) throw validationError(parsed.error.issues)
    return context.json(await getReader().listMapPlaces(parsed.data))
  })

  routes.get('/places/:slug', async (context) => context.json(await getReader().getPlaceBySlug(context.req.param('slug'))))

  return routes
}

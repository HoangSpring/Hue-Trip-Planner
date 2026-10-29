import { Hono } from 'hono'
import { alternativesRequestSchema } from '@shared/schemas'
import { AppError } from '../lib/errors'
import { createPublicSupabaseClient } from '../lib/supabase'
import type { ApiEnv } from '../types'
import { errorHandler } from '../middleware/errorHandler'
import { publicReadRateLimit } from '../middleware/publicReadRateLimit'
import { SupabasePlacesRepo, type PlacesRepo } from '../itinerary/placesRepo'
import { findAlternatives } from '../itinerary/alternatives'

export type AlternativesRouteDependencies = {
  createPlacesRepo?: () => PlacesRepo
  rateLimiter?: ReturnType<typeof publicReadRateLimit>
}

export function createAlternativesRoute(deps: AlternativesRouteDependencies = {}) {
  const router = new Hono<ApiEnv>()
  router.onError(errorHandler)
  const rateLimiter = deps.rateLimiter ?? publicReadRateLimit(60, 60_000)
  const createPlacesRepo = deps.createPlacesRepo ?? (() => new SupabasePlacesRepo(createPublicSupabaseClient()))

  router.post('/trips/alternatives', rateLimiter, async (c) => {
    let rawBody: unknown
    try {
      rawBody = await c.req.json()
    } catch {
      throw new AppError(400, 'VALIDATION_ERROR', 'Yêu cầu không đúng định dạng JSON.')
    }

    const parsed = alternativesRequestSchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Dữ liệu yêu cầu tìm địa điểm thay thế không hợp lệ.',
        parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        }))
      )
    }

    const repo = createPlacesRepo()
    const records = await repo.listPublished(c.req.raw.signal)
    const result = findAlternatives(records, parsed.data)

    return c.json(result)
  })

  return router
}

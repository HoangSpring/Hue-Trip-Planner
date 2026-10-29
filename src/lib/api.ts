import {
  apiErrorSchema,
  generateTripResponseSchema,
  mapPlacesSchema,
  paginatedPlacesSchema,
  placeDetailResponseSchema,
  placeMetaSchema,
  alternativesResponseSchema,
  type AlternativesRequest,
  regenerateDayResponseSchema,
  type RegenerateDayRequest,
  tripSchema,
  tripListResponseSchema,
  tripReplaceResponseSchema,
  type TripCreateRequest,
  type TripPatchRequest,
  type TripReplaceRequest,
} from '@shared/schemas'
import type { PlaceListQuery, PlaceMapQuery } from '@shared/schemas'
import { z } from 'zod'
import { vi } from './strings/vi'

type ApiRequestOptions = Omit<RequestInit, 'body'> & {
  accessToken?: string
  body?: unknown
}

export async function apiRequest<T>(path: string, schema: z.ZodType<T>, options: ApiRequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (options.accessToken) headers.set('Authorization', `Bearer ${options.accessToken}`)

  const response = await fetch(path.startsWith('/api/') ? path : `/api/${path.replace(/^\//, '')}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })

  const payload: unknown = response.status === 204 ? undefined : await response.json()
  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(payload)
    if (parsedError.success) throw new ApiRequestError(response.status, parsedError.data, response.headers)
    throw new Error(vi.system.serviceConnectionError)
  }
  return schema.parse(payload)
}

export function getPublicMeta() {
  return apiRequest('meta', placeMetaSchema)
}

export function getPlaces(filters: Partial<PlaceListQuery> = {}) {
  const query = new URLSearchParams()
  if (filters.category) query.set('category', filters.category)
  for (const tag of filters.tag ?? []) query.append('tag', tag)
  if (filters.q) query.set('q', filters.q)
  if (filters.sort) query.set('sort', filters.sort)
  if (filters.featured) query.set('featured', filters.featured)
  if (filters.page !== undefined) query.set('page', String(filters.page))
  if (filters.pageSize !== undefined) query.set('pageSize', String(filters.pageSize))
  const suffix = query.size ? `?${query.toString()}` : ''
  return apiRequest(`places${suffix}`, paginatedPlacesSchema)
}

export function getMapPlaces(filters: PlaceMapQuery = {}) {
  const query = new URLSearchParams()
  if (filters.category) query.set('category', filters.category)
  const suffix = query.size ? `?${query.toString()}` : ''
  return apiRequest(`places/map${suffix}`, mapPlacesSchema)
}

export function getPlaceBySlug(slug: string) {
  return apiRequest(`places/${encodeURIComponent(slug)}`, placeDetailResponseSchema)
}

export function generateTripApi(
  request: { input: import('@shared/schemas').TripInput; clientDraftId?: string },
  signal?: AbortSignal
) {
  return apiRequest('trips/generate', generateTripResponseSchema, {
    method: 'POST',
    body: request,
    signal,
  })
}

export function fetchAlternativesApi(
  request: AlternativesRequest,
  signal?: AbortSignal
) {
  return apiRequest('trips/alternatives', alternativesResponseSchema, {
    method: 'POST',
    body: request,
    signal,
  })
}

export function regenerateDayApi(
  request: RegenerateDayRequest,
  signal?: AbortSignal
) {
  return apiRequest('trips/regenerate-day', regenerateDayResponseSchema, {
    method: 'POST',
    body: request,
    signal,
  })
}

export function getMyTripsApi(accessToken: string) {
  return apiRequest('trips', tripListResponseSchema, { accessToken })
}

export function getTripApi(id: string, accessToken: string) {
  return apiRequest(`trips/${encodeURIComponent(id)}`, tripSchema, { accessToken })
}

export function createTripApi(draft: TripCreateRequest, accessToken: string) {
  return apiRequest('trips', tripSchema, { method: 'POST', body: draft, accessToken })
}

export function replaceTripApi(id: string, body: TripReplaceRequest, accessToken: string) {
  return apiRequest(`trips/${encodeURIComponent(id)}`, tripReplaceResponseSchema, { method: 'PUT', body, accessToken })
}

export function patchTripApi(id: string, body: TripPatchRequest, accessToken: string) {
  return apiRequest(`trips/${encodeURIComponent(id)}`, tripSchema, { method: 'PATCH', body, accessToken })
}

export function deleteTripApi(id: string, accessToken: string) {
  return apiRequest(`trips/${encodeURIComponent(id)}`, z.void(), { method: 'DELETE', accessToken })
}

export function duplicateTripApi(id: string, accessToken: string) {
  return apiRequest(`trips/${encodeURIComponent(id)}/duplicate`, tripSchema, { method: 'POST', accessToken })
}

export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly payload: z.infer<typeof apiErrorSchema>,
    readonly headers?: Headers
  ) {
    super(payload.error.message)
    this.name = 'ApiRequestError'
  }
}


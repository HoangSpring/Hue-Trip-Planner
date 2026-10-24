import { apiErrorSchema } from '@shared/schemas'
import type { z } from 'zod'

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

  const payload: unknown = await response.json()
  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(payload)
    if (parsedError.success) throw new ApiRequestError(response.status, parsedError.data)
    throw new Error('Không thể kết nối đến dịch vụ. Vui lòng thử lại.')
  }
  return schema.parse(payload)
}

export class ApiRequestError extends Error {
  constructor(readonly status: number, readonly payload: z.infer<typeof apiErrorSchema>) {
    super(payload.error.message)
    this.name = 'ApiRequestError'
  }
}

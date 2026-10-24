import type { ErrorHandler } from 'hono'
import { apiErrorSchema } from '@shared/schemas'
import { AppError } from '../lib/errors'
import type { ApiEnv } from '../types'

export const errorHandler: ErrorHandler<ApiEnv> = (error, context) => {
  const requestId = context.get('requestId') ?? 'req_unavailable'
  const appError = error instanceof AppError ? error : undefined
  const status = appError?.status ?? 500
  const payload = apiErrorSchema.parse({
    error: {
      code: appError?.code ?? 'INTERNAL_ERROR',
      message: appError?.message ?? 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      ...(appError?.details ? { details: appError.details } : {}),
      requestId,
    },
  })
  return context.json(payload, status)
}

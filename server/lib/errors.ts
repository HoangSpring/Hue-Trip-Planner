import type { ApiErrorCode } from '@shared/schemas'

export class AppError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 500 | 503,
    readonly code: ApiErrorCode,
    message: string,
    readonly details?: Array<{ path: string; message: string }> | { current: unknown },
  ) {
    super(message)
    this.name = 'AppError'
  }
}

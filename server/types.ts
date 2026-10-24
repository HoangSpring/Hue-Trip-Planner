export type AuthUser = { id: string; email: string | null }

export type ApiEnv = {
  Variables: {
    requestId: string
    user: AuthUser
    accessToken: string
  }
}

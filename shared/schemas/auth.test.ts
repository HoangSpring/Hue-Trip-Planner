import { describe, expect, it } from 'vitest'
import { resetPasswordRequestSchema, signInSchema, signUpSchema, updatePasswordSchema } from './auth'

describe('authentication schemas', () => {
  it('accepts normalized email and password credentials', () => {
    expect(signInSchema.parse({ email: ' user@example.test ', password: 'password123' })).toEqual({ email: 'user@example.test', password: 'password123' })
  })

  it('requires a display name for registration', () => {
    expect(signUpSchema.safeParse({ email: 'user@example.test', password: 'password123', displayName: 'Huế' }).success).toBe(true)
    expect(signUpSchema.safeParse({ email: 'user@example.test', password: 'password123', displayName: ' ' }).success).toBe(false)
  })

  it('validates reset email and matching new passwords', () => {
    expect(resetPasswordRequestSchema.safeParse({ email: 'bad' }).success).toBe(false)
    expect(updatePasswordSchema.safeParse({ password: 'password123', confirmPassword: 'password123' }).success).toBe(true)
    expect(updatePasswordSchema.safeParse({ password: 'password123', confirmPassword: 'otherpass' }).success).toBe(false)
  })
})

import { z } from 'zod'

const email = z.string().trim().email().max(254)
const password = z.string().min(8).max(128)

export const signInSchema = z.object({ email, password }).strict()
export const signUpSchema = z.object({
  email,
  password,
  displayName: z.string().trim().min(1).max(60),
}).strict()
export const resetPasswordRequestSchema = z.object({ email }).strict()
export const updatePasswordSchema = z.object({
  password,
  confirmPassword: z.string().min(8).max(128),
}).strict().refine((value) => value.password === value.confirmPassword, {
  path: ['confirmPassword'],
  message: 'passwords_differ',
})

import { z } from 'zod'

export const importPreviewRowSchema = z.object({
  line: z.number().int().min(2),
  slug: z.string().nullable(),
  status: z.enum(['valid', 'warning', 'error']),
  action: z.enum(['create', 'update', 'skip']),
  messages: z.array(z.string()),
}).strict()

export const importPreviewResponseSchema = z.object({
  summary: z.object({ total: z.number().int(), valid: z.number().int(), warnings: z.number().int(), errors: z.number().int() }).strict(),
  rows: z.array(importPreviewRowSchema),
}).strict()

export const importCommitResponseSchema = z.object({
  created: z.number().int(),
  updated: z.number().int(),
  skipped: z.number().int(),
  errors: z.array(z.object({ line: z.number().int(), message: z.string() }).strict()),
  errorCsv: z.string(),
}).strict()

export const importCommitRequestSchema = z.object({
  csv: z.string(),
  overwriteVerified: z.boolean().optional(),
}).strict()

export type ImportPreviewRow = z.infer<typeof importPreviewRowSchema>
export type ImportPreviewResponse = z.infer<typeof importPreviewResponseSchema>
export type ImportCommitResponse = z.infer<typeof importCommitResponseSchema>

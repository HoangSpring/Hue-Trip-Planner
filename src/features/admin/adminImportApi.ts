import { importPreviewResponseSchema, importCommitResponseSchema } from '@shared/schemas/placeImport'
import { apiRequest } from '@/lib/api'

export function previewPlaceCsv(csv: string, token: string) {
  return apiRequest('admin/import/preview', importPreviewResponseSchema, { method: 'POST', rawBody: csv, headers: { 'Content-Type': 'text/csv' }, accessToken: token })
}

export function commitPlaceCsv(csv: string, overwriteVerified: boolean, token: string) {
  return apiRequest('admin/import/commit', importCommitResponseSchema, { method: 'POST', body: { csv, overwriteVerified }, accessToken: token })
}

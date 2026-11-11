import { z } from 'zod'
import { adminPlaceInputSchema } from '@shared/schemas/adminPlace'
import { adminDashboardSchema, adminUserListSchema, adminUserSchema } from '@shared/schemas/adminUser'
import { apiRequest } from '@/lib/api'

export const adminPlaceSchema = adminPlaceInputSchema.extend({
  id: z.string().uuid(), verified: z.boolean(), verifiedBy: z.string().nullable(), verifiedAt: z.string().nullable(),
  lastVerifiedAt: z.string().nullable(), aiFilledFields: z.array(z.string()), createdAt: z.string(), updatedAt: z.string(), missingFields: z.array(z.string()),
})
export const adminListSchema = z.object({ items: z.array(adminPlaceSchema), page: z.number(), pageSize: z.number(), total: z.number() })
export const adminAuditSchema = z.object({ items: z.array(z.object({ id: z.number(), action: z.string(), changes: z.unknown().nullable(), created_at: z.string(), actor_id: z.string().nullable() })) })
export const bulkResultSchema = z.object({ results: z.array(z.object({ id: z.string(), success: z.boolean(), reason: z.string().optional() })) })
export type AdminPlace = z.infer<typeof adminPlaceSchema>

export function getAdminDashboard(token: string) {
  return apiRequest('admin/dashboard', adminDashboardSchema, { accessToken: token })
}
export function listAdminUsers(token: string, page: number) {
  return apiRequest(`admin/users?page=${page}&pageSize=25`, adminUserListSchema, { accessToken: token })
}
export function updateAdminUserRole(id: string, role: 'user' | 'admin', token: string) {
  return apiRequest(`admin/users/${encodeURIComponent(id)}/role`, adminUserSchema, { method: 'PATCH', body: { role }, accessToken: token })
}
export function setAdminUserSuspension(id: string, suspended: boolean, token: string) {
  return apiRequest(`admin/users/${encodeURIComponent(id)}/suspension`, adminUserSchema, { method: 'POST', body: { suspended }, accessToken: token })
}
export function deleteAdminUser(id: string, token: string) {
  return apiRequest(`admin/users/${encodeURIComponent(id)}`, z.undefined(), { method: 'DELETE', body: { confirm: 'DELETE' }, accessToken: token })
}

export function listAdminPlaces(token: string, query: URLSearchParams) {
  return apiRequest(`admin/places?${query}`, adminListSchema, { accessToken: token })
}
export function getAdminPlace(id: string, token: string) {
  return apiRequest(`admin/places/${encodeURIComponent(id)}`, adminPlaceSchema, { accessToken: token })
}
export function saveAdminPlace(id: string | null, payload: unknown, token: string) {
  return apiRequest(id ? `admin/places/${encodeURIComponent(id)}` : 'admin/places', adminPlaceSchema, { method: id ? 'PUT' : 'POST', body: payload, accessToken: token })
}
export function changeAdminStatus(id: string, status: 'published' | 'draft' | 'archived', token: string) {
  return apiRequest(`admin/places/${encodeURIComponent(id)}/status`, adminPlaceSchema, { method: 'POST', body: { status }, accessToken: token })
}
export function verifyAdminPlace(id: string, confirmedFields: string[] | undefined, token: string) {
  return apiRequest(`admin/places/${encodeURIComponent(id)}/verify`, adminPlaceSchema, { method: 'POST', body: { verified: true, confirmedFields }, accessToken: token })
}
export function bulkAdminPlaces(ids: string[], action: 'publish' | 'unpublish' | 'archive' | 'verify' | 'unverify', token: string) {
  return apiRequest('admin/places/bulk', bulkResultSchema, { method: 'POST', body: { ids, action }, accessToken: token })
}
export function getAdminAudit(id: string, token: string) {
  return apiRequest(`admin/places/${encodeURIComponent(id)}/audit`, adminAuditSchema, { accessToken: token })
}

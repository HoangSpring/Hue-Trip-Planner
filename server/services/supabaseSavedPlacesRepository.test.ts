import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../src/types/supabase'
import { describe, expect, it, vi } from 'vitest'
import { AppError } from '../lib/errors'
import { SupabaseSavedPlacesRepository } from './supabaseSavedPlacesRepository'

function repositoryWithUpsertError(code: string) {
  const upsert = vi.fn(async () => ({ data: null, error: { code, message: 'sensitive database text' } }))
  const client = { from: () => ({ upsert }) } as unknown as SupabaseClient<Database>
  return { repository: new SupabaseSavedPlacesRepository(client), upsert }
}

describe('SupabaseSavedPlacesRepository', () => {
  it('maps permission errors to a safe actionable response and logs only operation/code', async () => {
    const { repository } = repositoryWithUpsertError('42501')
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      await expect(repository.save('user-id', 'place-id')).rejects.toMatchObject({
        status: 403,
        code: 'FORBIDDEN',
        message: 'Phiên đăng nhập chưa đủ quyền lưu địa điểm. Hãy đăng nhập lại.',
      } satisfies Partial<AppError>)
      expect(log).toHaveBeenCalledWith('[saved_places] database request failed', { operation: 'save', code: '42501' })
      expect(JSON.stringify(log.mock.calls)).not.toContain('sensitive database text')
    } finally {
      log.mockRestore()
    }
  })

  it('identifies a missing saved-place relation or schema-cache entry', async () => {
    const { repository } = repositoryWithUpsertError('PGRST205')
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    try {
      await expect(repository.save('user-id', 'place-id')).rejects.toMatchObject({
        status: 503,
        message: 'Chức năng lưu địa điểm chưa được cấu hình đầy đủ.',
      })
    } finally {
      log.mockRestore()
    }
  })
})

import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import type { Database } from '../../src/types/supabase'
import { SupabasePlaceImportRepository } from './supabasePlaceImportRepository'

describe('SupabasePlaceImportRepository', () => {
  it('calls one authenticated atomic RPC for place, tags, and audit', async () => {
    const rpc = vi.fn(async () => ({ data: { action: 'created', place_id: 'd0000000-0000-4000-8000-000000000004', reason: null }, error: null }))
    const client = { rpc } as unknown as SupabaseClient<Database>
    const repository = new SupabasePlaceImportRepository(client)
    const result = await repository.importPlace({ slug: 'atomic', tags: [{ slug: 'heritage', weight: 2 }] }, false)
    expect(result).toEqual({ action: 'created', placeId: 'd0000000-0000-4000-8000-000000000004', reason: null })
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('admin_import_place', {
      p_row: { slug: 'atomic', tags: [{ slug: 'heritage', weight: 2 }] },
      p_overwrite_verified: false,
    })
  })

  it('fails clearly without partial writes when the migration RPC is not available', async () => {
    const client = { rpc: vi.fn(async () => ({ data: null, error: { code: 'PGRST202', message: 'missing function' } })) } as unknown as SupabaseClient<Database>
    const repository = new SupabasePlaceImportRepository(client)
    await expect(repository.importPlace({ slug: 'atomic', tags: [] }, false)).rejects.toMatchObject({
      status: 503,
      message: expect.stringContaining('cần áp dụng migration RPC import nguyên tử'),
    })
  })
})

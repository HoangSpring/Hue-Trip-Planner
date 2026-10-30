import type { SupabaseClient } from '@supabase/supabase-js'
import { AppError } from '../lib/errors'
import type { Database } from '../../src/types/supabase'
import type { Trip } from '@shared/schemas'
import { SupabaseTripRepository } from './supabaseTripRepository'

export interface TripSharingRepository {
  setShare(id: string, enabled: boolean, token: string | null): Promise<boolean>
  getSharedByToken(token: string): Promise<Trip | null>
}

export class SupabaseTripSharingRepository implements TripSharingRepository {
  constructor(
    private readonly userClient: SupabaseClient<Database>,
    private readonly serviceClient: SupabaseClient<Database>,
  ) {}

  async setShare(id: string, enabled: boolean, token: string | null): Promise<boolean> {
    const { data, error } = await this.userClient.from('trips')
      .update({ is_shared: enabled, share_token: token })
      .eq('id', id).select('id').maybeSingle()
    if (error) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể cập nhật chia sẻ. Bạn thử lại nhé.')
    return Boolean(data)
  }

  async getSharedByToken(token: string): Promise<Trip | null> {
    const { data, error } = await this.serviceClient.from('trips')
      .select('id').eq('share_token', token).eq('is_shared', true).maybeSingle()
    if (error) throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Chưa thể tải lịch trình chia sẻ.')
    if (!data) return null
    return new SupabaseTripRepository(this.serviceClient).get(data.id)
  }
}

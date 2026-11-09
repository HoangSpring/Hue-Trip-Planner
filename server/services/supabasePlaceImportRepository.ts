
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json, Tables } from '../../src/types/supabase'
import { AppError } from '../lib/errors'
import type {
  ImportExistingPlace,
  PlaceImportRepository,
} from './importService'

type TagSlugRow = {
  slug: string
}

type ExistingPlaceRow = Pick<
  Tables<'places'>,
  'id' | 'slug' | 'status' | 'verified' | 'source'
>

type ImportRpcResult = {
  action?: string
  place_id?: string
  reason?: string | null
}

export class SupabasePlaceImportRepository
  implements PlaceImportRepository {
  constructor(
    private readonly userClient: SupabaseClient<Database>,
  ) { }

  async tagSlugs(slugs: string[]): Promise<Set<string>> {
    if (!slugs.length) return new Set<string>()

    const { data, error } = await this.userClient
      .from('tags')
      .select('slug')
      .in('slug', slugs)

    if (error || !data) {
      throw new AppError(
        503,
        'SERVICE_UNAVAILABLE',
        'Không thể kiểm tra tag import.',
      )
    }

    const rows: TagSlugRow[] = data

    return new Set(
      rows.map((row: TagSlugRow) => row.slug),
    )
  }

  async existingBySlugs(
    slugs: string[],
  ): Promise<Map<string, ImportExistingPlace>> {
    const output = new Map<string, ImportExistingPlace>()

    for (let offset = 0; offset < slugs.length; offset += 100) {
      const batch = slugs.slice(offset, offset + 100)

      if (!batch.length) continue

      const { data, error } = await this.userClient
        .from('places')
        .select('id,slug,status,verified,source')
        .in('slug', batch)

      if (error || !data) {
        throw new AppError(
          503,
          'SERVICE_UNAVAILABLE',
          'Không thể kiểm tra địa điểm đã có.',
        )
      }

      const rows: ExistingPlaceRow[] = data

      for (const row of rows) {
        output.set(row.slug, row)
      }
    }

    return output
  }

  async importPlace(
    row: Record<string, unknown>,
    overwriteVerified: boolean,
  ): Promise<{
    action: 'created' | 'updated' | 'skipped'
    placeId: string
    reason: string | null
  }> {
    const { data, error } = await this.userClient.rpc(
      'admin_import_place',
      {
        p_row: row as unknown as Json,
        p_overwrite_verified: overwriteVerified,
      },
    )

    if (error) {
      if (
        error.code === 'PGRST202' ||
        error.code === '42883' ||
        error.code === 'PGRST203'
      ) {
        throw new AppError(
          503,
          'SERVICE_UNAVAILABLE',
          'Import chưa sẵn sàng: cần áp dụng migration RPC import nguyên tử rồi thử lại.',
        )
      }

      if (error.code === '42501') {
        throw new AppError(
          403,
          'FORBIDDEN',
          'Bạn không có quyền import địa điểm.',
        )
      }

      if (error.code === '23503') {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Một hoặc nhiều tag không tồn tại.',
        )
      }

      throw new AppError(
        503,
        'SERVICE_UNAVAILABLE',
        'Không thể import địa điểm lúc này.',
      )
    }

    const result = data as unknown as ImportRpcResult | null

    if (
      !result ||
      !['created', 'updated', 'skipped'].includes(
        result.action ?? '',
      ) ||
      !result.place_id
    ) {
      throw new AppError(
        503,
        'SERVICE_UNAVAILABLE',
        'RPC import trả kết quả chưa hợp lệ.',
      )
    }

    return {
      action: result.action as 'created' | 'updated' | 'skipped',
      placeId: result.place_id,
      reason: result.reason ?? null,
    }
  }
}

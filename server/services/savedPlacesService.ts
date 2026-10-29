import type { PlaceSummary, Category } from '@shared/schemas'
import { AppError } from '../lib/errors'

export interface SavedPlacesRepository {
  isPublished(placeId: string): Promise<boolean>
  list(userId: string, category?: Category): Promise<PlaceSummary[]>
  save(userId: string, placeId: string): Promise<void>
  remove(userId: string, placeId: string): Promise<void>
}

export class SavedPlacesService {
  constructor(private readonly repository: SavedPlacesRepository) {}

  async list(userId: string, category?: Category): Promise<{ items: PlaceSummary[] }> {
    return { items: await this.repository.list(userId, category) }
  }

  async save(userId: string, placeId: string): Promise<void> {
    if (!await this.repository.isPublished(placeId)) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy địa điểm.')
    await this.repository.save(userId, placeId)
  }

  async remove(userId: string, placeId: string): Promise<void> {
    await this.repository.remove(userId, placeId)
  }
}

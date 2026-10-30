import { randomBytes, randomUUID } from 'node:crypto'
import { sharedTripViewSchema, type Trip, type TripDraft, type SharedTripView } from '@shared/schemas'
import { AppError } from '../lib/errors'
import type { TripRepository } from './tripService'
import { TripService } from './tripService'
import type { TripSharingRepository } from './tripSharingRepository'

export const SHARED_NOT_FOUND_MESSAGE = 'Lịch trình không còn được chia sẻ.'

export function createShareToken(): string {
  return randomBytes(16).toString('base64url')
}

export class TripSharingService {
  constructor(
    private readonly sharingRepository: TripSharingRepository,
    private readonly userTripRepository?: TripRepository,
    private readonly maxTrips = 50,
  ) {}

  async setEnabled(id: string, enabled: boolean): Promise<string | null> {
    const token = enabled ? createShareToken() : null
    const updated = await this.sharingRepository.setShare(id, enabled, token)
    if (!updated) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy chuyến đi.')
    return token
  }

  async getView(token: string): Promise<SharedTripView> {
    const trip = await this.sharingRepository.getSharedByToken(token)
    if (!trip) throw new AppError(404, 'NOT_FOUND', SHARED_NOT_FOUND_MESSAGE)
    return sharedTripViewSchema.parse({
      title: trip.title,
      numDays: trip.numDays,
      startDate: trip.startDate,
      start: trip.start,
      days: trip.days.map((day) => ({
        dayIndex: day.dayIndex,
        date: day.date,
        items: day.items.map((item) => ({
          placeId: item.placeId,
          position: item.position,
          slot: item.slot,
          startTime: item.startTime,
          durationMin: item.durationMin,
          travelMinFromPrev: item.travelMinFromPrev,
          travelDistanceM: item.travelDistanceM,
          reason: item.reason,
          place: item.place,
        })),
      })),
    })
  }

  async copy(token: string): Promise<Trip> {
    const shared = await this.sharingRepository.getSharedByToken(token)
    if (!shared) throw new AppError(404, 'NOT_FOUND', SHARED_NOT_FOUND_MESSAGE)
    if (!this.userTripRepository) throw new Error('Thiếu repository chuyến đi người dùng.')
    const draft: TripDraft = {
      clientDraftId: randomUUID(),
      title: shared.title,
      startDate: shared.startDate,
      numDays: shared.numDays,
      input: { ...shared.input, notes: null },
      generatedBy: shared.generatedBy,
      llmModel: shared.llmModel,
      start: shared.start,
      days: shared.days.map((day) => ({
        id: randomUUID(),
        dayIndex: day.dayIndex,
        date: day.date,
        note: null,
        items: day.items.map((item, position) => ({
          id: randomUUID(),
          placeId: item.placeId,
          position,
          slot: item.slot,
          startTime: item.startTime,
          durationMin: item.durationMin,
          travelMinFromPrev: item.travelMinFromPrev,
          travelDistanceM: item.travelDistanceM,
          reason: item.reason,
          note: null,
          isLocked: false,
          addedBy: 'user' as const,
        })),
      })),
    }
    const result = await new TripService(this.userTripRepository, this.maxTrips).create(draft)
    return result.trip
  }
}

import { transportSchema, type Transport } from '@shared/schemas'
import { ITINERARY_CONFIG } from './config'
import { haversine, type Coordinates } from './geo'

export type TravelEstimate = { distanceKm: number; travelMin: number; maxLegKm: number; maxLegMin: number }

/** Rough road-time estimate. This is not a navigation route or ETA guarantee. */
export function estimateTravel(a: Coordinates, b: Coordinates, transport: Transport | null = null): TravelEstimate {
  const mode = transport ?? 'motorbike'
  const settings = ITINERARY_CONFIG.travel[mode]
  const distanceKm = haversine(a, b) * ITINERARY_CONFIG.circuity
  const travelMin = Math.ceil(distanceKm / settings.speedKmh * 60) + settings.bufferMin
  return { distanceKm, travelMin, maxLegKm: settings.maxLegKm, maxLegMin: settings.maxLegMin }
}

export function parseTransport(value: unknown): Transport | null {
  const parsed = transportSchema.nullable().safeParse(value)
  return parsed.success ? parsed.data : null
}

import type { Notice, TripInput } from '@shared/schemas'
import { haversine } from '../../shared/itinerary/geo'
import { ITINERARY_CONFIG } from '../../shared/itinerary/config'
import type { PlacesRepo } from './placesRepo'
import { rankCandidates } from './scoring'
import type { CandidateRecord, ScoredCandidate } from './types'

const sensitiveCompanions = new Set(['seniors', 'family_kids'])

function maximumItemsPerDay(input: TripInput): number {
  return ITINERARY_CONFIG.itemsPerDay[input.pace][1] - (sensitiveCompanions.has(input.companion) ? 1 : 0)
}

export type CandidateSelection = {
  candidates: ScoredCandidate[]
  diagnosticCandidates: ScoredCandidate[]
  notices: Notice[]
  requestedCount: number
  effectiveRadiusKm: number | null
  walkingRelaxed: boolean
  walkingExcludedCount: number
}

export function filterCandidates(records: readonly CandidateRecord[], input: TripInput): CandidateSelection {
  const notices: Notice[] = []
  const requestedCount = input.numDays * maximumItemsPerDay(input)
  const complete = records.filter(({ place }) => place.status === 'published' && place.lat !== null && place.lng !== null &&
    place.visitDurationMin !== null && place.visitDurationMin > 0)
  const byRadius = (radius: number) => complete.filter(({ place }) => !input.start ||
    haversine(input.start, place) <= radius)
  const applyWalkingRule = (places: readonly CandidateRecord[]) => places.filter(({ place }) =>
    !sensitiveCompanions.has(input.companion) || place.walkingIntensity !== 3)

  let effectiveRadiusKm: number | null = input.start ? ITINERARY_CONFIG.radiusKm.default : null
  let walkingRelaxed = false
  const withinDefaultRadius = byRadius(ITINERARY_CONFIG.radiusKm.default)
  let selected = applyWalkingRule(withinDefaultRadius)
  const walkingExcludedCount = withinDefaultRadius.length - selected.length
  if (selected.length < requestedCount && sensitiveCompanions.has(input.companion)) {
    walkingRelaxed = true
    selected = byRadius(ITINERARY_CONFIG.radiusKm.default)
    notices.push({ code: 'FILTER_RELAXED', message: 'Đã nới tiêu chí vận động để có thêm lựa chọn.' })
  }
  if (selected.length < requestedCount && input.start) {
    effectiveRadiusKm = ITINERARY_CONFIG.radiusKm.relaxed
    selected = byRadius(ITINERARY_CONFIG.radiusKm.relaxed)
    if (!notices.some(({ code }) => code === 'FILTER_RELAXED')) {
      notices.push({ code: 'FILTER_RELAXED', message: 'Đã mở rộng khu vực tìm địa điểm.' })
    } else {
      notices[0] = { code: 'FILTER_RELAXED', message: 'Đã nới tiêu chí vận động và mở rộng khu vực tìm địa điểm.' }
    }
  }
  if (selected.length > 0 && selected.length < requestedCount) {
    notices.push({ code: 'FEW_CANDIDATES', message: 'Một số ngày có thể có ít địa điểm hơn dự kiến.' })
  }
  return {
    candidates: rankCandidates(selected, input),
    diagnosticCandidates: rankCandidates(complete, input),
    notices,
    requestedCount,
    effectiveRadiusKm,
    walkingRelaxed,
    walkingExcludedCount: walkingRelaxed ? 0 : walkingExcludedCount,
  }
}

export async function loadCandidates(repo: PlacesRepo, input: TripInput, signal?: AbortSignal): Promise<CandidateSelection> {
  return filterCandidates(await repo.listPublished(signal), input)
}

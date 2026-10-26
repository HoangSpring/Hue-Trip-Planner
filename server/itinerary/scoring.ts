import type { TripInput } from '@shared/schemas'
import { ITINERARY_CONFIG } from '../../shared/itinerary/config'
import type { CandidateRecord, ScoredCandidate } from './types'

const interestCategory: Readonly<Record<string, readonly string[]>> = {
  heritage: ['heritage'], history: ['heritage'], spiritual: ['heritage'],
  river: ['sightseeing'], photography: ['sightseeing'], nature: ['sightseeing'],
  cuisine: ['food'], cafe: ['cafe'], 'local-life': ['food', 'sightseeing', 'shopping'], shopping: ['shopping'],
}

function interestMatch({ place, tagWeights }: CandidateRecord, input: TripInput): number {
  const matchingSlugs = new Set(place.tags.map(({ slug }) => slug).filter((slug) => input.interests.includes(slug)))
  let score = [...matchingSlugs].reduce((total, slug) => total + (tagWeights[slug] ?? 1) / 3, 0)
  if (matchingSlugs.size === 0 && input.interests.some((slug) => interestCategory[slug]?.includes(place.category))) {
    score += ITINERARY_CONFIG.scoring.categoryPreferenceBonus
  }
  return Math.min(1, score)
}

function companionFit({ place }: CandidateRecord, input: TripInput): number {
  const suitable = place.suitableFor.length === 0 ? 0.5 : place.suitableFor.includes(input.companion) ? 1 : 0.2
  const sensitive = input.companion === 'seniors' || input.companion === 'family_kids'
  return Math.max(0, suitable - (sensitive && place.walkingIntensity === 3 ? ITINERARY_CONFIG.scoring.sensitiveWalkingPenalty : 0))
}

function budgetFit({ place }: CandidateRecord, input: TripInput): number {
  if (input.budget === null) return 0.5
  if (place.priceLevel === null) return 0.5
  if (place.priceLevel === 0) return 1
  const expected = { budget: 1, mid: 2, comfortable: 3 }[input.budget]
  return 1 - Math.abs(expected - place.priceLevel) / 3
}

function completeness({ place }: CandidateRecord): number {
  const fields = [place.openTime, place.closeTime, place.bestTime.length > 0, place.suitableFor.length > 0,
    place.priceLevel, place.visitDurationMin]
  return fields.filter((value) => value !== null && value !== false).length / fields.length
}

export function scoreCandidate(candidate: CandidateRecord, input: TripInput): ScoredCandidate {
  const components = {
    interest: interestMatch(candidate, input),
    companion: companionFit(candidate, input),
    budget: budgetFit(candidate, input),
    verified: candidate.place.verified ? 1 : 0,
    featured: candidate.featured ? 1 : 0,
    completeness: completeness(candidate),
  }
  const weights = ITINERARY_CONFIG.weights
  const score = components.interest * weights.interest + components.companion * weights.companion +
    components.budget * weights.budget + components.verified * weights.verified +
    components.featured * weights.featured + components.completeness * weights.completeness
  return { ...candidate, score }
}

export function rankCandidates(candidates: readonly CandidateRecord[], input: TripInput): ScoredCandidate[] {
  return candidates.map((candidate) => scoreCandidate(candidate, input))
    .sort((a, b) => b.score - a.score || a.place.slug.localeCompare(b.place.slug, 'en'))
}

import { ITINERARY_CONFIG } from '../../shared/itinerary/config'
import type { ScoredCandidate } from './types'

function isLunchCandidate(candidate: ScoredCandidate): boolean {
  return candidate.place.category === 'food' &&
    (candidate.place.mealType.length === 0 || candidate.place.mealType.includes('lunch') || candidate.place.mealType.includes('dinner'))
}

function isEveningCandidate(candidate: ScoredCandidate): boolean {
  return candidate.place.bestTime.includes('evening') || ['cafe', 'sightseeing'].includes(candidate.place.category)
}

export function buildCandidatePool(candidates: readonly ScoredCandidate[], numDays: number, maxItemsPerDay: number): ScoredCandidate[] {
  const requestedSize = Math.min(ITINERARY_CONFIG.poolSize.max,
    Math.max(ITINERARY_CONFIG.poolSize.min, maxItemsPerDay * numDays * ITINERARY_CONFIG.poolSize.perItemFactor))
  const size = Math.min(requestedSize, candidates.length)
  if (size === 0) return []
  const ordered = [...candidates].sort((a, b) => b.score - a.score || a.place.slug.localeCompare(b.place.slug, 'en'))
  const selected = new Map<string, ScoredCandidate>()
  const add = (candidate: ScoredCandidate) => selected.set(candidate.place.id, candidate)
  const addTop = (list: readonly ScoredCandidate[], count: number) => list.slice(0, count).forEach(add)

  addTop(ordered.filter(isLunchCandidate), numDays * 2)
  addTop(ordered.filter(isEveningCandidate), numDays)

  const counts = new Map<string, number>()
  for (const candidate of selected.values()) counts.set(candidate.place.category, (counts.get(candidate.place.category) ?? 0) + 1)
  const perCategoryCap = Math.max(1, Math.ceil(size * ITINERARY_CONFIG.poolSize.maxCategoryShare))
  for (const candidate of ordered) {
    if (selected.size >= size) break
    if (selected.has(candidate.place.id)) continue
    const count = counts.get(candidate.place.category) ?? 0
    if (count >= perCategoryCap) continue
    add(candidate)
    counts.set(candidate.place.category, count + 1)
  }
  // Fill remaining slots only when the available categories make the 50% cap impossible.
  for (const candidate of ordered) {
    if (selected.size >= size) break
    add(candidate)
  }
  return [...selected.values()].sort((a, b) => b.score - a.score || a.place.slug.localeCompare(b.place.slug, 'en'))
}

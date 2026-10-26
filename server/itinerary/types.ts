import type { PlaceDetail } from '@shared/schemas'

export type CandidateRecord = {
  place: PlaceDetail
  tagWeights: Readonly<Record<string, number>>
  featured: boolean
}

export type ScoredCandidate = CandidateRecord & { score: number }

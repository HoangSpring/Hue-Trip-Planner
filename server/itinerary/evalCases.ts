import { tripInputSchema, type TripInput } from '@shared/schemas'

export type ItineraryEvalCase = { id: string; label: string; input: TripInput }

const base = {
  startDate: '2026-11-01', budget: 'mid' as const, transport: 'motorbike' as const, start: null, notes: null,
}

export const itineraryEvalCases: readonly ItineraryEvalCase[] = [
  { id: 'v1', label: 'Cặp đôi · 2 ngày · thích ẩm thực', input: tripInputSchema.parse({ ...base, numDays: 2, companion: 'couple', groupSize: 2, interests: ['cuisine', 'cafe'], pace: 'moderate' }) },
  { id: 'v2', label: 'Gia đình có trẻ nhỏ · 1 ngày', input: tripInputSchema.parse({ ...base, numDays: 1, companion: 'family_kids', groupSize: 4, interests: ['heritage', 'river'], pace: 'moderate' }) },
  { id: 'v3', label: 'Người lớn tuổi · 3 ngày thong thả', input: tripInputSchema.parse({ ...base, numDays: 3, companion: 'seniors', groupSize: 2, interests: ['heritage', 'nature'], pace: 'relaxed', transport: 'taxi' }) },
  { id: 'v4', label: 'Nhóm bạn · 4 ngày dày', input: tripInputSchema.parse({ ...base, numDays: 4, companion: 'friends', groupSize: 5, interests: ['cuisine', 'local-life'], pace: 'packed' }) },
  { id: 'v5', label: 'Một mình · 1 ngày · di sản và cà phê', input: tripInputSchema.parse({ ...base, numDays: 1, companion: 'solo', groupSize: 1, interests: ['heritage', 'cafe'], pace: 'moderate' }) },
  { id: 'v6', label: 'Cặp đôi · 3 ngày · sông nước và ảnh', input: tripInputSchema.parse({ ...base, numDays: 3, companion: 'couple', groupSize: 2, interests: ['river', 'photography'], pace: 'moderate', transport: 'walk_bike' }) },
  { id: 'v7', label: 'Gia đình · 2 ngày · di sản và ẩm thực', input: tripInputSchema.parse({ ...base, numDays: 2, companion: 'family_kids', groupSize: 3, interests: ['heritage', 'cuisine'], pace: 'relaxed' }) },
  { id: 'v8', label: 'Người lớn tuổi · 2 ngày · tâm linh và thiên nhiên', input: tripInputSchema.parse({ ...base, numDays: 2, companion: 'seniors', groupSize: 2, interests: ['spiritual', 'nature'], pace: 'relaxed', transport: 'tour' }) },
  { id: 'v9', label: 'Nhóm bạn · 2 ngày · cà phê và mua sắm', input: tripInputSchema.parse({ ...base, numDays: 2, companion: 'friends', groupSize: 4, interests: ['cafe', 'shopping'], pace: 'packed' }) },
  { id: 'v10', label: 'Một mình · 3 ngày · đời sống địa phương và lịch sử', input: tripInputSchema.parse({ ...base, numDays: 3, companion: 'solo', groupSize: 1, interests: ['local-life', 'history'], pace: 'moderate' }) },
]

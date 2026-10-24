// Shared itinerary defaults. Tune thresholds only with the evaluation in docs/07.
export const ITINERARY_CONFIG = {
  weights: { interest: 0.5, companion: 0.15, budget: 0.1, verified: 0.1, featured: 0.05, completeness: 0.1 },
  radiusKm: { default: 40, relaxed: 60 },
  poolSize: { max: 60, min: 12, perItemFactor: 3, maxCategoryShare: 0.5 },
  itemsPerDay: { relaxed: [3, 4], moderate: [4, 5], packed: [6, 7], reduceForSensitiveBy: 1, floor: 3 },
  dayStart: { default: '08:00', gentle: '08:30' },
  latestEnd: '21:30',
  closeBufferMin: 30,
  circuity: 1.3,
  travel: {
    motorbike: { speedKmh: 25, bufferMin: 3, maxLegKm: 10, maxLegMin: 30 },
    taxi: { speedKmh: 22, bufferMin: 5, maxLegKm: 12, maxLegMin: 35 },
    walk_bike: { speedKmh: 5, bufferMin: 0, maxLegKm: 2.5, maxLegMin: 35 },
    tour: { speedKmh: 25, bufferMin: 5, maxLegKm: 15, maxLegMin: 40 },
  },
  maxDayTravelMin: 120,
  llm: { temperature: 0.4, maxOutputTokens: 2500, repairIfElapsedUnderMs: 8000, minCoverage: 0.7 },
} as const

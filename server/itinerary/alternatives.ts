import type {
  AlternativeItem,
  AlternativesRequest,
  AlternativesResponse,
  PlaceDetail,
  PlaceSummary,
  Slot,
} from '@shared/schemas'
import { haversine } from '../../shared/itinerary/geo'
import { isOpenAt } from '../../shared/itinerary/openHours'
import { vi } from '../../src/lib/strings/vi'
import { scoreCandidate } from './scoring'
import type { CandidateRecord } from './types'

const slotCheckTimes: Record<Slot, string> = {
  morning: '09:00',
  noon: '12:00',
  afternoon: '14:30',
  evening: '19:00',
}

function toPlaceSummary(detail: PlaceDetail): PlaceSummary {
  return {
    id: detail.id,
    slug: detail.slug,
    name: detail.name,
    category: detail.category,
    shortDescription: detail.shortDescription,
    area: detail.area,
    lat: detail.lat,
    lng: detail.lng,
    coverImageUrl: detail.coverImageUrl,
    coverImageAlt: detail.coverImageAlt,
    imageCredit: detail.imageCredit,
    imageLicense: detail.imageLicense,
    imageSourceUrl: detail.imageSourceUrl,
    tags: detail.tags,
    verified: detail.verified,
    status: detail.status,
  }
}

export function findAlternatives(
  records: readonly CandidateRecord[],
  req: AlternativesRequest
): AlternativesResponse {
  const target = records.find((r) => r.place.id === req.placeId)
  if (!target || target.place.lat === null || target.place.lng === null) {
    return { items: [] }
  }

  const excluded = new Set([req.placeId, ...(req.excludePlaceIds || [])])
  const targetCategory = target.place.category
  const targetTagSlugs = new Set(target.place.tags.map((t) => t.slug))
  const targetCoords = { lat: target.place.lat, lng: target.place.lng }
  const checkTime = slotCheckTimes[req.slot] || '10:00'
  const userInterests = new Set(req.input?.interests || [])

  const candidates: {
    record: CandidateRecord
    distanceM: number
    score: number
    reasonTag: string
  }[] = []

  for (const record of records) {
    const { place } = record
    if (excluded.has(place.id)) continue
    if (place.status !== 'published') continue
    if (place.lat === null || place.lng === null) continue

    // If target is food (or slot is noon food), candidate should be food
    if (req.slot === 'noon' && targetCategory === 'food' && place.category !== 'food') {
      continue
    }

    // Opening hours check
    if (place.openTime && place.closeTime) {
      const openStatus = isOpenAt(
        {
          openTime: place.openTime,
          closeTime: place.closeTime,
          closedDays: place.closedDays ?? [],
        },
        req.date ?? null,
        checkTime
      )
      if (openStatus === 'closed') {
        continue
      }
    }

    // Calculations per docs/07 section 14
    const distanceKm = haversine(targetCoords, { lat: place.lat, lng: place.lng })
    const distanceM = Math.round(distanceKm * 1000)

    const sameCategory = place.category === targetCategory ? 1 : 0

    // Jaccard tag overlap
    const candTagSlugs = new Set(place.tags.map((t) => t.slug))
    let sharedTag: { slug: string; name: string } | null = null
    let intersectionCount = 0
    for (const tag of place.tags) {
      if (targetTagSlugs.has(tag.slug)) {
        intersectionCount += 1
        if (!sharedTag) sharedTag = tag
      }
    }
    const unionCount = new Set([...targetTagSlugs, ...candTagSlugs]).size
    const tagOverlap = unionCount > 0 ? intersectionCount / unionCount : 0

    // Proximity: 1 - min(distanceM / 6000, 1)
    const proximity = Math.max(0, 1 - Math.min(distanceM / 6000, 1))

    // Base score from candidates step (0 if input not provided)
    const baseScore = req.input ? scoreCandidate(record, req.input).score : 0

    // Verified: 1 if verified else 0
    const verified = place.verified ? 1 : 0

    const alternativeScore =
      0.4 * sameCategory +
      0.25 * tagOverlap +
      0.2 * proximity +
      0.1 * baseScore +
      0.05 * verified

    // Reason tag logic
    let reasonTag: string
    if (sameCategory === 1 && sharedTag) {
      reasonTag = `Cùng loại: ${sharedTag.name}`
    } else if (distanceM <= 2500) {
      reasonTag = 'Gần địa điểm hiện tại'
    } else if (userInterests.size > 0 && place.tags.some((t) => userInterests.has(t.slug))) {
      reasonTag = 'Hợp sở thích của bạn'
    } else if (sameCategory === 1) {
      const catLabel = vi.placeCategories[place.category] || place.category
      reasonTag = `Cùng loại: ${catLabel}`
    } else {
      reasonTag = 'Gợi ý phù hợp'
    }

    candidates.push({
      record,
      distanceM,
      score: alternativeScore,
      reasonTag,
    })
  }

  // Sort descending by alternativeScore; tie breaker by slug
  candidates.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 1e-6) {
      return b.score - a.score
    }
    return a.record.place.slug.localeCompare(b.record.place.slug)
  })

  const limit = req.limit ?? 5
  const top = candidates.slice(0, limit)

  const items: AlternativeItem[] = top.map((c) => ({
    place: toPlaceSummary(c.record.place),
    distanceM: c.distanceM,
    reasonTag: c.reasonTag,
  }))

  return { items }
}

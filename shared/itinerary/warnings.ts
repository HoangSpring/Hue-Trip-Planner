import type { Category, Companion, Pace, Transport, Warning } from '@shared/schemas'
import { estimateTravel } from './travel'
import { ITINERARY_CONFIG } from './config'
import { isOpenAt } from './openHours'

type WarningPlace = {
  id: string
  category: Category
  status?: 'published' | 'archived'
  lat?: number
  lng?: number
  openTime?: string | null
  closeTime?: string | null
  closedDays?: number[]
}

type WarningItem = {
  id: string
  placeId: string
  place?: WarningPlace
  position: number
  slot: 'morning' | 'noon' | 'afternoon' | 'evening'
  startTime: string | null
  durationMin: number | null
  travelMinFromPrev: number | null
  travelDistanceM: number | null
}

type WarningDay = { dayIndex: number; date: string | null; items: WarningItem[] }

export type WarningTrip = {
  days: WarningDay[]
  transport: Transport | null
  startDate: string | null
  pace?: Pace
  companion?: Companion
  start?: { label: string; lat: number; lng: number } | null
}

function dateForDay(startDate: string | null, dayIndex: number): string | null {
  if (!startDate) return null
  const value = new Date(`${startDate}T00:00:00.000Z`)
  if (Number.isNaN(value.valueOf())) return null
  value.setUTCDate(value.getUTCDate() + dayIndex - 1)
  return value.toISOString().slice(0, 10)
}

function minutes(value: string | null): number | null {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return null
  const [hour, minute] = value.split(':').map(Number)
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

function maxItems(trip: WarningTrip): number {
  const pace = trip.pace ?? 'moderate'
  const max = ITINERARY_CONFIG.itemsPerDay[pace][1]
  const reduce = trip.companion === 'seniors' || trip.companion === 'family_kids'
    ? ITINERARY_CONFIG.itemsPerDay.reduceForSensitiveBy : 0
  return Math.max(ITINERARY_CONFIG.itemsPerDay.floor, max - reduce)
}

function warning(code: Warning['code'], itemId: string | null, dayIndex: number, message: string): Warning {
  return { code, itemId, dayIndex, message }
}

/** Pure warning calculation shared by server and future itinerary editing UI. */
export function computeWarnings(trip: WarningTrip): Warning[] {
  const warnings: Warning[] = []
  for (const day of trip.days) {
    const date = day.date ?? dateForDay(trip.startDate, day.dayIndex)
    const ordered = [...day.items].sort((a, b) => a.position - b.position)
    if (ordered.length > maxItems(trip)) {
      warnings.push(warning('TOO_MANY_ITEMS', null, day.dayIndex, 'Ngày này có nhiều địa điểm hơn nhịp độ đã chọn.'))
    }
    if (!ordered.some((item) => item.slot === 'noon' && item.place?.category === 'food')) {
      warnings.push(warning('LUNCH_MISSING', null, day.dayIndex, 'Ngày này chưa có địa điểm ăn trưa.'))
    }

    let previous: WarningItem | null = null
    for (const item of ordered) {
      const place = item.place
      if (place?.status === 'archived') {
        warnings.push(warning('PLACE_ARCHIVED', item.id, day.dayIndex, 'Địa điểm này đã được gỡ khỏi danh sách hiện tại.'))
      }
      if (place && (place.openTime == null || place.closeTime == null)) {
        warnings.push(warning('MISSING_HOURS', item.id, day.dayIndex, 'Chưa có giờ mở cửa để kiểm tra.'))
      }
      const closedOnDay = Boolean(date && place?.closedDays?.includes(isoWeekday(date)))
      if (closedOnDay) {
        warnings.push(warning('CLOSED_ON_DAY', item.id, day.dayIndex, 'Địa điểm có thể đóng cửa trong ngày đã chọn.'))
      } else if (place && item.startTime && isOpenAt({
        openTime: place.openTime ?? null, closeTime: place.closeTime ?? null, closedDays: place.closedDays ?? [],
      }, date, item.startTime) === 'closed') {
        warnings.push(warning('CLOSED_AT_TIME', item.id, day.dayIndex, `Có thể đã đóng cửa lúc ${item.startTime}.`))
      }

      const priorCoordinates = previous?.place && previous.place.lat !== undefined && previous.place.lng !== undefined
        ? { lat: previous.place.lat, lng: previous.place.lng }
        : previous === null && trip.start ? { lat: trip.start.lat, lng: trip.start.lng } : null
      const currentCoordinates = place && place.lat !== undefined && place.lng !== undefined
        ? { lat: place.lat, lng: place.lng } : null
      if (currentCoordinates && priorCoordinates && place) {
        const estimate = estimateTravel(priorCoordinates, currentCoordinates, trip.transport)
        const distanceKm = item.travelDistanceM === null ? estimate.distanceKm : item.travelDistanceM / 1000
        const travelMin = item.travelMinFromPrev === null ? estimate.travelMin : item.travelMinFromPrev
        if (distanceKm > estimate.maxLegKm || travelMin > estimate.maxLegMin) {
          warnings.push(warning('TOO_FAR', item.id, day.dayIndex, 'Chặng di chuyển có thể quá xa hoặc mất nhiều thời gian.'))
        }
      }

      if (previous?.startTime && previous.durationMin !== null && item.startTime) {
        const priorStart = minutes(previous.startTime)
        const currentStart = minutes(item.startTime)
        if (priorStart !== null && currentStart !== null) {
          const travelMin = item.travelMinFromPrev ?? 0
          if (currentStart < priorStart + previous.durationMin + travelMin) {
            warnings.push(warning('TIME_OVERLAP', item.id, day.dayIndex, 'Thời gian ghé có thể bị chồng lấn.'))
          }
        }
      }
      previous = item
    }
  }
  return warnings
}

function isoWeekday(date: string): number {
  const value = new Date(`${date}T00:00:00.000Z`)
  return value.getUTCDay() || 7
}

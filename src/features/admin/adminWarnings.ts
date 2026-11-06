import type { AdminPlaceInput } from '@shared/schemas/adminPlace'

export function adminPlaceWarnings(place: Pick<AdminPlaceInput, 'mealType' | 'bestTime' | 'openTime' | 'closeTime' | 'lat' | 'lng'>): string[] {
  const warnings: string[] = []
  if (place.mealType.includes('lunch') && !place.bestTime.includes('noon')) warnings.push('Địa điểm phục vụ bữa trưa nhưng chưa chọn thời điểm “Trưa”.')
  if (place.openTime === null || place.closeTime === null) warnings.push('Chưa có giờ mở cửa; hệ thống sẽ xem giờ hoạt động là chưa rõ.')
  if (place.lat !== null && place.lng !== null) {
    if (place.lat < 15.8 || place.lat > 17.2 || place.lng < 106.8 || place.lng > 108.2) warnings.push('Tọa độ nằm ngoài vùng Huế mở rộng. Hãy kiểm tra lại ghim bản đồ.')
    if (distanceKm(place.lat, place.lng, 16.4698, 107.5795) > 25) warnings.push('Địa điểm cách Ga Huế hơn 25 km; hãy xác nhận đây là vị trí chủ ý.')
  }
  return warnings
}

export function isAdminImageAllowed(file: Pick<File, 'type' | 'size'>): boolean {
  return ['image/webp', 'image/jpeg', 'image/png'].includes(file.type) && file.size <= 2 * 1024 * 1024
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLng = (lng2 - lng1) * rad
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

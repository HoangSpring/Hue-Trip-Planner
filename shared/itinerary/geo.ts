const EARTH_RADIUS_KM = 6371.0088

export type Coordinates = { lat: number; lng: number }

/** Great-circle distance between two coordinates, in kilometers. */
export function haversine(a: Coordinates, b: Coordinates): number {
  const toRadians = (degrees: number) => degrees * Math.PI / 180
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const deltaLat = lat2 - lat1
  const deltaLng = toRadians(b.lng - a.lng)
  const halfChord = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, halfChord)))
}

import type { PlaceDetail } from '@shared/schemas/place'

export function buildPlaceJsonLd(place: PlaceDetail): Record<string, unknown> {
  const schemaType = place.category === 'food' ? 'Restaurant'
    : place.category === 'cafe' ? 'CafeOrCoffeeShop'
      : place.category === 'shopping' ? 'Store' : 'TouristAttraction'
  return {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: place.name,
    description: place.shortDescription || place.description || undefined,
    image: place.coverImageUrl || undefined,
    address: place.address ? { '@type': 'PostalAddress', streetAddress: place.address, addressLocality: 'Huế', addressCountry: 'VN' } : undefined,
    geo: Number.isFinite(place.lat) && Number.isFinite(place.lng) ? { '@type': 'GeoCoordinates', latitude: place.lat, longitude: place.lng } : undefined,
  }
}

export function serializeJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replaceAll('<', '\\u003c')
}

import { Component, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import type { PlaceMapItemDto } from '@shared/schemas'
import { paths } from '@/app/paths'
import { vi } from '@/lib/strings/vi'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import './map.css'

type MapViewProps = {
  places: PlaceMapItemDto[]
  numbered?: boolean
  height?: string
  className?: string
  selectedPlaceId?: string | null
  onSelectPlace?: (place: PlaceMapItemDto | null) => void
}
const hueCenter: L.LatLngExpression = [16.4637, 107.5909]
export const categoryColor: Record<PlaceMapItemDto['category'], string> = { heritage: '#5B3A8C', food: '#C65D36', cafe: '#2F6F5E', sightseeing: '#347A9C', shopping: '#B7791F' }
const categoryLabel: Record<PlaceMapItemDto['category'], string> = vi.placeCategories
const tileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

class MapBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function ClusterLayer({
  places,
  numbered,
  selectedPlaceId,
  onChoose,
}: {
  places: PlaceMapItemDto[]
  numbered: boolean
  selectedPlaceId?: string | null
  onChoose: (place: PlaceMapItemDto) => void
}) {
  const map = useMap()
  useEffect(() => {
    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 52,
      showCoverageOnHover: false,
      iconCreateFunction: (group) => L.divIcon({ className: 'hue-marker-cluster', html: `<span>${group.getChildCount()}</span>`, iconSize: [42, 42] }),
    })
    const markers: L.Marker[] = []
    places.forEach((place, index) => {
      const marker = L.marker([place.lat, place.lng], {
      icon: L.divIcon({ className: 'hue-marker-wrap', html: `<span class="hue-marker" style="--marker-color:${categoryColor[place.category]}"><i>${numbered ? index + 1 : '•'}</i></span>`, iconSize: [36, 42], iconAnchor: [18, 38] }),
        title: place.name,
      })
      marker.on('click', () => onChoose(place))
      markers.push(marker)
    })
    cluster.addLayers(markers)
    map.addLayer(cluster)

    if (selectedPlaceId) {
      const found = places.find((p) => p.id === selectedPlaceId)
      if (found) {
        map.setView([found.lat, found.lng], 15)
      }
    } else if (places.length > 1) {
      try {
        const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng]))
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
      } catch {
        // bounds error fallback
      }
    } else if (places.length === 1) {
      map.setView([places[0].lat, places[0].lng], 14)
    }

    return () => { map.removeLayer(cluster) }
  }, [map, numbered, onChoose, places, selectedPlaceId])
  return null
}

function PlacesFallback({ places }: { places: PlaceMapItemDto[] }) {
  return <div className="grid h-full min-h-56 place-content-center bg-white p-6 text-center"><h3 className="font-serif text-xl">{vi.map.mapUnavailable}</h3><p className="mt-2 text-sm text-ink-muted">{vi.map.listFallback}</p><ul className="mt-4 max-h-44 space-y-2 overflow-auto text-left">{places.slice(0, 20).map((place) => <li key={place.id}><Link className="text-sm font-semibold text-primary underline" to={paths.place(place.slug)}>{place.name}</Link></li>)}</ul></div>
}

export function MapView({
  places,
  numbered = false,
  height = '520px',
  className = '',
  selectedPlaceId,
  onSelectPlace,
}: MapViewProps) {
  const [tileFailed, setTileFailed] = useState(false)
  const [internalSelected, setInternalSelected] = useState<PlaceMapItemDto | null>(null)

  const activeSelected = selectedPlaceId !== undefined
    ? (places.find((p) => p.id === selectedPlaceId) ?? null)
    : internalSelected

  const choosePlace = useCallback((place: PlaceMapItemDto) => {
    setInternalSelected(place)
    onSelectPlace?.(place)
  }, [onSelectPlace])

  const handleClose = useCallback(() => {
    setInternalSelected(null)
    onSelectPlace?.(null)
  }, [onSelectPlace])

  return <div className={`relative overflow-hidden rounded-card border border-line bg-[#e8e4d8] ${className}`} style={{ height }}>
    <MapBoundary fallback={<PlacesFallback places={places}/> }>
      {tileFailed ? <PlacesFallback places={places}/> : <MapContainer center={hueCenter} zoom={13} scrollWheelZoom attributionControl={false} className="h-full w-full" aria-label="Bản đồ địa điểm Huế">
        <TileLayer url={tileUrl} eventHandlers={{ tileerror: () => setTileFailed(true) }} />
        <ClusterLayer places={places} numbered={numbered} selectedPlaceId={selectedPlaceId} onChoose={choosePlace}/>
      </MapContainer>}
    </MapBoundary>
    <div className="pointer-events-none absolute bottom-0 right-0 z-[500] bg-white/90 px-2 py-1 text-[11px] leading-4 text-ink"><a className="pointer-events-auto underline" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">{vi.layout.osmCredit}</a></div>
    {activeSelected && <aside className="absolute left-3 top-3 z-[500] max-w-[calc(100%-24px)] rounded-card border border-line bg-white p-3 shadow-card sm:left-auto sm:right-3 sm:w-64" aria-live="polite"><button onClick={handleClose} aria-label={vi.map.closeCard} className="float-right grid size-8 place-items-center rounded-full text-ink-muted">×</button><p className="pr-6 text-xs text-ink-muted">{categoryLabel[activeSelected.category]}</p><h3 className="mt-1 font-serif text-lg leading-6">{activeSelected.name}</h3><a href={paths.place(activeSelected.slug)} className="mt-2 inline-flex min-h-10 items-center font-semibold text-primary underline underline-offset-4">{vi.map.details}</a></aside>}
  </div>
}

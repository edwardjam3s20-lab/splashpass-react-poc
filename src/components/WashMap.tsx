import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useAppStore } from '../store/useAppStore'
import type { WashPoint } from '../types/database'

interface WashMapProps {
  points: WashPoint[]
  onMarkerClick: (pointId: string) => void
}

const userPulseIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#4F6EF7;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 rgba(79,110,247,.5);animation:pulse 1.5s infinite;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function pointIcon(status: WashPoint['status']) {
  const color = status === 'paused' ? '#F04438' : '#4F6EF7'
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 12px rgba(79,110,247,.35);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:14px;">💧</span></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}

/**
 * Thin Leaflet wrapper kept deliberately imperative (not react-leaflet)
 * because the original app's marker-churn pattern (clear + redraw on every
 * data refresh) maps more directly this way. Revisit with react-leaflet if
 * the map grows more interactive state later.
 */
export function WashMap({ points, onMarkerClick }: WashMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const userMarkerRef = useRef<L.Marker | null>(null)
  const pointMarkersRef = useRef<L.Marker[]>([])

  const userLat = useAppStore((s) => s.userLat)
  const userLng = useAppStore((s) => s.userLng)

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([userLat, userLng], 13)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)

    userMarkerRef.current = L.marker([userLat, userLng], { icon: userPulseIcon }).addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once, position handled below
  }, [])

  // Keep user marker + view in sync with location updates
  useEffect(() => {
    if (!mapRef.current || !userMarkerRef.current) return
    userMarkerRef.current.setLatLng([userLat, userLng])
  }, [userLat, userLng])

  // Redraw wash point markers whenever the list changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    pointMarkersRef.current.forEach((m) => map.removeLayer(m))
    pointMarkersRef.current = points
      .filter((p) => p.lat && p.lng)
      .map((p) => {
        const marker = L.marker([p.lat, p.lng], { icon: pointIcon(p.status) }).addTo(map)
        marker.on('click', () => onMarkerClick(p.id))
        return marker
      })
  }, [points, onMarkerClick])

  return <div ref={containerRef} className="h-full w-full" />
}

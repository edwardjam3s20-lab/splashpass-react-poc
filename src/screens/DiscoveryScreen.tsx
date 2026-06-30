// DiscoveryScreen.tsx — Bolt/Uber-inspired Discovery experience
// v2 — real ratings, real photos, leaflet.markercluster, viewport re-fetch
//
// Drop-in replacement for src/screens/DiscoveryScreen.tsx
//
// New dependencies:
//   npm install leaflet.markercluster
//   npm install -D @types/leaflet.markercluster

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import { useGeolocation } from '../hooks/useGeolocation'
import { useAppStore } from '../store/useAppStore'
import { useWashPointsInBounds, useRatingSummaries } from '../hooks/useWashPoints'
import { distKm } from '../lib/washPoints'
import type { LatLngBounds } from '../lib/washPoints'
import type { WashPoint } from '../types/database'

// ─── Constants ────────────────────────────────────────────────────────────────

const SHEET_SNAP = {
  COLLAPSED: 104,
  HALF:      320,
  FULL:      560,
} as const

type SheetState = 'collapsed' | 'half' | 'full'

const SHEET_H: Record<SheetState, number> = {
  collapsed: SHEET_SNAP.COLLAPSED,
  half:      SHEET_SNAP.HALF,
  full:      SHEET_SNAP.FULL,
}

const FILTER_CHIPS = [
  { id: 'nearest',   label: 'Nearest',   icon: '📍' },
  { id: 'open',      label: 'Open Now',  icon: '🟢' },
  { id: 'rated',     label: 'Top Rated', icon: '⭐' },
  { id: 'cheapest',  label: 'Cheapest',  icon: '💰' },
  { id: 'premium',   label: 'Premium',   icon: '✨' },
  { id: 'detailing', label: 'Detailing', icon: '🔧' },
]

// Re-query Supabase only when the map center moves more than this many
// degrees (~1.1 km at the equator). Prevents hammering on micro-pans.
const REFETCH_THRESHOLD_DEG = 0.01

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

function estDriveMin(km: number): number {
  return Math.max(1, Math.round((km / 30) * 60))
}

function leafletBoundsToLatLngBounds(b: L.LatLngBounds): LatLngBounds {
  return {
    swLat: b.getSouth(),
    swLng: b.getWest(),
    neLat: b.getNorth(),
    neLng: b.getEast(),
  }
}

// ─── Map icon builders ────────────────────────────────────────────────────────

function buildUserIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:22px;height:22px">
        <div style="
          position:absolute;inset:0;border-radius:50%;
          background:rgba(10,132,255,0.18);
          animation:splashPulse 2s ease-out infinite;
        "></div>
        <div style="
          position:absolute;top:3px;left:3px;width:16px;height:16px;
          background:#0A84FF;border-radius:50%;
          border:3px solid #fff;
          box-shadow:0 2px 8px rgba(10,132,255,0.5);
        "></div>
      </div>
    `,
    iconSize:   [22, 22],
    iconAnchor: [11, 11],
  })
}

function buildWashIcon(status: 'open' | 'paused', selected = false) {
  const isOpen = status === 'open'
  const size   = selected ? 52 : 40
  const anchor = selected ? 26 : 20
  const bg     = isOpen ? '#00C6BE' : '#AEAEB2'
  const glow   = isOpen ? 'rgba(0,198,190,0.45)' : 'rgba(0,0,0,0.18)'

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px;height:${size + 8}px;
        display:flex;flex-direction:column;align-items:center;
        filter:drop-shadow(0 4px 12px ${glow});
        ${selected ? 'transform:scale(1.2);transform-origin:bottom center;' : ''}
        transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
      ">
        <div style="
          width:${size}px;height:${size}px;
          background:${bg};
          border-radius:${size / 2}px ${size / 2}px ${size / 2}px 0;
          transform:rotate(-45deg);
          border:3px solid #fff;
          display:flex;align-items:center;justify-content:center;
        ">
          <span style="transform:rotate(45deg);font-size:${selected ? 20 : 15}px;line-height:1">💧</span>
        </div>
        <div style="
          width:6px;height:8px;
          background:${bg};
          clip-path:polygon(50% 100%,0 0,100% 0);
          margin-top:-2px;
        "></div>
      </div>
    `,
    iconSize:   [size, size + 8],
    iconAnchor: [anchor, size + 8],
  })
}

// ─── WashCard ─────────────────────────────────────────────────────────────────

interface WashCardProps {
  point:       WashPoint
  userLat:     number
  userLng:     number
  avgRating:   number | null
  reviewCount: number
  selected:    boolean
  onSelect:    (id: string) => void
  onBook:      (point: WashPoint) => void
}

function WashCard({
  point, userLat, userLng,
  avgRating, reviewCount,
  selected, onSelect, onBook,
}: WashCardProps) {
  const dist     = distKm(userLat, userLng, point.lat, point.lng)
  const isOpen   = point.status === 'open'
  const minPrice = point.services.length
    ? Math.min(...point.services.map((s) => Number(s.price)))
    : null
  const driveMin = estDriveMin(dist)

  const now      = new Date()
  const closeH   = parseInt((point.closes_at || '21:00').split(':')[0], 10)
  const closingSoon = isOpen && closeH - now.getHours() <= 1

  const hasPhoto    = Boolean(point.image_url)
  const [photoFailed, setPhotoFailed] = useState(false)
  const showPhoto = hasPhoto && !photoFailed
  const servicePills = point.services.slice(0, 3)

  return (
    <div
      onClick={() => onSelect(point.id)}
      style={{
        background:  '#fff',
        border:      selected ? '2px solid #00C6BE' : '1.5px solid #EBEBED',
        borderRadius: 24,
        marginBottom: 12,
        overflow:    'hidden',
        boxShadow:   selected
          ? '0 8px 32px rgba(0,198,190,0.2),0 2px 8px rgba(0,0,0,0.04)'
          : '0 2px 12px rgba(0,0,0,0.05)',
        cursor:     'pointer',
        transition: 'all 0.2s cubic-bezier(0.34,1.1,0.64,1)',
        transform:  selected ? 'scale(1.01)' : 'scale(1)',
      }}
    >
      {/* ── Photo strip ── */}
      {showPhoto && (
        <div style={{ height: 110, position: 'relative', overflow: 'hidden' }}>
          <img
            src={point.image_url!}
            alt={point.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setPhotoFailed(true)}
          />
          {/* Status pill over photo */}
          <div style={{
            position: 'absolute', top: 10, left: 10,
            fontSize: 11, fontWeight: 700,
            color:      isOpen ? (closingSoon ? '#B25A00' : '#1F8A41') : '#FF3B30',
            background: 'rgba(255,255,255,0.92)',
            borderRadius: 8, padding: '3px 8px',
            backdropFilter: 'blur(8px)',
          }}>
            {isOpen ? (closingSoon ? '⚡ Closing soon' : '● Open') : '✕ Closed'}
          </div>
          {/* Favourite */}
          <button
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', top: 8, right: 10,
              background: 'rgba(255,255,255,0.9)', border: 'none',
              borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, cursor: 'pointer',
            }}
            aria-label="Save to favourites"
          >🤍</button>
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          {/* Avatar (no-photo fallback) */}
          {!showPhoto && (
            <div style={{
              width: 52, height: 52, borderRadius: 15, flexShrink: 0,
              background: isOpen
                ? 'linear-gradient(135deg,#E0FAF9,#B3F5F0)'
                : '#F5F5F7',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
              border: isOpen ? '1px solid rgba(0,198,190,0.15)' : '1px solid #EBEBED',
            }}>💧</div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{
                fontSize: 15, fontWeight: 700, color: '#0D0D0D',
                letterSpacing: '-0.3px', lineHeight: 1.2, flex: 1,
              }}>
                {point.name}
              </div>
              {!showPhoto && (
                <button
                  onClick={(e) => e.stopPropagation()}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 18, lineHeight: 1, flexShrink: 0 }}
                  aria-label="Save to favourites"
                >🤍</button>
              )}
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
              {/* Real rating */}
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0D0D0D' }}>
                ⭐{' '}
                {avgRating != null
                  ? `${avgRating.toFixed(1)} (${reviewCount})`
                  : <span style={{ color: '#AEAEB2', fontWeight: 400 }}>New</span>
                }
              </span>
              <span style={{ color: '#AEAEB2', fontSize: 10 }}>·</span>
              <span style={{ fontSize: 12, color: '#6E6E73' }}>{formatDist(dist)}</span>
              <span style={{ color: '#AEAEB2', fontSize: 10 }}>·</span>
              <span style={{ fontSize: 12, color: '#6E6E73' }}>🚗 {driveMin} min</span>
              {!showPhoto && (
                <>
                  <span style={{ color: '#AEAEB2', fontSize: 10 }}>·</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, borderRadius: 6, padding: '1px 6px',
                    color:      isOpen ? (closingSoon ? '#B25A00' : '#1F8A41') : '#FF3B30',
                    background: isOpen
                      ? (closingSoon ? 'rgba(255,159,10,0.12)' : 'rgba(48,209,88,0.12)')
                      : 'rgba(255,59,48,0.1)',
                  }}>
                    {isOpen ? (closingSoon ? 'Closing soon' : 'Open') : 'Closed'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Service pills */}
        {servicePills.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            {servicePills.map((s) => (
              <span key={s.id} style={{
                fontSize: 11, fontWeight: 600, color: '#0A84FF',
                background: 'rgba(10,132,255,0.08)', borderRadius: 8,
                padding: '3px 9px', border: '1px solid rgba(10,132,255,0.12)',
              }}>
                {s.name}
              </span>
            ))}
            {point.services.length > 3 && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#6E6E73',
                background: '#F5F5F7', borderRadius: 8, padding: '3px 9px',
              }}>+{point.services.length - 3} more</span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
          <div>
            {minPrice != null
              ? <>
                  <span style={{ fontSize: 11, color: '#6E6E73' }}>From </span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: '#0D0D0D', letterSpacing: '-0.4px' }}>
                    KSh {minPrice.toLocaleString()}
                  </span>
                </>
              : <span style={{ fontSize: 12, color: '#AEAEB2' }}>No services listed</span>
            }
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); if (isOpen) onBook(point) }}
            disabled={!isOpen}
            style={{
              background:  isOpen ? '#0A84FF' : '#EBEBED',
              color:       isOpen ? '#fff'    : '#AEAEB2',
              border: 'none', borderRadius: 14,
              padding: '9px 20px', fontSize: 13, fontWeight: 700,
              cursor:     isOpen ? 'pointer' : 'default',
              boxShadow:  isOpen ? '0 4px 16px rgba(10,132,255,0.3)' : 'none',
              transition: 'all 0.15s',
              letterSpacing: '-0.2px', fontFamily: 'inherit',
            }}
          >
            {isOpen ? 'Book →' : 'Closed'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{ background: '#fff', border: '1.5px solid #EBEBED', borderRadius: 24, padding: 16, marginBottom: 12 }}>
      <div className="sp-skeleton" style={{ height: 80, borderRadius: 12, marginBottom: 14 }} />
      <div style={{ display: 'flex', gap: 12 }}>
        <div className="sp-skeleton" style={{ width: 52, height: 52, borderRadius: 15, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="sp-skeleton" style={{ height: 15, width: '65%', borderRadius: 8, marginBottom: 8 }} />
          <div className="sp-skeleton" style={{ height: 11, width: '45%', borderRadius: 8 }} />
        </div>
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#0D0D0D', marginBottom: 8, letterSpacing: '-0.4px' }}>
        No operators in this area
      </div>
      <div style={{ fontSize: 14, color: '#6E6E73', marginBottom: 24, lineHeight: 1.5 }}>
        SplashPass is expanding fast. Zoom out or pan the map to find nearby operators.
      </div>
      <button
        onClick={onReset}
        style={{
          background: '#0A84FF', color: '#fff', border: 'none',
          borderRadius: 16, padding: '12px 28px',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(10,132,255,0.32)', fontFamily: 'inherit',
        }}
      >
        Expand search area
      </button>
    </div>
  )
}

// ─── Viewport fetch badge ─────────────────────────────────────────────────────

function FetchingBadge() {
  return (
    <div style={{
      position: 'absolute', top: 64, left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(10,22,40,0.82)', color: '#fff',
      fontSize: 12, fontWeight: 600,
      borderRadius: 100, padding: '6px 14px',
      zIndex: 11, backdropFilter: 'blur(12px)',
      pointerEvents: 'none',
      display: 'flex', alignItems: 'center', gap: 6,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ animation: 'splashSpin 0.8s linear infinite', display: 'inline-block' }}>⟳</span>
      Loading operators…
    </div>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function DiscoveryScreen() {
  useGeolocation()
  const navigate = useNavigate()

  const userLat     = useAppStore((s) => s.userLat)
  const userLng     = useAppStore((s) => s.userLng)
  const gpsConfirmed = useAppStore((s) => s.gpsConfirmed)

  // Viewport bounds — null until the map fires its first moveend.
  const [mapBounds, setMapBounds] = useState<LatLngBounds | null>(null)

  const { points, isLoading, isFetching } = useWashPointsInBounds(mapBounds, userLat, userLng)
  const ratingsMap = useRatingSummaries()

  // ── Map refs ──
  const mapContainerRef   = useRef<HTMLDivElement>(null)
  const mapRef            = useRef<L.Map | null>(null)
  const userMarkerRef     = useRef<L.Marker | null>(null)
  const clusterGroupRef   = useRef<L.MarkerClusterGroup | null>(null)
  const markersRef        = useRef<Map<string, L.Marker>>(new Map())
  const lastFetchCenterRef = useRef<{ lat: number; lng: number } | null>(null)
  const centeredOnGpsRef  = useRef(false)

  // ── Sheet state ──
  const [sheetState,   setSheetState]   = useState<SheetState>('half')
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [search,       setSearch]       = useState('')
  const [activeFilter, setActiveFilter] = useState('nearest')

  const sheetRef    = useRef<HTMLDivElement>(null)
  const dragStartY  = useRef(0)
  const dragStartH  = useRef<number>(SHEET_SNAP.HALF)
  const isDragging  = useRef(false)
  const currentH    = useRef<number>(SHEET_SNAP.HALF)
  const rafRef      = useRef(0)

  const sheetHeightPx = SHEET_H[sheetState]

  // ── Filtered + sorted list ──
  const filteredPoints = useMemo(() => {
    let result = [...points]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.area.toLowerCase().includes(q)
      )
    }

    switch (activeFilter) {
      case 'open':
        result = result.filter((p) => p.status === 'open')
        break
      case 'rated':
        result = [...result].sort((a, b) =>
          (ratingsMap.get(b.id)?.avg_rating ?? 0) - (ratingsMap.get(a.id)?.avg_rating ?? 0)
        )
        break
      case 'cheapest': {
        const minP = (p: WashPoint) =>
          p.services.length ? Math.min(...p.services.map((s) => Number(s.price))) : Infinity
        result = [...result].sort((a, b) => minP(a) - minP(b))
        break
      }
      case 'detailing':
        result = result.filter((p) =>
          p.services.some(
            (s) => s.name.toLowerCase().includes('detail') || s.service_type === 'premium_service'
          )
        )
        break
      // 'nearest' — already sorted by dist from useWashPointsInBounds
    }

    return result
  }, [points, search, activeFilter, ratingsMap])

  // ── Init map ──
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([userLat, userLng], 14)

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { maxZoom: 19, subdomains: 'abcd' }
    ).addTo(map)

    // ── Marker cluster group with branded clusters ──
    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius:    60,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom:   true,
      iconCreateFunction(cluster) {
        const count = cluster.getChildCount()
        const size  = count < 10 ? 38 : count < 30 ? 46 : 54
        const fs    = size < 46 ? 13 : 15
        return L.divIcon({
          className: '',
          html: `
            <div style="
              width:${size}px;height:${size}px;
              background:#00C6BE;border-radius:50%;
              border:3px solid #fff;
              box-shadow:0 4px 16px rgba(0,198,190,0.45);
              display:flex;align-items:center;justify-content:center;
              font-size:${fs}px;font-weight:800;color:#fff;
            ">${count}</div>
          `,
          iconSize:   [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      },
    })
    map.addLayer(clusterGroup)
    clusterGroupRef.current = clusterGroup

    userMarkerRef.current = L.marker([userLat, userLng], { icon: buildUserIcon() }).addTo(map)
    mapRef.current = map

    // ── Viewport re-fetch on pan / zoom ──
    function onMoveEnd() {
      const center = map.getCenter()
      const prev   = lastFetchCenterRef.current
      const moved  =
        !prev ||
        Math.abs(center.lat - prev.lat) > REFETCH_THRESHOLD_DEG ||
        Math.abs(center.lng - prev.lng) > REFETCH_THRESHOLD_DEG

      if (moved) {
        lastFetchCenterRef.current = { lat: center.lat, lng: center.lng }
        setMapBounds(leafletBoundsToLatLngBounds(map.getBounds()))
      }
    }

    map.on('moveend', onMoveEnd)
    map.on('zoomend', onMoveEnd)

    // Fire immediately so the first Supabase query has real bounds.
    requestAnimationFrame(() => {
      map.invalidateSize()
      lastFetchCenterRef.current = { lat: map.getCenter().lat, lng: map.getCenter().lng }
      setMapBounds(leafletBoundsToLatLngBounds(map.getBounds()))
    })
    const resizeTimer = setTimeout(() => map.invalidateSize(), 300)
    const onResize    = () => map.invalidateSize()
    window.addEventListener('resize', onResize)

    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      map.off('moveend', onMoveEnd)
      map.off('zoomend', onMoveEnd)
      map.remove()
      mapRef.current          = null
      clusterGroupRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Keep user dot in sync ──
  useEffect(() => {
    userMarkerRef.current?.setLatLng([userLat, userLng])
  }, [userLat, userLng])

  // ── Auto-center on first GPS fix ──
  useEffect(() => {
    if (gpsConfirmed && !centeredOnGpsRef.current && mapRef.current) {
      centeredOnGpsRef.current = true
      mapRef.current.setView([userLat, userLng], 14, { animate: true })
    }
  }, [gpsConfirmed, userLat, userLng])

  // ── Select a wash point ──
  // Declared before the marker-sync effect (which references it via a ref,
  // see selectPointRef below) so markers never call a stale closure.
  const selectPoint = useCallback((id: string) => {
    const map = mapRef.current
    const pt  = points.find((p) => p.id === id)
    if (!pt || !map) return

    setSelectedId(id)
    setSheetState('half')

    // Fly slightly north of the point so the card doesn't cover the marker.
    map.flyTo([pt.lat - 0.003, pt.lng], 16, {
      animate: true, duration: 0.65, easeLinearity: 0.3,
    })

    setTimeout(() => {
      document.getElementById(`wash-card-${id}`)?.scrollIntoView({
        behavior: 'smooth', block: 'nearest',
      })
    }, 420)
  }, [points])

  // Markers are created once and never re-bind their click handler (we only
  // call setIcon on updates, see effect below). Without this ref, a marker's
  // handler would keep closing over whatever `points` array existed at
  // marker-creation time — going stale the moment `points` changes (new GPS
  // fix, viewport refetch, filter change). Routing through a ref means the
  // handler always calls the *current* selectPoint, regardless of when the
  // marker itself was created.
  const selectPointRef = useRef(selectPoint)
  useEffect(() => {
    selectPointRef.current = selectPoint
  }, [selectPoint])

  // ── Sync wash markers into cluster group ──
  useEffect(() => {
    const cg = clusterGroupRef.current
    if (!cg) return

    const incomingIds = new Set(filteredPoints.map((p) => p.id))
    const existing    = markersRef.current

    // Remove stale
    existing.forEach((marker, id) => {
      if (!incomingIds.has(id)) {
        cg.removeLayer(marker)
        existing.delete(id)
      }
    })

    // Add new / refresh icon on selected change
    filteredPoints.forEach((p) => {
      const icon       = buildWashIcon(p.status, p.id === selectedId)
      const existing_m = existing.get(p.id)

      if (existing_m) {
        existing_m.setIcon(icon)
      } else {
        const marker = L.marker([p.lat, p.lng], { icon })
        marker.on('click', () => selectPointRef.current(p.id))
        cg.addLayer(marker)
        existing.set(p.id, marker)
      }
    })
  }, [filteredPoints, selectedId])

  const clearSelection = useCallback(() => setSelectedId(null), [])

  // ── Recenter ──
  const recenterOnUser = useCallback(() => {
    mapRef.current?.flyTo([userLat, userLng], 14, { animate: true, duration: 0.65 })
  }, [userLat, userLng])

  // ── Sheet drag ──
  function snapNearest(h: number): SheetState {
    const d = [
      Math.abs(SHEET_SNAP.COLLAPSED - h),
      Math.abs(SHEET_SNAP.HALF      - h),
      Math.abs(SHEET_SNAP.FULL      - h),
    ]
    return (['collapsed', 'half', 'full'] as SheetState[])[d.indexOf(Math.min(...d))]
  }

  function setSheetHeightImmediate(h: number) {
    if (sheetRef.current) {
      sheetRef.current.style.height     = `${h}px`
      sheetRef.current.style.transition = 'none'
    }
    currentH.current = h
  }

  function snapSheet(state: SheetState) {
    if (sheetRef.current) {
      sheetRef.current.style.height     = `${SHEET_H[state]}px`
      sheetRef.current.style.transition = 'height 0.32s cubic-bezier(0.32,0.72,0,1)'
    }
    currentH.current = SHEET_H[state]
    setSheetState(state)
  }

  function onPointerDown(e: React.PointerEvent) {
    isDragging.current  = true
    dragStartY.current  = e.clientY
    dragStartH.current  = currentH.current
    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup',   onPointerUp)
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging.current) return
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const newH = Math.max(
        SHEET_SNAP.COLLAPSED,
        Math.min(SHEET_SNAP.FULL, dragStartH.current + (dragStartY.current - e.clientY))
      )
      setSheetHeightImmediate(newH)
    })
  }

  function onPointerUp(e: PointerEvent) {
    isDragging.current = false
    document.removeEventListener('pointermove', onPointerMove)
    document.removeEventListener('pointerup',   onPointerUp)
    cancelAnimationFrame(rafRef.current)
    const finalH = Math.max(
      SHEET_SNAP.COLLAPSED,
      Math.min(SHEET_SNAP.FULL, dragStartH.current + (dragStartY.current - e.clientY))
    )
    snapSheet(snapNearest(finalH))
  }

  const handleBook = useCallback(
    (point: WashPoint) => navigate(`/book/${point.id}`),
    [navigate]
  )

  const mapH = `calc(100% - ${sheetHeightPx - 32}px)`

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', background: '#F5F5F7', overflow: 'hidden' }}>

      <style>{`
        @keyframes splashPulse {
          0%   { transform:scale(1);   opacity:0.6; }
          100% { transform:scale(2.8); opacity:0; }
        }
        @keyframes splashSpin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        .sp-skeleton {
          background:linear-gradient(90deg,#f0f0f2 25%,#e6e6ea 50%,#f0f0f2 75%);
          background-size:200% 100%;
          animation:shimmer 1.4s infinite;
        }
        @keyframes shimmer {
          0%   { background-position:200% 0; }
          100% { background-position:-200% 0; }
        }
        /* Strip default Leaflet cluster backgrounds */
        .marker-cluster-small,.marker-cluster-medium,.marker-cluster-large,
        .marker-cluster-small div,.marker-cluster-medium div,.marker-cluster-large div {
          background:none !important; box-shadow:none !important;
        }
      `}</style>

      {/* ── Map layer ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: mapH,
        transition: 'height 0.32s cubic-bezier(0.32,0.72,0,1)',
        zIndex: 0,
      }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* ── Viewport fetching indicator ── */}
      {isFetching && !isLoading && <FetchingBadge />}

      {/* ── Floating search bar ── */}
      <div style={{
        position: 'absolute', top: 14, left: 14, right: 14,
        zIndex: 10, pointerEvents: 'none',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 18,
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          border: '1px solid rgba(235,235,237,0.6)',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          pointerEvents: 'auto',
        }}>
          <span style={{ fontSize: 14, opacity: 0.45 }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search wash points, areas…"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 14, fontWeight: 500, color: '#0D0D0D', fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: '#AEAEB2', padding: 0 }}
            >×</button>
          )}
        </div>
      </div>

      {/* ── Recenter button ── */}
      <button
        onClick={recenterOnUser}
        style={{
          position: 'absolute', right: 14,
          bottom: `calc(${sheetHeightPx}px + 14px)`,
          transition: 'bottom 0.32s cubic-bezier(0.32,0.72,0,1)',
          zIndex: 10,
          width: 46, height: 46, borderRadius: 15,
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(235,235,237,0.6)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}
        aria-label="Re-centre on my location"
      >📍</button>

      {/* ── Bottom sheet ── */}
      <div
        ref={sheetRef}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: `${SHEET_SNAP.HALF}px`,
          background: '#fff',
          borderRadius: '28px 28px 0 0',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.13)',
          zIndex: 20,
          transition: 'height 0.32s cubic-bezier(0.32,0.72,0,1)',
          display: 'flex', flexDirection: 'column',
          touchAction: 'none',
        }}
      >
        {/* Drag handle */}
        <div
          onPointerDown={onPointerDown}
          style={{
            padding: '12px 0 8px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            cursor: 'grab', flexShrink: 0, userSelect: 'none',
          }}
        >
          <div style={{ width: 36, height: 4, background: '#EBEBED', borderRadius: 4 }} />
        </div>

        {/* Sheet header */}
        <div style={{ padding: '0 18px 10px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0D0D0D', letterSpacing: '-0.5px' }}>
                Nearby washes
              </div>
              <div style={{ fontSize: 12, color: '#6E6E73', marginTop: 1 }}>
                {isLoading
                  ? 'Finding operators…'
                  : `${filteredPoints.length} result${filteredPoints.length !== 1 ? 's' : ''}${
                      filteredPoints.length > 0
                        ? ` · closest ${formatDist(distKm(userLat, userLng, filteredPoints[0].lat, filteredPoints[0].lng))}`
                        : ''
                    }`
                }
              </div>
            </div>
            {selectedId && (
              <button
                onClick={clearSelection}
                style={{
                  background: '#F5F5F7', border: 'none', borderRadius: 10,
                  padding: '6px 12px', fontSize: 12, fontWeight: 600,
                  color: '#6E6E73', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Clear</button>
            )}
          </div>

          {/* Filter chips */}
          <div style={{
            display: 'flex', gap: 7, overflowX: 'auto',
            paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id)}
                style={{
                  flexShrink: 0,
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 13px', borderRadius: 100,
                  border:      activeFilter === chip.id ? '1.5px solid #0A84FF' : '1.5px solid #EBEBED',
                  background:  activeFilter === chip.id ? 'rgba(10,132,255,0.08)' : '#F5F5F7',
                  fontSize: 12, fontWeight: 600,
                  color:       activeFilter === chip.id ? '#0A84FF' : '#6E6E73',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 13 }}>{chip.icon}</span>
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: '#F5F5F7', flexShrink: 0 }} />

        {/* Scrollable list */}
        <div style={{
          flex: 1,
          overflowY: sheetState === 'collapsed' ? 'hidden' : 'auto',
          padding: '12px 14px 100px',
          WebkitOverflowScrolling: 'touch',
        }}>
          {isLoading ? (
            <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
          ) : filteredPoints.length === 0 ? (
            <EmptyState onReset={() => {
              setSearch('')
              setActiveFilter('nearest')
              mapRef.current?.flyTo([userLat, userLng], 12, { animate: true, duration: 0.6 })
            }} />
          ) : (
            filteredPoints.map((p) => {
              const rating = ratingsMap.get(p.id)
              return (
                <div key={p.id} id={`wash-card-${p.id}`}>
                  <WashCard
                    point={p}
                    userLat={userLat}
                    userLng={userLng}
                    avgRating={rating?.avg_rating ?? null}
                    reviewCount={rating?.review_count ?? 0}
                    selected={p.id === selectedId}
                    onSelect={selectPoint}
                    onBook={handleBook}
                  />
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

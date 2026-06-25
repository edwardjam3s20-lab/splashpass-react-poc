import { useCallback, useState } from 'react'
import { useGeolocation } from '../hooks/useGeolocation'
import { useAppStore } from '../store/useAppStore'
import { useSortedWashPoints } from '../hooks/useWashPoints'
import { WashMap } from '../components/WashMap'
import { PointSheet } from '../components/PointSheet'
import type { WashPoint } from '../types/database'
import { useNavigate } from 'react-router-dom'

function WashPointCard({
  point,
  onSelect,
  distKm,
}: {
  point: WashPoint
  onSelect: (id: string) => void
  distKm?: number | null
}) {
  const isOpen = point.status === 'open'
  return (
    <div
      onClick={() => isOpen && onSelect(String(point.id))}
      className="sp-press flex items-center gap-3 rounded-[16px] bg-white p-3.5 mb-2.5"
      style={{
        border: '1px solid #EBEBED',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        opacity: isOpen ? 1 : 0.55,
        cursor: isOpen ? 'pointer' : 'default',
      }}
    >
      {/* Icon */}
      <div
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[13px] text-xl"
        style={{ background: '#E0FAF9' }}
      >
        💧
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[14px] font-bold text-ink truncate">{point.name}</span>
          {!isOpen && (
            <span
              className="text-[10px] font-700 px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: '#FFF0EE', color: '#FF3B30' }}
            >
              Closed
            </span>
          )}
        </div>
        <div className="text-[12px] text-muted">
          {point.area}
          {distKm != null ? ` · ${distKm.toFixed(1)} km` : ''}
          {point.services?.length ? ` · ${point.services.length} services` : ''}
        </div>
      </div>

      {/* CTA */}
      {isOpen && (
        <div
          className="flex-shrink-0 rounded-[11px] px-3 py-2 text-[12px] font-bold text-white"
          style={{ background: '#0A84FF' }}
        >
          Book
        </div>
      )}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 rounded-[16px] bg-white p-3.5 mb-2.5" style={{ border: '1px solid #EBEBED' }}>
      <div className="sp-skeleton h-11 w-11 rounded-[13px] flex-shrink-0" />
      <div className="flex-1">
        <div className="sp-skeleton h-4 w-32 mb-2 rounded" />
        <div className="sp-skeleton h-3 w-24 rounded" />
      </div>
    </div>
  )
}

export function DiscoveryScreen() {
  useGeolocation()
  const navigate = useNavigate()

  const userLat = useAppStore((s) => s.userLat)
  const userLng = useAppStore((s) => s.userLng)
  const { points, isLoading } = useSortedWashPoints(userLat, userLng)

  const [sheetPoint, setSheetPoint] = useState<WashPoint | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const openSheetFor = useCallback(
    (pointId: string) => {
      const point = points.find((p) => String(p.id) === String(pointId))
      if (!point) return
      setSheetPoint(point)
      setSheetOpen(true)
    },
    [points]
  )

  const closeSheet = useCallback(() => setSheetOpen(false), [])
  const handleBook = useCallback(
    (point: WashPoint) => {
      setSheetOpen(false)
      navigate(`/book/${point.id}`)
    },
    [navigate]
  )

  // Distance calculation helper
  function distTo(p: WashPoint): number | null {
    if (userLat == null || userLng == null || p.lat == null || p.lng == null) return null
    const R = 6371
    const dLat = ((p.lat - userLat) * Math.PI) / 180
    const dLon = ((p.lng - userLng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((userLat * Math.PI) / 180) * Math.cos((p.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  const nearestOpen = points.find((p) => p.status === 'open')

  return (
    <div className="flex h-full flex-col" style={{ background: '#F5F5F7' }}>
      {/* ── Header ── */}
      <div className="bg-white px-5 pt-3 pb-3" style={{ boxShadow: '0 1px 0 #EBEBED' }}>
        <div className="text-[20px] font-extrabold text-ink leading-tight" style={{ letterSpacing: '-0.5px' }}>
          Discover
        </div>
        <div className="text-[12px] text-muted mt-0.5">
          {isLoading ? 'Finding wash points near you…' : `${points.length} wash point${points.length === 1 ? '' : 's'} nearby`}
        </div>
      </div>

      {/* ── Map ── */}
      <div className="relative mx-3 mt-3 rounded-[18px] overflow-hidden" style={{ height: 150 }}>
        <WashMap points={points} onMarkerClick={openSheetFor} />
        {/* Nearest wash callout */}
        {nearestOpen && (
          <div
            className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center gap-2.5 rounded-[13px] px-3 py-2.5"
            style={{
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            }}
          >
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] text-base"
              style={{ background: '#E0FAF9' }}
            >
              💧
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-bold text-ink truncate">{nearestOpen.name}</div>
              <div className="text-[10px] text-muted">
                {nearestOpen.area}
                {distTo(nearestOpen) != null ? ` · ${distTo(nearestOpen)!.toFixed(1)} km` : ''}
                {' · Open now'}
              </div>
            </div>
            <button
              onClick={() => openSheetFor(String(nearestOpen.id))}
              className="flex-shrink-0 rounded-[10px] px-3 py-1.5 text-[11px] font-bold text-white"
              style={{ background: '#0A84FF' }}
            >
              Book
            </button>
          </div>
        )}
      </div>

      {/* ── Wash Points List ── */}
      <div className="flex-1 overflow-y-auto px-3 pt-3">
        <div
          className="text-[13px] font-bold text-ink mb-2.5"
          style={{ letterSpacing: '-0.2px' }}
        >
          Nearby Wash Points
        </div>
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : points.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-[15px] font-bold text-ink mb-1">No wash points found</div>
            <div className="text-[13px] text-muted">Try enabling location access</div>
          </div>
        ) : (
          points.map((p) => (
            <WashPointCard
              key={p.id}
              point={p}
              onSelect={openSheetFor}
              distKm={distTo(p)}
            />
          ))
        )}
      </div>

      <PointSheet point={sheetPoint} open={sheetOpen} onClose={closeSheet} onBook={handleBook} />
    </div>
  )
}

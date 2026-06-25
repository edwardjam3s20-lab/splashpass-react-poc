import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WashMap } from '../components/WashMap'
import { PointSheet } from '../components/PointSheet'
import { useGeolocation } from '../hooks/useGeolocation'
import { useAppStore } from '../store/useAppStore'
import { useSortedWashPoints } from '../hooks/useWashPoints'
import { getCarsByEmail } from '../lib/cars'
import { getTrialDaysLeft, isOnTrial } from '../lib/access'
import { getTier } from '../lib/loyalty'
import type { WashPoint } from '../types/database'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

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

export function HomeScreen() {
  useGeolocation()
  const navigate = useNavigate()

  const userLat = useAppStore((s) => s.userLat)
  const userLng = useAppStore((s) => s.userLng)
  const { points, isLoading } = useSortedWashPoints(userLat, userLng)

  const currentUser = useAppStore((s) => s.currentUser)
  const setUserCars = useAppStore((s) => s.setUserCars)

  useEffect(() => {
    if (!currentUser) return
    getCarsByEmail(currentUser.email).then(setUserCars)
  }, [currentUser, setUserCars])

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

  // Derived user state
  const name = currentUser?.name?.split(' ')[0] || 'there'
  const planName = currentUser?.sub_plan_name || (isOnTrial(currentUser) ? 'Free Trial' : 'No Plan')
  const trialDays = getTrialDaysLeft(currentUser)
  const onTrial = isOnTrial(currentUser)
  const pts = currentUser?.loyalty_points || 0
  const tier = getTier(pts)
  const isActive = currentUser?.sub_status === 'active'

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
      <div className="bg-white px-5 pt-2 pb-4" style={{ boxShadow: '0 1px 0 #EBEBED' }}>
        {/* Greeting row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[12px] text-muted font-medium mb-0.5">{greeting()} 👋</div>
            <div
              className="text-[20px] font-extrabold text-ink leading-tight"
              style={{ letterSpacing: '-0.5px' }}
            >
              {name}
            </div>
          </div>
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[14px] text-white font-extrabold text-[15px]"
              style={{ background: 'linear-gradient(135deg, #00C6BE, #0A84FF)' }}
            >
              {(currentUser?.name || '?')[0].toUpperCase()}
            </div>
            <div
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
              style={{ background: '#30D158', bottom: '-2px', right: '-2px' }}
            />
          </div>
        </div>

        {/* Status card */}
        <div
          className="rounded-[18px] p-4"
          style={{ background: 'linear-gradient(135deg, #1C2E4A, #0A1628)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              {/* Plan badge */}
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold mb-2"
                style={{
                  background: onTrial ? 'rgba(10,132,255,0.2)' : 'rgba(255,214,10,0.18)',
                  color: onTrial ? '#60B0FF' : '#FFD60A',
                }}
              >
                {onTrial ? '🎁 Free Trial' : isActive ? `✨ ${planName}` : '⚠️ Expired'}
              </span>
              <div
                className="text-[19px] font-extrabold text-white leading-tight"
                style={{ letterSpacing: '-0.4px' }}
              >
                {onTrial
                  ? `${trialDays} days left`
                  : isActive
                  ? `${currentUser?.sub_car_limit || 1} car${(currentUser?.sub_car_limit || 1) > 1 ? 's' : ''} covered`
                  : 'Subscribe now'}
              </div>
              <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {onTrial
                  ? 'KSh 30 fee per booking'
                  : isActive
                  ? `KSh ${[199, 499, 999, 1999].find(() => true)}/mo · unlimited washes`
                  : 'Trial ended'}
              </div>
            </div>

            {/* Points */}
            <div className="text-right flex-shrink-0 ml-4">
              <div
                className="text-[26px] font-extrabold leading-none"
                style={{ color: '#FFD60A', letterSpacing: '-1px' }}
              >
                {pts.toLocaleString()}
              </div>
              <div className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Points
              </div>
              <span
                className="inline-flex items-center gap-1 mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: 'rgba(255,214,10,0.15)', color: '#FFD60A' }}
              >
                {tier.icon} {tier.name}
              </span>
            </div>
          </div>

          {onTrial && (
            <button
              onClick={() => navigate('/plans')}
              className="mt-3 w-full rounded-[11px] py-2 text-[13px] font-bold"
              style={{ background: '#0A84FF', color: '#fff' }}
            >
              Upgrade — Remove fee →
            </button>
          )}
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

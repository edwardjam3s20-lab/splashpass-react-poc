import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WashMap } from '../components/WashMap'
import { WashPointsList } from '../components/WashPointsList'
import { PointSheet } from '../components/PointSheet'
import { useGeolocation } from '../hooks/useGeolocation'
import { useAppStore } from '../store/useAppStore'
import { useSortedWashPoints } from '../hooks/useWashPoints'
import { getCarsByEmail } from '../lib/cars'
import type { WashPoint } from '../types/database'

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

  return (
    <div className="flex h-full flex-col bg-bg">
      {/* Map */}
      <div className="relative h-[42vh] min-h-[260px] w-full">
        <WashMap points={points} onMarkerClick={openSheetFor} />
      </div>

      {/* Wash points list */}
      <div className="flex-1 overflow-y-auto px-4 pt-4">
        <h2 className="text-base font-bold text-navy mb-3">Nearby wash points</h2>
        {isLoading ? (
          <div className="text-sm text-muted">Loading wash points…</div>
        ) : (
          <WashPointsList points={points} onSelect={openSheetFor} />
        )}
      </div>

      <PointSheet point={sheetPoint} open={sheetOpen} onClose={closeSheet} onBook={handleBook} />
    </div>
  )
}

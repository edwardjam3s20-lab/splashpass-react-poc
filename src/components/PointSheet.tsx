import { distKm } from '../lib/washPoints'
import { useAppStore } from '../store/useAppStore'
import type { WashPoint } from '../types/database'

interface PointSheetProps {
  point: WashPoint | null
  open: boolean
  onClose: () => void
  onBook: (point: WashPoint) => void
}

function formatDistance(dist: number) {
  return dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`
}

export function PointSheet({ point, open, onClose, onBook }: PointSheetProps) {
  const userLat = useAppStore((s) => s.userLat)
  const userLng = useAppStore((s) => s.userLng)

  if (!point) return null

  const distLabel = formatDistance(distKm(userLat, userLng, point.lat, point.lng))

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={[
          'fixed inset-0 bg-navy/40 z-40 transition-opacity',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />
      {/* Sheet */}
      <div
        className={[
          'fixed left-0 right-0 bottom-[72px] z-50 bg-surface-1 rounded-t-app-lg p-6 pb-8',
          'shadow-app-lg transition-transform duration-300',
          open ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label={`${point.name} details`}
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-slate-200" />

        <h3 className="text-lg font-bold text-navy">{point.name}</h3>
        <p className="text-sm text-muted mt-0.5">{point.area}</p>
        <p className="text-sm font-semibold text-accent mt-1">{distLabel}</p>

        <div className="flex flex-wrap gap-2 mt-4 mb-6">
          {point.services.length ? (
            point.services.map((s) => (
              <div
                key={s.id}
                className="rounded-full bg-surface-3 px-3 py-1.5 text-xs font-medium text-navy"
              >
                💧 {s.name} — KSh {Number(s.price).toLocaleString()}
              </div>
            ))
          ) : (
            <div className="text-xs text-muted">Services loading…</div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onBook(point)}
          className="w-full rounded-app bg-accent py-3.5 text-sm font-bold text-white shadow-app-md active:scale-[0.98] transition-transform"
        >
          Book this wash point
        </button>
      </div>
    </>
  )
}

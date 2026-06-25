import { distKm } from '../lib/washPoints'
import { useAppStore } from '../store/useAppStore'
import type { WashPoint } from '../types/database'

interface PointSheetProps {
  point: WashPoint | null; open: boolean; onClose: () => void; onBook: (point: WashPoint) => void
}

export function PointSheet({ point, open, onClose, onBook }: PointSheetProps) {
  const userLat = useAppStore((s) => s.userLat)
  const userLng = useAppStore((s) => s.userLng)

  if (!point) return null

  const dist = distKm(userLat, userLng, point.lat, point.lng)
  const distLabel = dist < 1 ? `${Math.round(dist * 1000)}m away` : `${dist.toFixed(1)}km away`
  const isOpen = point.status === 'open' || point.status === 'paused'

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose}
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ background: 'rgba(10,22,40,0.5)', backdropFilter: 'blur(4px)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }} />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 z-50 rounded-t-[28px] bg-white px-5 pt-4 pb-8"
        style={{
          bottom: 72,
          boxShadow: '0 -8px 40px rgba(10,22,40,0.18)',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
        }}
        role="dialog" aria-modal="true" aria-label={`${point.name} details`}
      >
        {/* Handle bar */}
        <div className="mx-auto mb-5 h-1 w-10 rounded-full" style={{ background: '#EBEBED' }} />

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[15px] text-2xl"
              style={{ background: '#E0FAF9' }}>
              💧
            </div>
            <div>
              <div className="text-[17px] font-extrabold text-ink" style={{ letterSpacing: '-0.3px' }}>{point.name}</div>
              <div className="text-[12px] text-muted mt-0.5">{point.area} · {distLabel}</div>
            </div>
          </div>
          {!isOpen && (
            <span className="rounded-full px-2.5 py-1 text-[11px] font-bold flex-shrink-0"
              style={{ background: '#FFF0EE', color: '#FF3B30' }}>Closed</span>
          )}
        </div>

        {/* Services */}
        {point.services.length > 0 && (
          <div className="mb-5">
            <div className="text-[11px] font-bold text-muted uppercase tracking-[0.5px] mb-3">Services & Pricing</div>
            <div className="flex flex-col gap-2">
              {point.services.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between rounded-[12px] px-3 py-2.5"
                  style={{ background: '#F5F5F7', border: '1px solid #EBEBED' }}>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{i === 0 ? '🚿' : i === 1 ? '✨' : '💎'}</span>
                    <span className="text-[13px] font-semibold text-ink">{s.name}</span>
                  </div>
                  <span className="text-[14px] font-extrabold" style={{ color: '#0A84FF' }}>
                    KSh {Number(s.price).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button type="button" onClick={() => onBook(point)} disabled={!isOpen}
          className="sp-press w-full rounded-[16px] py-4 text-[15px] font-extrabold text-white"
          style={{
            background: isOpen ? '#0A84FF' : '#EBEBED',
            color: isOpen ? '#fff' : '#AEAEB2',
            boxShadow: isOpen ? '0 8px 24px rgba(10,132,255,0.36)' : 'none',
          }}>
          {isOpen ? 'Book This Wash Point →' : 'Currently Closed'}
        </button>
      </div>
    </>
  )
}

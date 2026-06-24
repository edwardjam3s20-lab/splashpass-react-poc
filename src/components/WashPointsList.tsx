import type { WashPoint } from '../types/database'

interface WashPointsListProps {
  points: WashPoint[]
  onSelect: (pointId: string) => void
}

function formatDistance(dist?: number) {
  if (dist == null) return ''
  return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`
}

export function WashPointsList({ points, onSelect }: WashPointsListProps) {
  if (!points.length) {
    return <div className="px-1 py-3 text-sm text-muted">No wash points available.</div>
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-none">
      {points.map((p, i) => {
        const isPaused = p.status === 'paused'
        const isFirst = i === 0 && !isPaused
        const minPrice = p.services.length
          ? Math.min(...p.services.map((s) => Number(s.price)))
          : null

        return (
          <button
            key={p.id}
            type="button"
            disabled={isPaused}
            onClick={() => !isPaused && onSelect(p.id)}
            className={[
              'flex-shrink-0 w-[165px] rounded-app-lg bg-surface-1 p-3.5 text-left transition-all',
              isPaused ? 'opacity-50 cursor-default' : 'cursor-pointer',
              isFirst
                ? 'border-[1.5px] border-accent shadow-[0_4px_20px_rgba(79,110,247,0.12)]'
                : 'border-[1.5px] border-slate-200 shadow-[0_2px_10px_rgba(11,20,55,0.07)]',
            ].join(' ')}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[22px]">💧</span>
              {isPaused ? (
                <span className="text-[11px] font-semibold text-danger">Busy</span>
              ) : (
                <span className="text-[11px] font-semibold text-success">Free</span>
              )}
            </div>
            <div className="text-[13px] font-bold text-navy leading-tight mb-0.5">{p.name}</div>
            <div className="text-[11px] text-muted mb-1.5">{p.area}</div>
            <div className="text-[11px] font-bold text-accent">{formatDistance(p.dist)} away</div>
            <div className="text-[11px] text-muted mt-0.5">
              {minPrice ? `From KSh ${minPrice.toLocaleString()}` : 'Tap for services'}
            </div>
          </button>
        )
      })}
    </div>
  )
}

import type { Car } from '../types/database'

interface CarOptionProps {
  car: Car
  selected: boolean
  onClick: () => void
}

function carEmoji(carType: string) {
  if (carType === 'SUV') return '🚙'
  if (carType === 'Pickup') return '🛻'
  return '🚗'
}

export function CarOption({ car, selected, onClick }: CarOptionProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] bg-white px-4 py-3 transition-all active:scale-[0.98]',
        selected
          ? 'border-accent shadow-[0_0_0_4px_rgba(79,110,247,0.08)]'
          : 'border-slate-200 shadow-app',
      ].join(' ')}
    >
      <div className="text-[22px]">{carEmoji(car.car_type)}</div>
      <div className="flex-1">
        <div className="text-sm font-bold text-navy">
          {car.make} {car.model}
        </div>
        <div className="text-xs font-bold text-gold">{car.plate || '—'}</div>
        <div className="text-[11px] text-muted">{car.car_type}</div>
      </div>
      <div
        className={[
          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-[1.5px] text-[11px]',
          selected ? 'border-accent bg-accent text-white' : 'border-slate-300 text-transparent',
        ].join(' ')}
      >
        ✓
      </div>
    </div>
  )
}

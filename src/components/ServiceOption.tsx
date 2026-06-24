import type { WashPointExtra } from '../types/database'

interface ServiceOptionProps {
  service: WashPointExtra
  selected: boolean
  onClick: () => void
}

export function ServiceOption({ service, selected, onClick }: ServiceOptionProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'mb-2 flex cursor-pointer items-center justify-between rounded-2xl border-[1.5px] px-4 py-3.5 transition-all',
        selected
          ? 'border-accent bg-accent/5 shadow-[0_0_0_4px_rgba(79,110,247,0.08)]'
          : 'border-slate-200 bg-white shadow-app',
      ].join(' ')}
    >
      <div>
        <div className="text-sm font-bold text-navy">{service.name}</div>
        {service.description && (
          <div className="mt-0.5 text-xs text-muted">{service.description}</div>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <div className={['text-[15px] font-extrabold', selected ? 'text-accent' : 'text-navy'].join(' ')}>
          KSh {Number(service.price).toLocaleString()}
        </div>
        <div
          className={[
            'flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] text-xs',
            selected ? 'border-accent bg-accent text-white' : 'border-slate-200 bg-bg text-transparent',
          ].join(' ')}
        >
          ✓
        </div>
      </div>
    </div>
  )
}

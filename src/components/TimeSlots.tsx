interface TimeSlotsProps {
  slots: string[]
  fullSlots: Set<string>
  selectedSlot: string | null
  onSelect: (slot: string) => void
  loading: boolean
}

export function TimeSlots({ slots, fullSlots, selectedSlot, onSelect, loading }: TimeSlotsProps) {
  if (loading) {
    return <div className="col-span-3 py-2 text-[13px] text-muted">Loading slots...</div>
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((s) => {
        const isFull = fullSlots.has(s)
        const isSelected = selectedSlot === s
        return (
          <div
            key={s}
            onClick={() => !isFull && onSelect(s)}
            className={[
              'rounded-xl border-[1.5px] px-2 py-2.5 text-center text-[12.5px] font-semibold transition-all',
              isFull
                ? 'cursor-default border-slate-200 bg-slate-50 text-slate-300'
                : isSelected
                  ? 'cursor-pointer border-accent bg-accent text-white shadow-app'
                  : 'cursor-pointer border-slate-200 bg-white text-navy hover:border-accent',
            ].join(' ')}
          >
            {s} {isFull && <span className="text-[9px] opacity-60">FULL</span>}
          </div>
        )
      })}
    </div>
  )
}

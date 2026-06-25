interface OnboardOptionProps {
  icon: string; title: string; subtitle: string; selected: boolean; onClick: () => void
}

export function OnboardOption({ icon, title, subtitle, selected, onClick }: OnboardOptionProps) {
  return (
    <div onClick={onClick}
      className="sp-press flex cursor-pointer items-center gap-4 rounded-[16px] bg-white px-4 py-3.5"
      style={{
        border: `1.5px solid ${selected ? '#0A84FF' : '#EBEBED'}`,
        boxShadow: selected ? '0 4px 16px rgba(10,132,255,0.14)' : '0 2px 8px rgba(0,0,0,0.04)',
        background: selected ? 'rgba(10,132,255,0.04)' : '#fff',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}>
      <div className="flex-shrink-0 text-[26px]">{icon}</div>
      <div className="flex-1">
        <div className="mb-0.5 text-[14px] font-bold text-ink">{title}</div>
        <div className="text-[12px] text-muted">{subtitle}</div>
      </div>
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold transition-all"
        style={{
          borderColor: selected ? '#0A84FF' : '#EBEBED',
          background: selected ? '#0A84FF' : '#fff',
          color: selected ? '#fff' : 'transparent',
        }}>
        ✓
      </div>
    </div>
  )
}

export function OnboardProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-7 flex gap-1.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-1 flex-1 rounded-full transition-colors duration-300"
          style={{ background: i < step ? '#30D158' : i === step ? '#0A84FF' : '#EBEBED' }} />
      ))}
    </div>
  )
}

interface OnboardOptionProps {
  icon: string
  title: string
  subtitle: string
  selected: boolean
  onClick: () => void
}

export function OnboardOption({ icon, title, subtitle, selected, onClick }: OnboardOptionProps) {
  return (
    <div
      onClick={onClick}
      className={[
        'flex cursor-pointer items-center gap-4 rounded-[18px] border-[1.5px] bg-white px-[18px] py-4 shadow-app transition-all active:scale-[0.98]',
        selected
          ? 'border-accent bg-accent/5 shadow-[0_0_0_4px_rgba(79,110,247,0.08)]'
          : 'border-slate-200',
      ].join(' ')}
    >
      <div className="flex-shrink-0 text-[26px]">{icon}</div>
      <div className="flex-1">
        <div className="mb-0.5 text-[15px] font-bold text-navy">{title}</div>
        <div className="text-xs text-muted">{subtitle}</div>
      </div>
      <div
        className={[
          'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs transition-all',
          selected ? 'border-accent bg-accent text-white' : 'border-slate-300 text-transparent',
        ].join(' ')}
      >
        ✓
      </div>
    </div>
  )
}

export function OnboardProgress({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="mb-[34px] flex gap-1.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={[
            'h-1 flex-1 rounded-full transition-colors',
            i < step ? 'bg-accent' : i === step ? 'bg-gold' : 'bg-slate-200',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

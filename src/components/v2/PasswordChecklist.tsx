export interface PwRules {
  len: boolean
  num: boolean
  special: boolean
}

export function pwRules(pass: string): PwRules {
  return {
    len: pass.length >= 8,
    num: /[0-9]/.test(pass),
    special: /[^A-Za-z0-9]/.test(pass),
  }
}

export function isPasswordValid(pass: string): boolean {
  const r = pwRules(pass)
  return r.len && r.num && r.special
}

function Check({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      className={[
        'flex items-center gap-2.5 text-[13px] transition-colors',
        met ? 'text-v2-success' : 'text-v2-text2',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] text-[11px] transition-all',
          met
            ? 'scale-[1.08] border-v2-success bg-v2-success text-white'
            : 'border-v2-border bg-white text-transparent',
        ].join(' ')}
      >
        ✓
      </span>
      {label}
    </div>
  )
}

export function PasswordChecklist({ password }: { password: string }) {
  const r = pwRules(password)
  return (
    <div className="my-2.5 mb-4 flex flex-col gap-1.5">
      <Check met={r.len} label="8+ Characters" />
      <Check met={r.num} label="Number" />
      <Check met={r.special} label="Special Character" />
    </div>
  )
}

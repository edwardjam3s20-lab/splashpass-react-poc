export interface PwRules { len: boolean; num: boolean; special: boolean }

export function pwRules(pass: string): PwRules {
  return { len: pass.length >= 8, num: /[0-9]/.test(pass), special: /[^A-Za-z0-9]/.test(pass) }
}

export function isPasswordValid(pass: string): boolean {
  const r = pwRules(pass); return r.len && r.num && r.special
}

function Check({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] transition-colors"
      style={{ color: met ? '#30D158' : '#6E6E73' }}>
      <span className="flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-[1.5px] text-[10px] font-bold transition-all"
        style={{
          borderColor: met ? '#30D158' : '#EBEBED',
          background: met ? '#30D158' : '#fff',
          color: met ? '#fff' : 'transparent',
          transform: met ? 'scale(1.08)' : 'scale(1)',
        }}>
        ✓
      </span>
      {label}
    </div>
  )
}

export function PasswordChecklist({ password }: { password: string }) {
  const r = pwRules(password)
  return (
    <div className="my-2 mb-4 flex flex-col gap-2 rounded-[13px] p-3" style={{ background: '#F5F5F7' }}>
      <Check met={r.len} label="At least 8 characters" />
      <Check met={r.num} label="Contains a number" />
      <Check met={r.special} label="Special character (!@#...)" />
    </div>
  )
}

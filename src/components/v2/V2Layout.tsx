import type { ReactNode } from 'react'

export function V2Screen({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full overflow-y-auto" style={{ background: '#F5F5F7' }}>
      <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-1 flex-col px-5 pb-10 pt-5">
        {children}
      </div>
    </div>
  )
}

export function V2Logo() {
  return (
    <div className="sp-fade-up mb-7 flex items-center gap-2.5">
      <img
        src="/logo.png"
        alt="SplashPass"
        className="h-9 w-9 rounded-[11px]"
        style={{ boxShadow: '0 6px 16px rgba(10,132,255,0.3)' }}
      />
      <div className="text-[18px] font-extrabold text-ink" style={{ letterSpacing: '-0.4px' }}>SplashPass</div>
    </div>
  )
}

export function V2Spacer() {
  return <div className="flex-1" />
}

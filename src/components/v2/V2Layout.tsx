import type { ReactNode } from 'react'

export function V2Screen({ children }: { children: ReactNode }) {
  return (
    <div className="h-full w-full overflow-y-auto bg-v2-bg font-v2-body text-v2-text [&_h1]:font-v2-display [&_h2]:font-v2-display [&_h3]:font-v2-display">
      <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-1 flex-col px-6 pb-10 pt-6">
        {children}
      </div>
    </div>
  )
}

export function V2Logo() {
  return (
    <div className="v2-fade-up mb-8 flex items-center gap-2.5">
      <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-v2-primary font-v2-display text-[17px] font-extrabold text-white shadow-v2-logo">
        S
      </div>
      <div className="font-v2-display text-[19px] font-extrabold text-v2-text">SplashPass</div>
    </div>
  )
}

export function V2Spacer() {
  return <div className="flex-1" />
}

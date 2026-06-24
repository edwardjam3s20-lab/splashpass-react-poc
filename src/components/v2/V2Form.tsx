import { useState } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export function V2Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[13px] font-semibold text-v2-text">{label}</label>
      {children}
    </div>
  )
}

export function V2Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        'w-full rounded-[14px] border-[1.5px] border-v2-border bg-white px-4 py-3.5',
        'font-v2-body text-[15px] text-v2-text outline-none transition-colors',
        'placeholder:text-slate-300',
        'focus:border-v2-primary focus:shadow-[0_0_0_4px_var(--color-v2-subtle)]',
        props.className ?? '',
      ].join(' ')}
    />
  )
}

export function V2Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        'w-full rounded-[14px] border-[1.5px] border-v2-border bg-white px-4 py-3.5',
        'font-v2-body text-[15px] text-v2-text outline-none transition-colors',
        'focus:border-v2-primary focus:shadow-[0_0_0_4px_var(--color-v2-subtle)]',
        props.className ?? '',
      ].join(' ')}
    />
  )
}

export function V2FieldError({ children }: { children: ReactNode }) {
  if (!children) return null
  return <div className="mt-1.5 text-[13px] text-v2-error">{children}</div>
}

/** Password input with a built-in show/hide toggle, matching the original eye-icon button. */
export function V2PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <V2Input {...props} type={visible ? 'text' : 'password'} className="pr-12" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-1.5 top-1.5 bottom-1.5 flex w-10 items-center justify-center rounded-[10px] text-v2-text2 hover:bg-v2-subtle hover:text-v2-primary"
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 4.06-5.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <path d="M1 1l22 22" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  )
}

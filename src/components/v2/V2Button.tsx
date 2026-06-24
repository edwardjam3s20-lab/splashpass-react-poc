import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface V2ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-v2-primary text-white shadow-v2-btn hover:bg-v2-primary-hover hover:shadow-v2-btn-hover hover:-translate-y-px active:translate-y-0 active:scale-[0.98]',
  secondary:
    'bg-white text-v2-text border-[1.5px] border-v2-border hover:border-v2-primary hover:bg-v2-subtle hover:text-v2-primary active:scale-[0.98]',
  ghost: 'bg-transparent text-v2-text2 font-semibold p-2.5 hover:text-v2-primary',
}

export function V2Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...rest
}: V2ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={[
        'flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 font-v2-body text-base font-bold transition-all',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <span
          className={[
            'h-[18px] w-[18px] rounded-full border-[2.5px] animate-spin',
            variant === 'primary'
              ? 'border-white/40 border-t-white'
              : 'border-v2-primary/25 border-t-v2-primary',
          ].join(' ')}
        />
      ) : (
        children
      )}
    </button>
  )
}

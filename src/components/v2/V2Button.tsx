import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

interface V2ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  children: ReactNode
}

export function V2Button({ variant = 'primary', loading = false, disabled, children, className = '', ...rest }: V2ButtonProps) {
  const styles: Record<Variant, React.CSSProperties> = {
    primary: { background: '#0A84FF', color: '#fff', boxShadow: '0 8px 24px rgba(10,132,255,0.32)', border: 'none' },
    secondary: { background: '#fff', color: '#0D0D0D', border: '1.5px solid #EBEBED', boxShadow: 'none' },
    ghost: { background: 'transparent', color: '#6E6E73', border: 'none', boxShadow: 'none' },
  }
  return (
    <button type="button" disabled={disabled || loading}
      className={`sp-press flex w-full items-center justify-center gap-2 rounded-[16px] px-5 py-4 text-[15px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      style={styles[variant]}
      {...rest}>
      {loading ? (
        <span className="h-[18px] w-[18px] rounded-full border-[2.5px] animate-spin"
          style={{ borderColor: variant === 'primary' ? 'rgba(255,255,255,0.3)' : 'rgba(10,132,255,0.25)', borderTopColor: variant === 'primary' ? '#fff' : '#0A84FF' }} />
      ) : children}
    </button>
  )
}

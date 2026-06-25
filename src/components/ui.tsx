/**
 * SplashPass Shared UI Primitives
 * ================================
 * Design tokens: Primary #0A84FF, Teal #00C6BE, Gold #FFD60A,
 * Navy #0A1628, Surface-1 #F5F5F7, Surface-2 #EBEBED, Ink #0D0D0D
 */
import type { ReactNode } from 'react'

/* ── Pill / Badge ────────────────────────────────────── */
export function Pill({
  children, color = '#0A84FF', bg, size = 11,
}: { children: ReactNode; color?: string; bg?: string; size?: number }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: bg ?? color + '1A', color,
      borderRadius: 20, padding: '2px 9px',
      fontSize: size, fontWeight: 700, letterSpacing: 0.1, whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}

/* ── Card ─────────────────────────────────────────────── */
export function Card({
  children, style = {}, p = 18, className = '',
}: { children: ReactNode; style?: React.CSSProperties; p?: number; className?: string }) {
  return (
    <div className={`sp-card ${className}`} style={{ padding: p, ...style }}>
      {children}
    </div>
  )
}

/* ── Divider ──────────────────────────────────────────── */
export function Divider({ my = 14 }: { my?: number }) {
  return <div style={{ height: 1, background: '#EBEBED', margin: `${my}px 0` }} />
}

/* ── Avatar ───────────────────────────────────────────── */
export function Avatar({
  name = '?', size = 44, gradient = false,
}: { name?: string; size?: number; gradient?: boolean }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.35, flexShrink: 0,
      background: gradient
        ? 'linear-gradient(135deg, #00C6BE, #0A84FF)'
        : 'linear-gradient(135deg, #0A84FF, #0066CC)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.35, letterSpacing: -0.3,
    }}>{initials}</div>
  )
}

/* ── Primary Button ───────────────────────────────────── */
export function PrimaryBtn({
  children, onClick, disabled, loading, variant = 'primary', size = 'md', style = {},
}: {
  children: ReactNode; onClick?: () => void; disabled?: boolean
  loading?: boolean; variant?: 'primary' | 'teal' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'; style?: React.CSSProperties
}) {
  const sizeCls: Record<string, React.CSSProperties> = {
    sm: { padding: '9px 18px', fontSize: 13, borderRadius: 12 },
    md: { padding: '13px 22px', fontSize: 15, borderRadius: 15 },
    lg: { padding: '16px 24px', fontSize: 16, borderRadius: 16 },
  }
  const variantCls: Record<string, React.CSSProperties> = {
    primary: { background: '#0A84FF', color: '#fff', boxShadow: '0 8px 24px rgba(10,132,255,0.32)', border: 'none' },
    teal: { background: '#00C6BE', color: '#fff', boxShadow: '0 8px 24px rgba(0,198,190,0.32)', border: 'none' },
    ghost: { background: '#F5F5F7', color: '#0D0D0D', border: '1px solid #EBEBED', boxShadow: 'none' },
    outline: { background: 'transparent', color: '#0A84FF', border: '1.5px solid #0A84FF', boxShadow: 'none' },
    danger: { background: '#FF3B30', color: '#fff', boxShadow: '0 8px 24px rgba(255,59,48,0.28)', border: 'none' },
  }
  return (
    <button
      onClick={onClick} disabled={disabled || loading}
      className="sp-press"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'inherit', fontWeight: 700, letterSpacing: -0.2, cursor: disabled ? 'not-allowed' : 'pointer',
        width: '100%', opacity: disabled || loading ? 0.45 : 1,
        transition: 'opacity 0.15s, box-shadow 0.15s',
        ...sizeCls[size], ...variantCls[variant], ...style,
      }}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

/* ── Spinner ──────────────────────────────────────────── */
export function Spinner({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'v2Spin 0.7s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

/* ── Section header ───────────────────────────────────── */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: '#6E6E73',
      textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
    }}>{children}</div>
  )
}

/* ── CheckRow ─────────────────────────────────────────── */
export function CheckRow({ label, checked = true }: { label: string; checked?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <div style={{
        width: 18, height: 18, borderRadius: 9, flexShrink: 0,
        background: checked ? '#30D158' : '#EBEBED',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: '#fff', fontWeight: 800,
      }}>{checked ? '✓' : ''}</div>
      <span style={{ fontSize: 13, color: '#6E6E73' }}>{label}</span>
    </div>
  )
}

/* ── Step progress bar ────────────────────────────────── */
export function StepBar({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {steps.map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 13, flexShrink: 0,
              background: i < current ? '#30D158' : i === current ? '#0A84FF' : '#EBEBED',
              color: i <= current ? '#fff' : '#AEAEB2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 800, transition: 'all 0.3s ease',
            }}>
              {i < current ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 5px',
                background: i < current ? '#0A84FF' : '#EBEBED',
                transition: 'background 0.4s ease',
              }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            fontSize: 10, fontWeight: i === current ? 700 : 500,
            color: i <= current ? '#0A84FF' : '#AEAEB2',
            flex: 1,
            textAlign: i === 0 ? 'left' : i === steps.length - 1 ? 'right' : 'center',
          }}>{s}</div>
        ))}
      </div>
    </div>
  )
}

/* ── Skeleton block ───────────────────────────────────── */
export function Skeleton({ w = '100%', h = 18, r = 8 }: { w?: string | number; h?: number; r?: number }) {
  return <div className="sp-skeleton" style={{ width: w, height: h, borderRadius: r }} />
}

/* ── Empty state ──────────────────────────────────────── */
export function EmptyState({ icon, title, sub, action }: { icon: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#0D0D0D', marginBottom: 6 }}>{title}</div>
      {sub && <div style={{ fontSize: 14, color: '#6E6E73', marginBottom: 20, lineHeight: 1.5 }}>{sub}</div>}
      {action}
    </div>
  )
}

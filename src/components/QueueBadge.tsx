// components/QueueBadge.tsx
//
// Small live-status pill: "No wait", "1 ahead", "4 ahead" — driven by
// useLiveQueue/useLiveQueueCounts, which stays in sync with the operator
// app in real time.

const MIN_PER_CAR = 12 // rough average service time, used only for the estimate text

export function QueueBadge({
  count,
  loading,
  size = 'sm',
}: {
  count: number
  loading?: boolean
  size?: 'sm' | 'md'
}) {
  if (loading) {
    return (
      <span
        className="sp-skeleton"
        style={{ display: 'inline-block', width: 64, height: size === 'sm' ? 16 : 20, borderRadius: 20 }}
      />
    )
  }

  const busy = count >= 3
  const some = count > 0 && count < 3
  const color = busy ? '#B25A00' : some ? '#0A84FF' : '#1F8A41'
  const bg = busy ? 'rgba(255,159,10,0.12)' : some ? 'rgba(10,132,255,0.08)' : 'rgba(48,209,88,0.12)'
  const label = count === 0 ? 'No wait — book now' : `${count} ahead in queue`

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        borderRadius: 20,
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        fontSize: size === 'sm' ? 11 : 12,
        fontWeight: 700,
        color,
        background: bg,
        whiteSpace: 'nowrap',
      }}
      title={count > 0 ? `~${count * MIN_PER_CAR} min estimated wait` : undefined}
    >
      🚗 {label}
    </span>
  )
}

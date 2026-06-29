import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { getCarsByEmail } from '../lib/cars'
import { getTrialDaysLeft, isOnTrial } from '../lib/access'
import { getTier } from '../lib/loyalty'
import { getBookingsByEmail } from '../lib/bookings'
import { isBookingMissed } from '../lib/bookingCost'
import { fetchWalletStatus } from '../lib/wallet'
import type { Booking } from '../types/database'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function QuickAction({
  icon,
  label,
  sub,
  onClick,
  accent,
}: {
  icon: string
  label: string
  sub: string
  onClick: () => void
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="sp-press flex flex-1 flex-col items-start gap-2 rounded-[18px] p-4 text-left"
      style={{
        background: accent ? 'linear-gradient(135deg, #0A84FF, #0066CC)' : '#fff',
        border: accent ? 'none' : '1px solid #EBEBED',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      }}
    >
      <div
        className="flex h-9 w-9 items-center justify-center rounded-[11px] text-[17px]"
        style={{ background: accent ? 'rgba(255,255,255,0.18)' : '#F5F5F7' }}
      >
        {icon}
      </div>
      <div>
        <div className="text-[14px] font-extrabold" style={{ color: accent ? '#fff' : '#0D0D0D' }}>
          {label}
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: accent ? 'rgba(255,255,255,0.7)' : '#6E6E73' }}>
          {sub}
        </div>
      </div>
    </button>
  )
}

function statusBadge(b: Booking) {
  if (b.status === 'completed') return { label: 'Completed', bg: 'rgba(48,209,88,0.12)', color: '#1F8A41' }
  if (b.status === 'cancelled') return { label: 'Cancelled', bg: 'rgba(255,59,48,0.1)', color: '#FF3B30' }
  if (b.status === 'rejected') return { label: 'Declined', bg: 'rgba(255,59,48,0.1)', color: '#FF3B30' }
  if (b.status === 'pending') return { label: 'Pending', bg: 'rgba(255,159,10,0.12)', color: '#B25A00' }
  if (isBookingMissed(b.date, b.time, b.status)) {
    return { label: 'Missed', bg: 'rgba(174,174,178,0.18)', color: '#6E6E73' }
  }
  return { label: 'Upcoming', bg: 'rgba(10,132,255,0.1)', color: '#0A84FF' }
}

export function HomeScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const setUserCars = useAppStore((s) => s.setUserCars)
  const [recentBooking, setRecentBooking] = useState<Booking | null>(null)
  const [loadingBooking, setLoadingBooking] = useState(!!currentUser?.email)
  const [walletBalance, setWalletBalance] = useState<number | null>(currentUser?.wallet_balance ?? null)

  useEffect(() => {
    if (!currentUser?.email) return
    fetchWalletStatus().then((status) => {
      if (status) setWalletBalance(status.balance)
    })
  }, [currentUser])

  useEffect(() => {
    if (!currentUser) return
    getCarsByEmail(currentUser.email).then(setUserCars)
  }, [currentUser, setUserCars])

  useEffect(() => {
    if (!currentUser?.email) return
    getBookingsByEmail(currentUser.email)
      .then((bookings) => setRecentBooking(bookings[0] ?? null))
      .catch(() => setRecentBooking(null))
      .finally(() => setLoadingBooking(false))
  }, [currentUser])

  const name = currentUser?.name?.split(' ')[0] || 'there'
  const planName = currentUser?.sub_plan_name || (isOnTrial(currentUser) ? 'Free Trial' : 'No Plan')
  const trialDays = getTrialDaysLeft(currentUser)
  const onTrial = isOnTrial(currentUser)
  const pts = currentUser?.loyalty_points || 0
  const tier = getTier(pts)
  const isActive = currentUser?.sub_status === 'active'

  return (
    <div className="flex h-full flex-col" style={{ background: '#F5F5F7' }}>
      {/* ── Header ── */}
      <div className="bg-white px-5 pt-2 pb-4" style={{ boxShadow: '0 1px 0 #EBEBED' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[12px] text-muted font-medium mb-0.5">{greeting()} 👋</div>
            <div className="text-[20px] font-extrabold text-ink leading-tight" style={{ letterSpacing: '-0.5px' }}>
              {name}
            </div>
          </div>
          <div className="relative flex-shrink-0">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-[14px] text-white font-extrabold text-[15px]"
              style={{ background: 'linear-gradient(135deg, #00C6BE, #0A84FF)' }}
            >
              {(currentUser?.name || '?')[0].toUpperCase()}
            </div>
            <div
              className="absolute h-3 w-3 rounded-full border-2 border-white"
              style={{ background: '#30D158', bottom: '-2px', right: '-2px' }}
            />
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-[18px] p-4" style={{ background: 'linear-gradient(135deg, #1C2E4A, #0A1628)' }}>
          <div className="flex items-start justify-between">
            <div>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold mb-2"
                style={{
                  background: onTrial ? 'rgba(10,132,255,0.2)' : 'rgba(255,214,10,0.18)',
                  color: onTrial ? '#60B0FF' : '#FFD60A',
                }}
              >
                {onTrial ? '🎁 Free Trial' : isActive ? `✨ ${planName}` : '⚠️ Expired'}
              </span>
              <div className="text-[19px] font-extrabold text-white leading-tight" style={{ letterSpacing: '-0.4px' }}>
                {onTrial
                  ? `${trialDays} days left`
                  : isActive
                  ? `${currentUser?.sub_car_limit || 1} car${(currentUser?.sub_car_limit || 1) > 1 ? 's' : ''} covered`
                  : 'Subscribe now'}
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-4">
              <div className="text-[26px] font-extrabold leading-none" style={{ color: '#FFD60A', letterSpacing: '-1px' }}>
                {pts.toLocaleString()}
              </div>
              <div className="text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Points
              </div>
              <span
                className="inline-flex items-center gap-1 mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: 'rgba(255,214,10,0.15)', color: '#FFD60A' }}
              >
                {tier.icon} {tier.name}
              </span>
            </div>
          </div>

          {onTrial && (
            <button
              onClick={() => navigate('/plans')}
              className="mt-3 w-full rounded-[11px] py-2 text-[13px] font-bold"
              style={{ background: '#0A84FF', color: '#fff' }}
            >
              Upgrade — Remove fee →
            </button>
          )}
        </div>

        {/* Wallet card */}
        <div
          onClick={() => navigate('/wallet')}
          className="sp-press mt-3 flex cursor-pointer items-center gap-3 rounded-[16px] p-3.5"
          style={{ background: '#fff', border: '1px solid #EBEBED', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] text-lg"
            style={{ background: '#E0FAF9' }}
          >
            👛
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-muted">Wallet Balance</div>
            <div className="text-[18px] font-extrabold text-ink leading-tight" style={{ letterSpacing: '-0.3px' }}>
              {walletBalance == null ? (
                <span className="sp-skeleton inline-block h-5 w-20 rounded" />
              ) : (
                `KSh ${walletBalance.toLocaleString()}`
              )}
            </div>
          </div>
          <div
            className="flex-shrink-0 rounded-[10px] px-3 py-1.5 text-[12px] font-bold text-white"
            style={{ background: '#0A84FF' }}
          >
            Top Up
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-3">
        {/* ── Quick actions ── */}
        <div className="flex gap-2.5 mb-4">
          <QuickAction
            icon="🔍"
            label="Find a wash"
            sub="Browse nearby points"
            onClick={() => navigate('/discover')}
            accent
          />
          <QuickAction
            icon="🧾"
            label="My Bookings"
            sub="View history"
            onClick={() => navigate('/bookings')}
          />
        </div>

        {/* ── Most recent booking ── */}
        <div className="text-[13px] font-bold text-ink mb-2.5" style={{ letterSpacing: '-0.2px' }}>
          Recent Activity
        </div>

        {loadingBooking ? (
          <div className="rounded-[16px] bg-white p-3.5" style={{ border: '1px solid #EBEBED' }}>
            <div className="sp-skeleton h-4 w-40 mb-2 rounded" />
            <div className="sp-skeleton h-3 w-24 rounded" />
          </div>
        ) : recentBooking ? (
          <div
            onClick={() => navigate('/bookings')}
            className="sp-press cursor-pointer rounded-[16px] bg-white p-3.5"
            style={{ border: '1px solid #EBEBED', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[14px] font-bold text-ink truncate">{recentBooking.location}</span>
              {(() => {
                const b = statusBadge(recentBooking)
                return (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: b.bg, color: b.color }}
                  >
                    {b.label}
                  </span>
                )
              })()}
            </div>
            <div className="text-[12px] text-muted">
              {recentBooking.date} · {recentBooking.time} · {recentBooking.service_name}
            </div>
          </div>
        ) : (
          <div
            className="rounded-[16px] bg-white p-5 text-center"
            style={{ border: '1px solid #EBEBED' }}
          >
            <div className="text-3xl mb-2">🚗</div>
            <div className="text-[14px] font-bold text-ink mb-1">No bookings yet</div>
            <div className="text-[12px] text-muted mb-3">Find a wash point to get started</div>
            <button
              onClick={() => navigate('/discover')}
              className="sp-press rounded-[11px] px-4 py-2 text-[13px] font-bold text-white"
              style={{ background: '#0A84FF' }}
            >
              Browse Wash Points
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

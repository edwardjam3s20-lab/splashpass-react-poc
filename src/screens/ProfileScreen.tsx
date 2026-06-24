import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { getCarsByEmail, deleteCarRow } from '../lib/cars'
import { getTrialDaysLeft, isOnTrial } from '../lib/access'

function carEmoji(carType: string) {
  if (carType === 'SUV') return '🚙'
  if (carType === 'Pickup') return '🛻'
  return '🚗'
}

export function ProfileScreen() {
  const navigate = useNavigate()
  const currentUser = useAppStore((s) => s.currentUser)
  const userCars = useAppStore((s) => s.userCars)
  const setUserCars = useAppStore((s) => s.setUserCars)
  const logout = useAppStore((s) => s.logout)
  const showToast = useAppStore((s) => s.showToast)

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) return
    getCarsByEmail(currentUser.email).then(setUserCars)
  }, [currentUser, setUserCars])

  if (!currentUser) return null

  const initials = (currentUser.name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  const carLimit = currentUser.sub_car_limit || 1
  const atCarLimit = userCars.length >= carLimit

  let statusLabel = 'Expired'
  let statusColor = 'text-danger'
  if (currentUser.sub_status === 'active') {
    statusLabel = 'Active'
    statusColor = 'text-success'
  } else if (isOnTrial(currentUser)) {
    statusLabel = `Free trial · ${getTrialDaysLeft(currentUser)} days left`
    statusColor = 'text-accent'
  }

  let renewLabel = '—'
  if (currentUser.sub_status === 'active' && currentUser.sub_start) {
    const rd = new Date(currentUser.sub_start)
    rd.setDate(rd.getDate() + 30)
    renewLabel = rd.toLocaleDateString('en-KE')
  }

  async function handleDeleteCar(carId: string) {
    try {
      await deleteCarRow(carId)
      setUserCars(userCars.filter((c) => String(c.id) !== String(carId)))
      showToast('Car removed.')
    } catch (e) {
      showToast(e instanceof Error ? `Could not remove car: ${e.message}` : 'Could not remove car.', true)
    } finally {
      setConfirmDeleteId(null)
    }
  }

  function handleLogout() {
    logout()
    navigate('/welcome')
  }

  return (
    <div className="bg-bg px-5 pt-6 pb-6">
      <h2 className="mb-5 text-xl font-bold text-navy">Account</h2>

      {/* Avatar row */}
      <div className="mb-3.5 flex items-center gap-4 rounded-[22px] bg-gradient-to-br from-navy-2 to-navy px-5 py-5 shadow-app-md">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-2 to-gold font-display text-xl font-extrabold text-white shadow-[0_4px_14px_rgba(245,166,35,0.3)]">
          {initials}
        </div>
        <div>
          <div className="text-lg font-extrabold text-white">{currentUser.name || '—'}</div>
          <div className="mt-0.5 text-[13px] text-white/55">{currentUser.email}</div>
          <div className="mt-px text-xs text-white/45">{currentUser.phone || '—'}</div>
        </div>
      </div>

      {/* Subscription */}
      <div className="mb-3 rounded-2xl border-[1.5px] border-slate-200 bg-white px-5 py-4.5 shadow-app">
        <div className="mb-3.5 text-[11px] font-bold uppercase tracking-wide text-muted">
          Subscription
        </div>
        <ProfileRow label="Plan" value={currentUser.sub_plan_name || (isOnTrial(currentUser) ? 'Trial' : 'None')} />
        <ProfileRow label="Status" value={statusLabel} valueClassName={statusColor} />
        <ProfileRow label="Cars allowed" value={`${carLimit} car${carLimit > 1 ? 's' : ''}`} />
        <ProfileRow label="Renews / Expires" value={renewLabel} last />
        <button
          type="button"
          onClick={() => navigate('/plans')}
          className="mt-3.5 w-full rounded-xl border-[1.5px] border-slate-200 py-2.5 text-[13px] font-bold text-navy"
        >
          Change Plan
        </button>
      </div>

      {/* My Cars */}
      <div className="mb-3 rounded-2xl border-[1.5px] border-slate-200 bg-white px-5 py-4.5 shadow-app">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted">My Cars</div>
          {!atCarLimit && (
            <button
              type="button"
              onClick={() => navigate('/add-car')}
              className="rounded-lg border-[1.5px] border-slate-200 px-4 py-1.5 text-xs font-bold text-navy"
            >
              + Add Car
            </button>
          )}
        </div>

        {userCars.length === 0 ? (
          <div className="py-3.5 text-center text-sm text-muted">No cars yet</div>
        ) : (
          userCars.map((car) => (
            <div key={car.id} className="flex items-center gap-3.5 border-b border-surface-2 py-3.5 last:border-0">
              <div className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-lg">
                {carEmoji(car.car_type)}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-navy">
                  {car.make} {car.model || '—'}
                </div>
                <div className="mt-0.5 text-xs font-bold text-accent">{car.plate || '—'}</div>
                <div className="text-[11px] text-muted">
                  {car.car_type}
                  {car.colour ? ` · ${car.colour}` : ''}
                </div>
              </div>
              {confirmDeleteId === car.id ? (
                <div className="flex flex-shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteCar(car.id)}
                    className="rounded-lg bg-danger px-2.5 py-1.5 text-[11px] font-bold text-white"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-muted"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(car.id)}
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-danger/10 text-[15px]"
                  aria-label="Remove car"
                >
                  🗑️
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Settings menu */}
      <div className="rounded-2xl border-[1.5px] border-slate-200 bg-white px-5 py-4.5 shadow-app">
        <div className="mb-3.5 text-[11px] font-bold uppercase tracking-wide text-muted">Settings</div>

        <MenuRow icon="💳" label="Subscription" onClick={() => navigate('/plans')} />
        <MenuRow icon="🔒" label="Change Password" onClick={() => navigate('/change-password')} />
        <MenuRow icon="🚪" label="Log Out" danger onClick={handleLogout} />
        <MenuRow icon="🗑️" label="Delete Account" danger last onClick={() => navigate('/delete-account')} />
      </div>
    </div>
  )
}

function ProfileRow({
  label,
  value,
  valueClassName,
  last,
}: {
  label: string
  value: string
  valueClassName?: string
  last?: boolean
}) {
  return (
    <div className={['flex items-center justify-between py-2.5 text-sm', last ? '' : 'border-b border-surface-2'].join(' ')}>
      <span className="text-[13px] text-muted">{label}</span>
      <strong className={valueClassName ?? 'text-navy'}>{value}</strong>
    </div>
  )
}

function MenuRow({
  icon,
  label,
  onClick,
  danger,
  last,
}: {
  icon: string
  label: string
  onClick: () => void
  danger?: boolean
  last?: boolean
}) {
  return (
    <div
      onClick={onClick}
      className={[
        'flex cursor-pointer items-center justify-between py-3.5',
        last ? '' : 'border-b border-surface-2',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <div
          className={[
            'flex h-9 w-9 items-center justify-center rounded-xl text-base',
            danger ? 'bg-danger/10' : 'bg-surface-3',
          ].join(' ')}
        >
          {icon}
        </div>
        <div className={['text-[15px] font-medium', danger ? 'text-danger' : 'text-navy'].join(' ')}>
          {label}
        </div>
      </div>
      <div className={['text-base', danger ? 'text-danger' : 'text-muted-2'].join(' ')}>›</div>
    </div>
  )
}

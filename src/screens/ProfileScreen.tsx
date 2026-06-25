import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { getCarsByEmail, deleteCarRow } from '../lib/cars'
import { getTrialDaysLeft, isOnTrial } from '../lib/access'
import { getTier } from '../lib/loyalty'

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

  const initials = (currentUser.name || '?').split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase()
  const carLimit = currentUser.sub_car_limit || 1
  const atCarLimit = userCars.length >= carLimit
  const pts = currentUser.loyalty_points || 0
  const tier = getTier(pts)
  const onTrial = isOnTrial(currentUser)
  const trialDays = getTrialDaysLeft(currentUser)
  const isActive = currentUser.sub_status === 'active'

  let statusLabel = 'Expired'
  let statusColor = '#FF3B30'
  if (isActive) { statusLabel = 'Active'; statusColor = '#30D158' }
  else if (onTrial) { statusLabel = `Free trial · ${trialDays} days left`; statusColor = '#0A84FF' }

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

  const menuSections = [
    {
      title: 'Subscription',
      items: [
        { icon: '💳', label: currentUser.sub_plan_name || (onTrial ? 'Trial' : 'No Plan'), sub: statusLabel, subColor: statusColor, action: () => navigate('/plans') },
        { icon: '📊', label: 'Change Plan', sub: 'View all plans', action: () => navigate('/plans') },
      ],
    },
    {
      title: 'Rewards',
      items: [
        { icon: '🏆', label: `${tier.icon} ${tier.name} Tier`, sub: `${pts.toLocaleString()} points`, action: () => navigate('/loyalty') },
      ],
    },
    {
      title: 'Account',
      items: [
        { icon: '🔒', label: 'Change Password', sub: '', action: () => navigate('/change-password') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: '❓', label: 'Help & Support', sub: '', action: () => {} },
        { icon: '📤', label: 'Refer a Friend', sub: 'Earn 50 pts per referral', action: () => showToast('Referral coming soon!') },
      ],
    },
  ]

  return (
    <div style={{ background: '#F5F5F7', minHeight: '100%', paddingBottom: 100 }}>
      {/* ── Profile hero ── */}
      <div
        className="px-5 pt-4 pb-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #1C2E4A, #0A1628)' }}
      >
        <div style={{ position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: 90, background: '#00C6BE', opacity: 0.06, pointerEvents: 'none' }} />

        <div className="text-[20px] font-extrabold text-white mb-4" style={{ letterSpacing: '-0.4px' }}>Account</div>

        <div className="flex items-center gap-3.5">
          <div className="relative flex-shrink-0">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-[18px] text-white font-extrabold text-[20px]"
              style={{ background: 'linear-gradient(135deg, #00C6BE, #0A84FF)' }}
            >
              {initials}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2"
              style={{ background: '#30D158', borderColor: '#1C2E4A' }} />
          </div>
          <div>
            <div className="text-[18px] font-extrabold text-white" style={{ letterSpacing: '-0.3px' }}>
              {currentUser.name || '—'}
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {currentUser.email}
            </div>
            <div className="flex gap-2 mt-2">
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{ background: 'rgba(255,214,10,0.18)', color: '#FFD60A' }}>
                {tier.icon} {tier.name}
              </span>
              {(onTrial || isActive) && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                  style={{ background: 'rgba(10,132,255,0.2)', color: '#60B0FF' }}>
                  {onTrial ? `Trial · ${trialDays}d` : currentUser.sub_plan_name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex mt-5 rounded-[16px] overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          {[
            { label: 'Total Washes', value: '—' },
            { label: 'Points', value: pts.toLocaleString() },
            { label: 'Cars', value: String(userCars.length) },
          ].map((s, i) => (
            <div key={i} className="flex-1 py-3.5 text-center"
              style={{ borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
              <div className="text-[20px] font-extrabold text-white" style={{ letterSpacing: '-0.5px' }}>{s.value}</div>
              <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* ── My Cars ── */}
        <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-2">My Vehicles</div>
        <div className="rounded-[18px] bg-white overflow-hidden mb-3"
          style={{ border: '1px solid #EBEBED', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {userCars.length === 0 ? (
            <div className="py-6 text-center">
              <div className="text-3xl mb-2">🚗</div>
              <div className="text-[14px] font-bold text-ink mb-1">No vehicles added</div>
              <div className="text-[12px] text-muted mb-3">Add a car to start booking</div>
              <button onClick={() => navigate('/add-car')}
                className="sp-press rounded-[11px] px-4 py-2 text-[13px] font-bold text-white"
                style={{ background: '#0A84FF' }}>
                Add Vehicle
              </button>
            </div>
          ) : (
            <>
              {userCars.map((car, i) => (
                <div key={car.id} className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottom: i < userCars.length - 1 ? '1px solid #EBEBED' : 'none' }}>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] text-lg"
                    style={{ background: 'rgba(10,132,255,0.09)' }}>
                    {carEmoji(car.car_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-ink">{car.make} {car.model || '—'}</div>
                    <div className="text-[12px] font-bold mt-0.5" style={{ color: '#0A84FF' }}>{car.plate || '—'}</div>
                    <div className="text-[11px] text-muted mt-0.5">{car.car_type}{car.colour ? ` · ${car.colour}` : ''}</div>
                  </div>
                  {confirmDeleteId === car.id ? (
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => handleDeleteCar(car.id)}
                        className="rounded-[9px] px-2.5 py-1.5 text-[11px] font-bold text-white"
                        style={{ background: '#FF3B30' }}>
                        Remove
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="rounded-[9px] px-2.5 py-1.5 text-[11px] font-bold text-muted"
                        style={{ background: '#F5F5F7', border: '1px solid #EBEBED' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDeleteId(car.id)}
                      className="sp-press flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px]"
                      style={{ background: '#FFF0EE' }}>
                      🗑️
                    </button>
                  )}
                </div>
              ))}
              {!atCarLimit && (
                <div onClick={() => navigate('/add-car')}
                  className="sp-press cursor-pointer flex items-center gap-3 px-4 py-3.5"
                  style={{ borderTop: '1px solid #EBEBED' }}>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] text-[20px] font-bold"
                    style={{ background: 'rgba(10,132,255,0.08)', color: '#0A84FF', border: '1.5px dashed rgba(10,132,255,0.3)' }}>
                    +
                  </div>
                  <div>
                    <div className="text-[14px] font-bold" style={{ color: '#0A84FF' }}>Add Vehicle</div>
                    <div className="text-[11px] text-muted">{userCars.length} of {carLimit} slots used</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Menu sections ── */}
        {menuSections.map((section) => (
          <div key={section.title} className="mb-3">
            <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-2">
              {section.title}
            </div>
            <div className="rounded-[18px] bg-white overflow-hidden"
              style={{ border: '1px solid #EBEBED', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              {section.items.map((item, i) => (
                <div key={item.label}
                  onClick={item.action}
                  className="sp-press cursor-pointer flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottom: i < section.items.length - 1 ? '1px solid #EBEBED' : 'none' }}>
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[11px] text-base"
                    style={{ background: '#F5F5F7' }}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold text-ink">{item.label}</div>
                    {item.sub && (
                      <div className="text-[12px] mt-0.5" style={{ color: (item as any).subColor || '#6E6E73' }}>
                        {item.sub}
                      </div>
                    )}
                  </div>
                  <span className="text-[18px] text-muted-light">›</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Danger zone */}
        <div className="rounded-[18px] bg-white overflow-hidden mb-4"
          style={{ border: '1px solid #EBEBED', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {[
            { icon: '🚪', label: 'Sign Out', action: handleLogout },
            { icon: '🗑️', label: 'Delete Account', action: () => navigate('/delete-account') },
          ].map((item, i) => (
            <div key={item.label}
              onClick={item.action}
              className="sp-press cursor-pointer flex items-center gap-3 px-4 py-3.5"
              style={{ borderBottom: i === 0 ? '1px solid #EBEBED' : 'none' }}>
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[11px] text-base"
                style={{ background: '#FFF0EE' }}>
                {item.icon}
              </div>
              <div className="flex-1 text-[14px] font-semibold" style={{ color: '#FF3B30' }}>{item.label}</div>
              <span className="text-[18px]" style={{ color: '#FF3B30' }}>›</span>
            </div>
          ))}
        </div>

        <div className="text-center text-[12px] text-muted pb-2">
          SplashPass v2.0 · Made with 💧 in Mombasa
        </div>
      </div>
    </div>
  )
}

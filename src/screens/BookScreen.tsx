import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../store/useAppStore'
import { useWashPoints } from '../hooks/useWashPoints'
import { useFullSlots } from '../hooks/useFullSlots'
import { calculateBookingCost, SLOTS } from '../lib/bookingCost'
import { createBooking, splitWashPrice } from '../lib/bookings'
import { isOnTrial, hasActiveAccess } from '../lib/access'
import { StepBar } from '../components/ui'

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function BookScreen() {
  const { pointId } = useParams<{ pointId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const currentUser = useAppStore((s) => s.currentUser)
  const userCars = useAppStore((s) => s.userCars)
  const bookingCar = useAppStore((s) => s.bookingCar)
  const setBookingCar = useAppStore((s) => s.setBookingCar)
  const bookingService = useAppStore((s) => s.bookingService)
  const setBookingService = useAppStore((s) => s.setBookingService)
  const bookingSlot = useAppStore((s) => s.bookingSlot)
  const setBookingSlot = useAppStore((s) => s.setBookingSlot)
  const setPendingBooking = useAppStore((s) => s.setPendingBooking)
  const showToast = useAppStore((s) => s.showToast)

  const { data: washPoints } = useWashPoints()
  const point = washPoints?.find((p) => String(p.id) === String(pointId))

  const [step, setStep] = useState(0) // 0 = service, 1 = date/time, 2 = review
  const [date, setDate] = useState(todayISO())
  const [submitting, setSubmitting] = useState(false)

  const { fullSlots, isLoading: slotsLoading } = useFullSlots(date, point?.name)

  useEffect(() => {
    if (!hasActiveAccess(currentUser)) navigate('/sub-wall', { replace: true })
  }, [currentUser, navigate])

  useEffect(() => {
    if (!bookingCar && userCars.length > 0) setBookingCar(userCars[0])
  }, [bookingCar, userCars, setBookingCar])

  if (!point) {
    return (
      <div className="flex h-full items-center justify-center bg-surface-1">
        <div className="text-center">
          <div className="sp-skeleton h-8 w-48 rounded mb-3 mx-auto" />
          <div className="sp-skeleton h-4 w-32 rounded mx-auto" />
        </div>
      </div>
    )
  }

  const cost = calculateBookingCost(bookingService, currentUser)
  const onTrial = isOnTrial(currentUser)

  // Steps validation
  function canAdvance() {
    if (step === 0) return !!bookingService && !!bookingCar
    if (step === 1) return !!bookingSlot
    return true
  }

  async function handleConfirm() {
    if (!bookingCar) return showToast('Please select a car.', true)
    if (!bookingService) return showToast('Please select a service.', true)
    if (!bookingSlot) return showToast('Please select a time slot.', true)
    if (!currentUser || !point) return

    setSubmitting(true)
    try {
      const split = splitWashPrice(cost.washPrice, point.commission_tier)
      const code = 'SP' + Math.random().toString(36).substring(2, 8).toUpperCase()
      const booking = await createBooking({
        user_email: currentUser.email,
        user_name: currentUser.name,
        date,
        time: bookingSlot,
        location: point.name,
        status: 'confirmed',
        car_plate: bookingCar.plate,
        car_type: bookingCar.car_type,
        car_make: bookingCar.make,
        car_model: bookingCar.model,
        service_name: bookingService.name,
        wash_price: cost.washPrice,
        app_fee: cost.appFee,
        total_amount: cost.total,
        operator_amount: split.operatorAmount,
        splash_commission: split.platformAmount,
        commission_tier: split.tier,
        booking_type: onTrial ? 'trial' : 'subscription',
        booking_code: code,
      })
      setPendingBooking({ booking, code, date })
      queryClient.invalidateQueries({ queryKey: ['bookings-by-date', date] })
      navigate('/mpesa/booking')
    } catch (e) {
      showToast(e instanceof Error ? `Booking failed: ${e.message}` : 'Booking failed.', true)
    } finally {
      setSubmitting(false)
    }
  }

  const steps = ['Service', 'Date & Time', 'Confirm']

  // Group slots into AM/PM
  const amSlots = SLOTS.filter((s) => s.includes('AM'))
  const pmSlots = SLOTS.filter((s) => s.includes('PM'))

  return (
    <div className="flex h-full flex-col" style={{ background: '#F5F5F7' }}>
      {/* Header */}
      <div className="bg-white px-4 pt-3 pb-4" style={{ boxShadow: '0 1px 0 #EBEBED' }}>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => (step > 0 ? setStep(step - 1) : navigate('/discover'))}
            className="sp-press flex h-9 w-9 items-center justify-center rounded-[11px] text-lg text-ink"
            style={{ background: '#F5F5F7' }}
          >
            ←
          </button>
          <div>
            <div className="text-[16px] font-extrabold text-ink" style={{ letterSpacing: '-0.3px' }}>
              {point.name}
            </div>
            <div className="text-[12px] text-muted">{point.area}</div>
          </div>
        </div>
        <StepBar steps={steps} current={step} />
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">

        {/* ── Step 0: Service + Car ── */}
        {step === 0 && (
          <div className="sp-fade-up">
            {/* Car selector */}
            {userCars.length > 0 && (
              <>
                <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-2.5">
                  Your Car
                </div>
                {userCars.length === 1 ? (
                  <div
                    className="flex items-center gap-3 rounded-[14px] bg-white p-3.5 mb-4"
                    style={{ border: '1.5px solid #0A84FF', boxShadow: '0 2px 8px rgba(10,132,255,0.12)' }}
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[12px] text-lg"
                      style={{ background: 'rgba(10,132,255,0.1)' }}
                    >
                      🚗
                    </div>
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-ink">
                        {bookingCar?.make} {bookingCar?.model}
                      </div>
                      <div className="text-[12px] font-bold" style={{ color: '#0A84FF' }}>
                        {bookingCar?.plate}
                      </div>
                    </div>
                    <div
                      className="h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ background: '#0A84FF' }}
                    >
                      ✓
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {userCars.map((car) => {
                      const sel = String(bookingCar?.id) === String(car.id)
                      return (
                        <div
                          key={car.id}
                          onClick={() => setBookingCar(car)}
                          className="sp-press flex-shrink-0 cursor-pointer rounded-[14px] p-3 w-[130px]"
                          style={{
                            background: sel ? 'rgba(10,132,255,0.06)' : '#fff',
                            border: `1.5px solid ${sel ? '#0A84FF' : '#EBEBED'}`,
                          }}
                        >
                          <div className="text-lg mb-1">🚗</div>
                          <div className="text-[12px] font-bold text-ink leading-tight">{car.make} {car.model}</div>
                          <div className="text-[11px] font-bold mt-0.5" style={{ color: '#0A84FF' }}>{car.plate}</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            {userCars.length === 0 && (
              <div
                onClick={() => navigate('/profile')}
                className="sp-press cursor-pointer rounded-[14px] p-4 mb-4 text-center"
                style={{ background: '#FFF0EE', border: '1.5px dashed #FF3B30' }}
              >
                <div className="text-[14px] font-bold text-ink mb-1">No cars added yet</div>
                <div className="text-[12px]" style={{ color: '#0A84FF' }}>Add a car in Profile →</div>
              </div>
            )}

            {/* Service selector */}
            <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-2.5">
              Select Service
            </div>
            {point.services.length === 0 ? (
              <div className="text-[13px] text-muted py-4 text-center">
                No services listed — ask at the wash point.
              </div>
            ) : (
              point.services.map((s, i) => {
                const sel = bookingService?.id === s.id
                return (
                  <div
                    key={s.id}
                    onClick={() => setBookingService(s)}
                    className="sp-press cursor-pointer rounded-[15px] bg-white p-4 mb-2.5"
                    style={{
                      border: `2px solid ${sel ? '#0A84FF' : '#EBEBED'}`,
                      boxShadow: sel ? '0 4px 16px rgba(10,132,255,0.14)' : 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[13px] text-xl"
                        style={{ background: sel ? 'rgba(10,132,255,0.1)' : '#F5F5F7' }}
                      >
                        {i === 0 ? '🚿' : i === 1 ? '✨' : '💎'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[14px] font-bold text-ink">{s.name}</span>
                          {i === 1 && (
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                              style={{ background: 'rgba(10,132,255,0.1)', color: '#0A84FF' }}
                            >
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-muted">
                          {i === 0 ? 'Exterior hand wash' : i === 1 ? 'Exterior + interior' : 'Full service + wax'}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className="text-[16px] font-extrabold"
                          style={{ color: sel ? '#0A84FF' : '#0D0D0D', letterSpacing: '-0.3px' }}
                        >
                          KSh {Number(s.price).toLocaleString()}
                        </div>
                        {sel && (
                          <div
                            className="h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white ml-auto mt-1"
                            style={{ background: '#0A84FF' }}
                          >
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ── Step 1: Date + Time ── */}
        {step === 1 && (
          <div className="sp-fade-up">
            {/* Date picker */}
            <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-2.5">
              Select Date
            </div>
            <div
              className="rounded-[14px] bg-white p-3 mb-5"
              style={{ border: '1.5px solid #EBEBED' }}
            >
              <input
                type="date"
                min={todayISO()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-[15px] font-bold text-ink outline-none bg-transparent"
              />
            </div>

            {/* Time slots */}
            <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-2.5">
              Morning
            </div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {slotsLoading
                ? Array(4).fill(0).map((_, i) => (
                    <div key={i} className="sp-skeleton h-[52px] rounded-[12px]" />
                  ))
                : amSlots.map((sl) => {
                    const full = fullSlots.has(sl)
                    const sel = bookingSlot === sl
                    return (
                      <div
                        key={sl}
                        onClick={() => !full && setBookingSlot(sl)}
                        className="sp-press cursor-pointer rounded-[12px] py-3 text-center"
                        style={{
                          background: sel ? '#0A84FF' : full ? '#F5F5F7' : '#fff',
                          border: `1.5px solid ${sel ? '#0A84FF' : '#EBEBED'}`,
                          opacity: full ? 0.4 : 1,
                          cursor: full ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div
                          className="text-[13px] font-bold"
                          style={{ color: sel ? '#fff' : full ? '#AEAEB2' : '#0D0D0D' }}
                        >
                          {sl}
                        </div>
                      </div>
                    )
                  })}
            </div>

            <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-2.5">
              Afternoon
            </div>
            <div className="grid grid-cols-4 gap-2">
              {slotsLoading
                ? Array(4).fill(0).map((_, i) => (
                    <div key={i} className="sp-skeleton h-[52px] rounded-[12px]" />
                  ))
                : pmSlots.map((sl) => {
                    const full = fullSlots.has(sl)
                    const sel = bookingSlot === sl
                    return (
                      <div
                        key={sl}
                        onClick={() => !full && setBookingSlot(sl)}
                        className="sp-press cursor-pointer rounded-[12px] py-3 text-center"
                        style={{
                          background: sel ? '#0A84FF' : full ? '#F5F5F7' : '#fff',
                          border: `1.5px solid ${sel ? '#0A84FF' : '#EBEBED'}`,
                          opacity: full ? 0.4 : 1,
                          cursor: full ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div
                          className="text-[13px] font-bold"
                          style={{ color: sel ? '#fff' : full ? '#AEAEB2' : '#0D0D0D' }}
                        >
                          {sl}
                        </div>
                      </div>
                    )
                  })}
            </div>
          </div>
        )}

        {/* ── Step 2: Review ── */}
        {step === 2 && (
          <div className="sp-fade-up">
            {/* Summary card */}
            <div
              className="rounded-[18px] bg-white p-5 mb-3"
              style={{ border: '1px solid #EBEBED', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
            >
              <div className="text-[11px] font-bold text-muted uppercase tracking-[0.6px] mb-4">
                Order Summary
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[13px] text-xl"
                  style={{ background: '#E0FAF9' }}
                >
                  💧
                </div>
                <div>
                  <div className="text-[15px] font-bold text-ink">{point.name}</div>
                  <div className="text-[12px] text-muted">{bookingService?.name || '—'}</div>
                </div>
              </div>

              <div style={{ height: 1, background: '#EBEBED', margin: '0 0 12px' }} />

              {[
                { label: 'Date', value: date },
                { label: 'Time', value: bookingSlot || '—' },
                { label: 'Car', value: bookingCar ? `${bookingCar.make} ${bookingCar.model} · ${bookingCar.plate}` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1.5">
                  <span className="text-[13px] text-muted">{label}</span>
                  <span className="text-[13px] font-semibold text-ink">{value}</span>
                </div>
              ))}

              <div style={{ height: 1, background: '#EBEBED', margin: '12px 0' }} />

              {[
                { label: 'Service', value: cost.washPrice > 0 ? `KSh ${cost.washPrice.toLocaleString()}` : '—' },
                ...(onTrial && cost.washPrice > 0 ? [{ label: 'Trial fee', value: 'KSh 30' }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1">
                  <span className="text-[13px] text-muted">{label}</span>
                  <span className="text-[13px] text-ink">{value}</span>
                </div>
              ))}

              <div className="flex justify-between pt-3 mt-2" style={{ borderTop: '1px solid #EBEBED' }}>
                <span className="text-[15px] font-extrabold text-ink">Total</span>
                <span
                  className="text-[19px] font-extrabold"
                  style={{ color: '#0A84FF', letterSpacing: '-0.5px' }}
                >
                  {cost.total ? `KSh ${cost.total.toLocaleString()}` : '—'}
                </span>
              </div>
            </div>

            {/* M-Pesa notice */}
            <div
              className="flex items-center gap-3 rounded-[14px] p-4"
              style={{ background: '#E0FAF9' }}
            >
              <span className="text-xl flex-shrink-0">📱</span>
              <span className="text-[13px] font-medium" style={{ color: '#0A2820' }}>
                M-Pesa STK push will be sent to{' '}
                <strong>{currentUser?.phone || 'your phone'}</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky CTA ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-6"
        style={{
          background: 'rgba(245,245,247,0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid #EBEBED',
        }}
      >
        <button
          onClick={() => {
            if (!canAdvance()) {
              if (step === 0) showToast('Please select a car and service.', true)
              if (step === 1) showToast('Please select a time slot.', true)
              return
            }
            if (step < 2) setStep(step + 1)
            else handleConfirm()
          }}
          disabled={submitting}
          className="sp-press w-full rounded-[16px] py-[15px] text-[15px] font-extrabold text-white"
          style={{
            background: step === 2 ? '#00C6BE' : '#0A84FF',
            boxShadow: step === 2 ? '0 8px 24px rgba(0,198,190,0.36)' : '0 8px 24px rgba(10,132,255,0.36)',
            opacity: submitting ? 0.5 : 1,
            letterSpacing: '-0.2px',
          }}
        >
          {submitting
            ? 'Please wait…'
            : step === 0
            ? 'Choose Date & Time →'
            : step === 1
            ? 'Review Booking →'
            : 'Confirm & Pay via M-Pesa →'}
        </button>
      </div>
    </div>
  )
}

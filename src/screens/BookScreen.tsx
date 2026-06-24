import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '../store/useAppStore'
import { useWashPoints } from '../hooks/useWashPoints'
import { useFullSlots } from '../hooks/useFullSlots'
import { CarOption } from '../components/CarOption'
import { ServiceOption } from '../components/ServiceOption'
import { TimeSlots } from '../components/TimeSlots'
import { calculateBookingCost, SLOTS } from '../lib/bookingCost'
import { createBooking, splitWashPrice } from '../lib/bookings'
import { isOnTrial } from '../lib/access'
import { hasActiveAccess } from '../lib/access'

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

  const [date, setDate] = useState(todayISO())
  const [submitting, setSubmitting] = useState(false)

  const { fullSlots, isLoading: slotsLoading } = useFullSlots(date, point?.name)

  // Guard: trial/sub access, mirrors openBookingScreen's hasActiveAccess check
  useEffect(() => {
    if (!hasActiveAccess(currentUser)) {
      navigate('/sub-wall', { replace: true })
    }
  }, [currentUser, navigate])

  // Default to first car, mirrors openBookingScreen's selectedCar init
  useEffect(() => {
    if (!bookingCar && userCars.length > 0) setBookingCar(userCars[0])
  }, [bookingCar, userCars, setBookingCar])

  if (!point) {
    return (
      <div className="flex h-full items-center justify-center bg-bg text-sm text-muted">
        Loading wash point…
      </div>
    )
  }

  const cost = calculateBookingCost(bookingService, currentUser)
  const onTrial = isOnTrial(currentUser)

  async function handleConfirm() {
    if (!bookingCar) return showToast('Please select a car.', true)
    if (!bookingService) return showToast('Please select a service.', true)
    if (!bookingSlot) return showToast('Please select a time slot.', true)
    if (!date) return showToast('Please select a date.', true)
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

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-bg">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-surface-1 px-4 py-4">
        <button
          onClick={() => navigate('/home')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg text-navy hover:bg-bg"
        >
          ←
        </button>
        <h2 className="text-base font-bold text-navy">{point.name}</h2>
      </div>

      <div className="flex-1 px-4 py-4">
        <div className="mb-5 flex items-center gap-3.5 rounded-2xl bg-surface-1 px-4 py-3.5 shadow-app">
          <div className="text-[28px]">💧</div>
          <div className="flex-1">
            <div className="text-[15px] font-bold text-navy">{point.name}</div>
            <div className="text-[13px] text-muted">{point.area}</div>
            {bookingService && (
              <div className="mt-0.5 text-[13px] font-bold text-gold">
                {bookingService.name} · KSh {cost.washPrice.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-muted">
          Select Car
        </div>
        <div className="mb-5 flex flex-col gap-2.5">
          {userCars.length === 0 ? (
            <div className="text-[13px] text-muted">
              No cars registered.{' '}
              <a onClick={() => navigate('/profile')} className="cursor-pointer font-bold text-gold">
                Add a car →
              </a>
            </div>
          ) : (
            userCars.map((car) => (
              <CarOption
                key={car.id}
                car={car}
                selected={String(bookingCar?.id) === String(car.id)}
                onClick={() => setBookingCar(car)}
              />
            ))
          )}
        </div>

        <div className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-muted">
          Select Service
        </div>
        <div className="mb-5">
          {!point.services.length ? (
            <div className="py-2 text-[13px] text-muted">
              No services listed yet — ask at the wash point.
            </div>
          ) : (
            point.services.map((s) => (
              <ServiceOption
                key={s.id}
                service={s}
                selected={bookingService?.id === s.id}
                onClick={() => setBookingService(s)}
              />
            ))
          )}
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-semibold text-navy">Select Date</label>
          <input
            type="date"
            min={todayISO()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3 text-sm text-navy outline-none focus:border-accent"
          />
        </div>

        <div className="mb-2.5 text-[13px] font-bold uppercase tracking-wide text-muted">
          Available Times
        </div>
        <div className="mb-5">
          <TimeSlots
            slots={SLOTS}
            fullSlots={fullSlots}
            selectedSlot={bookingSlot}
            onSelect={setBookingSlot}
            loading={slotsLoading}
          />
        </div>

        <div className="mb-5 rounded-2xl border-[1.5px] border-slate-200 bg-white p-4.5 shadow-app">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="text-[13px] text-muted">Service</div>
            <div className="text-base font-bold text-navy">
              {cost.washPrice ? `KSh ${cost.washPrice.toLocaleString()}` : '—'}
            </div>
          </div>
          {onTrial && cost.washPrice > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-[13px] text-muted">App fee (trial)</div>
              <div className="text-sm font-semibold text-muted">KSh 30</div>
            </div>
          )}
          {cost.washPrice > 0 && <div className="my-2.5 h-px bg-surface-3" />}
          <div className="flex items-center justify-between">
            <div className="text-[13px] font-bold text-navy">Total</div>
            <div className="font-display text-[22px] font-extrabold text-accent">
              {cost.total ? `KSh ${cost.total.toLocaleString()}` : '—'}
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={handleConfirm}
          className="w-full rounded-2xl bg-accent py-4 text-[15px] font-bold text-white shadow-app-md disabled:opacity-50 active:scale-[0.98]"
        >
          {submitting ? 'Please wait…' : 'Confirm & Pay via M-Pesa'}
        </button>
      </div>
    </div>
  )
}

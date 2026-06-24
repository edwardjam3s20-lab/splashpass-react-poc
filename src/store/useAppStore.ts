import { create } from 'zustand'
import type { Booking, Car, Profile, SubPlan, WashPoint, WashPointExtra } from '../types/database'

// Default coordinates: Mombasa — same fallback the original app used before
// GPS resolves, so the map has a sensible center on first paint.
const DEFAULT_LAT = -4.0435
const DEFAULT_LNG = 39.7173

const STORAGE_KEY = 'splashpass_user'

function loadStoredUser(): Profile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Profile) : null
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

interface AppState {
  userLat: number
  userLng: number
  gpsConfirmed: boolean
  setUserLocation: (lat: number, lng: number) => void

  selectedPoint: WashPoint | null
  setSelectedPoint: (point: WashPoint | null) => void

  sheetOpen: boolean
  openSheet: (point: WashPoint) => void
  closeSheet: () => void

  currentUser: Profile | null
  setCurrentUser: (user: Profile | null) => void
  logout: () => void

  userCars: Car[]
  setUserCars: (cars: Car[]) => void

  // Booking flow — mirrors selectedCar/selectedService/selectedSlot/pendingBooking
  bookingCar: Car | null
  setBookingCar: (car: Car | null) => void
  bookingService: WashPointExtra | null
  setBookingService: (service: WashPointExtra | null) => void
  bookingSlot: string | null
  setBookingSlot: (slot: string | null) => void
  pendingBooking: { booking: Booking; code: string; date: string } | null
  setPendingBooking: (pb: { booking: Booking; code: string; date: string } | null) => void
  resetBookingFlow: () => void

  selectedSubPlan: SubPlan | null
  setSelectedSubPlan: (plan: SubPlan | null) => void

  toastMessage: string | null
  toastIsError: boolean
  showToast: (msg: string, isError?: boolean) => void
  hideToast: () => void
}

export const useAppStore = create<AppState>((set) => ({
  userLat: DEFAULT_LAT,
  userLng: DEFAULT_LNG,
  gpsConfirmed: false,
  setUserLocation: (lat, lng) => set({ userLat: lat, userLng: lng, gpsConfirmed: true }),

  selectedPoint: null,
  setSelectedPoint: (point) => set({ selectedPoint: point }),

  sheetOpen: false,
  openSheet: (point) => set({ selectedPoint: point, sheetOpen: true }),
  closeSheet: () => set({ sheetOpen: false }),

  currentUser: loadStoredUser(),
  setCurrentUser: (user) => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
    set({ currentUser: user })
  },
  logout: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({
      currentUser: null,
      selectedPoint: null,
      sheetOpen: false,
      userCars: [],
    })
  },

  userCars: [],
  setUserCars: (cars) => set({ userCars: cars }),

  bookingCar: null,
  setBookingCar: (car) => set({ bookingCar: car }),
  bookingService: null,
  setBookingService: (service) => set({ bookingService: service }),
  bookingSlot: null,
  setBookingSlot: (slot) => set({ bookingSlot: slot }),
  pendingBooking: null,
  setPendingBooking: (pb) => set({ pendingBooking: pb }),
  resetBookingFlow: () =>
    set({ bookingCar: null, bookingService: null, bookingSlot: null, pendingBooking: null }),

  selectedSubPlan: null,
  setSelectedSubPlan: (plan) => set({ selectedSubPlan: plan }),

  toastMessage: null,
  toastIsError: false,
  showToast: (msg, isError = false) => set({ toastMessage: msg, toastIsError: isError }),
  hideToast: () => set({ toastMessage: null }),
}))

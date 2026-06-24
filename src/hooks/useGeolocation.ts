import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

/**
 * Requests the user's location once, then keeps watching for updates.
 * Mirrors the original app's `getLocation()` — falls back silently to the
 * Mombasa default coordinates already in the store if permission is denied.
 */
export function useGeolocation() {
  const setUserLocation = useAppStore((s) => s.setUserLocation)

  useEffect(() => {
    if (!navigator.geolocation) return

    const initialId = navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation(pos.coords.latitude, pos.coords.longitude),
      () => {
        /* permission denied or unavailable — keep default coords */
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserLocation(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
      void initialId
    }
  }, [setUserLocation])
}

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SplashScreen } from './screens/SplashScreen'
import { WelcomeScreen } from './screens/WelcomeScreen'
import { AuthScreen } from './screens/AuthScreen'
import { VerifyEmailScreen } from './screens/VerifyEmailScreen'
import { ProfileSetupScreen } from './screens/ProfileSetupScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { HomeScreen } from './screens/HomeScreen'
import { BookScreen } from './screens/BookScreen'
import { MpesaBookingScreen } from './screens/MpesaBookingScreen'
import { MpesaSubscriptionScreen } from './screens/MpesaSubscriptionScreen'
import { BookingConfirmedScreen } from './screens/BookingConfirmedScreen'
import { QRScreen } from './screens/QRScreen'
import { SubWallScreen } from './screens/SubWallScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { AddCarScreen } from './screens/AddCarScreen'
import { ChangePasswordScreen } from './screens/ChangePasswordScreen'
import { DeleteAccountScreen } from './screens/DeleteAccountScreen'
import { LoyaltyScreen } from './screens/LoyaltyScreen'
import { PlansScreen } from './screens/PlansScreen'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { Toast } from './components/Toast'

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen w-screen overflow-hidden">
        <Routes>
          {/* Pre-auth */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/welcome" element={<WelcomeScreen />} />
          <Route path="/auth/:mode" element={<AuthScreen />} />
          <Route path="/verify" element={<VerifyEmailScreen />} />
          <Route path="/profile-setup" element={<ProfileSetupScreen />} />
          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <OnboardingScreen />
              </RequireAuth>
            }
          />

          {/* Main app shell — bottom nav wraps these */}
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/home" element={<HomeScreen />} />
            <Route path="/plans" element={<PlansScreen />} />
            <Route path="/loyalty" element={<LoyaltyScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
          </Route>

          {/* Full-screen flows, no bottom nav */}
          <Route
            path="/book/:pointId"
            element={
              <RequireAuth>
                <BookScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/mpesa/booking"
            element={
              <RequireAuth>
                <MpesaBookingScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/mpesa/subscription"
            element={
              <RequireAuth>
                <MpesaSubscriptionScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/confirmed"
            element={
              <RequireAuth>
                <BookingConfirmedScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/qr"
            element={
              <RequireAuth>
                <QRScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/add-car"
            element={
              <RequireAuth>
                <AddCarScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/change-password"
            element={
              <RequireAuth>
                <ChangePasswordScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/delete-account"
            element={
              <RequireAuth>
                <DeleteAccountScreen />
              </RequireAuth>
            }
          />
          <Route
            path="/sub-wall"
            element={
              <RequireAuth>
                <SubWallScreen />
              </RequireAuth>
            }
          />
        </Routes>
        <Toast />
      </div>
    </BrowserRouter>
  )
}

export default App

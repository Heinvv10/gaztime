import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useStore } from './store/useStore';

// Layout
import { BottomNav } from './components/layout/BottomNav';

// Pages
import { Splash } from './pages/Splash';
import { Onboarding } from './pages/Onboarding';
import { PhoneInput } from './pages/auth/PhoneInput';
import { VerifyOTP } from './pages/auth/VerifyOTP';
import { SetupProfile } from './pages/auth/SetupProfile';
import { Home } from './pages/Home';
import { OrderProduct } from './pages/OrderProduct';
import { OrderTracking } from './pages/OrderTracking';
import { Orders } from './pages/Orders';
import { Wallet } from './pages/Wallet';
import { Profile } from './pages/Profile';
import { Referrals } from './pages/Referrals';
import { Safety } from './pages/Safety';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { isAuthenticated, isOnline } = useStore();

  return (
    <ErrorBoundary>
      <BrowserRouter>
      <div className="app">
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Splash />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/auth/phone" element={<PhoneInput />} />
            <Route path="/auth/verify-otp" element={<VerifyOTP />} />
            <Route path="/auth/setup-profile" element={<SetupProfile />} />

            {/* Protected routes */}
            <Route
              path="/home"
              element={
                isAuthenticated ? (
                  <>
                    <Home />
                    <BottomNav />
                  </>
                ) : (
                  <Navigate to="/auth/phone" replace />
                )
              }
            />
            <Route
              path="/order/:productId"
              element={
                isAuthenticated ? (
                  <OrderProduct />
                ) : (
                  <Navigate to="/auth/phone" replace />
                )
              }
            />
            <Route
              path="/track/:orderId"
              element={
                isAuthenticated ? (
                  <OrderTracking />
                ) : (
                  <Navigate to="/auth/phone" replace />
                )
              }
            />
            <Route
              path="/orders"
              element={
                isAuthenticated ? (
                  <>
                    <Orders />
                    <BottomNav />
                  </>
                ) : (
                  <Navigate to="/auth/phone" replace />
                )
              }
            />
            <Route
              path="/wallet"
              element={
                isAuthenticated ? (
                  <>
                    <Wallet />
                    <BottomNav />
                  </>
                ) : (
                  <Navigate to="/auth/phone" replace />
                )
              }
            />
            <Route
              path="/profile"
              element={
                isAuthenticated ? (
                  <>
                    <Profile />
                    <BottomNav />
                  </>
                ) : (
                  <Navigate to="/auth/phone" replace />
                )
              }
            />
            <Route
              path="/referrals"
              element={
                isAuthenticated ? (
                  <Referrals />
                ) : (
                  <Navigate to="/auth/phone" replace />
                )
              }
            />
            <Route
              path="/safety"
              element={
                isAuthenticated ? (
                  <Safety />
                ) : (
                  <Navigate to="/auth/phone" replace />
                )
              }
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>

        {/* Offline indicator */}
        {!isOnline && (
          <div className="offline-banner">
            ⚠️ You're offline. Some features may not be available.
          </div>
        )}
      </div>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

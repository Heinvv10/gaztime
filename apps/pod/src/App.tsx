import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { usePodStore } from './store/usePodStore';
import LoginPage from './pages/LoginPage';
import POSPage from './pages/POSPage';
import SaleConfirmationPage from './pages/SaleConfirmationPage';
import CustomerRegistrationPage from './pages/CustomerRegistrationPage';
import StockManagementPage from './pages/StockManagementPage';
import DailyReportsPage from './pages/DailyReportsPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import ShiftManagementPage from './pages/ShiftManagementPage';
import { ErrorBoundary } from './components/ErrorBoundary';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = usePodStore(state => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename="/pos">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <POSPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sale-confirmation"
          element={
            <ProtectedRoute>
              <SaleConfirmationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer-registration"
          element={
            <ProtectedRoute>
              <CustomerRegistrationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stock"
          element={
            <ProtectedRoute>
              <StockManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <DailyReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <CustomerOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/shift"
          element={
            <ProtectedRoute>
              <ShiftManagementPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

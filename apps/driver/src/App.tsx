import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import DeliveryList from './screens/DeliveryList';
import OrderNotification from './screens/OrderNotification';
import Navigation from './screens/Navigation';
import DeliveryCompletion from './screens/DeliveryCompletion';
import StockManagement from './screens/StockManagement';
import SafetyChecklist from './screens/SafetyChecklist';
import Earnings from './screens/Earnings';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const { isAuthenticated } = useStore();

  return (
    <ErrorBoundary>
      <BrowserRouter basename="/">
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {isAuthenticated ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="deliveries" element={<DeliveryList />} />
            <Route path="order/:orderId" element={<OrderNotification />} />
            <Route path="navigate/:orderId" element={<Navigation />} />
            <Route path="complete/:orderId" element={<DeliveryCompletion />} />
            <Route path="stock" element={<StockManagement />} />
            <Route path="safety" element={<SafetyChecklist />} />
            <Route path="earnings" element={<Earnings />} />
          </Route>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

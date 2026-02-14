import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Power, 
  MapPin, 
  TrendingUp, 
  Clock, 
  Star,
  AlertCircle,
  ChevronRight,
  Package
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Order } from '@shared/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    driver,
    orders,
    isOnline,
    toggleOnline,
    vehicleStock,
    dailyChecklistCompleted,
    isOnShift,
    shiftStartTime,
    startShift,
    endShift,
  } = useStore();

  const assignedOrders = orders.filter(o => o.status === 'assigned' || o.status === 'confirmed');
  const todayStats = {
    deliveries: driver?.todayDeliveries || 0,
    earnings: driver?.todayEarnings || 0,
    avgRating: driver?.ratingAvg || 0,
  };

  const handleOrderClick = (order: Order) => {
    navigate(`/order/${order.id}`);
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back,</h1>
          <p className="text-xl text-teal">{driver?.name}</p>
        </div>
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal to-yellow flex items-center justify-center text-2xl font-bold">
          {driver?.name.split(' ').map(n => n[0]).join('')}
        </div>
      </div>

      {/* Safety Alert */}
      {!dailyChecklistCompleted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow/10 border border-yellow rounded-lg p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow">Daily Safety Check Required</h3>
            <p className="text-sm text-gray-300 mt-1">
              Complete your vehicle inspection before starting deliveries
            </p>
            <button
              onClick={() => navigate('/safety')}
              className="mt-2 text-sm text-teal font-semibold"
            >
              Complete Now →
            </button>
          </div>
        </motion.div>
      )}

      {/* Shift Controls */}
      {!isOnShift ? (
        <motion.div
          className="card bg-gradient-to-r from-teal/20 to-yellow/20 border-teal"
          whileTap={{ scale: 0.98 }}
        >
          <button
            onClick={startShift}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-teal flex items-center justify-center">
                <Power className="w-6 h-6 text-dark-bg" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-white">Start Your Shift</h3>
                <p className="text-sm text-gray-300">
                  Ready to start deliveries?
                </p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-teal" />
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {/* Shift Timer */}
          <div className="card bg-teal/10 border-teal">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">On shift since</div>
                <div className="text-lg font-semibold text-white">
                  {shiftStartTime?.toLocaleTimeString('en-ZA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <button
                onClick={endShift}
                className="btn btn-danger text-sm"
              >
                End Shift
              </button>
            </div>
          </div>

          {/* Online/Offline Toggle */}
          <motion.div
            className="card"
            whileTap={{ scale: 0.98 }}
          >
            <button
              onClick={toggleOnline}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isOnline ? 'bg-teal/20' : 'bg-gray-700'
                }`}>
                  <Power className={`w-6 h-6 ${isOnline ? 'text-teal' : 'text-gray-400'}`} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-white">
                    {isOnline ? 'You\'re Online' : 'You\'re Offline'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {isOnline ? 'Receiving orders' : 'Tap to go online'}
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: isOnline ? 180 : 0 }}
                className={`w-10 h-6 rounded-full p-1 ${
                  isOnline ? 'bg-teal' : 'bg-gray-700'
                }`}
              >
                <motion.div
                  animate={{ x: isOnline ? 16 : 0 }}
                  className="w-4 h-4 bg-white rounded-full"
                />
              </motion.div>
            </button>
          </motion.div>
        </div>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <Package className="w-6 h-6 text-teal mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{todayStats.deliveries}</div>
          <div className="text-xs text-gray-400">Deliveries</div>
        </div>
        <div className="card text-center">
          <TrendingUp className="w-6 h-6 text-yellow mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">R{todayStats.earnings}</div>
          <div className="text-xs text-gray-400">Earnings</div>
        </div>
        <div className="card text-center">
          <Star className="w-6 h-6 text-yellow mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{todayStats.avgRating}</div>
          <div className="text-xs text-gray-400">Rating</div>
        </div>
      </div>

      {/* Vehicle Stock */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white">Vehicle Stock</h3>
          <button
            onClick={() => navigate('/stock')}
            className="text-sm text-teal font-semibold"
          >
            Manage
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-dark-surface rounded-lg p-3">
            <div className="text-sm text-gray-400">9kg Cylinders</div>
            <div className="text-xl font-bold text-white">
              {vehicleStock.filter(s => s.sizeKg === 9).length}
            </div>
          </div>
          <div className="flex-1 bg-dark-surface rounded-lg p-3">
            <div className="text-sm text-gray-400">19kg Cylinders</div>
            <div className="text-xl font-bold text-white">
              {vehicleStock.filter(s => s.sizeKg === 19).length}
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-white text-lg">Delivery Queue</h3>
          <button
            onClick={() => navigate('/deliveries')}
            className="text-sm text-teal font-semibold"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {assignedOrders.length === 0 ? (
            <div className="card text-center py-8 text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No deliveries assigned yet</p>
              <p className="text-sm mt-1">
                {isOnline ? 'Waiting for orders...' : 'Go online to receive orders'}
              </p>
            </div>
          ) : (
            assignedOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="card cursor-pointer hover:border-teal transition-colors"
                onClick={() => handleOrderClick(order)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white">{order.reference}</span>
                      <span className={`status-badge ${
                        order.status === 'assigned' ? 'bg-teal/20 text-teal' : 'bg-yellow/20 text-yellow'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{order.deliveryAddress.text}</span>
                      </div>
                      {order.deliveryAddress.landmark && (
                        <div className="text-xs text-gray-500 ml-6">
                          {order.deliveryAddress.landmark}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-white mb-1">
                      R{order.totalAmount}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

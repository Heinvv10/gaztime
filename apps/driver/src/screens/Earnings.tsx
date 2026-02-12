import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  
  Calendar,
  DollarSign,
  Package,
  Star,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store/useStore';

type Period = 'day' | 'week' | 'month';

export default function Earnings() {
  const { driver, orders } = useStore();
  const [period, setPeriod] = useState<Period>('day');

  const completedOrders = useMemo(() =>
    orders.filter(o => o.status === 'delivered' || o.status === 'completed'),
    [orders]
  );

  const getEarnings = (p: Period) => {
    const now = new Date();
    const start = new Date();
    if (p === 'day') start.setHours(0, 0, 0, 0);
    else if (p === 'week') start.setDate(now.getDate() - 7);
    else start.setMonth(now.getMonth() - 1);
    const filtered = completedOrders.filter(o => new Date(o.createdAt) >= start);
    return { amount: filtered.reduce((sum, o) => sum + (o.totalAmount || 0), 0), deliveries: filtered.length };
  };

  const earnings = {
    day: getEarnings('day'),
    week: getEarnings('week'),
    month: getEarnings('month'),
  };

  const stats = earnings[period];

  const performanceMetrics = [
    { label: 'Avg Delivery Time', value: '18 min', icon: Clock, color: 'text-teal' },
    { label: 'On-Time Rate', value: '96%', icon: Calendar, color: 'text-yellow' },
    { label: 'Avg Rating', value: driver?.ratingAvg || 0, icon: Star, color: 'text-yellow' },
    { label: 'Total Deliveries', value: driver?.totalDeliveries || 0, icon: Package, color: 'text-teal' },
  ];

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Earnings & History</h1>
        <p className="text-gray-400">Track your performance</p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 bg-dark-surface rounded-lg p-1">
        {[
          { key: 'day' as const, label: 'Today' },
          { key: 'week' as const, label: 'This Week' },
          { key: 'month' as const, label: 'This Month' },
        ].map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              period === p.key
                ? 'bg-teal text-dark-bg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Earnings Card */}
      <motion.div
        key={period}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card bg-gradient-to-br from-teal/20 to-yellow/20 border-teal"
      >
        <div className="text-center py-6">
          <DollarSign className="w-12 h-12 text-yellow mx-auto mb-4" />
          <div className="text-sm text-gray-300 mb-2">
            {period === 'day' ? 'Today' : period === 'week' ? 'This Week' : 'This Month'}
          </div>
          <div className="text-5xl font-bold text-white mb-2">
            R{stats.amount.toLocaleString()}
          </div>
          <div className="text-gray-400">
            {stats.deliveries} deliveries completed
          </div>
        </div>
      </motion.div>

      {/* Breakdown */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Earnings Breakdown</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
            <span className="text-gray-400">Base Pay</span>
            <span className="font-semibold text-white">R{Math.round(stats.amount * 0.6)}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
            <span className="text-gray-400">Delivery Fees</span>
            <span className="font-semibold text-white">R{Math.round(stats.amount * 0.25)}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
            <span className="text-gray-400">Tips & Bonuses</span>
            <span className="font-semibold text-teal">R{Math.round(stats.amount * 0.15)}</span>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h3 className="font-semibold text-white mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 gap-3">
          {performanceMetrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="card text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${metric.color}`} />
                <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                <div className="text-xs text-gray-400">{metric.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Deliveries */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Recent Deliveries</h3>
          <button className="text-sm text-teal font-semibold">View All</button>
        </div>

        <div className="space-y-3">
          {completedOrders.slice(0, 10).map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-white">{order.reference}</span>
                    {order.rating && (
                      <div className="flex items-center gap-1 text-yellow">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm font-semibold">{order.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <div>{order.customer?.name}</div>
                    <div className="line-clamp-1">{order.deliveryAddress?.text || (order.deliveryAddress as any)?.street || 'Walk-in'}</div>
                    {order.deliveredAt && (
                      <div className="text-xs text-gray-500">
                        {new Date(order.deliveredAt).toLocaleDateString()} at{' '}
                        {new Date(order.deliveredAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-teal mb-1">
                    R{order.totalAmount}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Weekly Chart Placeholder */}
      <div className="card">
        <h3 className="font-semibold text-white mb-4">Weekly Trend</h3>
        <div className="h-48 bg-dark-surface rounded-lg flex items-end justify-around p-4 gap-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
            const height = Math.random() * 100 + 20;
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gradient-to-t from-teal to-yellow rounded-t"
                  style={{ height: `${height}%` }}
                />
                <div className="text-xs text-gray-400">{day}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

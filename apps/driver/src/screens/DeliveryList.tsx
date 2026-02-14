import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Package,
  ChevronRight,
  Filter,
  Search
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Order, OrderStatus } from '@shared/types';

type FilterStatus = 'all' | 'assigned' | 'in_transit' | 'completed';

export default function DeliveryList() {
  const navigate = useNavigate();
  const { orders } = useStore();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = !searchTerm ||
      order.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.deliveryAddress.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleOrderClick = (order: Order) => {
    if (order.status === 'assigned') {
      navigate(`/order/${order.id}`);
    } else if (order.status === 'in_transit') {
      navigate(`/navigate/${order.id}`);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'assigned':
        return 'bg-yellow/20 text-yellow border-yellow/30';
      case 'in_transit':
        return 'bg-teal/20 text-teal border-teal/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-700/20 text-gray-400 border-gray-700/30';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'assigned':
        return 'New';
      case 'in_transit':
        return 'Active';
      case 'completed':
        return 'Done';
      default:
        return status;
    }
  };

  const filterOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'assigned', label: 'New' },
    { value: 'in_transit', label: 'Active' },
    { value: 'completed', label: 'Done' },
  ];

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">My Deliveries</h1>
        <p className="text-gray-400">{filteredOrders.length} total</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by order #, address, or customer..."
          className="input pl-10 w-full"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {filterOptions.map((option) => {
          const isActive = filterStatus === option.value;
          const count = option.value === 'all'
            ? orders.length
            : orders.filter(o => o.status === option.value).length;

          return (
            <button
              key={option.value}
              onClick={() => setFilterStatus(option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-teal text-dark-bg font-semibold'
                  : 'bg-dark-surface text-gray-400 border border-dark-border'
              }`}
            >
              {option.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isActive ? 'bg-dark-bg/20' : 'bg-dark-card'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Delivery List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card text-center py-12 text-gray-400"
            >
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No deliveries found</p>
              {searchTerm && (
                <p className="text-sm mt-1">Try adjusting your search</p>
              )}
            </motion.div>
          ) : (
            filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="card cursor-pointer hover:border-teal transition-colors"
                onClick={() => handleOrderClick(order)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Order Header */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-semibold text-white">
                        {order.reference}
                      </span>
                      <span className={`status-badge border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    {/* Customer */}
                    {order.customer && (
                      <div className="text-sm text-gray-300 mb-2">
                        {order.customer.name}
                      </div>
                    )}

                    {/* Address */}
                    <div className="space-y-1 text-sm text-gray-400">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.deliveryAddress.text}</span>
                      </div>
                      {order.deliveryAddress.landmark && (
                        <div className="text-xs text-teal ml-6">
                          📍 {order.deliveryAddress.landmark}
                        </div>
                      )}
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(order.createdAt).toLocaleString('en-ZA', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    {/* Items Preview */}
                    <div className="mt-2 text-xs text-gray-500">
                      {order.items.map((item, idx) => (
                        <span key={idx}>
                          {item.quantity}x {item.product?.name || 'Product'}
                          {idx < order.items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Amount & Arrow */}
                  <div className="text-right ml-4 flex flex-col items-end">
                    <div className="text-lg font-bold text-white mb-1">
                      R{order.totalAmount}
                    </div>
                    {order.paymentStatus === 'paid' && (
                      <div className="text-xs text-green-400 mb-2">
                        ✓ Paid
                      </div>
                    )}
                    {order.paymentStatus === 'pending' && (
                      <div className="text-xs text-yellow mb-2">
                        COD
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, RotateCcw, ChevronRight, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { Order, OrderStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@gaztime/shared';

const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  created: { label: 'Created', color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
  confirmed: { label: 'Confirmed', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  assigned: { label: 'Assigned', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  in_transit: { label: 'On the Way', color: 'text-primary', bgColor: 'bg-primary/20' },
  arriving: { label: 'Arriving', color: 'text-accent', bgColor: 'bg-accent/20' },
  delivered: { label: 'Delivered', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  completed: { label: 'Completed', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-500/20' },
};

export function Orders() {
  const navigate = useNavigate();
  const { orders, user, setOrders, setLoading } = useStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Fetch orders on mount
  useEffect(() => {
    if (user?.id) {
      const fetchOrders = async () => {
        setLoading(true);
        try {
          const fetchedOrders = await api.orders.list({ customerId: user.id });
          // Map API Order to local Order type
          const mappedOrders = fetchedOrders.map((order: any) => ({
            id: order.id,
            reference: order.reference,
            status: order.status,
            items: order.items.map((item: any) => ({
              productId: item.productId,
              productName: item.product?.name || 'Product',
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
            totalAmount: order.totalAmount,
            deliveryFee: order.deliveryFee || 0,
            deliveryAddress: order.deliveryAddress,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            createdAt: order.createdAt,
            deliveredAt: order.deliveredAt,
            estimatedDeliveryTime: order.estimatedDeliveryTime,
            driver: order.driver,
            rating: order.rating,
          }));
          setOrders(mappedOrders);
        } catch (err) {
          console.error('Failed to fetch orders:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [user?.id, setOrders, setLoading]);

  const filteredOrders = orders.filter((order) => {
    if (filter === 'active') {
      return !['delivered', 'completed', 'cancelled'].includes(order.status);
    }
    if (filter === 'completed') {
      return ['delivered', 'completed'].includes(order.status);
    }
    return true;
  });

  const handleReorder = (order: Order) => {
    if (order.items.length > 0) {
      navigate(`/order/${order.items[0].productId}`);
    }
  };

  const handleViewDetails = (order: Order) => {
    if (['delivered', 'completed', 'cancelled'].includes(order.status)) {
      // Show order detail modal or navigate to detail page
      
    } else {
      navigate(`/track/${order.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 pt-6 pb-8 px-6 rounded-b-3xl shadow-xl">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Package className="w-8 h-8" />
          My Orders
        </h1>
        <p className="text-primary-100 mt-2">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} total
        </p>
      </div>

      {/* Filter tabs */}
      <div className="px-6 -mt-4 mb-6">
        <Card>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'Active' },
              { key: 'completed', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as typeof filter)}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                  filter === tab.key
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:bg-navy-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Orders list */}
      <div className="px-6 space-y-4">
        {filteredOrders.length === 0 ? (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-24 h-24 bg-navy-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-12 h-12 text-gray-600" />
            </div>
            <p className="text-gray-400 mb-4">No orders found</p>
            <Button variant="primary" onClick={() => navigate('/home')}>
              Start Shopping
            </Button>
          </motion.div>
        ) : (
          filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card interactive onClick={() => handleViewDetails(order)}>
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Order {order.reference}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        statusConfig[order.status].bgColor
                      } ${statusConfig[order.status].color}`}
                    >
                      {statusConfig[order.status].label}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="space-y-1">
                    {order.items.map((item) => (
                      <div key={item.productId} className="flex justify-between text-white">
                        <span className="text-sm">
                          {item.productName} × {item.quantity}
                        </span>
                        <span className="text-sm font-medium">R {item.total}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-navy-700">
                    <div>
                      <p className="text-gray-400 text-xs">Total Amount</p>
                      <p className="text-primary font-bold text-lg">
                        R {order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {order.status === 'delivered' || order.status === 'completed' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorder(order);
                          }}
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reorder
                        </Button>
                      ) : (
                        <Button variant="primary" size="sm">
                          <Clock className="w-4 h-4 mr-2" />
                          Track
                        </Button>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

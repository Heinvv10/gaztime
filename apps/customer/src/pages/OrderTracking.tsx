import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, MessageCircle, MapPin, Clock, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { OrderStatus } from '@/types';
import { api } from '@gaztime/shared';

const orderStatuses: { status: OrderStatus; label: string }[] = [
  { status: 'confirmed', label: 'Order Confirmed' },
  { status: 'assigned', label: 'Driver Assigned' },
  { status: 'in_transit', label: 'On the Way' },
  { status: 'arriving', label: 'Arriving Soon' },
  { status: 'delivered', label: 'Delivered' },
];

export function OrderTracking() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const { orders, updateOrder } = useStore();
  
  const [order, setOrder] = useState(orders.find((o) => o.id === orderId));
  const [currentStatusIndex, setCurrentStatusIndex] = useState(2); // in_transit
  const [eta, setEta] = useState(10);

  // Fetch order details and poll for updates
  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const fetchedOrder = await api.orders.getById(orderId);
        // Map API Order to local Order type
        const mappedOrder: any = {
          id: fetchedOrder.id,
          reference: fetchedOrder.reference,
          status: fetchedOrder.status,
          items: fetchedOrder.items.map((item: any) => ({
            productId: item.productId,
            productName: item.product?.name || 'Product',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
          totalAmount: fetchedOrder.totalAmount,
          deliveryFee: fetchedOrder.deliveryFee || 0,
          deliveryAddress: fetchedOrder.deliveryAddress,
          paymentMethod: fetchedOrder.paymentMethod,
          paymentStatus: fetchedOrder.paymentStatus,
          createdAt: fetchedOrder.createdAt,
          deliveredAt: fetchedOrder.deliveredAt,
          driver: fetchedOrder.driver,
          rating: fetchedOrder.rating,
        };
        setOrder(mappedOrder);
        updateOrder(orderId, mappedOrder);
      } catch (err) {
        console.error('Failed to fetch order:', err);
      }
    };

    // Initial fetch
    fetchOrder();

    // Poll every 10 seconds for updates (only if order is active)
    const statusIdx = orderStatuses.findIndex((s) => s.status === order?.status);
    const isActiveOrder = statusIdx !== -1 && statusIdx < 4;
    
    let pollInterval: any;
    if (isActiveOrder) {
      pollInterval = setInterval(fetchOrder, 10000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [orderId, updateOrder]);

  // Update status index when order changes
  useEffect(() => {
    if (!order) return;
    
    const statusIdx = orderStatuses.findIndex((s) => s.status === order.status);
    if (statusIdx !== -1) {
      setCurrentStatusIndex(statusIdx);
    }

    // Simulate ETA countdown
    const timer = setInterval(() => {
      setEta((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 60000); // Every minute

    return () => clearInterval(timer);
  }, [order]);

  if (!order) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Order not found</p>
          <Button onClick={() => navigate('/orders')}>View All Orders</Button>
        </div>
      </div>
    );
  }

  const driver = order.driver;

  return (
    <div className="min-h-screen bg-navy pb-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-navy-800/95 backdrop-blur-md border-b border-navy-700">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 hover:bg-navy-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <div className="text-center">
            <p className="text-xs text-gray-400">Order {order.reference}</p>
            <p className="font-bold text-white">Track Delivery</p>
          </div>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Mock Map */}
      <div className="relative h-[60vh] bg-gradient-to-br from-navy-800 to-navy-900 border-b border-navy-700 overflow-hidden">
        {/* Grid pattern for "map" effect */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(43, 191, 179, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(43, 191, 179, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
        
        {/* Animated route line */}
        <svg className="absolute inset-0 w-full h-full">
          <motion.path
            d="M 50 400 Q 200 200, 300 100"
            stroke="rgba(43, 191, 179, 0.5)"
            strokeWidth="3"
            fill="none"
            strokeDasharray="10 5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 0.7 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
        </svg>

        {/* Destination marker (customer location) */}
        <motion.div
          className="absolute top-16 right-16"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <div className="relative">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-xl border-4 border-white">
              <MapPin className="w-6 h-6 text-navy" fill="currentColor" />
            </div>
            <motion.div
              className="absolute inset-0 bg-accent rounded-full opacity-50"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Driver marker (moving) */}
        <motion.div
          className="absolute bottom-32 left-24"
          initial={{ scale: 0, x: -100, y: 100 }}
          animate={{ scale: 1, x: 0, y: 0 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <div className="relative">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-xl border-4 border-white">
              <span className="text-2xl">🚛</span>
            </div>
            <motion.div
              className="absolute inset-0 bg-primary rounded-full opacity-50"
              animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* ETA badge */}
        <motion.div
          className="absolute top-4 left-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="bg-white rounded-full px-4 py-2 shadow-xl flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-bold text-navy">{eta} min</span>
          </div>
        </motion.div>
      </div>

      <div className="px-6 -mt-4 space-y-4">
        {/* Driver Info Card */}
        {driver && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-700 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                  {driver.name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white text-lg">{driver.name}</p>
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <span>{driver.vehicle.make} {driver.vehicle.model}</span>
                    <span>•</span>
                    <span>{driver.vehicle.registration}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-accent">★</span>
                    <span className="text-white font-medium">{driver.rating}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => window.location.href = `tel:${driver.phone}`}
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => window.location.href = `https://wa.me/${driver.phone.replace(/\+/g, '')}`}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Order Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h3 className="font-bold text-white mb-4">Delivery Status</h3>
            <div className="space-y-4">
              {orderStatuses.map((status, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <motion.div
                    key={status.status}
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <div className="relative">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-primary text-white'
                            : 'bg-navy-800 text-gray-500'
                        } ${isCurrent ? 'ring-4 ring-primary/30 scale-110' : ''}`}
                      >
                        {isCompleted ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-bold">{index + 1}</span>
                        )}
                      </div>
                      {index < orderStatuses.length - 1 && (
                        <div
                          className={`absolute top-10 left-5 w-0.5 h-8 transition-colors ${
                            index < currentStatusIndex ? 'bg-primary' : 'bg-navy-700'
                          }`}
                        />
                      )}
                    </div>
                    <div>
                      <p
                        className={`font-medium ${
                          isCompleted ? 'text-white' : 'text-gray-500'
                        }`}
                      >
                        {status.label}
                      </p>
                      {isCurrent && (
                        <p className="text-primary text-sm">In progress...</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Order Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <h3 className="font-bold text-white mb-3">Order Details</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.productId} className="flex justify-between text-gray-400">
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                  <span>R {item.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-navy-700 pt-3 flex justify-between">
                <span className="text-white font-bold">Total</span>
                <span className="text-primary font-bold text-xl">
                  R {order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

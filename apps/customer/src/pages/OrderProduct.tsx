import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, MapPin, CreditCard, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Toast from '@/components/Toast';
import { useStore } from '@/store/useStore';
import { api } from '@gaztime/shared';
import type { PaymentMethod } from '@/types';

const paymentMethods = [
  { id: 'wallet', name: 'Wallet', icon: '💳', description: 'Pay from wallet balance' },
  { id: 'cash', name: 'Cash', icon: '💵', description: 'Pay on delivery' },
  { id: 'voucher', name: 'Voucher', icon: '🎟️', description: 'Redeem a voucher code' },
];

export function OrderProduct() {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { products, user, addOrder, selectedAddress, selectedPaymentMethod, setSelectedPaymentMethod } = useStore();
  
  const product = products.find((p) => p.id === productId);
  const deliveryAddress = user?.addresses?.find((a) => a.id === (selectedAddress || user?.addresses?.find(x => x.isDefault)?.id));
  
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const hideToast = useCallback(() => setToastMsg(null), []);

  if (!product) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Product not found</p>
          <Button onClick={() => navigate('/home')}>Go Home</Button>
        </div>
      </div>
    );
  }

  const deliveryFee = 15;
  const subtotal = product.price * quantity;
  const total = subtotal + deliveryFee;
  const estimatedTime = '25-30 minutes';

  const handleQuantityChange = (delta: number) => {
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= 10) {
      setQuantity(newQty);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedPaymentMethod || !deliveryAddress || !user) {
      return;
    }

    setLoading(true);
    
    try {
      // Create order via API
      const orderData = {
        customerId: user.id,
        channel: 'app' as const,
        items: [
          {
            productId: product.id,
            quantity,
            unitPrice: product.price,
          },
        ],
        deliveryAddressId: deliveryAddress.id,
        deliveryAddress,
        deliveryFee,
        paymentMethod: selectedPaymentMethod as PaymentMethod,
      };

      const order = await api.orders.create(orderData);
      
      // Add order to local store
      const mappedOrder: any = {
        id: order.id,
        reference: order.reference,
        status: order.status,
        items: order.items.map((item: any) => ({
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity,
        })),
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        deliveryFee: order.deliveryFee || 0,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        deliveredAt: (order as any).deliveredAt,
        estimatedDeliveryTime: (order as any).estimatedDeliveryAt,
      };
      addOrder(mappedOrder);
      
      // Navigate to order tracking
      navigate(`/track/${order.id}`);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setToastMsg({ message: err.message || 'Failed to place order. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-navy-800/95 backdrop-blur-md border-b border-navy-700">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-navy-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="font-bold text-white">Order Details</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Product Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <span className="text-5xl">⛽</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{product.name}</h2>
                <p className="text-gray-400">{product.description}</p>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="flex items-center justify-between p-4 bg-navy-800 rounded-xl">
              <span className="text-white font-medium">Quantity</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="w-10 h-10 bg-navy-700 rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-navy-600 transition-colors"
                >
                  <Minus className="w-5 h-5 text-white" />
                </button>
                <span className="text-2xl font-bold text-white w-8 text-center">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= 10}
                  className="w-10 h-10 bg-primary rounded-full flex items-center justify-center disabled:opacity-30 hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Delivery Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Delivery Address
          </h3>
          <Card interactive onClick={() => navigate('/profile/addresses')}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-white mb-1">{deliveryAddress?.label}</p>
                <p className="text-gray-400 text-sm">{deliveryAddress?.text}</p>
                {deliveryAddress?.landmark && (
                  <p className="text-gray-500 text-xs mt-1">📍 {deliveryAddress.landmark}</p>
                )}
              </div>
              <button className="text-primary text-sm font-medium hover:underline">
                Change
              </button>
            </div>
          </Card>
        </motion.div>

        {/* Estimated Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-medium text-white">Estimated Delivery</p>
                <p className="text-gray-400 text-sm">{estimatedTime}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Method
          </h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <Card
                key={method.id}
                interactive
                onClick={() => setSelectedPaymentMethod(method.id)}
                className={`${
                  selectedPaymentMethod === method.id
                    ? 'ring-2 ring-primary bg-primary/10'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{method.icon}</div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{method.name}</p>
                    <p className="text-gray-400 text-sm">{method.description}</p>
                  </div>
                  {selectedPaymentMethod === method.id && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <h3 className="text-white font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-400">
                <span>
                  {product.name} × {quantity}
                </span>
                <span>R {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Delivery Fee</span>
                <span>R {deliveryFee.toFixed(2)}</span>
              </div>
              <div className="border-t border-navy-700 pt-3 flex justify-between">
                <span className="text-white font-bold text-lg">Total</span>
                <span className="text-primary font-bold text-2xl">R {total.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-navy via-navy/95 to-transparent">
        <Button
          variant="accent"
          size="lg"
          fullWidth
          loading={loading}
          onClick={handlePlaceOrder}
          disabled={!selectedPaymentMethod}
          className="shadow-glow-lg"
        >
          <span className="text-xl font-bold">Place Order - R {total.toFixed(2)}</span>
        </Button>
        {!selectedPaymentMethod && (
          <p className="text-center text-gray-400 text-sm mt-2">
            Please select a payment method
          </p>
        )}
      </div>
      {toastMsg && <Toast message={toastMsg.message} type={toastMsg.type} onClose={hideToast} />}
    </div>
  );
}

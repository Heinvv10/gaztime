import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, CreditCard, CheckCircle2 } from 'lucide-react';
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

type CheckoutStep = 'address' | 'payment' | 'review';

export function Checkout() {
  const navigate = useNavigate();
  const {
    cart,
    products,
    user,
    selectedAddress,
    selectedPaymentMethod,
    setSelectedAddress,
    setSelectedPaymentMethod,
    addOrder,
    clearCart,
  } = useStore();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const hideToast = useCallback(() => setToastMsg(null), []);

  // Get cart items with product details
  const cartItems = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return { ...item, product };
  }).filter((item) => item.product);

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const deliveryAddress = user?.addresses?.find(
    (a) => a.id === (selectedAddress || user?.addresses?.find((x) => x.isDefault)?.id)
  );

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product!.price * item.quantity),
    0
  );
  const deliveryFee = 15;
  const total = subtotal + deliveryFee;

  const handleContinue = () => {
    if (currentStep === 'address') {
      if (!deliveryAddress) {
        setToastMsg({ message: 'Please select a delivery address', type: 'error' });
        return;
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      if (!selectedPaymentMethod) {
        setToastMsg({ message: 'Please select a payment method', type: 'error' });
        return;
      }
      setCurrentStep('review');
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
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.product!.price,
        })),
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
        items: order.items.map((item: any, idx: number) => ({
          productId: item.productId,
          productName: cartItems[idx].product!.name,
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

      // Clear cart
      clearCart();

      // Navigate to order tracking
      navigate(`/track/${order.id}`);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setToastMsg({
        message: err.message || 'Failed to place order. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {['address', 'payment', 'review'].map((step, index) => {
        const isActive = step === currentStep;
        const isCompleted =
          (step === 'address' && ['payment', 'review'].includes(currentStep)) ||
          (step === 'payment' && currentStep === 'review');

        return (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : isActive
                  ? 'bg-primary text-white'
                  : 'bg-navy-700 text-gray-500'
              }`}
            >
              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
            </div>
            {index < 2 && (
              <div
                className={`w-12 h-1 ${
                  isCompleted ? 'bg-green-500' : 'bg-navy-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 pt-6 pb-6 px-6 sticky top-0 z-20">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => {
              if (currentStep === 'address') {
                navigate('/cart');
              } else if (currentStep === 'payment') {
                setCurrentStep('address');
              } else {
                setCurrentStep('payment');
              }
            }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">Checkout</h1>
        </div>
        {stepIndicator}
      </div>

      <div className="px-6 pt-6 space-y-6">
        {/* Step 1: Address */}
        {currentStep === 'address' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Select Delivery Address
            </h2>
            <div className="space-y-3">
              {user?.addresses?.map((address) => (
                <Card
                  key={address.id}
                  interactive
                  onClick={() => setSelectedAddress(address.id)}
                  className={`${
                    selectedAddress === address.id ||
                    (!selectedAddress && address.isDefault)
                      ? 'ring-2 ring-primary bg-primary/10'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white mb-1">{address.label}</p>
                      <p className="text-gray-400 text-sm">{address.text}</p>
                      {address.landmark && (
                        <p className="text-gray-500 text-xs mt-1">📍 {address.landmark}</p>
                      )}
                    </div>
                    {(selectedAddress === address.id ||
                      (!selectedAddress && address.isDefault)) && (
                      <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Payment */}
        {currentStep === 'payment' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Select Payment Method
            </h2>
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
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Review */}
        {currentStep === 'review' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Order items */}
            <div>
              <h2 className="text-white font-semibold mb-3">Order Items</h2>
              <Card>
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex justify-between">
                      <div>
                        <p className="text-white font-medium">{item.product!.name}</p>
                        <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-primary font-semibold">
                        R {(item.product!.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Delivery address */}
            <div>
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Delivery Address
              </h2>
              <Card>
                <p className="font-medium text-white mb-1">{deliveryAddress?.label}</p>
                <p className="text-gray-400 text-sm">{deliveryAddress?.text}</p>
              </Card>
            </div>

            {/* Payment method */}
            <div>
              <h2 className="text-white font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Payment Method
              </h2>
              <Card>
                <p className="text-white font-medium">
                  {paymentMethods.find((m) => m.id === selectedPaymentMethod)?.name}
                </p>
              </Card>
            </div>

            {/* Order summary */}
            <Card>
              <h3 className="text-white font-semibold mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>R {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Delivery Fee</span>
                  <span>R {deliveryFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-navy-700 pt-3 flex justify-between">
                  <span className="text-white font-bold text-lg">Total</span>
                  <span className="text-primary font-bold text-2xl">
                    R {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-navy via-navy/95 to-transparent">
        {currentStep !== 'review' ? (
          <Button
            variant="accent"
            size="lg"
            fullWidth
            onClick={handleContinue}
            className="shadow-glow-lg"
          >
            <span className="text-xl font-bold">Continue</span>
          </Button>
        ) : (
          <Button
            variant="accent"
            size="lg"
            fullWidth
            loading={loading}
            onClick={handlePlaceOrder}
            className="shadow-glow-lg"
          >
            <span className="text-xl font-bold">Place Order - R {total.toFixed(2)}</span>
          </Button>
        )}
      </div>
      {toastMsg && <Toast message={toastMsg.message} type={toastMsg.type} onClose={hideToast} />}
    </div>
  );
}

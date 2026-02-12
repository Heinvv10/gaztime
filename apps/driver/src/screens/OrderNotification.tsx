import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Package, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../store/useStore';

export default function OrderNotification() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, acceptOrder, rejectOrder } = useStore();

  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Order Not Found</h2>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleAccept = () => {
    acceptOrder(order.id);
    navigate(`/navigate/${order.id}`);
  };

  const handleReject = () => {
    rejectOrder(order.id);
    navigate('/');
  };

  const handleCall = () => {
    window.open(`tel:${order.customer?.phone}`, '_self');
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${order.customer?.phone.replace(/^0/, '27')}`, '_blank');
  };

  return (
    <div className="min-h-screen p-4 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal/20 mb-4">
            <Package className="w-8 h-8 text-teal" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">New Delivery Request</h1>
          <p className="text-gray-400">Order {order.reference}</p>
        </div>

        {/* Timer */}
        <div className="card bg-yellow/10 border-yellow text-center">
          <Clock className="w-6 h-6 text-yellow mx-auto mb-2" />
          <div className="text-sm text-gray-300">
            Accept within <span className="font-bold text-yellow">3:00</span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Customer Details</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Name</span>
              <span className="font-semibold text-white">{order.customer?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCall}
                className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Call
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex-1 btn btn-secondary flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="card">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-teal" />
            Delivery Location
          </h3>
          <div className="space-y-2">
            <p className="text-white">{order.deliveryAddress.text}</p>
            {order.deliveryAddress.landmark && (
              <div className="bg-teal/10 border border-teal/30 rounded-lg p-3">
                <p className="text-sm text-teal">
                  <span className="font-semibold">Landmark:</span> {order.deliveryAddress.landmark}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="card">
          <h3 className="font-semibold text-white mb-3">Order Items</h3>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-dark-surface rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-teal" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {item.product?.name || 'Product'}
                    </div>
                    <div className="text-sm text-gray-400">
                      Qty: {item.quantity}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white">R{item.total}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Info */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Delivery Fee</span>
            <span className="text-white">R{order.deliveryFee}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Payment Method</span>
            <span className="text-white capitalize">{order.paymentMethod.replace('_', ' ')}</span>
          </div>
          <div className="border-t border-dark-border pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Total Amount</span>
              <span className="text-2xl font-bold text-teal">R{order.totalAmount}</span>
            </div>
          </div>
          {order.paymentStatus === 'paid' && (
            <div className="mt-3 flex items-center gap-2 text-sm text-teal">
              <CheckCircle className="w-4 h-4" />
              <span>Payment confirmed</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border p-4 space-y-3">
          <button
            onClick={handleAccept}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Accept Delivery
          </button>
          <button
            onClick={handleReject}
            className="btn btn-danger w-full flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Reject
          </button>
        </div>
      </motion.div>
    </div>
  );
}

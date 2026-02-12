import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import Toast from '../components/Toast';
import { usePodStore } from '../store/usePodStore';
import { api } from '@gaztime/shared';
import type { Order } from '@gaztime/shared';

export default function CustomerOrdersPage() {
  const navigate = useNavigate();
  const { products, customers } = usePodStore();
  const [activeTab, setActiveTab] = useState<'incoming' | 'new' | 'schedule' | 'complaints'>('incoming');
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Load and poll for incoming customer orders
  useEffect(() => {
    loadIncomingOrders();
    
    // Poll every 10 seconds for new orders
    const interval = setInterval(() => {
      loadIncomingOrders();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadIncomingOrders = async () => {
    try {
      setLoading(true);
      // Load orders from customer app (channel='app')
      const allOrders = await api.orders.list();
      const customerOrders = allOrders.filter(
        (o: Order) => o.channel === 'app' && ['created', 'confirmed'].includes(o.status)
      );
      setIncomingOrders(customerOrders);
    } catch (error) {
      console.error('Failed to load incoming orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.orders.updateStatus(orderId, 'confirmed');
      await loadIncomingOrders();
      setToast({ message: 'Order accepted! Ready for preparation.', type: 'success' });
    } catch (error) {
      console.error('Failed to accept order:', error);
      setToast({ message: 'Failed to accept order. Please try again.', type: 'error' });
    }
  };

  // New Delivery Order Form
  const [orderForm, setOrderForm] = useState({
    customerId: '',
    productId: '',
    quantity: 1,
    deliveryDate: '',
    deliveryTime: 'morning',
    address: '',
  });

  const handleSubmitOrder = () => {
    setToast({ message: `Delivery order created for ${orderForm.quantity}x ${products.find(p => p.id === orderForm.productId)?.name}`, type: 'success' });
    setOrderForm({
      customerId: '',
      productId: '',
      quantity: 1,
      deliveryDate: '',
      deliveryTime: 'morning',
      address: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/pos')}
              className="touch-target bg-gray-100 hover:bg-gray-200 p-3 rounded-xl"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-teal-500 p-3 rounded-xl">
                <Truck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Customer Orders</h1>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="grid grid-cols-4 gap-0 border-b-2 border-gray-200">
            {[
              { id: 'incoming', label: 'Incoming Orders', icon: RefreshCw, badge: incomingOrders.length },
              { id: 'new', label: 'New Delivery', icon: Truck },
              { id: 'schedule', label: 'Schedule Future', icon: Calendar },
              { id: 'complaints', label: 'Complaints', icon: AlertCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`touch-target flex items-center justify-center gap-2 font-semibold text-lg transition-all relative ${
                  activeTab === tab.id
                    ? 'bg-teal-50 text-teal-600 border-b-4 border-teal-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-8">
            {/* Incoming Orders Tab */}
            {activeTab === 'incoming' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    Incoming Customer Orders ({incomingOrders.length})
                  </h2>
                  <button
                    onClick={loadIncomingOrders}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white rounded-xl transition-colors"
                  >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {incomingOrders.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl">
                    <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-xl text-gray-600">No incoming orders</p>
                    <p className="text-gray-500 mt-2">Orders from customers will appear here automatically</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incomingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white border-2 border-teal-200 rounded-2xl p-6 shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold">Order #{order.reference}</h3>
                            <p className="text-gray-600">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                            <p className="text-gray-600 mt-1">
                              Customer ID: {order.customerId}
                            </p>
                          </div>
                          <span
                            className={`px-4 py-2 rounded-xl font-semibold ${
                              order.status === 'created'
                                ? 'bg-yellow-100 text-yellow-700'
                                : order.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {order.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="mb-4">
                          <h4 className="font-semibold mb-2">Items:</h4>
                          <ul className="space-y-2">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between bg-gray-50 p-3 rounded-xl">
                                <span>
                                  {item.quantity}x {item.product?.name || `Product ${item.productId}`}
                                </span>
                                <span className="font-semibold">
                                  R{((item.unitPrice || 0) * item.quantity).toFixed(2)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                          <p className="font-semibold mb-1">Delivery Address:</p>
                          <p className="text-gray-700">{order.deliveryAddress?.text || 'No address'}</p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200">
                          <div>
                            <p className="text-sm text-gray-600">Total Amount</p>
                            <p className="text-2xl font-bold text-teal-600">
                              R{order.totalAmount.toFixed(2)}
                            </p>
                          </div>
                          {order.status === 'created' && (
                            <button
                              onClick={() => handleAcceptOrder(order.id)}
                              className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-xl transition-colors"
                            >
                              Accept Order
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* New Delivery Tab */}
            {activeTab === 'new' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Place Delivery Order</h2>

                {/* Customer Selection */}
                <div>
                  <label className="block text-lg font-semibold mb-3">Customer</label>
                  <select
                    value={orderForm.customerId}
                    onChange={(e) => setOrderForm({ ...orderForm, customerId: e.target.value })}
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500"
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-lg font-semibold mb-3">Product</label>
                  <div className="grid grid-cols-2 gap-4">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => setOrderForm({ ...orderForm, productId: product.id })}
                        className={`touch-target p-4 rounded-xl border-2 transition-all ${
                          orderForm.productId === product.id
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-300 hover:border-teal-300'
                        }`}
                      >
                        <p className="font-bold text-lg">{product.name}</p>
                        <p className="text-gray-600">{product.sizeKg}kg - R{product.price}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-lg font-semibold mb-3">Quantity</label>
                  <input
                    type="number"
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-lg font-semibold mb-3">Delivery Address</label>
                  <textarea
                    value={orderForm.address}
                    onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500"
                    rows={3}
                    placeholder="Enter delivery address"
                  />
                </div>

                <button
                  onClick={handleSubmitOrder}
                  disabled={!orderForm.customerId || !orderForm.productId || !orderForm.address}
                  className="w-full touch-target-lg bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-xl rounded-xl"
                >
                  Submit Order for Delivery
                </button>
              </div>
            )}

            {/* Schedule Future Tab */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Schedule Future Delivery</h2>

                <div>
                  <label className="block text-lg font-semibold mb-3">Delivery Date</label>
                  <input
                    type="date"
                    value={orderForm.deliveryDate}
                    onChange={(e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value })}
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold mb-3">Time Window</label>
                  <div className="grid grid-cols-3 gap-4">
                    {['morning', 'afternoon', 'evening'].map((time) => (
                      <button
                        key={time}
                        onClick={() => setOrderForm({ ...orderForm, deliveryTime: time })}
                        className={`touch-target p-4 rounded-xl border-2 transition-all capitalize ${
                          orderForm.deliveryTime === time
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-300 hover:border-teal-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-500 rounded-xl p-6">
                  <p className="font-semibold text-lg mb-2">📅 Scheduled Delivery</p>
                  <p className="text-gray-700">
                    This order will be prepared and dispatched for delivery on the selected date.
                    Customer will receive SMS confirmation.
                  </p>
                </div>

                <button
                  className="w-full touch-target-lg bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold text-xl rounded-xl"
                  onClick={() => setToast({ message: 'Future delivery scheduled', type: 'success' })}
                >
                  Schedule Delivery
                </button>
              </div>
            )}

            {/* Complaints Tab */}
            {activeTab === 'complaints' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">Handle Complaint / Return</h2>

                <div>
                  <label className="block text-lg font-semibold mb-3">Customer Phone</label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold mb-3">Complaint Type</label>
                  <select className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500">
                    <option value="">Select type</option>
                    <option value="faulty">Faulty Cylinder</option>
                    <option value="leak">Gas Leak</option>
                    <option value="delivery">Delivery Issue</option>
                    <option value="quality">Quality Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-lg font-semibold mb-3">Description</label>
                  <textarea
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500"
                    rows={4}
                    placeholder="Describe the issue..."
                  />
                </div>

                <div className="bg-red-50 border-2 border-red-500 rounded-xl p-6">
                  <p className="font-semibold text-lg mb-2 text-red-600">⚠️ Safety First</p>
                  <p className="text-gray-700">
                    For gas leaks or safety issues, immediately isolate the cylinder and contact depot operations.
                  </p>
                </div>

                <button
                  className="w-full touch-target-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xl rounded-xl"
                  onClick={() => setToast({ message: 'Complaint logged and escalated', type: 'success' })}
                >
                  Log Complaint
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

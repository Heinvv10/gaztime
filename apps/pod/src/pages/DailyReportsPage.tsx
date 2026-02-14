import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, DollarSign, Users, Package } from 'lucide-react';
import Toast from '../components/Toast';
import { usePodStore } from '../store/usePodStore';
import { format, isToday } from 'date-fns';

export default function DailyReportsPage() {
  const navigate = useNavigate();
  const { orders } = usePodStore();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [actualCash, setActualCash] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [reconciliationSuccess, setReconciliationSuccess] = useState(false);

  // Filter today's orders
  const todayOrders = orders.filter(order => isToday(new Date(order.createdAt)));
  
  // Calculate stats
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const todayUnits = todayOrders.reduce((sum, order) => 
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );
  
  // Sales by product
  const salesByProduct = todayOrders.reduce((acc, order) => {
    order.items.forEach(item => {
      const key = item.productId;
      if (!acc[key]) {
        acc[key] = { quantity: 0, revenue: 0, product: item.product };
      }
      acc[key].quantity += item.quantity;
      acc[key].revenue += item.total;
    });
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number; product: any }>);

  // Payment method breakdown
  const paymentBreakdown = todayOrders.reduce((acc, order) => {
    const method = order.paymentMethod;
    acc[method] = (acc[method] || 0) + order.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const handleReconciliation = async () => {
    if (actualCash === '' || actualCash < 0) {
      setToast({ message: 'Please enter a valid cash amount', type: 'error' });
      return;
    }

    setSubmitting(true);

    try {
      const expectedCash = paymentBreakdown.cash || 0;
      const today = format(new Date(), 'yyyy-MM-dd');

      // Get operator ID from localStorage or auth context
      const operatorId = localStorage.getItem('userId') || 'operator_unknown';
      const podId = localStorage.getItem('podId') || 'pod_01';

      const response = await fetch(`http://172.17.0.1:3333/api/pods/${podId}/reconciliation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          date: today,
          expectedCash,
          actualCash: Number(actualCash),
          operatorId,
          notes: actualCash !== expectedCash ? `Variance: R${Math.abs(Number(actualCash) - expectedCash).toFixed(2)}` : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit reconciliation');
      }

      const result = await response.json();

      setReconciliationSuccess(true);
      setToast({
        message: `Cash reconciliation submitted! Variance: R${result.data.variance.toFixed(2)}`,
        type: result.data.variance === 0 ? 'success' : 'info'
      });

      // Clear form
      setTimeout(() => {
        setActualCash('');
        setReconciliationSuccess(false);
      }, 3000);

    } catch (error: any) {
      console.error('Reconciliation error:', error);
      setToast({
        message: error.message || 'Failed to submit reconciliation',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
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
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Daily Reports</h1>
                <p className="text-gray-600">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-teal-100 p-2 rounded-lg">
                <DollarSign className="w-6 h-6 text-teal-600" />
              </div>
              <p className="text-gray-600 font-semibold">Revenue</p>
            </div>
            <p className="text-3xl font-bold text-teal-600">R{todayRevenue}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-gray-600 font-semibold">Sales</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{todayOrders.length}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-gray-600 font-semibold">Units Sold</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{todayUnits}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-green-100 p-2 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-600 font-semibold">Customers</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{todayOrders.length}</p>
          </div>
        </div>

        {/* Sales by Product */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6">Sales by Product</h2>
          <div className="space-y-4">
            {Object.values(salesByProduct).map((item) => (
              <div key={item.product?.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-bold text-lg">{item.product?.name}</p>
                  <p className="text-gray-600">{item.quantity} units sold</p>
                </div>
                <p className="text-2xl font-bold text-teal-600">R{item.revenue}</p>
              </div>
            ))}
            {Object.keys(salesByProduct).length === 0 && (
              <p className="text-center text-gray-400 py-8">No sales today</p>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6">Payment Method Breakdown</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(paymentBreakdown).map(([method, amount]) => (
              <div key={method} className="p-4 border-2 border-gray-200 rounded-xl">
                <p className="text-gray-600 text-sm uppercase font-semibold mb-1">{method}</p>
                <p className="text-2xl font-bold text-gray-900">R{amount}</p>
              </div>
            ))}
            {Object.keys(paymentBreakdown).length === 0 && (
              <p className="col-span-2 text-center text-gray-400 py-8">No payments today</p>
            )}
          </div>
        </div>

        {/* Cash Reconciliation */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Cash Reconciliation</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
              <span className="text-lg">Expected Cash</span>
              <span className="text-2xl font-bold">R{paymentBreakdown.cash || 0}</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-yellow-50 border-2 border-yellow-500 rounded-xl">
              <span className="text-lg font-semibold">Cash Drawer Count</span>
              <input
                type="number"
                placeholder="Enter amount"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value ? Number(e.target.value) : '')}
                disabled={submitting || reconciliationSuccess}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg text-xl font-bold w-48 text-right focus:outline-none focus:border-teal-500 disabled:bg-gray-100"
              />
            </div>
            <button
              className="w-full touch-target bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={handleReconciliation}
              disabled={submitting || reconciliationSuccess || actualCash === ''}
            >
              {submitting ? 'Submitting...' : reconciliationSuccess ? '✓ Submitted' : 'Submit Reconciliation'}
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

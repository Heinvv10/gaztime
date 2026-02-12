import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, AlertTriangle, QrCode, TrendingDown } from 'lucide-react';
import Toast from '../components/Toast';
import { usePodStore } from '../store/usePodStore';
import { getPodStockLevels } from '../lib/api';

export default function StockManagementPage() {
  const navigate = useNavigate();
  const { stock, products, receiveStock } = usePodStore();
  const [showReceive, setShowReceive] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [receiveQty, setReceiveQty] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Fetch stock levels on mount
  useEffect(() => {
    const fetchStock = async () => {
      try {
        await getPodStockLevels();
        // TODO: Update local store with API data when setStock method is added
      } catch (err) {
        console.error('Failed to fetch stock:', err);
      }
    };
    fetchStock();
  }, []);

  const handleReceive = () => {
    if (selectedProduct && receiveQty) {
      receiveStock(selectedProduct, parseInt(receiveQty));
      setShowReceive(false);
      setSelectedProduct(null);
      setReceiveQty('');
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { color: 'red', label: 'Out of Stock' };
    if (quantity < 5) return { color: 'yellow', label: 'Low Stock' };
    return { color: 'green', label: 'In Stock' };
  };

  const lowStockItems = stock.filter(s => s.quantity < 5);
  const totalValue = stock.reduce((sum, s) => {
    const product = products.find(p => p.id === s.productId);
    return sum + (product?.price || 0) * s.quantity;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/pos')}
                className="touch-target bg-gray-100 hover:bg-gray-200 p-3 rounded-xl"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-teal-500 p-3 rounded-xl">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold">Stock Management</h1>
              </div>
            </div>
            <button
              onClick={() => setShowReceive(true)}
              className="touch-target bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              Receive Stock
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <p className="text-gray-600 text-lg mb-2">Total Stock Value</p>
            <p className="text-4xl font-bold text-teal-600">R{totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <p className="text-gray-600 text-lg mb-2">Total Items</p>
            <p className="text-4xl font-bold text-gray-900">
              {stock.reduce((sum, s) => sum + s.quantity, 0)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <p className="text-gray-600 text-lg mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Low Stock Alerts
            </p>
            <p className="text-4xl font-bold text-yellow-600">{lowStockItems.length}</p>
          </div>
        </div>

        {/* Stock Levels */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Current Stock Levels</h2>
          <div className="space-y-4">
            {stock.map((item) => {
              const product = products.find(p => p.id === item.productId);
              if (!product) return null;
              
              const status = getStockStatus(item.quantity);
              const percentage = Math.min((item.quantity / 20) * 100, 100);

              return (
                <div key={item.productId} className="border-2 border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{product.name}</h3>
                      <p className="text-gray-600">{product.sizeKg}kg - R{product.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{item.quantity}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold bg-${status.color}-100 text-${status.color}-600`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Visual Stock Gauge */}
                  <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full transition-all bg-${status.color}-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  {item.quantity < 5 && (
                    <div className="mt-3 flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-semibold">Reorder needed</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Return Empties */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-gray-600" />
            Return Empty Cylinders
          </h2>
          <p className="text-gray-600 mb-4">Log returned empty cylinders for depot collection</p>
          <button
            className="touch-target bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold px-6 py-3 rounded-xl"
            onClick={() => setToast({ message: 'Empty cylinder return log coming soon', type: 'info' })}
          >
            Log Empty Returns
          </button>
        </div>
      </div>

      {/* Receive Stock Modal */}
      {showReceive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
            <h2 className="text-3xl font-bold mb-6">Receive Stock from Depot</h2>
            
            <div className="space-y-6">
              {/* Product Selection */}
              <div>
                <label className="block text-lg font-semibold mb-3">Select Product</label>
                <div className="grid grid-cols-2 gap-4">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product.id)}
                      className={`touch-target p-4 rounded-xl border-2 transition-all ${
                        selectedProduct === product.id
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-300 hover:border-teal-300'
                      }`}
                    >
                      <p className="font-bold text-lg">{product.name}</p>
                      <p className="text-gray-600">{product.sizeKg}kg</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity Input */}
              {selectedProduct && (
                <div>
                  <label className="block text-lg font-semibold mb-3">Quantity Received</label>
                  <input
                    type="number"
                    value={receiveQty}
                    onChange={(e) => setReceiveQty(e.target.value)}
                    className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500"
                    placeholder="Enter quantity"
                    min="1"
                  />
                </div>
              )}

              {/* Mock Scanner */}
              <button
                className="w-full touch-target bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold flex items-center justify-center gap-2"
                onClick={() => setToast({ message: 'QR Scanner coming soon', type: 'info' })}
              >
                <QrCode className="w-5 h-5" />
                Scan Incoming Cylinders
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setShowReceive(false);
                  setSelectedProduct(null);
                  setReceiveQty('');
                }}
                className="flex-1 touch-target bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleReceive}
                disabled={!selectedProduct || !receiveQty}
                className="flex-1 touch-target bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl"
              >
                Confirm Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

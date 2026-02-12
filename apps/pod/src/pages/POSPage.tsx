import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ShoppingCart, User, Search, CreditCard, Wallet, Smartphone, Ticket, LogOut } from 'lucide-react';
import { usePodStore } from '../store/usePodStore';
import type { PaymentMethod } from '@gaztime/shared';

export default function POSPage() {
  const navigate = useNavigate();
  const [phoneSearch, setPhoneSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  const {
    products,
    cart,
    selectedCustomer,
    paymentMethod,
    operator,
    pod,
    stock,
    addToCart,
    removeFromCart,
    selectCustomer,
    setPaymentMethod,
    findCustomerByPhone,
    logout,
  } = usePodStore();

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCustomerSearch = async () => {
    if (!phoneSearch) return;

    setSearching(true);
    setSearchError('');

    try {
      // Format phone to E.164 if needed
      const formattedPhone = phoneSearch.startsWith('+') 
        ? phoneSearch 
        : phoneSearch.startsWith('0') 
        ? `+27${phoneSearch.substring(1)}`
        : `+27${phoneSearch}`;

      // First check local store, then try API
      let customer = await findCustomerByPhone(formattedPhone);
      
      if (!customer) {
        setSearchError('Customer not found. Register them first.');
        return;
      }

      selectCustomer(customer);
      setPhoneSearch('');
    } catch (err: any) {
      console.error('Customer search error:', err);
      setSearchError(err.message || 'Failed to search customer');
    } finally {
      setSearching(false);
    }
  };

  const handleCheckout = () => {
    if (cart.length > 0 && paymentMethod) {
      navigate('/sale-confirmation');
    }
  };

  const getStockLevel = (productId: string) => {
    const found = stock.find(s => s.productId === productId);
    // If no stock data available (API didn't return pod-level stock), assume available
    return found ? found.quantity : -1; // -1 = no data (available)
  };

  const paymentMethods: { method: PaymentMethod; icon: any; label: string }[] = [
    { method: 'cash', icon: CreditCard, label: 'Cash' },
    { method: 'mobile_money', icon: Smartphone, label: 'Mobile' },
    { method: 'voucher', icon: Ticket, label: 'Voucher' },
    { method: 'wallet', icon: Wallet, label: 'Wallet' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="bg-teal-500 p-3 rounded-xl">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{pod.name}</h1>
              <p className="text-gray-600">Operator: {operator?.name}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="touch-target bg-red-100 text-red-600 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-red-200"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl mx-auto w-full gap-6 p-6">
        {/* Left Side - Products & Customer */}
        <div className="flex-1 space-y-6">
          {/* Customer Search */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <User className="w-6 h-6 text-teal-500" />
              Customer
            </h2>
            {selectedCustomer ? (
              <div className="bg-teal-50 border-2 border-teal-500 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">{selectedCustomer.name}</p>
                  <p className="text-gray-600">{selectedCustomer.phone}</p>
                </div>
                <button
                  onClick={() => selectCustomer(null)}
                  className="text-teal-600 font-semibold hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <input
                    type="tel"
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                    placeholder="Enter phone number"
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500"
                    data-testid="customer-phone-input"
                  />
                  <button
                    onClick={handleCustomerSearch}
                    disabled={searching || !phoneSearch}
                    className="touch-target bg-teal-500 text-white px-6 rounded-xl font-semibold hover:bg-teal-600 disabled:bg-gray-300 flex items-center gap-2"
                    data-testid="customer-search-btn"
                  >
                    <Search className="w-5 h-5" />
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                  <button
                    onClick={() => navigate('/customer-registration')}
                    className="touch-target bg-yellow-500 text-gray-900 px-6 rounded-xl font-semibold hover:bg-yellow-600"
                  >
                    New
                  </button>
                </div>
                {searchError && (
                  <p className="text-red-500 text-sm">{searchError}</p>
                )}
              </div>
            )}
          </div>

          {/* Quick Sell Products */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Quick Sell</h2>
            <div className="grid grid-cols-2 gap-4">
              {products.map((product) => {
                const stockLevel = getStockLevel(product.id);
                const hasStockData = stockLevel >= 0;
                const isLowStock = hasStockData && stockLevel < 5;
                const isOutOfStock = hasStockData && stockLevel === 0;

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    disabled={isOutOfStock}
                    className={`touch-target-lg p-6 rounded-2xl text-left transition-all ${
                      isOutOfStock
                        ? 'bg-gray-100 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 active:scale-95 shadow-lg'
                    }`}
                    data-testid={`product-${product.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Flame className="w-10 h-10 text-white" />
                      <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                        isOutOfStock
                          ? 'bg-red-500 text-white'
                          : isLowStock
                          ? 'bg-yellow-500 text-gray-900'
                          : 'bg-white text-teal-600'
                      }`}>
                        {hasStockData ? stockLevel : '∞'}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-1">{product.sizeKg}kg</h3>
                    <p className="text-3xl font-bold text-yellow-400">R{product.price}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side - Cart & Payment */}
        <div className="w-96 space-y-6">
          {/* Cart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-teal-500" />
              Cart ({cart.length})
            </h2>
            {cart.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No items in cart</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-xl"
                  >
                    <div className="flex-1">
                      <p className="font-bold">{item.product.name}</p>
                      <p className="text-gray-600">
                        R{item.product.price} x {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        R{item.product.price * item.quantity}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method */}
          {cart.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map(({ method, icon: Icon, label }) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`touch-target p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === method
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-300 hover:border-teal-300'
                    }`}
                    data-testid={`payment-${method}`}
                  >
                    <Icon className={`w-8 h-8 ${paymentMethod === method ? 'text-teal-600' : 'text-gray-600'}`} />
                    <span className={`font-semibold ${paymentMethod === method ? 'text-teal-600' : 'text-gray-600'}`}>
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Checkout */}
          {cart.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-2xl font-bold">Total</span>
                <span className="text-4xl font-bold text-teal-600">R{cartTotal}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={!paymentMethod}
                className="w-full touch-target-lg bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 font-bold text-xl rounded-xl transition-all"
                data-testid="checkout-btn"
              >
                Complete Sale
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t-2 border-gray-200 p-4">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-4">
          {[
            { label: 'Stock', path: '/stock' },
            { label: 'Reports', path: '/reports' },
            { label: 'Orders', path: '/orders' },
            { label: 'Shift', path: '/shift' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="touch-target bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-lg"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, ShoppingCart, User, Search, CreditCard, Wallet, Smartphone, Ticket, LogOut, Trash2 } from 'lucide-react';
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
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCustomerSearch = async () => {
    if (!phoneSearch) return;
    setSearching(true);
    setSearchError('');
    try {
      const formattedPhone = phoneSearch.startsWith('+')
        ? phoneSearch
        : phoneSearch.startsWith('0')
        ? `+27${phoneSearch.substring(1)}`
        : `+27${phoneSearch}`;
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
    return found ? found.quantity : -1;
  };

  const paymentMethods: { method: PaymentMethod; icon: any; label: string }[] = [
    { method: 'cash', icon: CreditCard, label: 'Cash' },
    { method: 'mobile_money', icon: Smartphone, label: 'Mobile' },
    { method: 'voucher', icon: Ticket, label: 'Voucher' },
    { method: 'wallet', icon: Wallet, label: 'Wallet' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header - compact on mobile */}
      <header className="bg-white shadow-sm px-3 py-2 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="bg-teal-500 p-2 sm:p-3 rounded-xl shrink-0">
              <Flame className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-2xl font-bold text-gray-900 truncate">{pod.name}</h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">Op: {operator?.name}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="bg-red-100 text-red-600 px-3 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold text-sm sm:text-base flex items-center gap-1 hover:bg-red-200 shrink-0"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full gap-3 sm:gap-6 p-3 sm:p-6 pb-20 lg:pb-6">
        {/* Left Side - Products & Customer */}
        <div className="flex-1 space-y-3 sm:space-y-6">
          {/* Customer Search - compact */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-3 sm:p-6">
            <h2 className="text-sm sm:text-xl font-bold mb-2 sm:mb-4 flex items-center gap-2">
              <User className="w-4 h-4 sm:w-6 sm:h-6 text-teal-500" />
              Customer
            </h2>
            {selectedCustomer ? (
              <div className="bg-teal-50 border-2 border-teal-500 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm sm:text-lg">{selectedCustomer.name}</p>
                  <p className="text-gray-600 text-xs sm:text-base">{selectedCustomer.phone}</p>
                </div>
                <button onClick={() => selectCustomer(null)} className="text-teal-600 font-semibold text-sm hover:underline">
                  Change
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomerSearch()}
                    placeholder="Phone number"
                    className="flex-1 min-w-0 px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-300 rounded-xl text-sm sm:text-lg focus:outline-none focus:border-teal-500"
                    data-testid="customer-phone-input"
                  />
                  <button
                    onClick={handleCustomerSearch}
                    disabled={searching || !phoneSearch}
                    className="bg-teal-500 text-white px-3 sm:px-6 rounded-xl font-semibold hover:bg-teal-600 disabled:bg-gray-300 flex items-center gap-1 shrink-0"
                    data-testid="customer-search-btn"
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">{searching ? '...' : 'Search'}</span>
                  </button>
                  <button
                    onClick={() => navigate('/customer-registration')}
                    className="bg-yellow-500 text-gray-900 px-3 sm:px-6 rounded-xl font-semibold hover:bg-yellow-600 shrink-0 text-sm sm:text-base"
                  >
                    New
                  </button>
                </div>
                {searchError && <p className="text-red-500 text-xs sm:text-sm">{searchError}</p>}
              </div>
            )}
          </div>

          {/* Quick Sell Products - responsive grid */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-3 sm:p-6">
            <h2 className="text-sm sm:text-xl font-bold mb-2 sm:mb-4">Quick Sell</h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
              {products.map((product) => {
                const stockLevel = getStockLevel(product.id);
                const hasStockData = stockLevel >= 0;
                const isLowStock = hasStockData && stockLevel < 5;
                const isOutOfStock = hasStockData && stockLevel === 0;
                const inCart = cart.find(c => c.product.id === product.id);

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && addToCart(product)}
                    disabled={isOutOfStock}
                    className={`relative p-3 sm:p-5 rounded-xl sm:rounded-2xl text-left transition-all ${
                      isOutOfStock
                        ? 'bg-gray-100 cursor-not-allowed opacity-50'
                        : inCart
                        ? 'bg-gradient-to-br from-teal-600 to-teal-700 shadow-lg ring-2 ring-yellow-400'
                        : 'bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 active:scale-95 shadow-md'
                    }`}
                    data-testid={`product-${product.id}`}
                  >
                    {inCart && (
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow">
                        {inCart.quantity}
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-1">
                      <Flame className="w-5 h-5 sm:w-8 sm:h-8 text-white/80" />
                      {hasStockData && (
                        <span className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-bold ${
                          isOutOfStock ? 'bg-red-500 text-white' : isLowStock ? 'bg-yellow-500 text-gray-900' : 'bg-white/20 text-white'
                        }`}>
                          {stockLevel}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-2xl font-bold text-white">{product.sizeKg}kg</h3>
                    <p className="text-lg sm:text-2xl font-bold text-yellow-400">R{product.price}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cart section - inline on mobile, sidebar on desktop */}
          <div className="lg:hidden space-y-3">
            {cart.length > 0 && (
              <>
                {/* Cart items */}
                <div className="bg-white rounded-xl shadow-md p-3">
                  <h2 className="text-sm font-bold mb-2 flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-teal-500" />
                    Cart ({cartCount} items)
                  </h2>
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{item.product.sizeKg}kg</span>
                          <span className="text-gray-500 text-xs">×{item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">R{item.product.price * item.quantity}</span>
                          <button onClick={() => removeFromCart(item.product.id)} className="text-red-400 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-white rounded-xl shadow-md p-3">
                  <h2 className="text-sm font-bold mb-2">Payment</h2>
                  <div className="grid grid-cols-4 gap-2">
                    {paymentMethods.map(({ method, icon: Icon, label }) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                          paymentMethod === method
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-teal-300'
                        }`}
                        data-testid={`payment-${method}`}
                      >
                        <Icon className={`w-5 h-5 ${paymentMethod === method ? 'text-teal-600' : 'text-gray-500'}`} />
                        <span className={`text-[10px] font-semibold ${paymentMethod === method ? 'text-teal-600' : 'text-gray-500'}`}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side - Cart & Payment (desktop only) */}
        <div className="hidden lg:block w-96 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-teal-500" />
              Cart ({cartCount})
            </h2>
            {cart.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No items in cart</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                    <div className="flex-1">
                      <p className="font-bold">{item.product.name}</p>
                      <p className="text-gray-600">R{item.product.price} × {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">R{item.product.price * item.quantity}</p>
                      <button onClick={() => removeFromCart(item.product.id)} className="text-red-500 text-sm hover:underline">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map(({ method, icon: Icon, label }) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      paymentMethod === method
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-300 hover:border-teal-300'
                    }`}
                    data-testid={`payment-${method}`}
                  >
                    <Icon className={`w-8 h-8 ${paymentMethod === method ? 'text-teal-600' : 'text-gray-600'}`} />
                    <span className={`font-semibold ${paymentMethod === method ? 'text-teal-600' : 'text-gray-600'}`}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {cart.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-2xl font-bold">Total</span>
                <span className="text-4xl font-bold text-teal-600">R{cartTotal}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={!paymentMethod}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 font-bold text-xl rounded-xl transition-all"
                data-testid="checkout-btn"
              >
                Complete Sale
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating checkout bar - mobile only */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-14 left-0 right-0 bg-white border-t shadow-2xl px-3 py-2 z-40">
          <button
            onClick={handleCheckout}
            disabled={!paymentMethod}
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-gray-900 font-bold text-base rounded-xl transition-all flex items-center justify-center gap-2"
            data-testid="checkout-btn"
          >
            <ShoppingCart className="w-5 h-5" />
            Pay R{cartTotal}
            {!paymentMethod && <span className="text-xs font-normal ml-1">(select payment)</span>}
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="bg-white border-t-2 border-gray-200 px-3 py-2 sm:p-4 fixed bottom-0 left-0 right-0 lg:relative z-50">
        <div className="max-w-7xl mx-auto grid grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: 'Stock', path: '/stock' },
            { label: 'Reports', path: '/reports' },
            { label: 'Orders', path: '/orders' },
            { label: 'Shift', path: '/shift' },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="bg-gray-100 hover:bg-gray-200 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-lg py-2 sm:py-3"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, RotateCcw, Bell, MapPin, Flame } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';

export function Home() {
  const navigate = useNavigate();
  const { user, products, orders, isOnline, loadProducts, loadOrders } = useStore();

  // Load products and orders on mount
  useEffect(() => {
    loadProducts();
    loadOrders();
  }, [loadProducts, loadOrders]);

  const lastOrder = orders.find((o) => o.status === 'delivered');

  const handleProductClick = (productId: string) => {
    navigate(`/order/${productId}`);
  };

  const handleReorder = () => {
    if (lastOrder && lastOrder.items?.length > 0) {
      navigate(`/order/${lastOrder.items[0].productId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 pb-20">
      {/* Offline banner */}
      {!isOnline && (
        <div className="offline-banner">
          ⚠️ You're offline. Some features may not be available.
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 pt-6 pb-8 px-6 rounded-b-3xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-primary-100 text-sm">Welcome back</p>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Hi {user?.name?.split(' ')[0]} 👋
            </h1>
          </div>
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <Bell className="w-6 h-6 text-white" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full"></span>
          </button>
        </div>

        {/* Delivery address */}
        <button
          onClick={() => navigate('/profile/addresses')}
          className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <MapPin className="w-4 h-4" />
          <span className="text-sm">
            {user?.addresses?.find((a) => a.isDefault)?.text || 'No address set'}
          </span>
        </button>
      </div>

      <div className="px-6 -mt-6 space-y-6">
        {/* Wallet Card */}
        <Card
          variant="gradient"
          interactive
          onClick={() => navigate('/wallet')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Wallet Balance</p>
              <p className="text-3xl font-bold text-white">
                R {user?.walletBalance.toFixed(2)}
              </p>
            </div>
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-white/80 text-sm">Tap to top up or view transactions</p>
          </div>
        </Card>

        {/* Quick reorder */}
        {lastOrder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card interactive onClick={handleReorder}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                    <RotateCcw className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Reorder Last</p>
                    <p className="text-sm text-gray-400">
                      {lastOrder.items?.length > 0 ? lastOrder.items[0].productName : 'Previous order'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">R {lastOrder.totalAmount}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Products Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Flame className="w-6 h-6 text-primary" />
              Order Gas
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card interactive onClick={() => handleProductClick(product.id)}>
                  <div className="flex items-center gap-4">
                    {/* Product icon */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center">
                        <span className="text-4xl">⛽</span>
                      </div>
                    </div>

                    {/* Product info */}
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">
                        {product.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">
                          R {product.price}
                        </span>
                        {product.inStock ? (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                            In Stock
                          </span>
                        ) : (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="text-gray-400">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Promo banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="bg-gradient-to-r from-accent to-accent-600 rounded-2xl p-6 text-navy shadow-xl">
            <h3 className="font-bold text-xl mb-2">🎉 Refer & Earn!</h3>
            <p className="mb-4 text-navy/80">
              Get R20 for every friend who joins Gaz Time
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/referrals')}
              className="border-navy text-navy hover:bg-navy hover:text-accent"
            >
              Share Your Code
            </Button>
          </div>
        </motion.div>

        {/* Safety tip */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="text-2xl">🛡️</div>
            <div>
              <h4 className="font-semibold text-white mb-1">Safety First</h4>
              <p className="text-sm text-gray-400 mb-3">
                Always check the cylinder condition and ensure proper ventilation when using LPG.
              </p>
              <button
                onClick={() => navigate('/safety')}
                className="text-primary text-sm font-medium hover:underline"
              >
                Read Safety Tips →
              </button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

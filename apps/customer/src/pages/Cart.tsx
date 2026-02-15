import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';

export function Cart() {
  const navigate = useNavigate();
  const { cart, products, addToCart, removeFromCart, clearCart } = useStore();

  // Get product details for cart items
  const cartItems = cart.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      ...item,
      product,
    };
  }).filter((item) => item.product); // Remove items with no product found

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.product!.price * item.quantity),
    0
  );

  const deliveryFee = cartItems.length > 0 ? 15 : 0;
  const total = subtotal + deliveryFee;

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(productId);
    } else if (newQty <= 10) {
      // Remove old and add new quantity
      removeFromCart(productId);
      addToCart(productId, newQty);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeFromCart(productId);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 pt-6 pb-4 px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">My Cart</h1>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-col items-center justify-center px-6 pt-20">
          <div className="w-32 h-32 bg-navy-800 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-16 h-16 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Your cart is empty</h2>
          <p className="text-gray-400 text-center mb-8">
            Add some gas cylinders to get started!
          </p>
          <Button onClick={() => navigate('/shop')} variant="primary" size="lg">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 pt-6 pb-4 px-6 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white">My Cart</h1>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-white/80 hover:text-white text-sm font-medium"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="px-6 pt-6 space-y-4">
        {/* Cart items */}
        {cartItems.map((item, index) => (
          <motion.div
            key={item.productId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <div className="flex items-start gap-4">
                {/* Product image */}
                <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-4xl">⛽</span>
                </div>

                {/* Product details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg mb-1">
                    {item.product!.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">
                    R {item.product!.price} each
                  </p>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, -1)}
                      className="w-8 h-8 bg-navy-700 rounded-full flex items-center justify-center hover:bg-navy-600 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-white font-semibold min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.productId, 1)}
                      disabled={item.quantity >= 10}
                      className="w-8 h-8 bg-primary rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Price and remove */}
                <div className="flex flex-col items-end gap-2">
                  <p className="text-primary font-bold text-lg">
                    R {(item.product!.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => handleRemoveItem(item.productId)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Order summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <h3 className="text-white font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
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

        {/* Delivery info */}
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
          <p className="text-accent text-sm">
            ⚡ Delivery in 25-30 minutes
          </p>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-navy via-navy/95 to-transparent">
        <Button
          variant="accent"
          size="lg"
          fullWidth
          onClick={handleCheckout}
          className="shadow-glow-lg"
        >
          <span className="text-xl font-bold">Proceed to Checkout</span>
        </Button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';

export function Shop() {
  const navigate = useNavigate();
  const { products, cart, addToCart, loadProducts } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'daily', name: 'Daily (1kg)' },
    { id: 'weekly', name: 'Weekly (3kg)' },
    { id: 'standard', name: 'Standard (9kg)' },
    { id: 'bulk', name: 'Bulk (48kg)' },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedCategory === 'all') return matchesSearch;

    // Filter by size/category
    if (selectedCategory === 'daily') return matchesSearch && product.sizeKg === 1;
    if (selectedCategory === 'weekly') return matchesSearch && product.sizeKg === 3;
    if (selectedCategory === 'standard') return matchesSearch && product.sizeKg === 9;
    if (selectedCategory === 'bulk') return matchesSearch && product.sizeKg === 48;

    return matchesSearch;
  });

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(productId, 1);
  };

  const handleProductClick = (productId: string) => {
    // Navigate to product detail or add to cart directly
    navigate(`/order/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 pt-6 pb-6 px-6 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-white">Shop Gas</h1>
          <button
            onClick={() => navigate('/cart')}
            className="relative p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-xs font-bold text-navy">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <div className="px-6 pt-6 space-y-6">
        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-navy-800 text-gray-400 hover:bg-navy-700'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No products found</p>
            <Button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
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
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg mb-1">
                        {product.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2 truncate">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
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

                    {/* Add to cart button */}
                    <button
                      onClick={(e) => handleAddToCart(product.id, e)}
                      disabled={!product.inStock}
                      className="flex-shrink-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

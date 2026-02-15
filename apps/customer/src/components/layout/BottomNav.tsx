import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, Package, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

const navItems = [
  { to: '/home', icon: Home, label: 'Home' },
  { to: '/shop', icon: ShoppingBag, label: 'Shop' },
  { to: '/cart', icon: ShoppingCart, label: 'Cart', showBadge: true },
  { to: '/orders', icon: Package, label: 'Orders' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export function BottomNav() {
  const { cart } = useStore();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-navy-800 border-t border-navy-700 bottom-nav z-40">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-w-touch flex-1 transition-colors ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="relative"
                >
                  <item.icon className="w-6 h-6" />
                  {item.showBadge && cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-2 w-4 h-4 bg-accent rounded-full flex items-center justify-center text-[10px] font-bold text-navy">
                      {cartItemCount}
                    </span>
                  )}
                </motion.div>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-px left-0 right-0 h-0.5 bg-primary"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Package, ShieldCheck, TrendingUp, Menu } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isOnline, vehicleStock, driver } = useStore();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/stock', icon: Package, label: 'Stock' },
    { path: '/safety', icon: ShieldCheck, label: 'Safety' },
    { path: '/earnings', icon: TrendingUp, label: 'Earnings' },
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Status Bar */}
      <div className="bg-dark-surface border-b border-dark-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-teal' : 'bg-gray-500'} animate-pulse`} />
          <span className="text-sm font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-teal" />
            <span className="font-semibold">{vehicleStock.length}</span>
          </div>
          <div className="text-yellow font-semibold">
            R{driver?.todayEarnings || 0}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg min-w-[64px] ${
                  isActive ? 'text-teal' : 'text-gray-400'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

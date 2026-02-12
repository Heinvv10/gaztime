import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  MapPin,
  CreditCard,
  Globe,
  Bell,
  Shield,
  Gift,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';

const menuSections = [
  {
    title: 'Account',
    items: [
      { icon: User, label: 'Personal Information', to: '/profile/personal' },
      { icon: MapPin, label: 'Delivery Addresses', to: '/profile/addresses' },
      { icon: CreditCard, label: 'Payment Methods', to: '/profile/payments' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: Globe, label: 'Language', to: '/profile/language' },
      { icon: Bell, label: 'Notifications', to: '/profile/notifications' },
    ],
  },
  {
    title: 'More',
    items: [
      { icon: Gift, label: 'Referrals', to: '/referrals' },
      { icon: Shield, label: 'Safety Information', to: '/safety' },
      { icon: HelpCircle, label: 'Help & Support', to: '/help' },
    ],
  },
];

export function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useStore();

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      navigate('/auth/phone', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 pt-6 pb-16 px-6 rounded-b-3xl shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-8">Profile</h1>
        
        {/* User card */}
        <motion.div
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-accent to-accent-700 rounded-full flex items-center justify-center text-3xl font-bold text-navy shadow-lg">
              {user?.name?.[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{user?.name}</h2>
              <p className="text-white/80">{user?.phone}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Menu sections */}
      <div className="px-6 -mt-8 space-y-6">
        {menuSections.map((section, sectionIndex) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3 px-2">
              {section.title}
            </h3>
            <Card>
              <div className="divide-y divide-navy-700">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => navigate(item.to)}
                      className="w-full flex items-center gap-4 py-4 first:pt-0 last:pb-0 hover:opacity-70 transition-opacity group"
                    >
                      <div className="w-10 h-10 bg-navy-800 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="flex-1 text-left font-medium text-white">
                        {item.label}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
                    </button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        ))}

        {/* Logout button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            variant="ghost"
            fullWidth
            onClick={handleLogout}
            className="border border-red-500/20 text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </motion.div>

        {/* App info */}
        <motion.div
          className="text-center text-gray-500 text-sm space-y-1 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p>Gaz Time Customer App</p>
          <p>Version 1.0.0</p>
        </motion.div>
      </div>
    </div>
  );
}

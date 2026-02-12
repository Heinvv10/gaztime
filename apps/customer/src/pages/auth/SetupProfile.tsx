import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useStore } from '@/store/useStore';
import { api } from '@gaztime/shared';

export function SetupProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '';
  
  const { setAuthenticated } = useStore();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    landmark: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create customer via API
      const customerData = {
        phone,
        name: formData.name,
        addresses: [
          {
            label: 'Home',
            text: formData.address,
            landmark: formData.landmark || undefined,
            isDefault: true,
          },
        ],
        language: 'en',
      };

      const customer = await api.customers.create(customerData);

      // Map Customer to User type and save to store
      const user = {
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
        addresses: customer.addresses,
        walletBalance: customer.walletBalance,
        referralCode: customer.referralCode,
        language: (customer as any).languagePreference || 'en',
        createdAt: customer.createdAt,
      };

      setAuthenticated(true, user, `token-${customer.id}`);
      navigate('/home', { replace: true });
    } catch (err: any) {
      console.error('Profile setup error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 p-6">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Profile</h1>
          <p className="text-gray-400">Just a few more details to get started</p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  placeholder="e.g., Thandi Mkhize"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Delivery Address
                </label>
                <textarea
                  id="address"
                  className="input resize-none h-24"
                  placeholder="e.g., 47 Main Road, Your Suburb, City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              {/* Landmark */}
              <div>
                <label htmlFor="landmark" className="block text-sm font-medium text-gray-300 mb-2">
                  Landmark (Optional)
                </label>
                <input
                  id="landmark"
                  type="text"
                  className="input"
                  placeholder="e.g., Near the blue tuck shop on 3rd street"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                />
                <p className="mt-2 text-xs text-gray-400">
                  Help our drivers find you easily
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
              >
                Complete Setup
              </Button>
            </form>
          </Card>
        </motion.div>

        {/* Info card */}
        <motion.div
          className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm text-gray-300">
            💡 <span className="font-medium">Tip:</span> You can add multiple addresses and update your details anytime in your profile.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

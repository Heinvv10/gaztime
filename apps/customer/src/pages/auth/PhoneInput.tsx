import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { api } from '@gaztime/shared';

export function PhoneInput() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (phone.length < 10) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Format phone to E.164 format for API
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('0') 
        ? `+27${cleanPhone.substring(1)}` 
        : `+27${cleanPhone}`;
      
      // Check if customer exists
      try {
        const customer = await api.customers.getByPhone(formattedPhone);
        // Customer exists, go to OTP with existing customer flag
        navigate('/auth/verify-otp', { 
          state: { 
            phone: formattedPhone, 
            isExisting: true,
            customerId: customer.id 
          } 
        });
      } catch (apiError: any) {
        // Customer not found (404), proceed to registration
        if (apiError.status === 404) {
          navigate('/auth/verify-otp', { 
            state: { 
              phone: formattedPhone, 
              isExisting: false 
            } 
          });
        } else {
          throw apiError;
        }
      }
    } catch (err: any) {
      console.error('Phone lookup error:', err);
      setError(err.message || 'Failed to verify phone number');
    } finally {
      setLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as: 072 123 4567
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Phone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Gaz Time</h1>
          <p className="text-gray-400">Enter your phone number to get started</p>
        </motion.div>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-400">+27</span>
                </div>
                <input
                  id="phone"
                  type="tel"
                  className="input pl-14"
                  placeholder="072 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  maxLength={12}
                  required
                />
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-400">
                  {error}
                </p>
              )}
              {!error && (
                <p className="mt-2 text-xs text-gray-400">
                  We'll send you a verification code via SMS
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={phone.replace(/\D/g, '').length < 10}
            >
              Continue
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="text-center text-gray-400 text-sm mt-8">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useStore } from '@/store/useStore';
import { api } from '@gaztime/shared';

export function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '';
  const isExisting = location.state?.isExisting || false;
  const customerId = location.state?.customerId;
  
  const { setAuthenticated } = useStore();
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (code?: string) => {
    const otpCode = code || otp.join('');
    
    if (otpCode.length !== 6) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Mock OTP validation (any 6 digits works)
      // In production, this would be validated server-side
      
      if (isExisting && customerId) {
        // Existing customer - fetch their data and log them in
        try {
          const customer = await api.customers.getById(customerId);
          
          // Map Customer to User type
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
          navigate('/');
        } catch (apiError: any) {
          console.error('Failed to fetch customer:', apiError);
          setError(apiError.message || 'Failed to load your account');
        }
      } else {
        // New customer - go to profile setup
        navigate('/auth/setup-profile', { state: { phone, isNewUser: true } });
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setResendTimer(60);
    // Mock resend API call
    
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Icon */}
        <motion.div
          className="text-center mb-8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-accent to-accent-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Shield className="w-10 h-10 text-navy" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Verify Your Number</h1>
          <p className="text-gray-400">
            We sent a code to{' '}
            <span className="text-primary font-medium">+27 {phone}</span>
          </p>
        </motion.div>

        {/* OTP Input */}
        <Card>
          <div className="space-y-6">
            <div className="flex justify-center gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  className="w-12 h-14 text-center text-2xl font-bold bg-navy-800 border-2 border-navy-600 rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                />
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">
                {error}
              </p>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              onClick={() => handleSubmit()}
              disabled={otp.some((digit) => digit === '')}
            >
              Verify
            </Button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-gray-400 text-sm">
                  Resend code in <span className="text-primary font-medium">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-primary hover:text-primary-400 transition-colors text-sm font-medium"
                >
                  Resend Code
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Help text */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Didn't receive the code?{' '}
          <a href="/help" className="text-primary hover:underline">
            Get help
          </a>
        </p>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Phone, Lock, Fingerprint } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useStore((state) => state.login);
  const [phone, setPhone] = useState('0765432109');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(phone, pin);
      if (success) {
        navigate('/', { replace: true });
      } else {
        setError('Invalid phone number or PIN');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometric = () => {
    // Mock biometric auth
    login('0765432109', '1234').then((success) => {
      if (success) navigate('/', { replace: true });
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal/10 border-2 border-teal">
            <Flame className="w-10 h-10 text-teal" />
          </div>
          <h1 className="text-3xl font-bold text-white">Gaz Time Driver</h1>
          <p className="text-gray-400">Sign in to start your shift</p>
        </div>

        {/* Login Form */}
        <motion.form
          onSubmit={handleLogin}
          className="card space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input pl-12"
                  placeholder="0765432109"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                PIN
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="input pl-12"
                  placeholder="••••"
                  maxLength={4}
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-500/10 border border-red-500 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dark-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-dark-card text-gray-400">Or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBiometric}
            className="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
            <Fingerprint className="w-5 h-5" />
            Use Biometric
          </button>
        </motion.form>

        <p className="text-center text-xs text-gray-500">
          Demo: Use phone 0765432109 and PIN 1234
        </p>
      </motion.div>
    </div>
  );
}

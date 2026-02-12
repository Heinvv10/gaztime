import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, QrCode } from 'lucide-react';
import Toast from '../components/Toast';
import { usePodStore } from '../store/usePodStore';
import type { CustomerStatus, CustomerSegment, Language } from '@gaztime/shared';
import { api } from '@gaztime/shared';

export default function CustomerRegistrationPage() {
  const navigate = useNavigate();
  const addCustomer = usePodStore(state => state.addCustomer);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    landmark: '',
  });

  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');

    try {
      // Format phone to E.164
      const formattedPhone = formData.phone.startsWith('+') 
        ? formData.phone 
        : formData.phone.startsWith('0') 
        ? `+27${formData.phone.substring(1)}`
        : `+27${formData.phone}`;

      // Create customer via API
      const customer = await api.customers.create({
        phone: formattedPhone,
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
      });

      // Add to local store
      addCustomer({
        ...customer,
        segment: 'new' as CustomerSegment,
        languagePreference: 'en' as Language,
        status: 'active' as CustomerStatus,
      });

      setShowQR(true);
      setTimeout(() => {
        navigate('/pos');
      }, 3000);
    } catch (err: any) {
      console.error('Customer registration error:', err);
      setError(err.message || 'Failed to register customer');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.phone && formData.address;

  if (showQR) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center success-feedback">
          <div className="flex justify-center mb-6">
            <div className="bg-teal-100 p-6 rounded-full">
              <QrCode className="w-24 h-24 text-teal-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Customer Registered!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Welcome, {formData.name}
          </p>
          <div className="bg-gray-100 p-8 rounded-2xl mb-6">
            <p className="text-gray-600 mb-4">Loyalty QR Code</p>
            <div className="w-48 h-48 bg-white border-4 border-gray-300 rounded-xl mx-auto flex items-center justify-center">
              <QrCode className="w-32 h-32 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Scan this code for loyalty rewards
            </p>
          </div>
          <p className="text-gray-400">Returning to POS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/pos')}
              className="touch-target bg-gray-100 hover:bg-gray-200 p-3 rounded-xl"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-teal-500 p-3 rounded-xl">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Register New Customer</h1>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-lg font-semibold mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500"
                placeholder="e.g. Thabo Malema"
                data-testid="name-input"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-lg font-semibold mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500"
                placeholder="e.g. 0823456789"
                data-testid="phone-input"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-lg font-semibold mb-2">
                Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500"
                rows={3}
                placeholder="e.g. 12 Main Street, Your City"
                data-testid="address-input"
              />
            </div>

            {/* Landmark */}
            <div>
              <label className="block text-lg font-semibold mb-2">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500"
                placeholder="e.g. Near the blue tuck shop"
              />
            </div>
          </div>

          {/* Link to Fibre Time */}
          <div className="mt-8 p-6 bg-yellow-50 border-2 border-yellow-500 rounded-xl">
            <p className="font-semibold text-lg mb-2">Link to Fibre Time Account?</p>
            <p className="text-gray-600 mb-4">
              Customers with Fibre Time accounts get extra loyalty rewards
            </p>
            <button
              type="button"
              className="touch-target bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-6 py-3 rounded-xl"
              onClick={() => setToast({ message: 'Fibre Time linking coming soon', type: 'info' })}
            >
              Link Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border-2 border-red-500 rounded-xl">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="w-full touch-target-lg bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-xl rounded-xl mt-8"
            data-testid="register-submit"
          >
            {loading ? 'Registering...' : 'Register Customer'}
          </button>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

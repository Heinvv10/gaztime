import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Navigation as NavigationIcon,
  Phone,
  MessageCircle,
  MapPin,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Locate,
  MapPinned,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useToast } from '../hooks/useToast';
import { useGeolocation } from '../hooks/useGeolocation';
import Toast from '../components/Toast';

export default function Navigation() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, updateLocation } = useStore();
  const { toast, showToast, hideToast } = useToast();

  // Start GPS tracking
  const { position, error: gpsError, isWatching } = useGeolocation({
    watch: true,
    enableHighAccuracy: true,
    onLocationUpdate: (pos) => {
      // Update driver location in backend
      updateLocation(pos.lat, pos.lng);
    },
    onError: (err) => {
      console.error('GPS error:', err);
      showToast('GPS tracking unavailable', 'error');
    },
  });

  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return <div className="p-6 text-center text-gray-400">Order not found</div>;
  }

  const mockDirections = [
    { instruction: 'Head south on Main Street', distance: '500m' },
    { instruction: 'Turn right at the Spar supermarket', distance: '200m' },
    { instruction: 'Continue straight past the tire shop', distance: '300m' },
    { instruction: 'Destination will be on your left', distance: '50m' },
  ];

  const handleComplete = () => {
    navigate(`/complete/${order.id}`);
  };

  const handleCall = () => {
    if (!order.customer?.phone) {
      showToast('Customer phone number not available', 'info');
      return;
    }
    window.open(`tel:${order.customer.phone}`, '_self');
  };

  const handleWhatsApp = () => {
    if (!order.customer?.phone) {
      showToast('Customer phone number not available', 'info');
      return;
    }
    window.open(`https://wa.me/${order.customer.phone.replace(/^0/, '27')}`, '_blank');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Mock Map */}
      <div className="relative flex-1 bg-gradient-to-br from-dark-surface to-dark-card">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <NavigationIcon className="w-16 h-16 text-teal mx-auto animate-pulse" />
            <div className="text-white font-semibold">Map View</div>
            <div className="text-sm text-gray-400">
              {isWatching && position
                ? `GPS Active: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`
                : gpsError
                ? 'GPS Unavailable'
                : 'Acquiring GPS...'}
            </div>
            {position && (
              <div className="text-xs text-teal">
                Accuracy: ±{Math.round(position.accuracy)}m
                {position.speed && position.speed > 0 && (
                  <> • Speed: {Math.round(position.speed * 3.6)} km/h</>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Distance Badge */}
        <div className="absolute top-4 left-4 right-4">
          <div className="card flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">Distance</div>
              <div className="text-2xl font-bold text-white">1.2 km</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">ETA</div>
              <div className="text-2xl font-bold text-teal">5 min</div>
            </div>
          </div>
        </div>

        {/* Contact Buttons */}
        <div className="absolute top-32 right-4 space-y-2">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleCall}
            className="w-14 h-14 rounded-full bg-teal flex items-center justify-center shadow-lg"
          >
            <Phone className="w-6 h-6 text-dark-bg" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleWhatsApp}
            className="w-14 h-14 rounded-full bg-teal flex items-center justify-center shadow-lg"
          >
            <MessageCircle className="w-6 h-6 text-dark-bg" />
          </motion.button>
        </div>
      </div>

      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-dark-surface border-t border-dark-border rounded-t-3xl"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
        </div>

        <div className="p-4 pb-6 space-y-4 max-h-[50vh] overflow-y-auto">
          {/* Destination */}
          <div>
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal" />
              Destination
            </h3>
            <div className="bg-dark-card border border-dark-border rounded-lg p-3">
              <p className="text-white">{order.deliveryAddress.text}</p>
              {order.deliveryAddress.landmark && (
                <div className="mt-2 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow">{order.deliveryAddress.landmark}</p>
                </div>
              )}
            </div>
          </div>

          {/* Turn-by-turn Directions */}
          <div>
            <h3 className="font-semibold text-white mb-3">Directions</h3>
            <div className="space-y-2">
              {mockDirections.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-3 bg-dark-card border border-dark-border rounded-lg p-3"
                >
                  <div className="w-8 h-8 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-teal font-semibold text-sm">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white">{step.instruction}</p>
                    <p className="text-sm text-gray-400 mt-1">{step.distance}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Arrival Button */}
          <button
            onClick={handleComplete}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            I've Arrived
          </button>
        </div>
      </motion.div>

      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}

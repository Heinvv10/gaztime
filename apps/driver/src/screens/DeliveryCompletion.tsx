import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Camera,
  Pen,
  Hash,
  QrCode,
  Banknote,
  CreditCard,
  Image as ImageIcon,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import CameraCapture from '../components/CameraCapture';
import SignatureCapture from '../components/SignatureCapture';

type ProofMethod = 'signature' | 'photo' | 'otp';
type PaymentType = 'cash' | 'digital';

export default function DeliveryCompletion() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const { orders, completeDelivery } = useStore();

  const order = orders.find(o => o.id === orderId);
  const [proofMethod, setProofMethod] = useState<ProofMethod>('otp');
  const [otpCode, setOtpCode] = useState('');
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [cashAmount, setCashAmount] = useState(order?.totalAmount ? order.totalAmount.toString() : '0');
  const [cylinderScanned, setCylinderScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedSignature, setCapturedSignature] = useState<string | null>(null);

  if (!order) {
    return <div className="p-6 text-center text-gray-400">Order not found</div>;
  }

  const handleComplete = () => {
    if (order.paymentStatus === 'pending' && !cashAmount) {
      showToast('Please confirm payment collection', 'error');
      return;
    }

    if (proofMethod === 'otp' && otpCode.length !== 6) {
      showToast('Please enter the 6-digit OTP', 'error');
      return;
    }

    if (proofMethod === 'photo' && !capturedPhoto) {
      showToast('Please take a photo', 'error');
      return;
    }

    if (proofMethod === 'signature' && !capturedSignature) {
      showToast('Please capture signature', 'error');
      return;
    }

    const proof = {
      type: proofMethod,
      data: proofMethod === 'otp'
        ? otpCode
        : proofMethod === 'photo'
        ? capturedPhoto
        : capturedSignature || 'completed',
    };
    completeDelivery(order.id, proof);
    navigate('/', { replace: true });
  };

  const handleScan = () => {
    // Mock QR scan
    setCylinderScanned(true);
    setTimeout(() => {
      showToast('Cylinder CYL-001 scanned successfully', 'success');
    }, 500);
  };

  const handlePhotoCapture = (imageDataUrl: string) => {
    setCapturedPhoto(imageDataUrl);
    setShowCamera(false);
    showToast('Photo captured successfully', 'success');
  };

  const handleSignatureCapture = (signatureDataUrl: string) => {
    setCapturedSignature(signatureDataUrl);
    setShowSignature(false);
    showToast('Signature captured successfully', 'success');
  };

  return (
    <div className="min-h-screen p-4 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal/20 mb-4">
            <CheckCircle className="w-8 h-8 text-teal" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Complete Delivery</h1>
          <p className="text-gray-400">Order {order.reference}</p>
        </div>

        {/* Cylinder Scanning */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Scan Cylinder</h3>
          <button
            onClick={handleScan}
            className={`w-full btn ${cylinderScanned ? 'btn-secondary' : 'btn-primary'} flex items-center justify-center gap-2`}
          >
            <QrCode className="w-5 h-5" />
            {cylinderScanned ? 'Cylinder Scanned ✓' : 'Scan QR Code'}
          </button>
          {cylinderScanned && (
            <div className="mt-3 text-sm text-teal flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>CYL-001 (9kg) verified</span>
            </div>
          )}
        </div>

        {/* Delivery Proof Method */}
        <div className="card">
          <h3 className="font-semibold text-white mb-4">Delivery Proof</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { type: 'otp' as ProofMethod, icon: Hash, label: 'OTP' },
              { type: 'signature' as ProofMethod, icon: Pen, label: 'Signature' },
              { type: 'photo' as ProofMethod, icon: Camera, label: 'Photo' },
            ].map((method) => {
              const Icon = method.icon;
              const isActive = proofMethod === method.type;
              return (
                <button
                  key={method.type}
                  onClick={() => setProofMethod(method.type)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isActive 
                      ? 'border-teal bg-teal/10' 
                      : 'border-dark-border bg-dark-surface'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${isActive ? 'text-teal' : 'text-gray-400'}`} />
                  <div className={`text-sm font-medium ${isActive ? 'text-teal' : 'text-gray-400'}`}>
                    {method.label}
                  </div>
                </button>
              );
            })}
          </div>

          {/* OTP Input */}
          {proofMethod === 'otp' && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Enter customer's 6-digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="input text-center text-2xl tracking-widest"
                placeholder="••••••"
              />
            </div>
          )}

          {/* Signature */}
          {proofMethod === 'signature' && (
            <div>
              {capturedSignature ? (
                <div className="space-y-3">
                  <div className="bg-white border-2 border-teal rounded-lg p-2">
                    <img
                      src={capturedSignature}
                      alt="Signature"
                      className="w-full h-32 object-contain"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setCapturedSignature(null);
                      setShowSignature(true);
                    }}
                    className="btn btn-secondary w-full"
                  >
                    Recapture Signature
                  </button>
                </div>
              ) : (
                <div>
                  <div className="bg-dark-surface border-2 border-dashed border-dark-border rounded-lg h-40 flex items-center justify-center mb-3">
                    <div className="text-center text-gray-500">
                      <Pen className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Customer signature area</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSignature(true)}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Pen className="w-5 h-5" />
                    Capture Signature
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Photo */}
          {proofMethod === 'photo' && (
            <div>
              {capturedPhoto ? (
                <div className="space-y-3">
                  <div className="bg-dark-surface border-2 border-teal rounded-lg p-2">
                    <img
                      src={capturedPhoto}
                      alt="Delivery proof"
                      className="w-full h-48 object-cover rounded"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setCapturedPhoto(null);
                      setShowCamera(true);
                    }}
                    className="btn btn-secondary w-full"
                  >
                    Retake Photo
                  </button>
                </div>
              ) : (
                <div>
                  <div className="bg-dark-surface border-2 border-dashed border-dark-border rounded-lg h-40 flex items-center justify-center mb-3">
                    <div className="text-center text-gray-500">
                      <Camera className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Photo proof area</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCamera(true)}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Take Photo
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Payment Collection */}
        {order.paymentStatus === 'pending' && (
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Collect Payment</h3>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setPaymentType('cash')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  paymentType === 'cash'
                    ? 'border-teal bg-teal/10'
                    : 'border-dark-border bg-dark-surface'
                }`}
              >
                <Banknote className={`w-6 h-6 mx-auto mb-2 ${paymentType === 'cash' ? 'text-teal' : 'text-gray-400'}`} />
                <div className={`text-sm font-medium ${paymentType === 'cash' ? 'text-teal' : 'text-gray-400'}`}>
                  Cash
                </div>
              </button>
              <button
                onClick={() => setPaymentType('digital')}
                className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                  paymentType === 'digital'
                    ? 'border-teal bg-teal/10'
                    : 'border-dark-border bg-dark-surface'
                }`}
              >
                <CreditCard className={`w-6 h-6 mx-auto mb-2 ${paymentType === 'digital' ? 'text-teal' : 'text-gray-400'}`} />
                <div className={`text-sm font-medium ${paymentType === 'digital' ? 'text-teal' : 'text-gray-400'}`}>
                  Digital
                </div>
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Amount to collect
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">R</span>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="input pl-10 text-lg font-semibold"
                  placeholder="0"
                />
              </div>
              <div className="mt-2 text-sm text-gray-400">
                Order total: <span className="text-white font-semibold">R{order.totalAmount}</span>
              </div>
            </div>
          </div>
        )}

        {order.paymentStatus === 'paid' && (
          <div className="card bg-teal/10 border-teal">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-teal" />
              <div>
                <div className="font-semibold text-white">Payment Confirmed</div>
                <div className="text-sm text-gray-400">Paid via {order.paymentMethod}</div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-dark-surface border-t border-dark-border p-4">
          <button
            onClick={handleComplete}
            className="btn btn-primary w-full flex items-center justify-center gap-2 text-lg"
          >
            <CheckCircle className="w-6 h-6" />
            Complete Delivery
          </button>
        </div>
      </motion.div>

      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <CameraCapture
            onCapture={handlePhotoCapture}
            onCancel={() => setShowCamera(false)}
          />
        )}
      </AnimatePresence>

      {/* Signature Modal */}
      <AnimatePresence>
        {showSignature && (
          <SignatureCapture
            onCapture={handleSignatureCapture}
            onCancel={() => setShowSignature(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

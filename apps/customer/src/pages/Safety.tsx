import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Phone, Shield, Flame } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const safetyTips = [
  {
    icon: '🔍',
    title: 'Check Before Use',
    description: 'Always inspect the cylinder for damage, rust, or dents before connecting.',
  },
  {
    icon: '🌬️',
    title: 'Ventilation',
    description: 'Use LPG in well-ventilated areas. Never use indoors without proper ventilation.',
  },
  {
    icon: '🔥',
    title: 'Keep Away from Heat',
    description: 'Store cylinders away from direct sunlight, heat sources, and open flames.',
  },
  {
    icon: '👃',
    title: 'Know the Smell',
    description: 'LPG has a distinctive smell. If you smell gas, turn off the supply immediately.',
  },
  {
    icon: '🔧',
    title: 'Proper Connections',
    description: 'Use only approved regulators and hoses. Check for leaks with soapy water.',
  },
  {
    icon: '🚫',
    title: 'Never Modify',
    description: 'Do not modify cylinders or equipment. Use only certified components.',
  },
];

const emergencyContacts = [
  { name: 'Gaz Time Emergency', number: '0800 GAZ TIME' },
  { name: 'Fire Department', number: '10177' },
  { name: 'Emergency Services', number: '112' },
];

export function Safety() {
  const navigate = useNavigate();

  const handleReportLeak = () => {
    if (confirm('Are you experiencing a gas leak? We will call you immediately.')) {
      window.location.href = 'tel:0800427849';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 pb-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-red-600/95 backdrop-blur-md border-b border-red-700">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-red-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            LPG Safety
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-6">
        {/* Emergency banner */}
        <motion.div
          className="bg-red-500 rounded-2xl p-6 shadow-xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Gas Leak?</h2>
              <p className="text-white/90 text-sm">Report immediately</p>
            </div>
          </div>
          <Button
            variant="accent"
            fullWidth
            size="lg"
            onClick={handleReportLeak}
          >
            <Phone className="w-5 h-5 mr-2" />
            Report Gas Leak
          </Button>
        </motion.div>

        {/* Safety tips */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Flame className="w-6 h-6 text-primary" />
            Safety Guidelines
          </h2>
          <div className="space-y-3">
            {safetyTips.map((tip, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <div className="flex gap-4">
                    <div className="text-4xl flex-shrink-0">{tip.icon}</div>
                    <div>
                      <h3 className="font-bold text-white mb-1">{tip.title}</h3>
                      <p className="text-gray-400 text-sm">{tip.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* How to connect cylinder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <h3 className="font-bold text-white mb-4">How to Connect a Cylinder</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <p className="text-white font-medium">Check the valve</p>
                  <p className="text-gray-400 text-sm">
                    Ensure the cylinder valve is closed (turn clockwise)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div>
                  <p className="text-white font-medium">Connect the regulator</p>
                  <p className="text-gray-400 text-sm">
                    Attach regulator hand-tight. Don't use tools - hand pressure is enough
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div>
                  <p className="text-white font-medium">Check for leaks</p>
                  <p className="text-gray-400 text-sm">
                    Apply soapy water to connections. Bubbles indicate a leak
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                  4
                </div>
                <div>
                  <p className="text-white font-medium">Open the valve slowly</p>
                  <p className="text-gray-400 text-sm">
                    Turn counter-clockwise gradually. Your gas is ready to use!
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Emergency contacts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h2 className="text-xl font-bold text-white mb-4">Emergency Contacts</h2>
          <div className="space-y-3">
            {emergencyContacts.map((contact, index) => (
              <Card key={index}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Phone className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{contact.name}</p>
                      <p className="text-gray-400 text-sm">{contact.number}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${contact.number.replace(/\s/g, '')}`}
                    className="px-4 py-2 bg-primary rounded-lg text-white font-medium hover:bg-primary-600 transition-colors"
                  >
                    Call
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Warning box */}
        <motion.div
          className="bg-accent/20 border border-accent/40 rounded-xl p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-accent text-sm">
            ⚠️ <span className="font-medium">Important:</span> LPG is heavier than air and can
            accumulate in low areas. Never use LPG below ground level (basements, cellars).
          </p>
        </motion.div>
      </div>
    </div>
  );
}

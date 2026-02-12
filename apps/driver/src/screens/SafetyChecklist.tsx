import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle,
  Circle,
  AlertTriangle,
  Phone,
  FileText,
  Camera
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  checked: boolean;
}

export default function SafetyChecklist() {
  const { dailyChecklistCompleted, completeDailyChecklist } = useStore();
  const [activeTab, setActiveTab] = useState<'daily' | 'incident' | 'sos'>('daily');
  const { toast, showToast, hideToast } = useToast();
  
  const [vehicleChecklist, setVehicleChecklist] = useState<ChecklistItem[]>([
    { id: 'v1', category: 'Vehicle', item: 'Tire pressure and condition', checked: false },
    { id: 'v2', category: 'Vehicle', item: 'Brakes functioning properly', checked: false },
    { id: 'v3', category: 'Vehicle', item: 'Lights and indicators working', checked: false },
    { id: 'v4', category: 'Vehicle', item: 'Fire extinguisher present and charged', checked: false },
    { id: 'v5', category: 'Vehicle', item: 'First aid kit available', checked: false },
  ]);

  const [cylinderChecklist, setCylinderChecklist] = useState<ChecklistItem[]>([
    { id: 'c1', category: 'Cylinders', item: 'No visible damage or dents', checked: false },
    { id: 'c2', category: 'Cylinders', item: 'Valves and caps secure', checked: false },
    { id: 'c3', category: 'Cylinders', item: 'No gas leaks detected', checked: false },
    { id: 'c4', category: 'Cylinders', item: 'Inspection dates valid', checked: false },
    { id: 'c5', category: 'Cylinders', item: 'Cylinders properly secured', checked: false },
  ]);

  const [incidentType, setIncidentType] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');

  const toggleCheck = (
    checklist: ChecklistItem[],
    setChecklist: React.Dispatch<React.SetStateAction<ChecklistItem[]>>,
    id: string
  ) => {
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const allChecked = [...vehicleChecklist, ...cylinderChecklist].every(item => item.checked);

  const handleSubmitChecklist = () => {
    if (!allChecked) {
      showToast('Please complete all checklist items before submitting', 'error');
      return;
    }
    completeDailyChecklist();
    showToast('Daily safety checklist completed! ✓', 'success');
  };

  const handleSubmitIncident = () => {
    if (!incidentType || !incidentDescription) {
      showToast('Please fill in all incident details', 'error');
      return;
    }
    showToast('Incident report submitted. Management notified.', 'success');
    setIncidentType('');
    setIncidentDescription('');
  };

  const handleSOS = () => {
    if (confirm('This will alert emergency services and management. Continue?')) {
      showToast('🚨 SOS ACTIVATED — Emergency services contacted, help is on the way!', 'error');
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Safety & Compliance</h1>
        <p className="text-gray-400">Your safety is our priority</p>
      </div>

      {/* Status Badge */}
      {dailyChecklistCompleted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-teal/10 border-teal"
        >
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-teal" />
            <div>
              <div className="font-semibold text-white">Daily Checklist Complete</div>
              <div className="text-sm text-gray-400">You're all set for today</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 bg-dark-surface rounded-lg p-1">
        {[
          { key: 'daily' as const, label: 'Daily Check' },
          { key: 'incident' as const, label: 'Report' },
          { key: 'sos' as const, label: 'SOS' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-teal text-dark-bg'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Daily Checklist Tab */}
      {activeTab === 'daily' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Vehicle Inspection */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Vehicle Inspection</h3>
            <div className="space-y-3">
              {vehicleChecklist.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => toggleCheck(vehicleChecklist, setVehicleChecklist, item.id)}
                  className="w-full flex items-start gap-3 p-3 bg-dark-surface rounded-lg hover:bg-dark-border transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  {item.checked ? (
                    <CheckCircle className="w-5 h-5 text-teal flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                  <span className={`text-left ${item.checked ? 'text-gray-400 line-through' : 'text-white'}`}>
                    {item.item}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Cylinder Inspection */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Cylinder Inspection</h3>
            <div className="space-y-3">
              {cylinderChecklist.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => toggleCheck(cylinderChecklist, setCylinderChecklist, item.id)}
                  className="w-full flex items-start gap-3 p-3 bg-dark-surface rounded-lg hover:bg-dark-border transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  {item.checked ? (
                    <CheckCircle className="w-5 h-5 text-teal flex-shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                  <span className={`text-left ${item.checked ? 'text-gray-400 line-through' : 'text-white'}`}>
                    {item.item}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm font-semibold text-white">
                {[...vehicleChecklist, ...cylinderChecklist].filter(i => i.checked).length} / {vehicleChecklist.length + cylinderChecklist.length}
              </span>
            </div>
            <div className="w-full h-2 bg-dark-surface rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-teal"
                initial={{ width: 0 }}
                animate={{
                  width: `${([...vehicleChecklist, ...cylinderChecklist].filter(i => i.checked).length / (vehicleChecklist.length + cylinderChecklist.length)) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmitChecklist}
            disabled={!allChecked || dailyChecklistCompleted}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {dailyChecklistCompleted ? 'Checklist Complete' : 'Submit Checklist'}
          </button>
        </motion.div>
      )}

      {/* Incident Report Tab */}
      {activeTab === 'incident' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="card bg-yellow/10 border-yellow">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                Report any incidents, accidents, or safety concerns immediately. All reports are confidential.
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-white mb-4">Incident Type</h3>
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="input"
            >
              <option value="">Select type...</option>
              <option value="accident">Traffic Accident</option>
              <option value="gas_leak">Gas Leak</option>
              <option value="equipment">Equipment Failure</option>
              <option value="injury">Personal Injury</option>
              <option value="theft">Theft/Security</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="card">
            <h3 className="font-semibold text-white mb-4">Description</h3>
            <textarea
              value={incidentDescription}
              onChange={(e) => setIncidentDescription(e.target.value)}
              className="input min-h-[120px] resize-none"
              placeholder="Describe what happened in detail..."
            />
          </div>

          <div className="card">
            <h3 className="font-semibold text-white mb-4">Add Photos (Optional)</h3>
            <button className="btn btn-secondary w-full flex items-center justify-center gap-2">
              <Camera className="w-5 h-5" />
              Take Photos
            </button>
          </div>

          <button
            onClick={handleSubmitIncident}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Submit Report
          </button>
        </motion.div>
      )}

      {/* SOS Tab */}
      {activeTab === 'sos' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="card bg-red-500/10 border-red-500">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-500 mb-2">Emergency SOS</h3>
                <p className="text-sm text-gray-300">
                  Only use in genuine emergencies. This will immediately alert:
                </p>
                <ul className="text-sm text-gray-300 mt-2 space-y-1 ml-4 list-disc">
                  <li>Emergency services</li>
                  <li>Gaz Time management</li>
                  <li>Your emergency contact</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="card text-center py-12">
            <motion.button
              onClick={handleSOS}
              className="w-32 h-32 rounded-full bg-red-500 mx-auto mb-6 flex items-center justify-center shadow-2xl"
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-white mx-auto mb-2" />
                <div className="text-xl font-bold text-white">SOS</div>
              </div>
            </motion.button>
            <p className="text-gray-400">Tap to activate emergency alert</p>
          </div>

          <div className="card">
            <h3 className="font-semibold text-white mb-3">Emergency Contacts</h3>
            <div className="space-y-2">
              <a href="tel:10111" className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-teal" />
                  <div>
                    <div className="text-white font-semibold">Police</div>
                    <div className="text-sm text-gray-400">10111</div>
                  </div>
                </div>
              </a>
              <a href="tel:10177" className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-teal" />
                  <div>
                    <div className="text-white font-semibold">Ambulance</div>
                    <div className="text-sm text-gray-400">10177</div>
                  </div>
                </div>
              </a>
              <a href="tel:0123456789" className="flex items-center justify-between p-3 bg-dark-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-teal" />
                  <div>
                    <div className="text-white font-semibold">Gaz Time Control</div>
                    <div className="text-sm text-gray-400">012 345 6789</div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}

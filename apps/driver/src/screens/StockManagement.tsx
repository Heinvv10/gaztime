import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  QrCode, 
  
  Minus,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import type { VehicleStock } from '@shared/types';

export default function StockManagement() {
  const { vehicleStock, loadStock, returnEmpty } = useStore();
  const [activeTab, setActiveTab] = useState<'current' | 'load' | 'return'>('current');
  const [scanMode, setScanMode] = useState(false);
  const { toast, showToast, hideToast } = useToast();

  const stockBySize = vehicleStock.reduce((acc, item) => {
    acc[item.sizeKg] = (acc[item.sizeKg] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const handleScan = () => {
    setScanMode(true);
    setTimeout(() => {
      // Mock scan
      const newCylinder: VehicleStock = {
        cylinderId: `CYL-${Date.now()}`,
        sizeKg: 9,
      };
      loadStock([...vehicleStock, newCylinder]);
      setScanMode(false);
      showToast('Cylinder scanned and loaded', 'success');
    }, 1000);
  };

  const handleReturnEmpty = (cylinderId: string) => {
    returnEmpty(cylinderId);
    showToast('Empty cylinder returned', 'success');
  };

  const handleEndOfDay = () => {
    const full = vehicleStock.length;
    const empty = 0; // Would track empties in real app
    
    showToast(`Reconciliation submitted: ${full} full, ${empty} empty`, 'success');
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Stock Management</h1>
        <p className="text-gray-400">Manage your vehicle inventory</p>
      </div>

      {/* Stock Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <Package className="w-8 h-8 text-teal mx-auto mb-2" />
          <div className="text-3xl font-bold text-white">{vehicleStock.length}</div>
          <div className="text-sm text-gray-400">Total Cylinders</div>
        </div>
        <div className="card text-center">
          <TrendingUp className="w-8 h-8 text-yellow mx-auto mb-2" />
          <div className="text-3xl font-bold text-white">
            {stockBySize[9] || 0}:{stockBySize[19] || 0}
          </div>
          <div className="text-sm text-gray-400">9kg : 19kg</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-dark-surface rounded-lg p-1">
        {[
          { key: 'current' as const, label: 'Current Stock' },
          { key: 'load' as const, label: 'Load Stock' },
          { key: 'return' as const, label: 'Return Empties' },
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

      {/* Current Stock Tab */}
      {activeTab === 'current' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {vehicleStock.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No cylinders loaded</p>
              <p className="text-sm mt-2">Go to "Load Stock" to add cylinders</p>
            </div>
          ) : (
            <>
              {/* Group by size */}
              {Object.entries(stockBySize).map(([size, count]) => (
                <div key={size} className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-teal/20 flex items-center justify-center">
                        <Package className="w-6 h-6 text-teal" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{size}kg Cylinders</div>
                        <div className="text-sm text-gray-400">{count} units</div>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-teal">{count}</div>
                  </div>
                  
                  {/* Individual cylinders */}
                  <div className="space-y-2">
                    {vehicleStock
                      .filter(s => s.sizeKg === parseInt(size))
                      .slice(0, 3)
                      .map((cylinder) => (
                        <div 
                          key={cylinder.cylinderId}
                          className="bg-dark-surface rounded-lg p-2 flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-400 font-mono">{cylinder.cylinderId}</span>
                          <CheckCircle className="w-4 h-4 text-teal" />
                        </div>
                      ))}
                    {count > 3 && (
                      <div className="text-center text-sm text-gray-500 pt-2">
                        +{count - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </motion.div>
      )}

      {/* Load Stock Tab */}
      {activeTab === 'load' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="card bg-teal/10 border-teal">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-teal flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300">
                Scan cylinders at the depot before starting your shift. Each cylinder must be scanned individually.
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-white mb-4">Scan Cylinder QR Code</h3>
            
            <div className="bg-dark-surface border-2 border-dashed border-dark-border rounded-xl h-64 flex items-center justify-center mb-4">
              {scanMode ? (
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <QrCode className="w-24 h-24 text-teal mx-auto mb-4" />
                  </motion.div>
                  <p className="text-gray-400">Scanning...</p>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <QrCode className="w-16 h-16 mx-auto mb-3" />
                  <p className="text-sm">Position QR code in frame</p>
                </div>
              )}
            </div>

            <button
              onClick={handleScan}
              disabled={scanMode}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              {scanMode ? 'Scanning...' : 'Start Scan'}
            </button>
          </div>

          {/* Quick add for demo */}
          <div className="card">
            <h3 className="font-semibold text-white mb-3">Quick Add (Demo)</h3>
            <div className="flex gap-2">
              <button
                onClick={() => loadStock([...vehicleStock, { cylinderId: `CYL-9-${Date.now()}`, sizeKg: 9 }])}
                className="flex-1 btn btn-secondary"
              >
                + 9kg
              </button>
              <button
                onClick={() => loadStock([...vehicleStock, { cylinderId: `CYL-19-${Date.now()}`, sizeKg: 19 }])}
                className="flex-1 btn btn-secondary"
              >
                + 19kg
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Return Empties Tab */}
      {activeTab === 'return' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Return Empty Cylinders</h3>
            
            {vehicleStock.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No cylinders to return</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vehicleStock.slice(0, 5).map((cylinder) => (
                  <div
                    key={cylinder.cylinderId}
                    className="bg-dark-surface rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <div>
                        <div className="text-white font-mono text-sm">{cylinder.cylinderId}</div>
                        <div className="text-xs text-gray-400">{cylinder.sizeKg}kg</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleReturnEmpty(cylinder.cylinderId)}
                      className="btn btn-danger text-sm px-4 py-2"
                    >
                      Return
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* End of Day Reconciliation */}
          <div className="card bg-yellow/10 border-yellow">
            <h3 className="font-semibold text-white mb-3">End of Day</h3>
            <p className="text-sm text-gray-300 mb-4">
              Submit your final stock count when returning to depot
            </p>
            <button
              onClick={handleEndOfDay}
              className="btn btn-primary w-full"
            >
              Submit Reconciliation
            </button>
          </div>
        </motion.div>
      )}

      {toast.visible && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}

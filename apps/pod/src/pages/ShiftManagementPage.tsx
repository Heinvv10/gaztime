import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, FileText } from 'lucide-react';
import Toast from '../components/Toast';
import { usePodStore } from '../store/usePodStore';
import { format, differenceInMinutes } from 'date-fns';

export default function ShiftManagementPage() {
  const navigate = useNavigate();
  const { operator, shiftStartTime, startShift, endShift } = usePodStore();
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [handoverChecklist, setHandoverChecklist] = useState({
    stockCounted: false,
    cashReconciled: false,
    cleanedWorkspace: false,
    reportedIssues: false,
  });

  const isShiftActive = shiftStartTime !== null;
  const shiftDuration = isShiftActive
    ? differenceInMinutes(new Date(), new Date(shiftStartTime!))
    : 0;
  const hours = Math.floor(shiftDuration / 60);
  const minutes = shiftDuration % 60;

  const handleClockIn = () => {
    startShift();
  };

  const handleClockOut = () => {
    const allChecked = Object.values(handoverChecklist).every(v => v);
    if (!allChecked) {
      setToast({ message: 'Please complete all handover checklist items before clocking out', type: 'error' });
      return;
    }
    endShift();
    setToast({ message: 'Shift ended successfully!', type: 'success' });
    setTimeout(() => navigate('/pos'), 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
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
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Shift Management</h1>
                <p className="text-gray-600">Operator: {operator?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Shift Status */}
        <div className={`rounded-2xl shadow-lg p-8 mb-6 ${
          isShiftActive
            ? 'bg-gradient-to-br from-teal-500 to-teal-600'
            : 'bg-white'
        }`}>
          {isShiftActive ? (
            <div className="text-white">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xl opacity-90 mb-2">Shift Started</p>
                  <p className="text-4xl font-bold">
                    {format(new Date(shiftStartTime!), 'HH:mm')}
                  </p>
                  <p className="text-lg opacity-90 mt-2">
                    {format(new Date(shiftStartTime!), 'EEEE, MMM d')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl opacity-90 mb-2">Duration</p>
                  <p className="text-5xl font-bold">
                    {hours}h {minutes}m
                  </p>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-semibold">Shift Active</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-20 h-20 mx-auto mb-6 text-gray-400" />
              <h2 className="text-3xl font-bold mb-4">Ready to start your shift?</h2>
              <p className="text-gray-600 mb-8 text-lg">
                Clock in to begin serving customers
              </p>
              <button
                onClick={handleClockIn}
                className="touch-target-lg bg-teal-500 hover:bg-teal-600 text-white font-bold text-xl px-12 py-4 rounded-xl"
                data-testid="clock-in-btn"
              >
                Clock In
              </button>
            </div>
          )}
        </div>

        {/* Handover Checklist (only shown during active shift) */}
        {isShiftActive && (
          <>
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-teal-500" />
                Shift Handover Checklist
              </h2>
              <div className="space-y-4">
                {Object.entries({
                  stockCounted: 'Stock counted and reconciled',
                  cashReconciled: 'Cash drawer reconciled',
                  cleanedWorkspace: 'Workspace cleaned and organized',
                  reportedIssues: 'Issues/incidents reported',
                }).map(([key, label]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      handoverChecklist[key as keyof typeof handoverChecklist]
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-300 hover:border-teal-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={handoverChecklist[key as keyof typeof handoverChecklist]}
                      onChange={(e) =>
                        setHandoverChecklist({
                          ...handoverChecklist,
                          [key]: e.target.checked,
                        })
                      }
                      className="w-6 h-6 rounded accent-teal-500"
                    />
                    <span className="text-lg font-semibold">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Operator Notes */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-teal-500" />
                Shift Notes
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-teal-500"
                rows={6}
                placeholder="Any issues, observations, or notes for the next operator..."
              />
            </div>

            {/* Clock Out Button */}
            <button
              onClick={handleClockOut}
              disabled={!Object.values(handoverChecklist).every(v => v)}
              className="w-full touch-target-lg bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-xl rounded-xl"
              data-testid="clock-out-btn"
            >
              Clock Out & End Shift
            </button>
            {!Object.values(handoverChecklist).every(v => v) && (
              <p className="text-center text-gray-500 mt-4">
                Complete all checklist items to clock out
              </p>
            )}
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

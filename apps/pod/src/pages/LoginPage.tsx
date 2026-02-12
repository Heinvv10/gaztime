import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Delete } from 'lucide-react';
import { usePodStore } from '../store/usePodStore';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const login = usePodStore(state => state.login);
  const navigate = useNavigate();

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin(pin + num);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  const handleSubmit = async () => {
    const success = await login(pin);
    if (success) {
      navigate('/pos');
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-teal-500 p-6 rounded-full">
              <Flame className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gaz Time Pod</h1>
          <p className="text-xl text-gray-600">Gaz Time POS</p>
          <p className="text-lg text-gray-500 mt-4">Enter your PIN to continue</p>
        </div>

        {/* PIN Display */}
        <div className={`mb-8 ${error ? 'error-feedback' : ''}`}>
          <div className="flex justify-center gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold transition-all ${
                  i < pin.length
                    ? 'bg-teal-500 text-white scale-110'
                    : error
                    ? 'bg-red-100 border-2 border-red-500'
                    : 'bg-gray-100 border-2 border-gray-300'
                }`}
              >
                {i < pin.length && '•'}
              </div>
            ))}
          </div>
          {error && (
            <p className="text-center text-red-500 font-semibold mt-4 text-lg">
              Incorrect PIN. Try again.
            </p>
          )}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberClick(num)}
              className="touch-target-lg bg-gray-100 hover:bg-gray-200 active:bg-teal-500 active:text-white rounded-2xl text-3xl font-bold transition-all"
              data-testid={`pin-${num}`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="touch-target-lg bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-all"
            data-testid="pin-backspace"
          >
            <Delete className="w-8 h-8" />
          </button>
          <button
            onClick={() => handleNumberClick('0')}
            className="touch-target-lg bg-gray-100 hover:bg-gray-200 active:bg-teal-500 active:text-white rounded-2xl text-3xl font-bold transition-all"
            data-testid="pin-0"
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={pin.length < 4}
            className="touch-target-lg bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-2xl text-xl font-bold transition-all"
            data-testid="pin-submit"
          >
            Enter
          </button>
        </div>

        {/* Helper Text */}
        <p className="text-center text-gray-400 text-sm">
          Demo PIN: 1234
        </p>
      </div>
    </div>
  );
}

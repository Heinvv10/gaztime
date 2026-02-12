import { AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
  onReset: () => void;
  theme: 'blue' | 'orange' | 'teal' | 'green';
}

export function ErrorFallback({ onReset, theme }: ErrorFallbackProps) {
  const themeColors = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-500',
      button: 'bg-orange-600 hover:bg-orange-700',
    },
    teal: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      icon: 'text-teal-500',
      button: 'bg-teal-600 hover:bg-teal-700',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-500',
      button: 'bg-green-600 hover:bg-green-700',
    },
  };

  const colors = themeColors[theme];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div
        className={`max-w-md w-full ${colors.bg} border-2 ${colors.border} rounded-lg p-8 text-center`}
      >
        <div className="flex justify-center mb-4">
          <AlertTriangle className={`w-16 h-16 ${colors.icon}`} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          Try refreshing the page to continue
        </p>
        <button
          onClick={onReset}
          className={`w-full ${colors.button} text-white font-semibold py-3 px-6 rounded-lg transition-colors`}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

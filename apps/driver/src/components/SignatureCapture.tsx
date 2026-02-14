import { useRef, useState, useCallback, useEffect } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface SignatureCaptureProps {
  onCapture: (signatureDataUrl: string) => void;
  onCancel: () => void;
}

export default function SignatureCapture({ onCapture, onCancel }: SignatureCaptureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Set drawing style
    ctx.strokeStyle = '#00A5A5'; // Teal color
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setContext(ctx);
  }, []);

  const getCoordinates = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    if ('touches' in event) {
      const touch = event.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }
  }, []);

  const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    const coords = getCoordinates(event);
    if (!coords || !context) return;

    setIsDrawing(true);
    setHasSignature(true);
    context.beginPath();
    context.moveTo(coords.x, coords.y);
  }, [context, getCoordinates]);

  const draw = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing || !context) return;

    const coords = getCoordinates(event);
    if (!coords) return;

    context.lineTo(coords.x, coords.y);
    context.stroke();
  }, [isDrawing, context, getCoordinates]);

  const stopDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing) return;

    setIsDrawing(false);
    if (context) {
      context.closePath();
    }
  }, [isDrawing, context]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  }, [context]);

  const confirm = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const signatureDataUrl = canvas.toDataURL('image/png');
    onCapture(signatureDataUrl);
  }, [hasSignature, onCapture]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-dark-bg z-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Customer Signature</h2>
        <button
          onClick={onCancel}
          className="w-10 h-10 rounded-full bg-dark-card flex items-center justify-center"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-teal/10 border-b border-teal/30 p-3">
        <p className="text-sm text-teal text-center">
          Ask the customer to sign below
        </p>
      </div>

      {/* Signature Canvas */}
      <div className="flex-1 p-4">
        <div className="h-full bg-white rounded-lg border-2 border-dashed border-dark-border relative overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-lg">Sign here</p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-dark-surface border-t border-dark-border p-4 space-y-3">
        <div className="flex gap-3">
          <button
            onClick={clear}
            disabled={!hasSignature}
            className="flex-1 btn btn-secondary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RotateCcw className="w-5 h-5" />
            Clear
          </button>
          <button
            onClick={confirm}
            disabled={!hasSignature}
            className="flex-1 btn btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check className="w-5 h-5" />
            Confirm
          </button>
        </div>
      </div>
    </motion.div>
  );
}

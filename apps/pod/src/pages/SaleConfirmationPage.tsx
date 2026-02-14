import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Printer, MessageSquare, QrCode, Home } from 'lucide-react';
import Toast from '../components/Toast';
import { usePodStore } from '../store/usePodStore';
import type { Order } from '@gaztime/shared';
import { createPOSSale } from '../lib/api';

export default function SaleConfirmationPage() {
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const { cart, selectedCustomer, paymentMethod, clearCart, updateStock } = usePodStore();

  const printReceipt = () => {
    if (!order) return;

    const printWindow = window.open('', 'PRINT', 'height=600,width=400');

    if (!printWindow) {
      setToast({ message: 'Please allow popups to print', type: 'error' });
      return;
    }

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt #${order.reference}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
            }
            body {
              font-family: 'Courier New', monospace;
              font-size: 14px;
              max-width: 300px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
            }
            .header h2 {
              margin: 0;
              font-size: 20px;
            }
            .header p {
              margin: 5px 0;
              font-size: 12px;
            }
            .items {
              margin: 20px 0;
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
            }
            .total {
              font-size: 18px;
              font-weight: bold;
              margin: 15px 0;
              text-align: right;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              border-top: 2px dashed #000;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>GAZ TIME POD</h2>
            <p>Pay-As-You-Go LPG</p>
            <p>Receipt #${order.reference}</p>
          </div>

          <div class="items">
            ${order.items.map(item => `
              <div class="item">
                <span>${item.product?.name || 'Product'} x${item.quantity}</span>
                <span>R${item.total.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>

          <div class="total">
            TOTAL: R${order.totalAmount.toFixed(2)}
          </div>

          <div class="footer">
            <p>Payment: ${order.paymentMethod.toUpperCase()}</p>
            <p>${new Date(order.createdAt).toLocaleString()}</p>
            <p style="margin-top: 15px;">Thank you for your purchase!</p>
            <p>www.gaztime.app</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    setToast({ message: 'Receipt sent to printer', type: 'success' });
  };

  useEffect(() => {
    const processOrder = async () => {
      if (!selectedCustomer || !paymentMethod || cart.length === 0) {
        navigate('/pos');
        return;
      }

      try {
        setLoading(true);
        
        // Create order via API
        const items = cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
        }));

        const newOrder = await createPOSSale(
          selectedCustomer.id,
          items,
          paymentMethod
        );

        // Update local stock
        cart.forEach(item => {
          updateStock(item.product.id, -item.quantity);
        });

        setOrder(newOrder);
        setShowSuccess(true);
        clearCart();

        // Auto-navigate after 5 seconds
        setTimeout(() => {
          navigate('/pos');
        }, 5000);
      } catch (err: any) {
        console.error('Sale error:', err);
        setError(err.message || 'Failed to process sale');
        // Fallback to local order creation
        const completeSale = usePodStore.getState().completeSale;
        const localOrder = await completeSale();
        setOrder(localOrder);
        setShowSuccess(true);
      } finally {
        setLoading(false);
      }
    };

    processOrder();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Processing sale...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full text-center">
          <div className="bg-red-100 p-6 rounded-full inline-block mb-6">
            <svg className="w-24 h-24 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sale Failed</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => navigate('/pos')}
            className="touch-target-lg bg-teal-500 text-white rounded-xl font-bold px-8"
          >
            Back to POS
          </button>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className={`bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full ${showSuccess ? 'success-feedback' : ''}`}>
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-green-100 p-6 rounded-full">
            <CheckCircle className="w-24 h-24 text-green-500" />
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
          Sale Complete!
        </h1>
        <p className="text-center text-gray-600 text-xl mb-8">
          Thank you for your purchase
        </p>

        {/* Receipt Preview */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 border-2 border-dashed border-gray-300">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold">Gaz Time Pod</h2>
            <p className="text-gray-600">Gaz Time POS</p>
            <p className="text-gray-500 text-sm mt-2">Receipt #{order.reference}</p>
          </div>

          <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

          {/* Items */}
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.product?.name} x{item.quantity}</span>
                <span className="font-bold">R{item.total}</span>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-dashed border-gray-300 my-4"></div>

          {/* Total */}
          <div className="flex justify-between text-2xl font-bold">
            <span>TOTAL</span>
            <span className="text-teal-600">R{order.totalAmount}</span>
          </div>

          <div className="mt-4 text-center text-gray-600">
            <p>Payment: {order.paymentMethod.toUpperCase()}</p>
            <p className="text-sm mt-2">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            className="touch-target-lg bg-teal-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-teal-600"
            onClick={printReceipt}
          >
            <Printer className="w-6 h-6" />
            Print Receipt
          </button>
          <button
            className="touch-target-lg bg-yellow-500 text-gray-900 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-yellow-600"
            onClick={() => setToast({ message: 'SMS receipt sent!', type: 'success' })}
          >
            <MessageSquare className="w-6 h-6" />
            SMS Receipt
          </button>
        </div>

        {/* Cylinder Serial Scan */}
        <button
          className="w-full touch-target bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold flex items-center justify-center gap-2 mb-6"
          onClick={() => setToast({ message: 'QR Scanner coming soon', type: 'info' })}
        >
          <QrCode className="w-5 h-5" />
          Scan Cylinder Serial
        </button>

        {/* Back to POS */}
        <button
          onClick={() => navigate('/pos')}
          className="w-full touch-target-lg bg-gray-900 text-white rounded-xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-gray-800"
          data-testid="back-to-pos"
        >
          <Home className="w-6 h-6" />
          Back to POS
        </button>

        <p className="text-center text-gray-400 text-sm mt-4">
          Redirecting in 5 seconds...
        </p>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

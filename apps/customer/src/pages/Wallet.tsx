import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet as WalletIcon,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  CreditCard,
  Ticket,
  QrCode,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@gaztime/shared';

const transactionIcons = {
  top_up: ArrowDownLeft,
  debit: ArrowUpRight,
  refund: ArrowDownLeft,
  referral_credit: Gift,
  promo_credit: Gift,
};

const topupMethods = [
  { id: 'eft', name: 'Bank Transfer (EFT)', icon: CreditCard, description: 'Transfer from your bank' },
  { id: 'voucher', name: 'Voucher Code', icon: Ticket, description: 'Redeem a voucher' },
  { id: 'snapscan', name: 'SnapScan', icon: QrCode, description: 'Scan QR code to pay' },
];

export function Wallet() {
  const navigate = useNavigate();
  const { user, updateUser } = useStore();
  const [showTopup, setShowTopup] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const balance = user?.walletBalance || 0;
  const [transactions, setTransactions] = useState<any[]>([]);

  // Load transactions from orders
  useEffect(() => {
    if (!user) return;
    api.orders.list({ customerId: user.id }).then((orders: any[]) => {
      const txns = orders.map((o: any) => ({
        id: o.id,
        type: 'debit' as const,
        amount: -(o.totalAmount || 0),
        description: `Order ${o.reference} - ${o.items?.[0]?.product?.name || 'LPG'}`,
        date: o.createdAt,
        status: o.status,
      })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txns);
    }).catch(() => {});
  }, [user]);

  const handleTopup = async () => {
    if (!selectedMethod || !topupAmount || !user) return;

    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.customers.creditWallet(
        user.id,
        amount,
        `Top up via ${selectedMethod}`
      );
      
      // Update local user state
      updateUser({ walletBalance: result.newBalance });
      
      // Close modal
      setShowTopup(false);
      setSelectedMethod(null);
      setTopupAmount('');
    } catch (err: any) {
      console.error('Top-up error:', err);
      setError(err.message || 'Failed to top up wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 pt-6 pb-12 px-6 rounded-b-3xl shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <WalletIcon className="w-8 h-8" />
            My Wallet
          </h1>
        </div>

        {/* Balance card */}
        <motion.div
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <p className="text-white/80 text-sm mb-2">Available Balance</p>
          <motion.p
            className="text-5xl font-bold text-white mb-4"
            key={balance}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring' }}
          >
            R {balance.toFixed(2)}
          </motion.p>
          <Button
            variant="accent"
            size="md"
            onClick={() => setShowTopup(true)}
            className="group"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
            Top Up Wallet
          </Button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-6 space-y-6">
        {/* Quick actions */}
        <Card>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/wallet/send')}
              className="flex flex-col items-center gap-2 p-4 bg-navy-800 rounded-xl hover:bg-navy-700 transition-colors"
            >
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <span className="text-white text-sm font-medium">Send Gas</span>
            </button>
            <button
              onClick={() => navigate('/wallet/voucher')}
              className="flex flex-col items-center gap-2 p-4 bg-navy-800 rounded-xl hover:bg-navy-700 transition-colors"
            >
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                <Ticket className="w-6 h-6 text-accent" />
              </div>
              <span className="text-white text-sm font-medium">Redeem Code</span>
            </button>
          </div>
        </Card>

        {/* Transactions */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {transactions.map((transaction, index) => {
              const Icon = transactionIcons[transaction.type as keyof typeof transactionIcons] || ArrowUpRight;
              const isCredit = transaction.amount > 0;

              return (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card>
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isCredit ? 'bg-green-500/20' : 'bg-red-500/20'
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            isCredit ? 'text-green-400' : 'text-red-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{transaction.description}</p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(transaction.date), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold text-lg ${
                            isCredit ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {isCredit ? '+' : ''}R {Math.abs(transaction.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top-up Modal */}
      {showTopup && (
        <motion.div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowTopup(false)}
        >
          <motion.div
            className="w-full max-w-md bg-navy-800 rounded-2xl p-6 shadow-2xl"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Top Up Wallet</h2>
              <button
                onClick={() => setShowTopup(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Amount input */}
            <div className="mb-6">
              <label className="block text-gray-300 font-medium mb-2">Amount (R)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full input text-2xl"
                placeholder="0.00"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
              />
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              {topupMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                      selectedMethod === method.id
                        ? 'bg-primary/20 border-2 border-primary'
                        : 'bg-navy-700 border-2 border-transparent hover:bg-navy-600'
                    }`}
                  >
                    <div className="w-12 h-12 bg-navy-800 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-white">{method.name}</p>
                      <p className="text-sm text-gray-400">{method.description}</p>
                    </div>
                    {selectedMethod === method.id && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!selectedMethod || !topupAmount || loading}
              loading={loading}
              onClick={handleTopup}
            >
              Top Up R {parseFloat(topupAmount || '0').toFixed(2)}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

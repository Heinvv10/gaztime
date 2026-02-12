import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Share2, Users, TrendingUp, Gift } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import QRCode from 'qrcode.react';

export function Referrals() {
  const navigate = useNavigate();
  const { user } = useStore();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.referralCode || 'LOADING...';
  const referralLink = `https://gaztime.co.za/ref/${referralCode}`;
  
  // Mock stats
  const stats = {
    invited: 12,
    joined: 8,
    earned: 160,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const message = `🔥 Join Gaz Time and get gas delivered in 30 minutes!\n\nUse my code: ${referralCode}\nWe both get R20 credit!\n\n${referralLink}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join Gaz Time',
        text: message,
      });
    } else {
      // Fallback to WhatsApp
      window.location.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 pb-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-navy-800/95 backdrop-blur-md border-b border-navy-700">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-navy-700 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="font-bold text-white">Referrals</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <div className="px-6 pt-6 space-y-6">
        {/* Hero section */}
        <motion.div
          className="bg-gradient-to-r from-accent to-accent-600 rounded-2xl p-6 text-center text-navy"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold mb-2">Earn R20 per Friend!</h2>
          <p className="text-navy/80 text-lg">
            Share Gaz Time and earn credits when your friends sign up
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold text-white mb-1">{stats.invited}</p>
            <p className="text-xs text-gray-400">Invited</p>
          </Card>
          <Card className="text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white mb-1">{stats.joined}</p>
            <p className="text-xs text-gray-400">Joined</p>
          </Card>
          <Card className="text-center">
            <Gift className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-white mb-1">R{stats.earned}</p>
            <p className="text-xs text-gray-400">Earned</p>
          </Card>
        </motion.div>

        {/* Referral code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <div className="text-center">
              <p className="text-gray-400 mb-3">Your Referral Code</p>
              <div className="bg-navy-800 rounded-xl p-6 mb-4">
                <p className="text-4xl font-bold text-gradient tracking-wider">
                  {referralCode}
                </p>
              </div>
              <Button
                variant="outline"
                fullWidth
                onClick={handleCopy}
                className={copied ? 'border-green-500 text-green-500' : ''}
              >
                <Copy className="w-5 h-5 mr-2" />
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* QR Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <div className="text-center">
              <p className="text-white font-semibold mb-4">Scan to Join</p>
              <div className="bg-white rounded-xl p-4 inline-block">
                <QRCode value={referralLink} size={180} />
              </div>
              <p className="text-gray-400 text-sm mt-4">
                Friends can scan this QR code to sign up with your referral
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Share button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button variant="primary" size="lg" fullWidth onClick={handleShare}>
            <Share2 className="w-5 h-5 mr-2" />
            Share via WhatsApp
          </Button>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <h3 className="font-bold text-white mb-4">How It Works</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-white">Share Your Code</p>
                  <p className="text-sm text-gray-400">
                    Send your unique referral code to friends and family
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-white">They Sign Up</p>
                  <p className="text-sm text-gray-400">
                    Your friend creates an account using your code
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-white">You Both Get R20!</p>
                  <p className="text-sm text-gray-400">
                    Credits are added to both wallets automatically
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function Splash() {
  const navigate = useNavigate();
  const { isAuthenticated, hasSeenOnboarding } = useStore();
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      
      // Navigate after animation
      setTimeout(() => {
        if (isAuthenticated) {
          navigate('/home', { replace: true });
        } else if (hasSeenOnboarding) {
          navigate('/auth/phone', { replace: true });
        } else {
          navigate('/onboarding', { replace: true });
        }
      }, 300);
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, isAuthenticated, hasSeenOnboarding]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-gradient-to-br from-navy via-navy-800 to-primary-900 flex items-center justify-center z-50"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <motion.div
              className="relative"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Flame className="w-24 h-24 mx-auto text-primary drop-shadow-glow" />
              <motion.div
                className="absolute inset-0 bg-primary rounded-full blur-2xl opacity-30"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
            
            <motion.h1
              className="text-4xl font-bold text-white mt-6 mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Gaz Time
            </motion.h1>
            
            <motion.p
              className="text-primary-300 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Clean Energy, Delivered
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

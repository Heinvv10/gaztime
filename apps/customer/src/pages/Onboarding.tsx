import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/useStore';
import { onboardingSteps } from '@/mocks/data';

export function Onboarding() {
  const navigate = useNavigate();
  const setHasSeenOnboarding = useStore((state) => state.setHasSeenOnboarding);
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setHasSeenOnboarding(true);
      navigate('/auth/phone');
    }
  };

  const handleSkip = () => {
    setHasSeenOnboarding(true);
    navigate('/auth/phone');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy to-navy-900 flex flex-col">
      {/* Skip button */}
      <div className="p-4 text-right">
        <button
          onClick={handleSkip}
          className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
        >
          Skip
        </button>
      </div>

      {/* Slides */}
      <div className="flex-1 flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="text-center max-w-md"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Emoji icon */}
            <motion.div
              className="text-8xl mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              {onboardingSteps[currentStep].image}
            </motion.div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-4">
              {onboardingSteps[currentStep].title}
            </h2>

            {/* Description */}
            <p className="text-gray-300 text-lg leading-relaxed">
              {onboardingSteps[currentStep].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="p-6 space-y-6">
        {/* Step indicators */}
        <div className="flex justify-center gap-2">
          {onboardingSteps.map((_, index) => (
            <motion.div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-primary'
                  : 'w-2 bg-gray-600'
              }`}
              initial={false}
              animate={{
                width: index === currentStep ? 32 : 8,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          ))}
        </div>

        {/* Next button */}
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleNext}
          className="group"
        >
          {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
          <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX } from 'lucide-react';
import { useZenemeStore } from '../../../../hooks/useZenemeStore';

interface BreathingPageProps {
  onComplete: () => void;
}

export function BreathingPage({ onComplete }: BreathingPageProps) {
  const { t } = useZenemeStore();
  const [completedCycle, setCompletedCycle] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  useEffect(() => {
    const cycleInterval = setInterval(() => {
      setBreathPhase((prev) => {
        if (prev === 'inhale') return 'hold';
        if (prev === 'hold') return 'exhale';
        setCompletedCycle(true);
        return 'inhale';
      });
    }, 4000);

    return () => clearInterval(cycleInterval);
  }, []);

  const getWavePosition = () => {
    switch (breathPhase) {
      case 'inhale':
        return '-30%';
      case 'hold':
        return '-30%';
      case 'exhale':
        return '10%';
      default:
        return '0%';
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-transparent z-50">
      
      {/* Wave animations */}
      <div className="absolute inset-0" style={{ transform: 'translateY(530px)' }}>
        <motion.div
          className="absolute inset-0 w-full h-full"
          animate={{
            y: getWavePosition(),
          }}
          transition={{
            duration: 4,
            ease: 'easeInOut',
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1440 3000"
            preserveAspectRatio="none"
            style={{ opacity: 0.3 }}
          >
            <motion.path
              d="M-240,500 Q120,350 480,500 T1200,500 T1920,500 L1920,3000 L-240,3000 Z"
              fill="url(#gradient1)"
              animate={{
                d: [
                  "M-240,500 Q120,135 480,500 T1200,500 T1920,500 L1920,3000 L-240,3000 Z",
                  "M-240,500 Q120,865 480,500 T1200,500 T1920,500 L1920,3000 L-240,3000 Z",
                  "M-240,500 Q120,135 480,500 T1200,500 T1920,500 L1920,3000 L-240,3000 Z",
                ],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#2e1065" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        <motion.div
          className="absolute inset-0 w-full h-full"
          animate={{
            y: getWavePosition(),
          }}
          transition={{
            duration: 4,
            ease: 'easeInOut',
            delay: 0.2,
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1440 3000"
            preserveAspectRatio="none"
            style={{ opacity: 0.4 }}
          >
            <motion.path
              d="M-240,550 Q360,400 960,550 T1680,550 T2400,550 L2400,3000 L-240,3000 Z"
              fill="url(#gradient2)"
              animate={{
                d: [
                  "M-240,550 Q360,1150 960,550 T1680,550 T2400,550 L2400,3000 L-240,3000 Z",
                  "M-240,550 Q360,-50 960,550 T1680,550 T2400,550 L2400,3000 L-240,3000 Z",
                  "M-240,550 Q360,1150 960,550 T1680,550 T2400,550 L2400,3000 L-240,3000 Z",
                ],
              }}
              transition={{
                duration: 6.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <defs>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5b21b6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.7" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        <motion.div
          className="absolute inset-0 w-full h-full"
          animate={{
            y: getWavePosition(),
          }}
          transition={{
            duration: 4,
            ease: 'easeInOut',
            delay: 0.4,
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 1440 3000"
            preserveAspectRatio="none"
            style={{ opacity: 0.5 }}
          >
            <motion.path
              d="M-240,600 Q120,450 480,600 T1200,600 T1920,600 L1920,3000 L-240,3000 Z"
              fill="url(#gradient3)"
              animate={{
                d: [
                  "M-240,600 Q120,1525 480,600 T1200,600 T1920,600 L1920,3000 L-240,3000 Z",
                  "M-240,600 Q120,-325 480,600 T1200,600 T1920,600 L1920,3000 L-240,3000 Z",
                  "M-240,600 Q120,1525 480,600 T1200,600 T1920,600 L1920,3000 L-240,3000 Z",
                ],
              }}
              transition={{
                duration: 5.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <defs>
              <linearGradient id="gradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#5b21b6" stopOpacity="0.8" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      <div className="w-full h-full relative flex flex-col items-center justify-center z-10">
        <div className="absolute top-12 left-0 right-0 z-10 px-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="inline-block px-4 py-2 rounded-full bg-[#121212]/80 backdrop-blur-md text-gray-300 text-sm mb-4 border border-white/5">
                {t.breathing.stepLabel}
              </div>
              <div className="h-2 bg-white/10 backdrop-blur-md rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#8B5CF6] to-violet-600 w-1/3 rounded-full" />
              </div>
            </div>

            <h1 className="text-4xl text-white mb-4">
              {t.breathing.title}
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              {t.breathing.description}
            </p>
          </div>
        </div>

        <div className="relative z-10 text-center">
          <motion.div
            key={breathPhase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-3xl text-white backdrop-blur-sm bg-white/10 px-8 py-4 rounded-full border border-white/5"
          >
            {breathPhase === 'inhale' && t.breathing.inhale}
            {breathPhase === 'hold' && t.breathing.hold}
            {breathPhase === 'exhale' && t.breathing.exhale}
          </motion.div>
        </div>

        <div className="absolute bottom-12 left-0 right-0 z-10 px-12">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <button
              onClick={() => setSoundOn(!soundOn)}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors backdrop-blur-md bg-white/10 rounded-full border border-white/5"
            >
              {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span>{soundOn ? t.breathing.mute : t.breathing.soundOn}</span>
            </button>

            <button
              onClick={onComplete}
              className="px-8 py-3 rounded-full backdrop-blur-xl bg-gradient-to-r from-[#8B5CF6] to-violet-700 text-white hover:from-violet-600 hover:to-violet-800 transition-all shadow-lg"
            >
              {completedCycle ? t.breathing.continueButton : t.breathing.skipButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, RefreshCw, ArrowRight } from 'lucide-react';
import { useZenemeStore } from '../../../../hooks/useZenemeStore';
import { Button } from '../../../ui/button';

interface BreathingPageProps {
  onComplete: () => void;
}

export function BreathingPage({ onComplete }: BreathingPageProps) {
  const { t } = useZenemeStore();
  const [completedCycle, setCompletedCycle] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showNudge, setShowNudge] = useState(false);
  const autoNavTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimerRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Timer finished
            setIsTimerRunning(false);
            setShowNudge(true);

            // Auto navigate after 1.5s (Strategy A)
            autoNavTimeoutRef.current = setTimeout(() => {
              onComplete();
            }, 1500);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(interval);
      if (autoNavTimeoutRef.current) clearTimeout(autoNavTimeoutRef.current);
    };
  }, [isTimerRunning, remainingSeconds, onComplete]);

  const handleOneMoreMinute = () => {
    if (autoNavTimeoutRef.current) {
      clearTimeout(autoNavTimeoutRef.current);
      autoNavTimeoutRef.current = null;
    }
    setRemainingSeconds(60);
    setIsTimerRunning(true);
    setShowNudge(false);
  };

  const handleNextStep = () => {
    if (autoNavTimeoutRef.current) {
      clearTimeout(autoNavTimeoutRef.current);
    }
    onComplete();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-transparent">

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
          <div className="max-w-4xl mx-auto mt-[30px]">
            <div className="mb-4">
              <div className="inline-block px-4 py-2 rounded-full bg-[#121212]/80 backdrop-blur-md text-gray-300 text-sm mb-4 border border-white/5">
                {t.breathing.stepLabel}
              </div>
              <div className="h-2 bg-white/10 backdrop-blur-md rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#8B5CF6] to-violet-600 w-1/3 rounded-full" />
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-2 mb-4">
              <div
                className="fixed bottom-80 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3"
                style={{ perspective: '1000px' }}
              >
                <div className="w-56 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5 shadow-inner">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-200 via-white to-violet-200 shadow-[0_0_10px_rgba(255,255,255,0.6)]"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(remainingSeconds / 60) * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </div>

                <div className="flex items-center justify-center gap-0.5 font-mono text-xs text-white/60 tracking-widest h-5 overflow-hidden">
                  <div className="relative w-5 h-full">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={Math.floor(remainingSeconds / 60)}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        {Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  <span className="pb-0.5">:</span>

                  <div className="relative w-2.5 h-full">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={Math.floor((remainingSeconds % 60) / 10)}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        {Math.floor((remainingSeconds % 60) / 10)}
                      </motion.span>
                    </AnimatePresence>
                  </div>

                  <div className="relative w-2.5 h-full">
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={remainingSeconds % 10}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        {remainingSeconds % 10}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            <h1 className="text-4xl text-white mb-4">
              {t.breathing.title}
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              一分钟呼吸训练，专注画面中的节奏起伏，让呼吸在几次往复间慢慢放缓、趋于平稳。
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
              {t.breathing.skipButton}
            </button>
          </div>
        </div>
      </div>

      {/* Completion Nudge / Toast */}
      <AnimatePresence>
        {showNudge && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-28 z-50 flex flex-col items-center gap-4 bg-[#1e1e1e]/95 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4"
          >
            <div className="text-center space-y-1">
              <h3 className="text-white font-semibold text-lg">做得很好</h3>
              <p className="text-slate-400 text-sm">我们进入下一步。</p>
            </div>

            <div className="flex gap-3 w-full">
              <Button
                onClick={handleOneMoreMinute}
                variant="outline"
                className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-white h-10 text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                再来 1 分钟
              </Button>
              <Button
                onClick={handleNextStep}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white h-10 text-sm font-medium"
              >
                下一步
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

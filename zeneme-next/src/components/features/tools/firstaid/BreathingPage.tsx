import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, RefreshCw, ArrowRight } from 'lucide-react';
import { useZenemeStore } from '../../../../hooks/useZenemeStore';
import { Button } from '../../../ui/button';
import { BreathingArcTimer } from './BreathingArcTimer';
/* eslint-disable @typescript-eslint/no-explicit-any */
interface BreathingPageProps {
  onComplete: () => void;
}

export function BreathingPage({ onComplete }: BreathingPageProps) {
  const { t } = useZenemeStore();
  const [completedCycle, setCompletedCycle] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [progressPercent, setProgressPercent] = useState(25);
  // ✅ 用 BreathingArcTimer 的 inhale 作为每个 16s 周期起点，强制背景“重置对齐”
  const [waveCycleKey, setWaveCycleKey] = useState(0);
  // ✅ BGM audio
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const bgmStartedRef = useRef(false);
  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [showNudge, setShowNudge] = useState(false);
  const autoNavTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio context for breathing sounds
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentOscillatorRef = useRef<OscillatorNode | null>(null);
  const currentGainRef = useRef<GainNode | null>(null);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  // ✅ Init BGM (mp4 audio track)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio('/audio/bgm.mp4');
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.35; // 你可以调小一点
    audio.muted = true; // 默认静音播放
    bgmRef.current = audio;

    const startPlayback = async () => {
      try {
        await audio.play();
      } catch (e) {
        console.error('[BGM] autoplay failed:', e);
      }
    };

    startPlayback();

    return () => {
      audio.pause();
      audio.currentTime = 0;
      bgmRef.current = null;
      bgmStartedRef.current = false;
    };

  }, []);
  // Play breathing sound based on phase
  const playBreathingSound = (phase: 'inhale' | 'hold' | 'exhale') => {
    if (!soundOn || !audioContextRef.current) return;

    // Stop any currently playing sound
    if (currentOscillatorRef.current) {
      try {
        currentOscillatorRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    }

    const audioContext = audioContextRef.current;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different frequencies and patterns for each phase
    if (phase === 'inhale') {
      // Rising tone for inhale
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 4);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 4);
    } else if (phase === 'exhale') {
      // Falling tone for exhale
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(220, audioContext.currentTime + 4);
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 4);
    } else {
      // Steady low tone for hold
      oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
    }

    oscillator.type = 'sine';
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 4);

    currentOscillatorRef.current = oscillator;
    currentGainRef.current = gainNode;
  };

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

            // Auto navigate after 15s (Strategy A)
            autoNavTimeoutRef.current = setTimeout(() => {
              onComplete();
            }, 15000);

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
  const stopBgm = () => {
    const bgm = bgmRef.current;
    if (!bgm) return;
    bgm.pause();
    bgm.currentTime = 0;
  };
  const handleNextStep = () => {
    stopBgm();
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

  // 仅用于停止时的静态位置兜底（不依赖 tailwind）
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

  /**
   * ✅ 4-4-4-4（16s）节奏：
   * 0-4s   吸气：低 -> 高
   * 4-8s   保持：高（冻结）
   * 8-12s  呼气：高 -> 低（第4秒到最低）
   * 12-16s 保持：低（冻结）
   */
  const CYCLE_DURATION = 16;
  const times = [0, 0.25, 0.5, 0.75, 1];

  // y：用重复值实现 hold 冻结
  const waveY = ['0%', '-60%', '-60%', '0%', '0%'];

  // 形状 morph：同样用重复值实现 hold 冻结
  const d1High = 'M-240,500 Q120,135 480,500 T1200,500 T1920,500 L1920,3000 L-240,3000 Z';
  const d1Low = 'M-240,500 Q120,865 480,500 T1200,500 T1920,500 L1920,3000 L-240,3000 Z';

  const d2High = 'M-240,550 Q360,-50 960,550 T1680,550 T2400,550 L2400,3000 L-240,3000 Z';
  const d2Low = 'M-240,550 Q360,1150 960,550 T1680,550 T2400,550 L2400,3000 L-240,3000 Z';

  const d3High = 'M-240,600 Q120,-325 480,600 T1200,600 T1920,600 L1920,3000 L-240,3000 Z';
  const d3Low = 'M-240,600 Q120,1525 480,600 T1200,600 T1920,600 L1920,3000 L-240,3000 Z';

  const waveTransition = {
    duration: CYCLE_DURATION,
    times,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-slate-900 z-0">
      {/* Wave animations */}
      {/* ✅ key 让背景在 inhale 时“重置对齐”到 16s 周期起点 */}
      <div
        key={waveCycleKey}
        className="absolute inset-0"
        style={{ transform: 'translateY(530px)' }}
      >
        {/* Layer 1 */}
        <motion.div
          className="absolute inset-0 w-full h-full"
          animate={isTimerRunning ? { y: waveY } : { y: getWavePosition() }}
          transition={isTimerRunning ? waveTransition : { duration: 0 }}
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
              animate={
                isTimerRunning
                  ? { d: [d1Low, d1High, d1High, d1Low, d1Low] }
                  : { d: breathPhase === 'exhale' ? d1Low : d1High }
              }
              transition={isTimerRunning ? waveTransition : { duration: 0 }}
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#2e1065" stopOpacity="0.6" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Layer 2 */}
        <motion.div
          className="absolute inset-0 w-full h-full"
          animate={isTimerRunning ? { y: waveY } : { y: getWavePosition() }}
          transition={isTimerRunning ? waveTransition : { duration: 0 }}
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
              animate={
                isTimerRunning
                  ? { d: [d2Low, d2High, d2High, d2Low, d2Low] }
                  : { d: breathPhase === 'exhale' ? d2Low : d2High }
              }
              transition={isTimerRunning ? waveTransition : { duration: 0 }}
            />
            <defs>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5b21b6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#4c1d95" stopOpacity="0.7" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Layer 3 */}
        <motion.div
          className="absolute inset-0 w-full h-full"
          animate={isTimerRunning ? { y: waveY } : { y: getWavePosition() }}
          transition={isTimerRunning ? waveTransition : { duration: 0 }}
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
              animate={
                isTimerRunning
                  ? { d: [d3Low, d3High, d3High, d3Low, d3Low] }
                  : { d: breathPhase === 'exhale' ? d3Low : d3High }
              }
              transition={isTimerRunning ? waveTransition : { duration: 0 }}
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

      <div className="w-full h-full relative z-10 overflow-y-auto">
        {/* ✅ 新增：用 flex 布局和最小高度 (min-h-[700px]) 来撑开页面 */}
        <div className="flex flex-col justify-between min-h-[700px] h-full">

          {/* ✅ 顶部和主体内容区域 */}
          {/* 1. 给这个外层容器加上 relative，作为计时器的定位锚点 */}
          <div className="w-full px-6 md:px-12 pt-12 pb-8 flex-1 z-10 relative">

            {/* 2. 新增：将计时器单独提取出来，用绝对定位和 Flexbox 占满这个区域并居中 */}
            <div className="absolute left-1/2 top-[80%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
              <div className="pointer-events-auto">
                <BreathingArcTimer
                  isPlaying={isTimerRunning}
                  onPhaseChange={(p) => {
                    setBreathPhase(p);
                    if (p === 'inhale') {
                      setCompletedCycle(true);
                      setWaveCycleKey((k) => k + 1);
                    }
                  }}
                />
              </div>
            </div>

            {/* 3. 原本的文字内容区域，加上 relative z-10 确保文字在计时器上层 */}
            <div className="max-w-4xl mx-auto mt-[30px] relative z-10 pointer-events-none">
              <div className="mb-4">
                <div className="block w-fit mx-auto px-4 py-2 rounded-full bg-slate-900/60 backdrop-blur-md text-slate-300 text-sm mb-4 border border-white/10">
                  {t.breathing.stepLabel}
                </div>
                <div className="h-2 bg-white/10 backdrop-blur-md rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#8B5CF6] to-violet-600 rounded-full"
                    animate={{ width: `${((60 - remainingSeconds) / 60) * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </div>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-white/40 text-sm font-medium tracking-widest tabular-nums">
                  {formatTime(remainingSeconds)}
                </span>
              </div>

              {/* ⚠️ 注意：这里原本的 BreathingArcTimer 已经被删除了，因为我们把它移到了上面的 absolute 容器里 */}

              <div className="mt-16 pointer-events-auto">
                <h1 className="text-4xl text-white mb-4">四步呼吸法</h1>
                <p className="text-gray-400 text-lg max-w-3xl">
                  四步呼吸法（箱式呼吸）：吸气 4 秒 → 停 4 秒 → 呼气 4 秒 → 停 4 秒。用稳定节奏激活副交感神经，让你更快恢复平静与掌控感。
                </p>
              </div>
            </div>
          </div>

          {/* ✅ 底部控制按钮区域 (去掉 absolute，加上 shrink-0 防止被压缩) */}
          <div className="w-full px-6 md:px-12 pb-12 shrink-0 z-10">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
              <button
                onClick={async () => {
                  const next = !soundOn;
                  setSoundOn(next);

                  if (audioContextRef.current?.state === 'suspended') {
                    try {
                      await audioContextRef.current.resume();
                    } catch { }
                  }

                  const bgm = bgmRef.current;
                  if (!bgm) return;

                  try {
                    // 确保音频一直在播
                    if (bgm.paused) {
                      await bgm.play();
                    }

                    // 只切换静音，不暂停
                    bgm.muted = !next;
                    console.log('[BGM status after toggle]', {
                      soundOnNext: next,
                      paused: bgm.paused,
                      muted: bgm.muted,
                      currentTime: bgm.currentTime,
                      ended: bgm.ended,
                      readyState: bgm.readyState,
                    });
                  } catch (e) {
                    console.error('[BGM] toggle mute failed:', e);
                    setSoundOn(false);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors backdrop-blur-md bg-white/10 rounded-full border border-white/5"
              >
                {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                <span>{soundOn ? t.breathing.mute : t.breathing.soundOn}</span>
              </button>

              <button
                onClick={() => {
                  stopBgm();
                  onComplete();
                }}
                className="px-8 py-3 rounded-full backdrop-blur-xl bg-gradient-to-r from-[#8B5CF6] to-violet-700 text-white hover:from-violet-600 hover:to-violet-800 transition-all shadow-lg"
              >
                {t.breathing.skipButton}
              </button>
            </div>
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
            className="absolute bottom-28 z-100 flex flex-col items-center gap-4 bg-[#1e1e1e]/95 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4"
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

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from "react-dom";
import { motion, useMotionValue } from 'motion/react';
import { cn } from '../../../ui/utils';
import { useZenemeStore } from '../../../../hooks/useZenemeStore';


function usePrefersReducedMotion() {
  // 初始值放到 useState initializer，避免在 effect 里同步 setState
  const [shouldReduceMotion, setShouldReduceMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event: MediaQueryListEvent) => {
      setShouldReduceMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return shouldReduceMotion;
}

interface BreathingArcTimerProps {
  isPlaying?: boolean;
  size?: number;
  strokeWidth?: number;
  onPhaseChange?: (phase: 'inhale' | 'hold' | 'exhale') => void;
  className?: string;
}

type BreathingPhase = 'INHALE' | 'HOLD_TOP' | 'EXHALE' | 'HOLD_BOTTOM';

const PHASE_DURATION = 4000;

export function BreathingArcTimer({
  isPlaying = true,
  size = 480,
  strokeWidth = 22,
  onPhaseChange,
  className,
}: BreathingArcTimerProps) {
  const { t } = useZenemeStore();
  const prefersReducedMotion = usePrefersReducedMotion();

  //  避免 SSR/Hydration 期间 document 不可用导致的渲染异常（只影响挂载方式，不改逻辑）
  const [mounted, setMounted] = useState(false);
    useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
      }, []);

  // State for UI rendering
  const [phase, setPhase] = useState<BreathingPhase>('INHALE');
  const [countdown, setCountdown] = useState(4);

  // Refs for logic loop to avoid closure staleness and re-renders
  const phaseRef = useRef<BreathingPhase>('INHALE');
  const startTimeRef = useRef<number | null>(null);

  // ✅ TS2554：useRef 需要初始值
  const rafRef = useRef<number | null>(null);

  const onPhaseChangeRef = useRef(onPhaseChange);

  // ✅ 用一个 ref 标记“需要在首帧重置 UI”，避免在 effect 里同步 setState
  const needsUiResetRef = useRef(false);

  // SVG parameters
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;

  // Motion value for performant updates without React render cycle
  const progressMv = useMotionValue(circumference);

  // Keep callback ref fresh
  useEffect(() => {
    onPhaseChangeRef.current = onPhaseChange;
  }, [onPhaseChange]);

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      startTimeRef.current = null;
      return;
    }

    // Initialize start time if needed
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();

      // Reset to initial state when starting/restarting (逻辑不变)
      phaseRef.current = 'INHALE';
      needsUiResetRef.current = true; //  让首帧去 setPhase/setCountdown
      progressMv.set(circumference);
    }

    const loop = () => {
      // ✅ 把“重置 UI 状态”从 effect 挪到 rAF 回调首帧，避免 lint 报错
      if (needsUiResetRef.current) {
        needsUiResetRef.current = false;
        setPhase('INHALE');
        setCountdown(4);
      }

      const now = Date.now();
      if (startTimeRef.current === null) startTimeRef.current = now;

      let elapsed = now - startTimeRef.current;

      // Phase Transition
      if (elapsed >= PHASE_DURATION) {
        elapsed = 0;
        startTimeRef.current = now;

        let nextPhase: BreathingPhase = 'INHALE';
        switch (phaseRef.current) {
          case 'INHALE': nextPhase = 'HOLD_TOP'; break;
          case 'HOLD_TOP': nextPhase = 'EXHALE'; break;
          case 'EXHALE': nextPhase = 'HOLD_BOTTOM'; break;
          case 'HOLD_BOTTOM': nextPhase = 'INHALE'; break;
        }

        phaseRef.current = nextPhase;
        setPhase(nextPhase);

        const simplifiedPhase =
          (nextPhase === 'HOLD_TOP' || nextPhase === 'HOLD_BOTTOM')
            ? 'hold'
            : (nextPhase === 'INHALE' ? 'inhale' : 'exhale');
        onPhaseChangeRef.current?.(simplifiedPhase);
      }

      // Progress Calculation (0 to 1)
      const tt = Math.max(0, Math.min(elapsed / PHASE_DURATION, 1));

      // Update Arc (Motion Value)
      let targetOffset = circumference;

      switch (phaseRef.current) {
        case 'INHALE':
          targetOffset = circumference * (1 - tt);
          break;
        case 'HOLD_TOP':
          targetOffset = 0;
          break;
        case 'EXHALE':
          targetOffset = circumference * tt;
          break;
        case 'HOLD_BOTTOM':
          targetOffset = circumference;
          break;
      }

      progressMv.set(targetOffset);

      // Countdown Calculation (4 -> 1)
      const currentCount = 4 - Math.floor(elapsed / 1000);
      const safeCount = Math.max(1, Math.min(4, currentCount));
      setCountdown(prev => (prev !== safeCount ? safeCount : prev));

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isPlaying, circumference, progressMv]);

  const getPhaseText = () => {
    switch (phase) {
      case 'INHALE': return t.breathing.inhale;
      case 'HOLD_TOP': return t.breathing.hold;
      case 'EXHALE': return t.breathing.exhale;
      case 'HOLD_BOTTOM': return t.breathing.hold;
    }
  };

  
  const content = (
    <div
      className={cn(
            "fixed left-1/2 top-1/2 z-9999 -translate-x-1/2 translate-y-[120px] md:translate-y-[40px]",
            className
            )}

      style={{ width: size, height: size / 2 + 40 }}
    >
      <div className="relative" style={{ width: size, height: size / 2 }}>
        <svg
          width={size}
          height={size / 2 + strokeWidth}
          viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
          className="overflow-visible"
        >
          <path
            d={`M ${strokeWidth/2},${center} A ${radius},${radius} 0 0,1 ${size - strokeWidth/2},${center}`}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {!prefersReducedMotion && (
            <motion.path
              d={`M ${strokeWidth/2},${center} A ${radius},${radius} 0 0,1 ${size - strokeWidth/2},${center}`}
              fill="none"
              stroke="white"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              style={{ strokeDashoffset: progressMv }}
            />
          )}
        </svg>

        <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ transform: "translateY(42px)" }} //往下挪，数值自己调：12/16/24/32
        >       
          <div style={{ fontSize: 76 }} className="font-light text-white tabular-nums tracking-tighter leading-none mb-2">
            {prefersReducedMotion ? 4 : countdown}
          </div>

          <div style={{ fontSize: 38 }} className="font-medium text-white/80 tracking-widest">
            {getPhaseText()}
          </div>
        </div>
      </div>
    </div>
  );

  //  未挂载前不渲染（防止 document 不可用）
  if (!mounted) return null;

  //  Portal：避免 fixed 被父级 transform/overflow 裁剪或层级覆盖
  return createPortal(content, document.body);
}

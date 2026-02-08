import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { cn } from '../../../ui/utils';
import { useZenemeStore } from '../../../../hooks/useZenemeStore';

function usePrefersReducedMotion() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduceMotion(mediaQuery.matches);

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
  size = 280,
  strokeWidth = 14,
  onPhaseChange,
  className,
}: BreathingArcTimerProps) {
  const { t } = useZenemeStore();
  const prefersReducedMotion = usePrefersReducedMotion();
  
  // State for UI rendering
  const [phase, setPhase] = useState<BreathingPhase>('INHALE');
  const [countdown, setCountdown] = useState(4);
  
  // Refs for logic loop to avoid closure staleness and re-renders
  const phaseRef = useRef<BreathingPhase>('INHALE');
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>();
  const onPhaseChangeRef = useRef(onPhaseChange);

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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startTimeRef.current = null;
      return;
    }

    // Initialize start time if needed
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
      // Reset to initial state when starting/restarting
      phaseRef.current = 'INHALE';
      setPhase('INHALE');
      setCountdown(4);
      progressMv.set(circumference);
    }

    const loop = () => {
      const now = Date.now();
      // Ensure startTime is set
      if (startTimeRef.current === null) startTimeRef.current = now;
      
      let elapsed = now - startTimeRef.current;

      // Phase Transition
      if (elapsed >= PHASE_DURATION) {
        // Switch phase logic
        elapsed = 0; // Reset logic time for new phase calculation immediately
        startTimeRef.current = now; // Reset timer

        let nextPhase: BreathingPhase = 'INHALE';
        switch (phaseRef.current) {
          case 'INHALE': nextPhase = 'HOLD_TOP'; break;
          case 'HOLD_TOP': nextPhase = 'EXHALE'; break;
          case 'EXHALE': nextPhase = 'HOLD_BOTTOM'; break;
          case 'HOLD_BOTTOM': nextPhase = 'INHALE'; break;
        }

        phaseRef.current = nextPhase;
        setPhase(nextPhase);
        
        // Notify parent
        const simplifiedPhase = 
          (nextPhase === 'HOLD_TOP' || nextPhase === 'HOLD_BOTTOM') 
            ? 'hold' 
            : (nextPhase === 'INHALE' ? 'inhale' : 'exhale');
        onPhaseChangeRef.current?.(simplifiedPhase);
      }

      // Progress Calculation (0 to 1)
      const t = Math.max(0, Math.min(elapsed / PHASE_DURATION, 1));
      
      // Update Arc (Motion Value)
      // strokeDashoffset: circumference (empty) -> 0 (full)
      let targetOffset = circumference;
      
      switch (phaseRef.current) {
        case 'INHALE':
          // 0 -> 1 : Empty -> Full
          // offset: C -> 0
          targetOffset = circumference * (1 - t);
          break;
        case 'HOLD_TOP':
          // Full static
          targetOffset = 0;
          break;
        case 'EXHALE':
          // 1 -> 0 : Full -> Empty
          // offset: 0 -> C
          // progress t goes 0->1. We want visual full->empty.
          // Formula: targetOffset = circumference * t
          targetOffset = circumference * t;
          break;
        case 'HOLD_BOTTOM':
          // Empty static
          targetOffset = circumference;
          break;
      }
      
      progressMv.set(targetOffset);

      // Countdown Calculation (4 -> 1)
      // 4 - floor(elapsed/1000)
      // clamp to 1..4 just in case
      const currentCount = 4 - Math.floor(elapsed / 1000);
      const safeCount = Math.max(1, Math.min(4, currentCount));
      
      // Only trigger render if value changed
      setCountdown(prev => prev !== safeCount ? safeCount : prev);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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

  return (
    <div 
      className={cn("fixed inset-0 m-auto z-20 flex items-center justify-center translate-y-[120px] md:translate-y-[40px] scale-100 md:scale-[1.5]", className)}
      style={{ width: size, height: size / 2 + 40 }}
    >
      <div className="relative" style={{ width: size, height: size / 2 }}>
        {/* SVG Container */}
        <svg 
          width={size} 
          height={size / 2 + strokeWidth}
          viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}
          className="overflow-visible"
        >
          {/* Background Track */}
          <path
            d={`M ${strokeWidth/2},${center} A ${radius},${radius} 0 0,1 ${size - strokeWidth/2},${center}`}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Progress Arc */}
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

        {/* Center Text */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-end pb-2"
          style={{ transform: 'translateY(20px)' }}
        >
           {/* Countdown Number */}
           <div className="text-6xl font-light text-white tabular-nums tracking-tighter leading-none mb-2">
            {prefersReducedMotion ? 4 : countdown}
          </div>
          
          {/* Phase Text */}
          <div className="text-lg font-medium text-white/80 tracking-widest">
            {getPhaseText()}
          </div>
        </div>
      </div>
    </div>
  );
}

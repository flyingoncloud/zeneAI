'use client';

import React from 'react';
import { TimerIcon, X } from 'lucide-react';

interface TaskFrameProps {
  /** Seconds left on this screen; hidden when null. */
  secondsLeft: number | null;
  /** This screen's full allowance, so the bar can show how much is spent. */
  totalSeconds: number;
  stepLabel: string;
  instruction: React.ReactNode;
  /** Amber callout under the instruction band, used by the hold screens. */
  banner?: React.ReactNode;
  onExit: () => void;
  onNext: () => void;
  nextEnabled: boolean;
  nextLabel?: string;
  /**
   * Why NEXT is still grey. A disabled button with no explanation reads as a
   * broken app, and the user then waits out a timer they never had to wait for.
   */
  nextHint?: string;
  children: React.ReactNode;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Three visual states for the clock. Every screen is timed, so a countdown that
 * blends into the chrome is worse than none: the user has to be able to tell at
 * a glance whether they have a minute or five seconds.
 */
function clockTone(secondsLeft: number): { pill: string; bar: string } {
  if (secondsLeft <= 10) {
    return {
      pill: 'border-rose-400/50 bg-rose-500/15 text-rose-300 animate-pulse',
      bar: 'bg-rose-400',
    };
  }
  if (secondsLeft <= 20) {
    return { pill: 'border-amber-400/50 bg-amber-500/15 text-amber-300', bar: 'bg-amber-400' };
  }
  return { pill: 'border-white/15 bg-white/5 text-slate-200', bar: 'bg-violet-400' };
}

/**
 * The chrome every task screen shares: exit + countdown on the left, the step
 * label centred, and a NEXT that only lights up once the screen is complete.
 */
export const TaskFrame: React.FC<TaskFrameProps> = ({
  secondsLeft,
  totalSeconds,
  stepLabel,
  instruction,
  banner,
  onExit,
  onNext,
  nextEnabled,
  nextLabel = '下一步',
  nextHint,
  children,
}) => {
  const tone = clockTone(secondsLeft ?? totalSeconds);
  const remaining = Math.max(0, Math.min(1, (secondsLeft ?? 0) / totalSeconds));

  return (
    <div className="h-full flex flex-col">
      <header className="relative flex items-center gap-3 px-4 md:px-6 py-3 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl">
        <button
          type="button"
          onClick={onExit}
          aria-label="退出测试"
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {secondsLeft !== null && (
          <div
            className={`flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full border transition-colors ${tone.pill}`}
            role="timer"
            aria-label="本题剩余时间"
          >
            <TimerIcon className="w-4 h-4 shrink-0" />
            <span className="tabular-nums text-base md:text-lg font-bold leading-none">
              {formatClock(secondsLeft)}
            </span>
          </div>
        )}

        <span className="flex-1 text-center text-xs md:text-sm text-slate-400 truncate">
          {stepLabel}
        </span>

        <button
          type="button"
          onClick={onNext}
          disabled={!nextEnabled}
          title={nextEnabled ? undefined : nextHint}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            nextEnabled
              ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500'
              : 'bg-white/5 text-slate-500 cursor-not-allowed'
          }`}
        >
          {nextLabel}
        </button>

        {/* Drains left to right along the bottom edge of the header, so the
            time left is readable without parsing the digits. */}
        {secondsLeft !== null && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5">
            <div
              className={`h-full transition-[width] duration-1000 ease-linear ${tone.bar}`}
              style={{ width: `${remaining * 100}%` }}
            />
          </div>
        )}
      </header>

      <div className="px-4 md:px-6 py-3 bg-violet-500/10 border-b border-violet-400/20">
        <p className="text-sm md:text-base text-violet-100 text-center leading-relaxed">
          {instruction}
        </p>
        {!nextEnabled && nextHint && (
          <p className="mt-1 text-xs text-violet-300/70 text-center">{nextHint}</p>
        )}
      </div>

      {banner && (
        <div className="px-4 md:px-6 py-2.5 bg-amber-500/15 border-b border-amber-400/30">
          <p className="text-sm font-medium text-amber-200 text-center">{banner}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">{children}</div>
    </div>
  );
};

TaskFrame.displayName = 'TaskFrame';

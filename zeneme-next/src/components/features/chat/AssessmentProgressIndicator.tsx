'use client';

import React from 'react';
import { motion } from 'motion/react';

/** Domain metadata */
const DOMAIN_META: Record<string, {
  name: string;
  icon: string;
  total: number;
  prompt: string;
}> = {
  '2.1': {
    name: '情绪觉察',
    icon: '💗',
    total: 10,
    prompt: '我想探索一下自己的情绪觉察能力，请从这个领域开始提问吧。',
  },
  '2.2': {
    name: '认知模式',
    icon: '🧠',
    total: 46,
    prompt: '我想了解自己的认知模式和思维习惯，请从这个领域开始提问。',
  },
  '2.3': {
    name: '关系模式',
    icon: '🤝',
    total: 27,
    prompt: '我想探索自己的关系模式和依恋风格，请从这个领域开始提问。',
  },
  '2.4': {
    name: '性格类型',
    icon: '🎭',
    total: 0,
    prompt: '',
  },
  '2.5': {
    name: '成长指数',
    icon: '🌱',
    total: 6,
    prompt: '我想评估一下自己的成长潜力和心灵韧性，请从这个领域开始提问。',
  },
};

const ALL_DOMAINS = ['2.1', '2.2', '2.3', '2.4', '2.5'];

interface AssessmentProgressIndicatorProps {
  totalAnswered: number;
  totalQuestions?: number;
  domainsCovered: string[];
  domainQuestionCounts?: Record<string, number>;
  canGenerateReport: boolean;
  onDomainSelect?: (domainCode: string, prompt: string) => void;
}

export const AssessmentProgressIndicator: React.FC<AssessmentProgressIndicatorProps> = ({
  totalAnswered,
  totalQuestions = 83,
  domainsCovered,
  domainQuestionCounts = {},
  canGenerateReport,
  onDomainSelect,
}) => {
  const percentage = Math.round((totalAnswered / totalQuestions) * 100);

  return (
    <div className="space-y-2">
      {/* Overall progress summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                canGenerateReport ? 'bg-emerald-400' : 'bg-violet-500/70'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-slate-500">
            {totalAnswered}/{totalQuestions}
          </span>
        </div>
        {canGenerateReport && (
          <span className="text-[10px] text-emerald-400/80">✓ 可生成报告</span>
        )}
      </div>

      {/* Domain cards row */}
      <div className="flex gap-1.5">
        {ALL_DOMAINS.map((code) => {
          const meta = DOMAIN_META[code];
          if (!meta) return null;

          const answered = domainQuestionCounts[code] || 0;
          const total = meta.total;
          const isComingSoon = total === 0;
          const domainPct = total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0;
          const isComplete = domainPct >= 80;
          const hasStarted = answered > 0;
          const canClick = !isComingSoon && !!onDomainSelect && !isComplete;

          return (
            <button
              key={code}
              type="button"
              disabled={!canClick}
              onClick={() => {
                if (canClick) onDomainSelect(code, meta.prompt);
              }}
              aria-label={`${meta.name}：已完成 ${answered}/${total}${isComingSoon ? '，即将开放' : ''}`}
              className={`
                flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg
                border transition-all duration-200 min-w-0
                ${isComingSoon
                  ? 'border-white/5 bg-white/[0.02] opacity-40 cursor-default'
                  : isComplete
                    ? 'border-emerald-500/20 bg-emerald-500/5 cursor-default'
                    : canClick
                      ? 'border-white/5 bg-white/[0.03] hover:border-violet-500/30 hover:bg-violet-500/10 cursor-pointer active:scale-95'
                      : 'border-white/5 bg-white/[0.03] cursor-default'
                }
              `}
            >
              {/* Icon */}
              <span className="text-base leading-none" aria-hidden="true">{meta.icon}</span>

              {/* Domain name */}
              <span className={`text-[10px] font-medium leading-tight truncate w-full text-center ${
                isComplete ? 'text-emerald-300/80' : hasStarted ? 'text-white/70' : 'text-white/40'
              }`}>
                {meta.name}
              </span>

              {/* Progress or status */}
              {isComingSoon ? (
                <span className="text-[9px] text-white/20">即将开放</span>
              ) : (
                <div className="w-full px-1">
                  <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        isComplete ? 'bg-emerald-400/80' : hasStarted ? 'bg-violet-500/60' : 'bg-white/10'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${domainPct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className={`text-[9px] tabular-nums block text-center mt-0.5 ${
                    isComplete ? 'text-emerald-400/60' : hasStarted ? 'text-violet-300/50' : 'text-white/20'
                  }`}>
                    {answered}/{total}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

AssessmentProgressIndicator.displayName = 'AssessmentProgressIndicator';

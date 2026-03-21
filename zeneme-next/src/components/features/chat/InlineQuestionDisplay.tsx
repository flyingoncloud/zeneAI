'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';

/** Shape of an inline assessment question */
export interface InlineQuestion {
  id: number;
  text: string;
  options: Array<{ value: number; text: string }>;
  domain: string;
  subcategory?: string;
}

interface InlineQuestionDisplayProps {
  question: InlineQuestion;
  onAnswer: (questionId: number, answerValue: number) => void;
  disabled?: boolean;
}

export const InlineQuestionDisplay: React.FC<InlineQuestionDisplayProps> = ({
  question,
  onAnswer,
  disabled = false,
}) => {
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const isAnswered = selectedValue !== null || disabled;

  const handleSelect = (value: number) => {
    if (isAnswered) return;
    setSelectedValue(value);
    onAnswer(question.id, value);
  };

  const handleKeyDown = (e: React.KeyboardEvent, value: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(value);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 120 }}
      role="group"
      aria-label={`测评问题：${question.text}`}
      className="
        relative overflow-hidden rounded-2xl
        bg-slate-900/60 backdrop-blur-xl
        border border-violet-500/20
        shadow-[0_0_15px_rgba(139,92,246,0.15)]
        p-5
      "
    >
      {/* Question text */}
      <p className="text-[15px] leading-relaxed text-white/90 font-light tracking-wide mb-4">
        {question.text}
      </p>

      {/* Options */}
      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="选择你的回答"
      >
        {question.options.map((option) => {
          const isSelected = selectedValue === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${option.value}. ${option.text}`}
              tabIndex={isAnswered && !isSelected ? -1 : 0}
              disabled={isAnswered && !isSelected}
              onClick={() => handleSelect(option.value)}
              onKeyDown={(e) => handleKeyDown(e, option.value)}
              className={`
                flex-1 min-w-[100px] px-3 py-2.5
                text-sm leading-snug
                rounded-xl border
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-1 focus:ring-offset-slate-900
                ${
                  isSelected
                    ? 'bg-violet-600/80 border-violet-400/50 text-white shadow-lg shadow-violet-500/25'
                    : isAnswered
                      ? 'bg-white/3 border-white/5 text-white/30 cursor-default'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-violet-400/30 cursor-pointer'
                }
              `}
            >
              <span className="font-medium">{option.value}.</span>{' '}
              <span>{option.text}</span>
            </button>
          );
        })}
      </div>

      {/* Answered confirmation */}
      {isAnswered && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-3 text-xs text-violet-300/60"
        >
          ✓ 已记录
        </motion.p>
      )}
    </motion.div>
  );
};

InlineQuestionDisplay.displayName = 'InlineQuestionDisplay';

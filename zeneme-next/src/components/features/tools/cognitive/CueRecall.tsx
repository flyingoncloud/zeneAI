'use client';

import React from 'react';
import { Check } from 'lucide-react';
import type { RecognitionTrial } from '@/data/cognitiveScreen';
import { ItemGlyph } from './ItemGlyph';

interface CueRecallProps {
  trials: RecognitionTrial[];
  /** targetId -> the option id the user picked for that row. */
  answers: Record<string, string>;
  onChange: (answers: Record<string, string>) => void;
}

/**
 * 提示后再认 — the rescue step after free recall (设计文档 7.2/7.3).
 *
 * One row per item the user failed to put back, three choices each: the item
 * itself against two that were never on screen.
 *
 * It earns its place twice over. Clinically, cue benefit is the thing that
 * separates "it never went in" from "it went in and I could not get it out" —
 * the second pattern is common, much less alarming, and invisible to a free
 * recall count. Experientially, it is the difference between a test that tells
 * you what you failed and one that gives you the answer back; the screen is
 * meant to be finished by people who are worried, not only by people who do
 * well at it.
 *
 * All three options in a row come from the same family, so the family is not a
 * hint. The help is the recognition format itself, which is the point.
 */
export const CueRecall: React.FC<CueRecallProps> = ({ trials, answers, onChange }) => {
  const pick = (targetId: string, optionId: string) => {
    const next = { ...answers };
    // Re-tapping the chosen card clears the row, so a misfire does not force
    // the user to commit to some other wrong answer.
    if (next[targetId] === optionId) delete next[targetId];
    else next[targetId] = optionId;
    onChange(next);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {trials.map((trial, index) => (
        <div
          key={trial.targetId}
          className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 space-y-3"
        >
          <p className="text-xs text-slate-500">
            第 {index + 1} 组 · 下面三个里有一个是刚才出现过的
          </p>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {trial.options.map((option) => {
              const isChosen = answers[trial.targetId] === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => pick(trial.targetId, option.id)}
                  aria-pressed={isChosen}
                  aria-label={option.label}
                  className={`relative aspect-square md:aspect-[4/3] rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                    isChosen
                      ? 'border-violet-400 bg-violet-500/20 ring-2 ring-violet-400/40'
                      : 'border-white/10 bg-slate-800/50 hover:border-violet-400/40'
                  }`}
                >
                  <ItemGlyph itemId={option.id} className="w-16 h-16 md:w-24 md:h-24" />
                  <span className="text-xs md:text-sm text-slate-300">{option.label}</span>
                  {isChosen && (
                    <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <p className="text-xs text-slate-500 text-center">
        每组选一个（已答 {Object.keys(answers).length}/{trials.length} 组）。
        不确定也可以猜——猜错不会倒扣。
      </p>
    </div>
  );
};

CueRecall.displayName = 'CueRecall';

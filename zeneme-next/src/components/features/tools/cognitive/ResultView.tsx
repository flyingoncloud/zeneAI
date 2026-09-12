'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Info, RotateCcw } from 'lucide-react';
import {
  BANDS,
  CELLS_PER_BLOCK,
  EDUCATION_BONUS,
  FAMILY_LABELS,
  bandDefinition,
  type BandDefinition,
  type ScreenResult,
} from '@/data/cognitiveScreen';

interface ResultViewProps {
  result: ScreenResult;
  onRetake: () => void;
  onExit: () => void;
}

/**
 * The report.
 *
 * Two things were wrong with the previous version and both are fixed here.
 *
 * A bare "74 / 100" tells the user nothing they can act on: they cannot tell
 * whether it is a pass, where the line is, or which part of it went badly. So
 * every band is on screen with its numbers, the current one marked, and the
 * score is itemised into rows that add up to the total.
 *
 * And the framing was wrong at both ends — "未经效度验证的探索性指标" in a red
 * warning box at the top reads as either alarming or meaningless, while the one
 * thing a screen like this owes a low scorer, the words "go and get this
 * checked, this is what it could be", was nowhere on the page. The caveat is
 * still here, stated plainly and in proportion, and the referral is now in the
 * band copy where a low scorer cannot miss it.
 */

/** Tailwind can only see class names it can read, so these are written out. */
const TONE: Record<BandDefinition['tone'], { hero: string; chip: string; bar: string }> = {
  emerald: {
    hero: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10',
    chip: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200',
    bar: 'bg-emerald-400',
  },
  amber: {
    hero: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
    chip: 'border-amber-400/50 bg-amber-500/15 text-amber-200',
    bar: 'bg-amber-400',
  },
  orange: {
    hero: 'text-orange-300 border-orange-400/40 bg-orange-500/10',
    chip: 'border-orange-400/50 bg-orange-500/15 text-orange-200',
    bar: 'bg-orange-400',
  },
};

/** Delays here are two selection tasks long, so most of them read in seconds. */
function formatDelay(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes} 分钟` : `${minutes} 分 ${rest} 秒`;
}

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-6 space-y-4">
    <h3 className="text-sm font-semibold text-white">{title}</h3>
    {children}
  </div>
);

export const ResultView: React.FC<ResultViewProps> = ({ result, onRetake, onExit }) => {
  const band = bandDefinition(result.band);
  const tone = TONE[band.tone];
  const memoryCells = CELLS_PER_BLOCK * result.blocks.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full overflow-y-auto p-6"
    >
      <div className="max-w-xl mx-auto space-y-5">
        <div className={`rounded-2xl border p-8 text-center space-y-3 backdrop-blur-xl ${tone.hero}`}>
          <p className="text-xs tracking-wide opacity-70">自我认知参考指数 · 非医疗用途</p>
          <p className="text-5xl font-bold tabular-nums">
            {result.totalScore}
            <span className="text-2xl opacity-50"> / 100</span>
          </p>
          <p className="text-base font-medium">{band.title}</p>
        </div>

        {/* The scale, with the thresholds spelled out. */}
        <Card title="这个分数落在哪一档">
          <div className="space-y-2">
            {BANDS.map((definition) => {
              const isCurrent = definition.band === result.band;
              const chip = TONE[definition.tone].chip;
              return (
                <div
                  key={definition.band}
                  className={`rounded-xl border px-4 py-3 flex items-baseline gap-3 ${
                    isCurrent ? chip : 'border-white/5 bg-white/[0.02] text-slate-400'
                  }`}
                >
                  <span className="text-sm font-semibold tabular-nums w-[4.5rem] shrink-0">
                    {definition.min}–{definition.max}
                  </span>
                  <span className="text-sm font-medium">{definition.name}</span>
                  {isCurrent && (
                    <span className="ml-auto text-xs font-semibold shrink-0">你在这里</span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            这三条线是我们按各项的分值权重划的，不是来自大样本常模，所以它更适合和你自己以后的分数比，而不是和别人比。
          </p>
        </Card>

        {/* Every point accounted for. */}
        <Card title="分数是怎么算出来的">
          <div className="space-y-5">
            {result.lines.map((line) => (
              <div key={line.key} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-slate-200">
                    {line.label}
                    {line.note && (
                      <span className="text-xs text-amber-300/70 ml-2">{line.note}</span>
                    )}
                  </span>
                  <span className="text-sm tabular-nums text-slate-300 shrink-0">
                    {line.earned}
                    <span className="text-slate-600"> / {line.max} 分</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
                    style={{ width: `${line.max > 0 ? (line.earned / line.max) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400">{line.detail}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{line.hint}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/5 space-y-1">
            {result.educationBonusApplied && (
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-violet-300/90">受教育年数校正</span>
                <span className="tabular-nums text-violet-300/90">+{EDUCATION_BONUS} 分</span>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-white">合计</span>
              <span className="text-sm font-semibold tabular-nums text-white">
                {result.totalScore} / 100 分
              </span>
            </div>
          </div>
        </Card>

        <Card title="接下来建议怎么做">
          <p className="text-sm text-slate-300 leading-relaxed">{band.meaning}</p>
          <p className="text-sm text-slate-200 leading-relaxed">{band.action}</p>
          {result.flags.length > 0 && (
            <ul className="text-xs text-slate-500 space-y-1 pt-1">
              {result.flags.map((flag) => (
                <li key={flag}>· {flag}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="记忆部分的细节">
          {result.blocks.map((block) => (
            <div key={block.family} className="text-sm space-y-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-slate-300">{FAMILY_LABELS[block.family]}</span>
                <span className="text-slate-400 tabular-nums text-xs">
                  认出 {block.setHits}/{CELLS_PER_BLOCK} · 位置对 {block.orderHits} · 差一格{' '}
                  {block.adjacentHits} · 间隔 {formatDelay(block.delaySeconds)}
                </span>
              </div>
              {block.cuedCount > 0 && (
                <p className="text-xs text-slate-500">
                  有 {block.cuedCount} 项当时没想起来，提示后认出 {block.recognisedIds.length} 项。
                </p>
              )}
            </div>
          ))}

          <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-500">选了没出现过的</p>
              <p className="text-slate-200 tabular-nums text-base">{result.falseRecognitions} 次</p>
              <p className="text-slate-600 mt-1">更像是当时没记住</p>
            </div>
            <div>
              <p className="text-slate-500">同组混淆</p>
              <p className="text-slate-200 tabular-nums text-base">{result.intrusions} 次</p>
              <p className="text-slate-600 mt-1">出现过、但自己当时没选的项目</p>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {memoryCells} 个项目里，间隔越长而掉得越多，越值得留意；两组都一样低，则更可能是当时没记住，而不是后来忘了。
          </p>
        </Card>

        {/* Placed at the end, sized like a footnote rather than a warning: it is
            a scope statement, not a hazard. */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 flex gap-3">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            这份结果是一次自助小测的表现记录，题目由我们自己编写，不是 MoCA
            或任何已发表量表的电子版，也没有做过效度验证。它不能用来诊断或排除任何疾病——只有医生的面诊和检查可以。
            单次分数受睡眠、情绪、用药和当时的专注程度影响很大，看变化比看一次的数字有意义。
          </p>
        </div>

        <div className="flex gap-3 pb-6">
          <button
            type="button"
            onClick={onRetake}
            className="flex-1 px-5 py-3 rounded-xl border border-white/10 text-slate-200 text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            换一套题重测
          </button>
          <button
            type="button"
            onClick={onExit}
            className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-purple-500 transition-all"
          >
            完成
          </button>
        </div>
      </div>
    </motion.div>
  );
};

ResultView.displayName = 'ResultView';

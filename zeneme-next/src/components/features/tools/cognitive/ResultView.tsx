'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import {
  BAND_COPY,
  CELLS_PER_BLOCK,
  FAMILY_LABELS,
  WEIGHTS,
  type ScreenResult,
} from '@/data/cognitiveScreen';

interface ResultViewProps {
  result: ScreenResult;
  onRetake: () => void;
  onExit: () => void;
}

/** What each of the four selection domains is actually reading. */
const DOMAIN_HINTS: Record<string, string> = {
  orientation: '知道现在是什么季节、大概什么时候——定向力最先受影响，也最容易自己察觉。',
  attention: '在一堆相似图形里把目标一个不漏地找出来，反映持续注意和视觉搜索。',
  calculation: '同时记住两堆的数量再合起来算，考的是数感和心算时的信息保持。',
  fluency: '「水果」这个类别在脑子里浮现得有多快，反映语义提取的效率。',
};

const BAND_RING: Record<ScreenResult['band'], string> = {
  green: 'text-emerald-400 border-emerald-400/40 bg-emerald-500/10',
  amber: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
  orange: 'text-orange-300 border-orange-400/40 bg-orange-500/10',
};

/** Delays here are two selection tasks long, so most of them read in seconds. */
function formatDelay(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes} 分钟` : `${minutes} 分 ${rest} 秒`;
}

const MetricRow: React.FC<{
  label: string;
  hint: string;
  hits: number;
  total: number;
  points: number;
  /** Extra qualifier, e.g. how many wrong taps offset the right ones. */
  note?: string;
}> = ({ label, hint, hits, total, points, note }) => (
  <div className="space-y-1.5">
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-slate-200">
        {label}
        {note && <span className="text-xs text-amber-300/70 ml-2">{note}</span>}
      </span>
      <span className="text-sm tabular-nums text-slate-400">
        {hits}/{total}
        <span className="text-slate-600"> · 满分 {points}</span>
      </span>
    </div>
    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
        style={{ width: `${total > 0 ? (hits / total) * 100 : 0}%` }}
      />
    </div>
    <p className="text-xs text-slate-500">{hint}</p>
  </div>
);

export const ResultView: React.FC<ResultViewProps> = ({ result, onRetake, onExit }) => {
  const copy = BAND_COPY[result.band];
  const memoryCells = CELLS_PER_BLOCK * result.blocks.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full overflow-y-auto p-6"
    >
      <div className="max-w-xl mx-auto space-y-5">
        <div
          className={`rounded-2xl border p-8 text-center space-y-3 backdrop-blur-xl ${BAND_RING[result.band]}`}
        >
          <p className="text-xs uppercase tracking-widest opacity-70">认知快测指数</p>
          <p className="text-5xl font-bold tabular-nums">
            {result.totalScore}
            <span className="text-2xl opacity-50"> / 100</span>
          </p>
          <p className="text-base font-medium">{copy.title}</p>
        </div>

        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-100/90 leading-relaxed">
            这是一个<strong className="font-semibold">未经效度验证的探索性指标</strong>
            ，不是诊断，也不能替代认知量表或医生的判断。它的题目是我们自己编写的，分数只适合和你自己以往的分数比较。
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-white">分项表现</h3>

          <MetricRow
            label="顺序记忆"
            hint="把正确的项目放回正确的位置——既考记忆，也考按顺序取出的能力。"
            hits={result.orderHits}
            total={memoryCells}
            points={WEIGHTS.order}
          />
          <MetricRow
            label="延迟识别"
            hint="不论位置，认出自己当初选过的项目。这一项最接近临床上最看重的延迟回忆。"
            hits={result.setHits}
            total={memoryCells}
            points={WEIGHTS.set}
          />

          {result.domains.map((domain) => (
            <MetricRow
              key={domain.domain}
              label={domain.label}
              hint={DOMAIN_HINTS[domain.domain] ?? ''}
              hits={domain.hits}
              total={domain.targets}
              points={domain.points}
              note={
                domain.falsePositives > 0 ? `多选了 ${domain.falsePositives} 个` : undefined
              }
            />
          ))}

          <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-500">虚假识别</p>
              <p className="text-slate-200 tabular-nums text-base">{result.falseRecognitions} 次</p>
              <p className="text-slate-600 mt-1">选了从未出现过的项目</p>
            </div>
            <div>
              <p className="text-slate-500">同组混淆</p>
              <p className="text-slate-200 tabular-nums text-base">{result.intrusions} 次</p>
              <p className="text-slate-600 mt-1">选了出现过但自己没放进格子的项目</p>
            </div>
          </div>

          {result.educationBonusApplied && (
            <p className="text-xs text-violet-300/80">已按受教育年数加 3 分。</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">分组明细</h3>
          {result.blocks.map((block) => (
            <div key={block.family} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-slate-300">{FAMILY_LABELS[block.family]}</span>
              <span className="text-slate-400 tabular-nums text-xs">
                顺序 {block.orderHits}/{CELLS_PER_BLOCK} · 识别 {block.setHits}/{CELLS_PER_BLOCK} ·
                间隔 {formatDelay(block.delaySeconds)}
              </span>
            </div>
          ))}
          <p className="text-xs text-slate-500 leading-relaxed">
            间隔越长而分数掉得越多，越值得留意；三组都一样低，则更可能是当时没记住，而不是后来忘了。
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-6 space-y-3">
          <h3 className="text-sm font-semibold text-white">建议</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{copy.advice}</p>
          {result.flags.length > 0 && (
            <ul className="text-xs text-slate-500 space-y-1 pt-1">
              {result.flags.map((flag) => (
                <li key={flag}>· {flag}</li>
              ))}
            </ul>
          )}
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

'use client';

import React, { useMemo } from 'react';
import { DOMAINS, TOTAL_DOMAIN_WEIGHT as TOTAL_WEIGHT } from '@/data/domains';

interface DomainProgressBarProps {
  totalQuestions: number;
  currentIndex: number;
  highWaterMark: number;
  currentDomain?: string | null;
  domainSummary: Record<string, { total: number; answered: number }>;
  answeredIndices: Set<number>;
  onDomainSelect?: (domainCode: string) => void;
}

export const DomainProgressBar: React.FC<DomainProgressBarProps> = ({
  totalQuestions,
  currentIndex,
  currentDomain,
  domainSummary,
  answeredIndices,
  onDomainSelect,
}) => {
  const hasBackendData = Object.values(domainSummary).some((s) => s.total > 0);

  const fallback = useMemo(() => {
    const ranges: Array<{ start: number; end: number; total: number }> = [];
    let cursor = 0;
    for (const d of DOMAINS) {
      const count = TOTAL_WEIGHT > 0 ? Math.round((d.weight / TOTAL_WEIGHT) * totalQuestions) : 0;
      ranges.push({ start: cursor, end: cursor + count, total: count });
      cursor += count;
    }
    return ranges;
  }, [totalQuestions]);

  const fallbackDomainAnswered = useMemo(() => {
    const counts: number[] = [];
    for (const range of fallback) {
      let answered = 0;
      for (let i = range.start; i < range.end; i++) {
        if (answeredIndices.has(i)) answered++;
      }
      counts.push(answered);
    }
    return counts;
  }, [fallback, answeredIndices]);

  // Compute per-domain data for rendering
  const domainData = useMemo(() => {
    return DOMAINS.map((d, idx) => {
      const bs = domainSummary[d.code];
      const fb = fallback[idx];
      const total = hasBackendData ? (bs?.total ?? 0) : fb.total;
      const answered = hasBackendData ? (bs?.answered ?? 0) : fallbackDomainAnswered[idx];
      const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
      const active = hasBackendData
        ? currentDomain === d.code
        : (currentIndex >= fb.start && currentIndex < fb.end);
      return { ...d, total, answered, pct, active, fb };
    }).filter(d => d.total > 0);
  }, [hasBackendData, domainSummary, fallback, fallbackDomainAnswered, currentDomain, currentIndex]);

  const overallAnswered = hasBackendData
    ? Object.values(domainSummary).reduce((s, v) => s + v.answered, 0)
    : fallbackDomainAnswered.reduce((s, v) => s + v, 0);
  const overallPct = totalQuestions > 0 ? Math.round((overallAnswered / totalQuestions) * 100) : 0;

  const base = hasBackendData
    ? Object.values(domainSummary).reduce((s, v) => s + v.total, 0)
    : totalQuestions;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3 text-center">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
          五维心理评估
        </h2>
        <p className="text-sm text-slate-400">
          探索你在五大心理维度上的内在模式
        </p>
        <div className="flex items-baseline justify-between px-1">
          <span className="text-xs text-slate-500">{overallAnswered}/{totalQuestions}</span>
          <span className="text-xs text-slate-500">{overallPct}%完成</span>
        </div>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-[3px] w-full items-center">
        {domainData.map((d) => {
          const w = base > 0 ? (d.total / base) * 100 : 0;
          const fill = d.total > 0 ? (d.answered / d.total) * 100 : 0;
          return (
            <button
              type="button"
              key={d.code}
              onClick={() => onDomainSelect?.(d.code)}
              aria-label={`${d.label} ${d.answered}/${d.total}`}
              className="relative rounded-full overflow-hidden cursor-pointer hover:opacity-80 active:scale-95 transition-all"
              style={{
                width: `${w}%`,
                height: d.active ? '10px' : '7px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                transition: 'height 0.3s ease',
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${fill}%`,
                  backgroundColor: d.color,
                  boxShadow: d.active ? `0 0 12px ${d.color}` : 'none',
                  transition: 'width 0.5s ease-out, box-shadow 0.3s ease',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Labels with inline progress for active domain */}
      <div className="flex gap-[3px] w-full">
        {domainData.map((d) => {
          const w = base > 0 ? (d.total / base) * 100 : 0;
          return (
            <div key={d.code} className="text-center truncate" style={{ width: `${w}%` }}>
              <button
                type="button"
                onClick={() => onDomainSelect?.(d.code)}
                className="text-[11px] font-semibold cursor-pointer hover:opacity-80 transition-all leading-tight"
                style={{
                  color: d.active ? d.color : 'rgba(148,163,184,0.4)',
                  transition: 'color 0.3s ease',
                }}
              >
                {d.label}
                {d.active && (
                  <span className="block text-[9px] font-normal opacity-70">
                    {d.answered}/{d.total} {d.pct}%
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

DomainProgressBar.displayName = 'DomainProgressBar';

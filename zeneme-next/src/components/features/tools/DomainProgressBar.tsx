'use client';

import React, { useMemo } from 'react';

const DOMAINS = [
  { code: '2.1', label: '情绪觉察', color: '#f472b6', weight: 10 },
  { code: '2.2', label: '认知模式', color: '#34d399', weight: 46 },
  { code: '2.3', label: '关系模式', color: '#fb923c', weight: 27 },
  { code: '2.4', label: '性格类型', color: '#a78bfa', weight: 0 },
  { code: '2.5', label: '成长指数', color: '#38bdf8', weight: 6 },
];

const TOTAL_WEIGHT = DOMAINS.reduce((s, d) => s + d.weight, 0);

interface DomainProgressBarProps {
  totalQuestions: number;
  currentIndex: number;
  /** Highest question index reached (doesn't decrease when jumping back) */
  highWaterMark: number;
  currentDomain?: string | null;
  domainSummary: Record<string, { total: number; answered: number }>;
  /** Set of answered question indices — used for accurate per-domain counts in fallback mode */
  answeredIndices: Set<number>;
  onDomainSelect?: (domainCode: string) => void;
}

export const DomainProgressBar: React.FC<DomainProgressBarProps> = ({
  totalQuestions,
  currentIndex,
  highWaterMark,
  currentDomain,
  domainSummary,
  answeredIndices,
  onDomainSelect,
}) => {
  // Check if backend provided real domain data
  const hasBackendData = Object.values(domainSummary).some((s) => s.total > 0);

  // Fallback: compute sequential ranges from weights scaled to totalQuestions
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

  // Compute per-domain answered counts from answeredIndices + fallback ranges
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

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5 text-center">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-400/80">
          内 视 快 测
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
          五维心理评估
        </h2>
        <p className="text-sm text-slate-400">
          探索你在五大心理维度上的内在模式
        </p>
      </div>

      {/* Counter: domain-specific + overall */}
      {(() => {
        // Determine active domain — from backend or fallback ranges
        let activeDomainCode = currentDomain;
        if (!activeDomainCode) {
          for (let i = 0; i < DOMAINS.length; i++) {
            const r = fallback[i];
            if (r.total > 0 && currentIndex >= r.start && currentIndex < r.end) {
              activeDomainCode = DOMAINS[i].code;
              break;
            }
          }
        }

        const activeMeta = DOMAINS.find((d) => d.code === activeDomainCode);
        const activeIdx = DOMAINS.findIndex((d) => d.code === activeDomainCode);
        const bs = activeDomainCode ? domainSummary[activeDomainCode] : null;
        const fb = fallback[activeIdx >= 0 ? activeIdx : 0];

        const dTotal = hasBackendData ? (bs?.total ?? 0) : fb?.total ?? 0;
        const dAnswered = hasBackendData
          ? (bs?.answered ?? 0)
          : (activeIdx >= 0 ? fallbackDomainAnswered[activeIdx] : 0);
        const dPct = dTotal > 0 ? Math.round((dAnswered / dTotal) * 100) : 0;

        const overallAnswered = hasBackendData
          ? Object.values(domainSummary).reduce((s, v) => s + v.answered, 0)
          : fallbackDomainAnswered.reduce((s, v) => s + v, 0);
        const overallPct = totalQuestions > 0 ? Math.round((overallAnswered / totalQuestions) * 100) : 0;

        return (
          <div className="px-1 space-y-1">
            {/* Active domain progress */}
            {activeMeta && dTotal > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: activeMeta.color }}
                  />
                  <span className="text-sm font-medium" style={{ color: activeMeta.color }}>
                    {activeMeta.label}
                  </span>
                  <span className="text-sm text-slate-400">
                    {dAnswered}/{dTotal}
                  </span>
                </div>
                <span className="text-sm" style={{ color: activeMeta.color }}>
                  {dPct}%
                </span>
              </div>
            )}
            {/* Overall progress */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs text-slate-500">总进度 </span>
                <span className="text-xs text-slate-400">{overallAnswered}/{totalQuestions}</span>
              </div>
              <span className="text-xs text-slate-500">{overallPct}% complete</span>
            </div>
          </div>
        );
      })()}

      {/* Segmented bar */}
      <div className="flex gap-[3px] w-full items-center">
        {DOMAINS.map((d, idx) => {
          const bs = domainSummary[d.code];
          const fb = fallback[idx];

          const domainTotal = hasBackendData ? (bs?.total ?? 0) : fb.total;
          if (domainTotal === 0) return null;

          const base = hasBackendData
            ? Object.values(domainSummary).reduce((s, v) => s + v.total, 0)
            : totalQuestions;
          const w = base > 0 ? (domainTotal / base) * 100 : 0;

          // Fill calculation
          let fill: number;
          if (hasBackendData) {
            fill = domainTotal > 0 ? ((bs?.answered ?? 0) / domainTotal) * 100 : 0;
          } else {
            // Use actual answered count per domain range
            fill = domainTotal > 0 ? (fallbackDomainAnswered[idx] / domainTotal) * 100 : 0;
          }

          const active = hasBackendData
            ? currentDomain === d.code
            : (currentIndex >= fb.start && currentIndex < fb.end);

          return (
            <button
              type="button"
              key={d.code}
              onClick={() => onDomainSelect?.(d.code)}
              aria-label={`跳转到${d.label}领域`}
              className="relative rounded-full overflow-hidden cursor-pointer hover:opacity-80 active:scale-95 transition-all"
              style={{
                width: `${w}%`,
                height: active ? '10px' : '7px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                transition: 'height 0.3s ease',
              }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${fill}%`,
                  backgroundColor: d.color,
                  boxShadow: active ? `0 0 12px ${d.color}` : 'none',
                  transition: 'width 0.5s ease-out, box-shadow 0.3s ease',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-[3px] w-full">
        {DOMAINS.map((d, idx) => {
          const bs = domainSummary[d.code];
          const fb = fallback[idx];

          const domainTotal = hasBackendData ? (bs?.total ?? 0) : fb.total;
          if (domainTotal === 0) return null;

          const base = hasBackendData
            ? Object.values(domainSummary).reduce((s, v) => s + v.total, 0)
            : totalQuestions;
          const w = base > 0 ? (domainTotal / base) * 100 : 0;

          const active = hasBackendData
            ? currentDomain === d.code
            : (currentIndex >= fb.start && currentIndex < fb.end);

          return (
            <div key={d.code} className="text-center truncate" style={{ width: `${w}%` }}>
              <button
                type="button"
                onClick={() => onDomainSelect?.(d.code)}
                className="text-[11px] font-semibold cursor-pointer hover:opacity-80 transition-all"
                style={{
                  color: active ? d.color : 'rgba(148,163,184,0.4)',
                  transition: 'color 0.3s ease',
                }}
              >
                {d.label}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

DomainProgressBar.displayName = 'DomainProgressBar';

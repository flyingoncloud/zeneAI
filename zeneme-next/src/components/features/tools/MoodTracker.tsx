import React, { useState, useMemo } from 'react';
import { useZenemeStore, MoodLog } from '../../../hooks/useZenemeStore';
import { Button } from '../../ui/button';
import { ChevronLeft, ChevronRight, X, BarChart2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Dialog, DialogContent } from '../../ui/dialog';
import { ScrollArea } from '../../ui/scroll-area';
import {
  IconAnxious,
  IconSad,
  IconAngry,
  IconHappy,
  IconRelieved,
  IconConfused,
  IconTired,
  IconGrateful,
  IconCalm,
  IconSatisfied,
  IconExpectant,
  IconConfident,
  IconCurious,
  IconWarm,
  IconRepressed,
  IconScared,
  IconWronged,
  IconLonely
} from '../../ui/ZeneMeEmotions';

// ── Dark Theme Tokens ──
import { DK } from '../../../styles/darktheme';

// --- Configuration ---

type MoodConfigType = {
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  level: number; // 0-15
  color: string;
  type: 'pos' | 'neg';
};

// Expanded 16 Emotions
// Positive (8): Happy, Calm, Satisfied, Grateful, Expectant, Confident, Curious, Warm
// Negative (8): Anxious, Sad, Angry, Repressed, Scared, Wronged, Lonely, Confused

export const MOOD_CONFIG: Record<string, MoodConfigType> = {
  // Positive (Levels 8-15)
  Happy:     { label: '开心', Icon: IconHappy,    level: 15, color: '#F59E0B', type: 'pos' },
  Calm:      { label: '平静', Icon: IconCalm,     level: 14, color: '#A78BFA', type: 'pos' },
  Satisfied: { label: '满足', Icon: IconSatisfied,level: 13, color: '#FCD34D', type: 'pos' },
  Grateful:  { label: '感激', Icon: IconGrateful, level: 12, color: '#F472B6', type: 'pos' },
  Expectant: { label: '期待', Icon: IconExpectant,level: 11, color: '#FBBF24', type: 'pos' },
  Confident: { label: '自信', Icon: IconConfident,level: 10, color: '#F59E0B', type: 'pos' },
  Curious:   { label: '好奇', Icon: IconCurious,  level: 9,  color: '#60A5FA', type: 'pos' },
  Warm:      { label: '温暖', Icon: IconWarm,     level: 8,  color: '#FB7185', type: 'pos' },

  // Negative (Levels 0-7)
  Confused:  { label: '迷茫', Icon: IconConfused, level: 7,  color: '#94A3B8', type: 'neg' },
  Lonely:    { label: '孤独', Icon: IconLonely,    level: 6,  color: '#64748B', type: 'neg' },
  Wronged:   { label: '委屈', Icon: IconWronged,  level: 5,  color: '#60A5FA', type: 'neg' },
  Scared:    { label: '害怕', Icon: IconScared,   level: 4,  color: '#818CF8', type: 'neg' },
  Repressed: { label: '压抑', Icon: IconRepressed,level: 3,  color: '#475569', type: 'neg' },
  Angry:     { label: '愤怒', Icon: IconAngry,    level: 2,  color: '#EF4444', type: 'neg' },
  Sad:       { label: '悲伤', Icon: IconSad,      level: 1,  color: '#3B82F6', type: 'neg' },
  Anxious:   { label: '焦虑', Icon: IconAnxious,  level: 0,  color: '#F59E0B', type: 'neg' },
  
  // Backwards compatibility / Mapping
  Neutral:   { label: '平淡', Icon: IconRelieved, level: 14, color: '#A78BFA', type: 'pos' },
  Tired:     { label: '疲惫', Icon: IconTired,    level: 3,  color: '#94A3B8', type: 'neg' },
  Overwhelmed:{ label: '不知所措', Icon: IconAnxious, level: 0, color: '#F59E0B', type: 'neg' },
  Relieved:  { label: '宽慰', Icon: IconRelieved, level: 14, color: '#A78BFA', type: 'pos' },
};

// Chart color: maps mood level (0-15) → gradient color for dark theme
// Bottom (low) → blue #5B7CFF; Top (positive) → golden #FFC15A
function levelToColor(level: number): string {
  const t = level / 15;
  const stops = [
    { p: 0,    r: 91,  g: 124, b: 255 },   // #5B7CFF  blue (low mood)
    { p: 0.40, r: 100, g: 148, b: 255 },   // brighter blue
    { p: 0.70, r: 255, g: 210, b: 100 },   // warm yellow
    { p: 1,    r: 255, g: 193, b: 90  },    // #FFC15A  golden (high mood)
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t <= stops[i + 1].p) {
      const lt = (t - stops[i].p) / (stops[i + 1].p - stops[i].p);
      const r = Math.round(stops[i].r + (stops[i + 1].r - stops[i].r) * lt);
      const g = Math.round(stops[i].g + (stops[i + 1].g - stops[i].g) * lt);
      const b = Math.round(stops[i].b + (stops[i + 1].b - stops[i].b) * lt);
      return `rgb(${r},${g},${b})`;
    }
  }
  return 'rgb(255,193,90)';
}

// Helper to get formatted date key
const getDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const MoodTracker: React.FC = () => {
  const { moodLogs, t, language } = useZenemeStore();
  const [viewMode, setViewMode] = useState<'chart' | 'calendar'>('chart');
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');
  const [currentDate, setCurrentDate] = useState(new Date()); // For Calendar month nav
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // For detail modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // --- Data Processing ---

  // Group logs by date key
  const logsByDate = useMemo(() => {
    const grouped: Record<string, MoodLog[]> = {};
    moodLogs.forEach(log => {
      // Ensure date consistency
      const key = log.date;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(log);
    });
    return grouped;
  }, [moodLogs]);

  // Determine Main Emotion for a date
  const getMainEmotionLog = (logs: MoodLog[]) => {
    if (!logs || logs.length === 0) return null;
    
    // Sort by: 
    // 1. Intensity (desc)
    // 2. Frequency of that emotion (desc)
    // 3. Timestamp (desc/latest)
    
    // Calculate frequencies first
    const freq: Record<string, number> = {};
    logs.forEach(l => { freq[l.mood] = (freq[l.mood] || 0) + 1; });

    return [...logs].sort((a, b) => {
      const intA = a.intensity || 50;
      const intB = b.intensity || 50;
      if (intA !== intB) return intB - intA; // Higher intensity first

      const freqA = freq[a.mood];
      const freqB = freq[b.mood];
      if (freqA !== freqB) return freqB - freqA; // Higher frequency first

      const timeA = Number(a.timestamp) || 0;
      const timeB = Number(b.timestamp) || 0;
      return timeB - timeA; // Latest first
    })[0];
  };

  const openDetailModal = (date: Date) => {
    setSelectedDate(date);
    setIsDetailModalOpen(true);
  };

  // --- Chart Logic ---

  const dashboardData = useMemo(() => {
    const numDays = chartRange === '7d' ? 7 : 30;
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const days: Array<{
      date: Date; dateKey: string; label: string;
      entries: Array<{ level: number; mood: string; config: MoodConfigType }>;
      minLevel: number | null; maxLevel: number | null; count: number;
    }> = [];

    let totalEntries = 0;

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = getDateKey(d);
      const logs = logsByDate[key] || [];

      const entries = logs
        .map(log => { const cfg = MOOD_CONFIG[log.mood]; return cfg ? { level: cfg.level, mood: log.mood, config: cfg } : null; })
        .filter(Boolean) as Array<{ level: number; mood: string; config: MoodConfigType }>;

      totalEntries += entries.length;
      const levels = entries.map(e => e.level);

      days.push({
        date: new Date(d), dateKey: key,
        label: chartRange === '7d' ? dayNames[d.getDay()] : String(d.getDate()),
        entries,
        minLevel: levels.length > 0 ? Math.min(...levels) : null,
        maxLevel: levels.length > 0 ? Math.max(...levels) : null,
        count: entries.length,
      });
    }

    const startDate = days[0]?.date;
    const endDate = days[days.length - 1]?.date;
    let dateRange = '';
    if (startDate && endDate) {
      dateRange = startDate.getMonth() === endDate.getMonth()
        ? `${startDate.getDate()}–${endDate.getDate()} ${months[endDate.getMonth()]} ${endDate.getFullYear()}`
        : `${startDate.getDate()} ${months[startDate.getMonth()]} – ${endDate.getDate()} ${months[endDate.getMonth()]} ${endDate.getFullYear()}`;
    }
    return { days, totalEntries, dateRange };
  }, [logsByDate, chartRange, language]);

  // --- Calendar Logic ---

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon=0, Sun=6

    const days = [];
    // Previous month padding
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ id: `prev-${i}`, empty: true });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const key = getDateKey(d);
      const logs = logsByDate[key] || [];
      const mainLog = getMainEmotionLog(logs);
      days.push({
        id: key,
        date: d,
        dayNum: i,
        logs,
        mainLog,
        config: mainLog ? MOOD_CONFIG[mainLog.mood] : null,
      });
    }
    return days;
  }, [currentDate, logsByDate]);

  // --- Detail Modal Logic ---

  const selectedDateLogs = useMemo(() => {
    if (!selectedDate) return [];
    const key = getDateKey(selectedDate);
    const logs = logsByDate[key] || [];
    // Sort by timestamp asc (timeline)
    return [...logs].sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));
  }, [selectedDate, logsByDate]);

  const selectedDateMainLog = useMemo(() => getMainEmotionLog(selectedDateLogs), [selectedDateLogs]);


  // --- Render Components ---

  const renderChart = () => {
    const { days, totalEntries, dateRange } = dashboardData;
    const numDays = days.length;

    /* ── SVG coordinate system ── */
    const VW = 820, VH = 340;
    const pad = { top: 14, right: 72, bottom: 50, left: 14 };
    const dW = VW - pad.left - pad.right;   // 734
    const dH = VH - pad.top - pad.bottom;   // 376

    const colW = dW / numDays;
    const colCX = (i: number) => pad.left + (i + 0.5) * colW;
    const levelToY = (lvl: number) => pad.top + dH - (lvl / 15) * dH;

    // 3-zone horizontal boundaries
    const zoneY1 = pad.top + dH / 3;
    const zoneY2 = pad.top + (2 * dH) / 3;

    /* ── Grid lines & X labels ── */
    const vLineXs: number[] = [];
    const xLabels: Array<{ x: number; text: string }> = [];

    if (chartRange === '7d') {
      // 6 internal column-boundary dashed lines
      for (let i = 1; i < 7; i++) vLineXs.push(pad.left + i * colW);
      // Labels centered in each column
      days.forEach((d, i) => xLabels.push({ x: colCX(i), text: d.label }));
    } else {
      // ~6 evenly distributed ticks for 30-day
      const tickCount = 6;
      const step = (numDays - 1) / (tickCount - 1);
      for (let t = 0; t < tickCount; t++) {
        const idx = Math.round(t * step);
        const x = pad.left + idx * colW;          // left edge of that day column
        xLabels.push({ x, text: String(days[idx].date.getDate()) });
        vLineXs.push(x);
      }
    }

    const noData = days.every(d => d.count === 0);

    /* ── Build per-capsule gradient defs ── */
    const gradDefs: Array<{ i: number; stops: Array<{ off: number; col: string; op: number }> }> = [];
    days.forEach((d, i) => {
      if (d.count <= 1 || d.minLevel === null || d.maxLevel === null) return;
      const lo = d.minLevel, hi = d.maxLevel;
      const colorAt = (frac: number) => levelToColor(hi - frac * (hi - lo));
      gradDefs.push({ i, stops: [
        { off: 0,   col: colorAt(0),    op: 0.22 },
        { off: 10,  col: colorAt(0.10), op: 0.50 },
        { off: 35,  col: colorAt(0.35), op: 0.62 },
        { off: 65,  col: colorAt(0.65), op: 0.62 },
        { off: 90,  col: colorAt(0.90), op: 0.50 },
        { off: 100, col: colorAt(1),    op: 0.22 },
      ]});
    });

    return (
      <div className="flex-1 w-full h-full p-4 md:p-6 flex flex-col min-h-0 min-w-0">
        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-4 flex-shrink-0">
          <div>
            <div className="text-[11px] tracking-[0.2em] uppercase font-medium text-slate-400">TOTAL</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl leading-none text-white">{totalEntries}</span>
              <span className="text-base text-slate-400">entries</span>
            </div>
            <div className="text-sm mt-1 text-slate-500">{dateRange}</div>
          </div>
          <div className="rounded-lg p-1 flex gap-1" style={{ backgroundColor: DK.bgPanel, border: `1px solid ${DK.border}` }}>
            <button onClick={() => setChartRange('7d')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${chartRange === '7d' ? 'text-white shadow-md' : ''}`}
              style={chartRange === '7d' ? { backgroundColor: '#8B5CF6', boxShadow: '0 2px 8px rgba(139,92,246,0.35)' } : { color: '#94a3b8' }}>
              {language === 'zh' ? '周' : 'Week'}
            </button>
            <button onClick={() => setChartRange('30d')} className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${chartRange === '30d' ? 'text-white shadow-md' : ''}`}
              style={chartRange === '30d' ? { backgroundColor: '#8B5CF6', boxShadow: '0 2px 8px rgba(139,92,246,0.35)' } : { color: '#94a3b8' }}>
              {language === 'zh' ? '月' : 'Month'}
            </button>
          </div>
        </div>

        {noData ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-slate-500">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(234,240,255,0.06)' }}><BarChart2 className="w-8 h-8 opacity-40" /></div>
            <p className="text-sm">{language === 'zh' ? '还没有情绪记录，试试从一次情绪急救开始吧。' : 'No mood logs yet.'}</p>
          </div>
        ) : (
          /* ── SVG Chart ── */
          <div className="flex-1 min-h-[280px] rounded-xl p-2" style={{ backgroundColor: DK.bgChart, border: `1px solid ${DK.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
            <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full" style={{ overflow: 'visible' }}>
              <defs>
                {/* ── Capsule body gradients (translucent, alpha-fade at edges) ── */}
                {gradDefs.map(g => (
                  <linearGradient key={`cg${g.i}`} id={`cg${g.i}`} x1="0" y1="0" x2="0" y2="1">
                    {g.stops.map((s, si) => (
                      <stop key={si} offset={`${s.off}%`} stopColor={s.col} stopOpacity={s.op} />
                    ))}
                  </linearGradient>
                ))}

                {/* Glow filter for positive/high-level dots */}
                <filter id="dotGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>

                {/* Shadow filter for all data dots */}
                <filter id="dotShadow" x="-30%" y="-30%" width="160%" height="200%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.35" />
                </filter>
              </defs>

              {/* ── Drawing area border (subtle) ── */}
              <rect x={pad.left} y={pad.top} width={dW} height={dH} fill="none" stroke={DK.border} strokeWidth="1" />

              {/* ── Horizontal zone lines (dashed) ── */}
              <line x1={pad.left} y1={zoneY1} x2={pad.left + dW} y2={zoneY1} stroke={DK.gridLine} strokeWidth="1" strokeDasharray="6 4" />
              <line x1={pad.left} y1={zoneY2} x2={pad.left + dW} y2={zoneY2} stroke={DK.gridLine} strokeWidth="1" strokeDasharray="6 4" />

              {/* ── Vertical dashed grid ── */}
              {vLineXs.map((x, vi) => (
                <line key={`vl${vi}`} x1={x} y1={pad.top} x2={x} y2={pad.top + dH} stroke={DK.gridDash} strokeWidth="1" strokeDasharray="4 4" />
              ))}

              {/* ════════ Data Points ════════ */}
              {days.map((d, i) => {
                if (d.count === 0) return null;
                const cx = colCX(i);

                /* ── Single check-in → dot ── */
                if (d.count === 1) {
                  const lvl = d.entries[0].level;
                  const cy = levelToY(lvl);
                  const col = levelToColor(lvl);
                  const isHighLevel = lvl >= 10;
                  return (
                    <g key={`dp${i}`} onClick={() => openDetailModal(d.date)} style={{ cursor: 'pointer' }} filter={isHighLevel ? 'url(#dotGlow)' : 'url(#dotShadow)'}>
                      <circle cx={cx} cy={cy} r="9.5" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      <circle cx={cx} cy={cy} r="7" fill={col} stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" />
                    </g>
                  );
                }

                /* ── Multiple check-ins → capsule ── */
                const minL = d.minLevel!;
                const maxL = d.maxLevel!;
                const topY = levelToY(maxL);
                const botY = levelToY(minL);
                const rawH = botY - topY;
                const capsH = Math.max(rawH, 22);
                const extra = capsH - rawH;
                const capTop = topY - extra / 2;
                const cW = 16;
                const isHighLevel = maxL >= 10;

                return (
                  <g key={`dp${i}`} onClick={() => openDetailModal(d.date)} style={{ cursor: 'pointer' }}>
                    {/* Capsule body (translucent pill) */}
                    <rect
                      x={cx - cW / 2} y={capTop}
                      width={cW} height={capsH}
                      rx={cW / 2}
                      fill={`url(#cg${i})`}
                    />
                    {/* Top endpoint dot */}
                    <g filter={isHighLevel ? 'url(#dotGlow)' : 'url(#dotShadow)'}>
                      <circle cx={cx} cy={levelToY(maxL)} r="8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      <circle cx={cx} cy={levelToY(maxL)} r="6" fill={levelToColor(maxL)} stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
                    </g>
                    {/* Bottom endpoint dot */}
                    <g filter="url(#dotShadow)">
                      <circle cx={cx} cy={levelToY(minL)} r="8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      <circle cx={cx} cy={levelToY(minL)} r="6" fill={levelToColor(minL)} stroke="rgba(255,255,255,0.85)" strokeWidth="2" />
                    </g>
                  </g>
                );
              })}

              {/* ── Y-axis labels (right side, aligned to zones) ── */}
              <text x={pad.left + dW + 14} y={pad.top + dH * 0.17} fill="#94a3b8" fontSize="16" dominantBaseline="middle" textAnchor="start">愉悦</text>
              <text x={pad.left + dW + 14} y={pad.top + dH * 0.50} fill="#94a3b8" fontSize="16" dominantBaseline="middle" textAnchor="start">一般</text>
              <text x={pad.left + dW + 14} y={pad.top + dH * 0.83} fill="#94a3b8" fontSize="16" dominantBaseline="middle" textAnchor="start">低落</text>

              {/* ── X-axis labels ── */}
              {xLabels.map((l, li) => (
                <text key={`xl${li}`} x={l.x} y={pad.top + dH + 32} fill="#94a3b8" fontSize="14" textAnchor="middle">{l.text}</text>
              ))}
            </svg>
          </div>
        )}

        <div className="mt-2 text-center flex-shrink-0">
          <p className="text-xs text-slate-500">
            {language === 'zh' ? '这是情绪轨迹，用来感受变化，不是用来评分的' : "This is your emotional journey. Observe, don't judge."}
          </p>
        </div>
      </div>
    );
  };

  const renderCalendar = () => (
    <div className="flex-1 w-full h-full flex flex-col p-4 overflow-hidden">
       {/* Calendar Header */}
       <div className="flex items-center justify-between mb-6 px-2">
         <span className="text-lg font-semibold tracking-wide text-white">
           {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
         </span>
         <div className="flex gap-2">
           <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)]">
             <ChevronLeft size={16} />
           </Button>
           <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="h-8 w-8 rounded-full text-slate-400 hover:text-white hover:bg-[rgba(255,255,255,0.06)]">
             <ChevronRight size={16} />
           </Button>
         </div>
       </div>

       {/* Week Headers */}
       <div className="grid grid-cols-7 mb-2">
         {['一', '二', '三', '四', '五', '六', '日'].map(d => (
           <div key={d} className="text-center text-xs font-medium py-2 text-slate-400">{d}</div>
         ))}
       </div>

       {/* Days Grid */}
       <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-1 md:gap-2 overflow-y-auto">
         {calendarDays.map((day) => {
           if (day.empty) return <div key={day.id} className="bg-transparent" />;
           
           const hasLog = day.logs && day.logs.length > 0;
           const isToday = day.date?.getDate() === new Date().getDate() && day.date?.getMonth() === new Date().getMonth();

           return (
             <div
               key={day.id}
               onClick={() => hasLog && openDetailModal(day.date!)}
               className="relative rounded-xl border transition-all duration-200 flex flex-col items-center justify-center min-h-[60px] md:min-h-[80px]"
               style={{
                 backgroundColor: hasLog ? 'rgba(139,92,246,0.10)' : 'rgba(234,240,255,0.03)',
                 borderColor: hasLog ? 'rgba(139,92,246,0.22)' : 'transparent',
                 cursor: hasLog ? 'pointer' : 'default',
                 ...(isToday ? { boxShadow: `inset 0 0 0 1px rgba(139,92,246,0.55)` } : {}),
               }}
               onMouseEnter={(e) => {
                 if (hasLog) {
                   e.currentTarget.style.backgroundColor = 'rgba(139,92,246,0.18)';
                   e.currentTarget.style.borderColor = 'rgba(139,92,246,0.35)';
                 }
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.backgroundColor = hasLog ? 'rgba(139,92,246,0.10)' : 'rgba(234,240,255,0.03)';
                 e.currentTarget.style.borderColor = hasLog ? 'rgba(139,92,246,0.22)' : 'transparent';
               }}
             >
               <span className="absolute top-2 left-2 text-xs font-medium" style={{ color: isToday ? '#8B5CF6' : '#94a3b8' }}>
                 {day.dayNum}
               </span>
               {hasLog && day.mainLog && day.config && (
                 <div className="flex items-center justify-center w-full h-full pt-4">
                   <day.config.Icon size={48} className="filter drop-shadow-sm transform hover:scale-110 transition-transform" />
                 </div>
               )}
             </div>
           );
         })}
       </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative pt-[80px]" style={{ backgroundColor: DK.bgPage }}>
      
      {/* 
         Internal Header 
         - Positioned after padding (visually below TopBar)
         - Contains Title and Controls
      */}
      <div className="shrink-0 flex items-center justify-between px-6 pb-4">
        <h1 className="text-2xl font-bold tracking-wide text-[30px] text-white">{t.mood.title}</h1>
        
        {/* View Toggle */}
        <div className="p-1 rounded-lg flex gap-1" style={{ backgroundColor: DK.bgPanel, border: `1px solid ${DK.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
          <button
            onClick={() => setViewMode('chart')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={viewMode === 'chart' ? { backgroundColor: '#8B5CF6', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(139,92,246,0.35)' } : { color: '#94a3b8' }}
            onMouseEnter={(e) => { if (viewMode !== 'chart') e.currentTarget.style.backgroundColor = DK.hoverOverlay; }}
            onMouseLeave={(e) => { if (viewMode !== 'chart') e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <BarChart2 size={14} />
            {language === 'zh' ? '图表' : 'Chart'}
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={viewMode === 'calendar' ? { backgroundColor: '#8B5CF6', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(139,92,246,0.35)' } : { color: '#94a3b8' }}
            onMouseEnter={(e) => { if (viewMode !== 'calendar') e.currentTarget.style.backgroundColor = DK.hoverOverlay; }}
            onMouseLeave={(e) => { if (viewMode !== 'calendar') e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <CalendarIcon size={14} />
            {language === 'zh' ? '日历' : 'Calendar'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'chart' ? (
          <div className="w-full h-full">
            {renderChart()}
          </div>
        ) : (
          <div className="w-full h-full animate-in fade-in slide-in-from-right-4 duration-300">
            {renderCalendar()}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="shadow-2xl max-w-md p-0 overflow-hidden text-white" style={{ backgroundColor: DK.bgPanel, borderColor: DK.border }}>
          {selectedDate && selectedDateMainLog && MOOD_CONFIG[selectedDateMainLog.mood] && (
            <div className="flex flex-col h-[500px]">
              {/* Header */}
              <div className="p-6 text-center" style={{ background: `linear-gradient(to bottom, rgba(139,92,246,0.12), transparent)`, borderBottom: `1px solid ${DK.border}` }}>
                 <h3 className="text-sm font-medium mb-2 text-slate-400">
                   {selectedDate.getFullYear()}年{selectedDate.getMonth()+1}月{selectedDate.getDate()}日
                 </h3>
                 <div className="flex flex-col items-center">
                    <div className="mb-2 filter drop-shadow-lg">
                       {(() => {
                           const Icon = MOOD_CONFIG[selectedDateMainLog.mood].Icon;
                           return <Icon size={80} />;
                       })()}
                    </div>
                    <span className="text-xl font-bold tracking-wide text-white">
                      {MOOD_CONFIG[selectedDateMainLog.mood]?.label}
                    </span>
                 </div>
              </div>

              {/* Timeline List */}
              <ScrollArea className="flex-1 p-6">
                <div className="relative ml-3 space-y-6" style={{ borderLeft: `1px solid ${DK.border}` }}>
                  {selectedDateLogs.map((log, idx) => {
                    const config = MOOD_CONFIG[log.mood];
                    const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                    
                    // Derive intensity label
                    let intensityLabel = '中';
                    if (log.intensity !== undefined) {
                      if (log.intensity <= 33) intensityLabel = '轻';
                      else if (log.intensity >= 67) intensityLabel = '强';
                    }

                    return (
                      <div key={idx} className="relative pl-6">
                        {/* Dot */}
                        <div className={`absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full border-2`}
                          style={{
                            borderColor: DK.bgPanel,
                            backgroundColor: log === selectedDateMainLog ? '#8B5CF6' : 'rgba(234,240,255,0.25)',
                          }}
                        />
                        
                        {/* Card */}
                        <div className="rounded-xl p-3 flex items-center gap-4" style={{ backgroundColor: 'rgba(234,240,255,0.05)', border: `1px solid ${DK.border}` }}>
                          <div className="shrink-0">
                            {config && <config.Icon size={40} />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-semibold text-white">{config?.label}</span>
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Clock size={10} />
                                {timeStr}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                 intensityLabel === '强' ? 'border-red-400/30 text-red-400 bg-red-500/10' :
                                 intensityLabel === '轻' ? 'border-emerald-400/30 text-emerald-400 bg-emerald-500/10' :
                                 'border-yellow-400/30 text-yellow-400 bg-yellow-500/10'
                               }`}>
                                 {language === 'zh' ? intensityLabel : (intensityLabel === '强' ? 'Strong' : intensityLabel === '轻' ? 'Mild' : 'Moderate')}
                               </span>
                               {log.source && (
                                 <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: 'rgba(234,240,255,0.60)', backgroundColor: 'rgba(234,240,255,0.06)' }}>
                                   {log.source === 'first-aid' ? '情绪急救' : log.source === 'sketch' ? '内视涂鸦' : log.source === 'test' ? '内视快测' : '对话'}
                                 </span>
                               )}
                            </div>
                            {log.note && (
                              <p className="text-xs mt-2 italic leading-relaxed" style={{ color: 'rgba(234,240,255,0.55)' }}>{log.note}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              
              <div className="p-4" style={{ borderTop: `1px solid ${DK.border}`, backgroundColor: 'rgba(234,240,255,0.03)' }}>
                 <Button onClick={() => setIsDetailModalOpen(false)} className="w-full text-white" style={{ backgroundColor: 'rgba(234,240,255,0.08)', border: `1px solid ${DK.border}` }}
                   onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(234,240,255,0.14)'; }}
                   onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(234,240,255,0.08)'; }}
                 >
                   {language === 'zh' ? '关闭' : 'Close'}
                 </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
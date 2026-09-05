/**
 * 认知快测 — the "tap the ones that match" question family.
 *
 * Four of the design's 图片类 variants share one interaction: show a grid, have
 * the user tap either the single best answer or every member of a category. So
 * they share one component (SelectionGrid) and one scoring rule, and differ only
 * in the data below — 定向力, 注意力（图形划消）, 计算力（数感）and
 * 语言流畅性（类别识别）.
 *
 * These also double as the distraction interval between a memory block's encode
 * and recall screens, which is what the clinical guidance asks for: the delay
 * should be filled by the other tests rather than by dead time.
 */

export type SelectionDomain = 'orientation' | 'attention' | 'calculation' | 'fluency';

export interface SelectionCell {
  /** Unique within a task. A glyph may repeat across cells, an id may not. */
  id: string;
  /** ItemGlyph key. Omitted for the numeric answer cards. */
  glyph?: string;
  /** Rendered instead of a glyph, for the numeric answer cards. */
  text?: string;
  /** Accessible name. */
  label: string;
}

/** A pile of identical items to be counted, for the 数感 questions. */
export interface CountGroup {
  glyph: string;
  count: number;
  label: string;
}

export interface SelectionTask {
  id: string;
  domain: SelectionDomain;
  /** Shown in the step label, e.g. '定向力'. */
  domainLabel: string;
  instruction: string;
  /** single = pick the one best answer; multi = pick every match. */
  mode: 'single' | 'multi';
  /** Counting stimulus rendered above the options; only the 数感 tasks use it. */
  groups?: CountGroup[];
  options: SelectionCell[];
  /**
   * Cell ids that earn credit. Single-select tasks may list more than one when
   * the honest answer is genuinely ambiguous — see `daypartTask`.
   */
  correct: string[];
  columns: number;
  seconds: number;
}

/* ------------------------------------------------------------------ *
 * 领域 2 · 定向力（时间）
 * ------------------------------------------------------------------ */

/**
 * The design asks for a place question (客厅 / 医院 / 办公室 / 商场) alongside
 * the season one. A self-administered app has no way to know where the user
 * actually is, so that half can be asked but never scored. Both questions here
 * are about time instead, which the device clock can check.
 */

const SEASONS: { key: string; glyph: string; label: string }[] = [
  { key: 'spring', glyph: 'season-spring', label: '春天' },
  { key: 'summer', glyph: 'season-summer', label: '夏天' },
  { key: 'autumn', glyph: 'season-autumn', label: '秋天' },
  { key: 'winter', glyph: 'season-winter', label: '冬天' },
];

/** Northern-hemisphere months; the product ships in Chinese first. */
function seasonForMonth(month: number): string {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function seasonTask(now: Date, random: () => number): SelectionTask {
  return {
    id: 'orientation-season',
    domain: 'orientation',
    domainLabel: '定向力',
    instruction: '下面四张图分别是四个季节。请点选和现在这个季节相符的一张。',
    mode: 'single',
    options: shuffled(
      SEASONS.map((season) => ({
        id: season.key,
        glyph: season.glyph,
        label: season.label,
      })),
      random,
    ),
    correct: [seasonForMonth(now.getMonth() + 1)],
    columns: 4,
    seconds: 45,
  };
}

const DAYPARTS: { key: string; glyph: string; label: string }[] = [
  { key: 'dawn', glyph: 'daypart-dawn', label: '清晨' },
  { key: 'midday', glyph: 'daypart-midday', label: '中午' },
  { key: 'dusk', glyph: 'daypart-dusk', label: '傍晚' },
  { key: 'night', glyph: 'daypart-night', label: '深夜' },
];

/** [start, end] in whole hours, inclusive. */
const DAYPART_HOURS: Record<string, [number, number]> = {
  dawn: [5, 10],
  midday: [11, 15],
  dusk: [16, 19],
  night: [20, 4],
};

function inDaypart(hour: number, key: string): boolean {
  const [start, end] = DAYPART_HOURS[key];
  return start <= end ? hour >= start && hour <= end : hour >= start || hour <= end;
}

/**
 * Which part of the day it is. Anyone within an hour of a boundary gets credit
 * for either side, because at 10:40 both 清晨 and 中午 are honest answers and
 * marking one of them wrong would measure the cut-off, not the user.
 */
function daypartTask(now: Date, random: () => number): SelectionTask {
  const hour = now.getHours();
  const correct = DAYPARTS.map((part) => part.key).filter(
    (key) => inDaypart(hour, key) || inDaypart((hour + 1) % 24, key) || inDaypart((hour + 23) % 24, key),
  );

  return {
    id: 'orientation-daypart',
    domain: 'orientation',
    domainLabel: '定向力',
    instruction: '下面四张图分别是一天中的四个时段。请点选和现在最接近的一张。',
    mode: 'single',
    options: shuffled(
      DAYPARTS.map((part) => ({ id: part.key, glyph: part.glyph, label: part.label })),
      random,
    ),
    correct,
    columns: 4,
    seconds: 45,
  };
}

/* ------------------------------------------------------------------ *
 * 领域 3 · 注意力（图形划消）
 * ------------------------------------------------------------------ */

const CANCELLATION_TARGETS = 6;
const CANCELLATION_CELLS = 20;

/**
 * Visual search: one target shape hidden among two similar ones. What this
 * measures is sustained attention, so the grid is deliberately uniform — there
 * is no clever way to find the stars other than looking at every cell.
 */
function cancellationTask(random: () => number): SelectionTask {
  const fillers = ['circle', 'triangle'];
  const cells: SelectionCell[] = [
    ...Array.from({ length: CANCELLATION_TARGETS }, (_, i) => ({
      id: `star-${i}`,
      glyph: 'star',
      label: '星形',
    })),
    ...Array.from({ length: CANCELLATION_CELLS - CANCELLATION_TARGETS }, (_, i) => {
      const glyph = fillers[i % fillers.length];
      return {
        id: `${glyph}-${i}`,
        glyph,
        label: glyph === 'circle' ? '圆形' : '三角形',
      };
    }),
  ];

  return {
    id: 'attention-cancellation',
    domain: 'attention',
    domainLabel: '注意力',
    instruction: '请把下面所有的星形都点出来，不要漏掉，也不要点错。',
    mode: 'multi',
    options: shuffled(cells, random),
    correct: cells.filter((cell) => cell.glyph === 'star').map((cell) => cell.id),
    columns: 5,
    seconds: 60,
  };
}

/* ------------------------------------------------------------------ *
 * 领域 4 · 计算力（数感）
 * ------------------------------------------------------------------ */

/**
 * Counting two piles and combining them, rather than serial subtraction. The
 * arithmetic is trivial on purpose: what is being measured is holding two counts
 * in mind at once, not whether the user can do sums.
 */
function countingTask(
  id: string,
  prompt: string,
  left: CountGroup,
  right: CountGroup,
  answer: number,
  decoys: number[],
  random: () => number,
): SelectionTask {
  const values = [answer, ...decoys];
  return {
    id,
    domain: 'calculation',
    domainLabel: '计算力',
    instruction: prompt,
    mode: 'single',
    groups: [left, right],
    options: shuffled(
      values.map((value) => ({
        id: `n${value}`,
        text: String(value),
        label: `${value}`,
      })),
      random,
    ),
    correct: [`n${answer}`],
    columns: 4,
    seconds: 60,
  };
}

/* ------------------------------------------------------------------ *
 * 领域 6 · 语言流畅性（类别识别）
 * ------------------------------------------------------------------ */

const FRUIT: { glyph: string; label: string }[] = [
  { glyph: 'apple', label: '苹果' },
  { glyph: 'cherry', label: '樱桃' },
  { glyph: 'grape', label: '葡萄' },
  { glyph: 'citrus', label: '柑橘' },
  { glyph: 'banana', label: '香蕉' },
  { glyph: 'apple', label: '苹果' },
];

const NON_FRUIT: { glyph: string; label: string }[] = [
  { glyph: 'pencil', label: '铅笔' },
  { glyph: 'ruler', label: '直尺' },
  { glyph: 'eraser', label: '橡皮' },
  { glyph: 'scissors', label: '剪刀' },
  { glyph: 'paperclip', label: '回形针' },
  { glyph: 'highlighter', label: '荧光笔' },
  { glyph: 'notebook', label: '笔记本' },
  { glyph: 'bus', label: '公交车' },
  { glyph: 'bike', label: '自行车' },
  { glyph: 'train', label: '火车' },
  { glyph: 'plane', label: '飞机' },
  { glyph: 'boat', label: '帆船' },
  { glyph: 'car', label: '汽车' },
  { glyph: 'carrot', label: '胡萝卜' },
];

/**
 * The design replaces "name as many fruits as you can" with "pick out the
 * fruit", which drops the typing and the speech recognition but keeps the thing
 * being measured: how quickly the category comes to mind. The carrot is in there
 * on purpose — it is the near miss that separates knowing the category from
 * recognising food.
 */
function fluencyTask(random: () => number): SelectionTask {
  const cells: SelectionCell[] = [
    ...FRUIT.map((item, i) => ({ id: `fruit-${i}`, glyph: item.glyph, label: item.label })),
    ...NON_FRUIT.map((item, i) => ({ id: `other-${i}`, glyph: item.glyph, label: item.label })),
  ];

  return {
    id: 'fluency-category',
    domain: 'fluency',
    domainLabel: '语言流畅性',
    instruction: '下面这些图片里，请把所有属于「水果」的都点出来。',
    mode: 'multi',
    options: shuffled(cells, random),
    correct: cells.filter((cell) => cell.id.startsWith('fruit-')).map((cell) => cell.id),
    columns: 5,
    seconds: 60,
  };
}

/* ------------------------------------------------------------------ *
 * Assembly
 * ------------------------------------------------------------------ */

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Six tasks, ordered so that each memory block is followed by two questions
 * from two different domains rather than two of a kind.
 */
export function buildSelectionTasks(random: () => number, now: Date): SelectionTask[] {
  return [
    seasonTask(now, random),
    cancellationTask(random),
    countingTask(
      'calculation-total',
      '左边和右边一共有多少个？请点选正确的数字。',
      { glyph: 'apple', count: 7, label: '苹果' },
      { glyph: 'apple', count: 5, label: '苹果' },
      12,
      [10, 11, 13],
      random,
    ),
    fluencyTask(random),
    daypartTask(now, random),
    countingTask(
      'calculation-difference',
      '左边比右边多多少个？请点选正确的数字。',
      { glyph: 'citrus', count: 9, label: '柑橘' },
      { glyph: 'citrus', count: 4, label: '柑橘' },
      5,
      [3, 4, 6],
      random,
    ),
  ];
}

/* ------------------------------------------------------------------ *
 * Scoring
 * ------------------------------------------------------------------ */

export interface SelectionScore {
  taskId: string;
  domain: SelectionDomain;
  /** Correct cells tapped. */
  hits: number;
  /** Cells tapped that were not correct. */
  falsePositives: number;
  targets: number;
  /** 0..1 share of this task earned. */
  credit: number;
}

/**
 * Wrong taps cancel right ones on the multi-select tasks. Without that, tapping
 * every cell would score full marks on 划消 and 类别识别, which are exactly the
 * two tasks where indiscriminate tapping is the failure mode worth catching.
 */
export function scoreSelection(task: SelectionTask, selected: string[]): SelectionScore {
  const correct = new Set(task.correct);
  const hits = selected.filter((id) => correct.has(id)).length;
  const falsePositives = selected.length - hits;

  const credit =
    task.mode === 'single'
      ? hits > 0 && falsePositives === 0
        ? 1
        : 0
      : Math.max(0, hits - falsePositives) / task.correct.length;

  return {
    taskId: task.id,
    domain: task.domain,
    hits: task.mode === 'single' ? Math.min(1, hits) : hits,
    falsePositives,
    // A single-select task needs one tap, however many answers would be
    // accepted, so the report reads 1/1 rather than 1/2 on a perfect answer.
    targets: task.mode === 'single' ? 1 : task.correct.length,
    credit,
  };
}

export const DOMAIN_LABELS: Record<SelectionDomain, string> = {
  orientation: '定向力',
  attention: '注意力',
  calculation: '计算力',
  fluency: '语言流畅性',
};

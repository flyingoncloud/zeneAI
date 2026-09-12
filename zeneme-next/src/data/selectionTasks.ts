/**
 * 认知快测 — the "tap the ones that match" question family.
 *
 * Five variants share one interaction: show something, have the user tap either
 * the single best answer or every member of a category. So they share one
 * component (SelectionGrid) and one scoring rule, and differ only in the data
 * below — 定向力, 注意力（图形划消 + 数一数有几张脸）, 计算力（数感）and
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
  /** Accessible name, and the caption when the task sets `captions`. */
  label: string;
  /** Tailwind classes washed behind the card, for the 定向力 sky tints. */
  tone?: string;
}

/** A pile of identical items to be counted, for the 数感 question. */
export interface CountGroup {
  glyph: string;
  count: number;
  label: string;
}

/**
 * One of the two panels in the 数感 question. The heading and the tint are not
 * decoration: on a phone the two piles wrap onto separate lines and stop reading
 * as "left" and "right" at all, so the side has to be stated rather than
 * implied by position.
 */
export interface CountSide {
  /** 左边 / 右边. */
  heading: string;
  /** Tailwind classes for the panel's border and tint. */
  tone: string;
  group: CountGroup;
}

/** One item in a scattered scene, positioned in percent of the frame. */
export interface SceneCell {
  id: string;
  glyph: string;
  label: string;
  xPct: number;
  yPct: number;
  /** 0.8–1.2, so the scene does not read as a grid in disguise. */
  scale: number;
}

export interface SelectionTask {
  id: string;
  domain: SelectionDomain;
  /** Shown in the step label, e.g. '定向力'. */
  domainLabel: string;
  instruction: string;
  /** single = pick the one best answer; multi = pick every match. */
  mode: 'single' | 'multi';
  /** Two labelled piles rendered above the options; only 数感 uses it. */
  sides?: CountSide[];
  /** A scattered scene rendered above the options; only 数脸 uses it. */
  scene?: SceneCell[];
  options: SelectionCell[];
  /** Show each option's label under its glyph. */
  captions?: boolean;
  /**
   * Cell ids that earn credit. Single-select tasks may list more than one when
   * the honest answer is genuinely ambiguous — see `daypartTask`.
   */
  correct: string[];
  columns: number;
  seconds: number;
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Distractor offsets for the two counting questions. Which pattern is used is
 * drawn per session, because a fixed set puts the right answer in the same rank
 * every time — with `[-2,-1,+1]` alone it is always the second largest, and that
 * is a rule you can follow without counting anything.
 */
const NEAR_MISS_PATTERNS: number[][] = [
  [-2, -1, 1],
  [-1, 1, 2],
  [-2, -1, 2],
  [-1, 1, 3],
];

/** Three plausible wrong numbers around `answer`, as answer cards. */
function nearMisses(answer: number, random: () => number): SelectionCell[] {
  const offsets = NEAR_MISS_PATTERNS[Math.floor(random() * NEAR_MISS_PATTERNS.length)];
  return [answer, ...offsets.map((offset) => answer + offset)].map((value) => ({
    id: `n${value}`,
    text: String(value),
    label: `${value}`,
  }));
}

/* ------------------------------------------------------------------ *
 * 领域 2 · 定向力（时间）
 * ------------------------------------------------------------------ */

/**
 * The design asks for a place question (客厅 / 医院 / 办公室 / 商场) alongside
 * the season one. A self-administered app has no way to know where the user
 * actually is, so that half can be asked but never scored. Both questions here
 * are about time instead, which the device clock can check.
 *
 * Both carry captions and a sky tint, and both are shown in their natural order
 * rather than shuffled. Naming the picture is not what is being tested — knowing
 * which one is *now* is — so making the pictures unambiguous can only remove
 * noise. Shuffling four cards whose correct order is common knowledge just adds
 * a search step.
 */

const SEASONS: { key: string; glyph: string; label: string; tone: string }[] = [
  { key: 'spring', glyph: 'season-spring', label: '春天', tone: 'from-pink-500/15 to-emerald-500/10' },
  { key: 'summer', glyph: 'season-summer', label: '夏天', tone: 'from-amber-400/20 to-orange-500/10' },
  { key: 'autumn', glyph: 'season-autumn', label: '秋天', tone: 'from-orange-500/20 to-yellow-600/10' },
  { key: 'winter', glyph: 'season-winter', label: '冬天', tone: 'from-sky-400/20 to-slate-400/10' },
];

/** Northern-hemisphere months; the product ships in Chinese first. */
function seasonForMonth(month: number): string {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function seasonTask(now: Date): SelectionTask {
  return {
    id: 'orientation-season',
    domain: 'orientation',
    domainLabel: '定向力',
    instruction: '下面四张图分别是四个季节。请点选和现在这个季节相符的一张。',
    mode: 'single',
    options: SEASONS.map((season) => ({
      id: season.key,
      glyph: season.glyph,
      label: season.label,
      tone: season.tone,
    })),
    captions: true,
    correct: [seasonForMonth(now.getMonth() + 1)],
    columns: 4,
    seconds: 45,
  };
}

/** Listed dawn → night, which is the order they are shown in. */
const DAYPARTS: { key: string; glyph: string; label: string; hint: string; tone: string }[] = [
  { key: 'dawn', glyph: 'daypart-dawn', label: '清晨', hint: '天刚亮', tone: 'from-orange-300/20 to-sky-400/10' },
  { key: 'midday', glyph: 'daypart-midday', label: '中午', hint: '太阳最高', tone: 'from-amber-300/25 to-yellow-500/10' },
  { key: 'dusk', glyph: 'daypart-dusk', label: '傍晚', hint: '天快黑了', tone: 'from-purple-500/20 to-orange-500/10' },
  { key: 'night', glyph: 'daypart-night', label: '深夜', hint: '天全黑', tone: 'from-indigo-600/25 to-slate-900/20' },
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
function daypartTask(now: Date): SelectionTask {
  const hour = now.getHours();
  const correct = DAYPARTS.map((part) => part.key).filter(
    (key) =>
      inDaypart(hour, key) || inDaypart((hour + 1) % 24, key) || inDaypart((hour + 23) % 24, key),
  );

  return {
    id: 'orientation-daypart',
    domain: 'orientation',
    domainLabel: '定向力',
    instruction: '下面是一天里的四个时段，从早到晚排列。请点选和现在最接近的一张。',
    mode: 'single',
    options: DAYPARTS.map((part) => ({
      id: part.key,
      glyph: part.glyph,
      label: `${part.label}·${part.hint}`,
      tone: part.tone,
    })),
    captions: true,
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
 * measures is sustained attention, so the grid is deliberately uniform and
 * deliberately colourless — there is no clever way to find the stars other than
 * looking at every cell. This is the one screen where the abstract, monochrome
 * treatment is the design rather than a shortcut.
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
 * 领域 3 · 注意力（数一数有几张脸）
 * ------------------------------------------------------------------ */

const FACE_GLYPHS = ['face-a', 'face-b', 'face-c', 'face-d'];
const ROUND_DISTRACTORS: { glyph: string; label: string }[] = [
  { glyph: 'ball', label: '皮球' },
  { glyph: 'clock', label: '时钟' },
  { glyph: 'flower-round', label: '花' },
  { glyph: 'cup', label: '杯子' },
];

/**
 * How many faces are hidden in the scene, drawn per session for the same reason
 * the pile total is: a fixed answer is remembered rather than counted. The range
 * stays well clear of both ends of the scene — all-faces and almost-no-faces are
 * both answerable without searching.
 */
const FACE_MIN = 6;
const FACE_MAX = 10;
const SCENE_CELLS = 24;
/**
 * Five, not six. The scatter divides the frame's width, so the column count is
 * what caps how large a face can be drawn on a phone — and a face too small to
 * tell from a clock is not a discrimination task, it is an eye test.
 */
const SCENE_COLUMNS = 5;
/**
 * Jitter as a share of a cell. Enough that the layout does not read as a grid,
 * small enough that two neighbours at full size still do not sit on top of each
 * other — overlapping items would make the count genuinely ambiguous. Tightened
 * when the frame was narrowed and the glyphs grown: the same fraction of a
 * smaller cell is a larger fraction of the gap between two pictures.
 */
const SCENE_JITTER = 0.22;

/**
 * Count the faces in a scene. This is the item Jim asked for, and it is a real
 * one: the same "how many of X are in this picture" form is used in cognitive
 * screening because it loads visual search and numerosity while asking almost
 * nothing of education or reasoning.
 *
 * The distractors are all round and patterned — a clock face, a flower centre —
 * so the count cannot be done by spotting circles. Positions come off a jittered
 * grid rather than a neat one: a tidy grid turns counting into arithmetic on rows.
 *
 * Not built from photographs of real people on purpose. Celebrity- or
 * family-photo recognition tests exist, but the photographs are licensed, and
 * "do you know who this is" measures which celebrities the user grew up with,
 * which is a cultural bias we would be building in rather than a signal.
 */
function faceCountTask(random: () => number): SelectionTask {
  const faceCount = FACE_MIN + Math.floor(random() * (FACE_MAX - FACE_MIN + 1));
  const kinds: { glyph: string; label: string }[] = [
    ...Array.from({ length: faceCount }, (_, i) => ({
      glyph: FACE_GLYPHS[i % FACE_GLYPHS.length],
      label: '人脸',
    })),
    ...Array.from({ length: SCENE_CELLS - faceCount }, (_, i) => ROUND_DISTRACTORS[i % ROUND_DISTRACTORS.length]),
  ];

  const rows = Math.ceil(SCENE_CELLS / SCENE_COLUMNS);
  const scene: SceneCell[] = shuffled(kinds, random).map((kind, index) => {
    const column = index % SCENE_COLUMNS;
    const row = Math.floor(index / SCENE_COLUMNS);
    return {
      id: `scene-${index}`,
      glyph: kind.glyph,
      label: kind.label,
      // Cell centre, then jittered so the layout reads as a scattered pile.
      xPct:
        ((column + 0.5) / SCENE_COLUMNS) * 100 +
        (random() - 0.5) * (100 / SCENE_COLUMNS) * SCENE_JITTER,
      yPct: ((row + 0.5) / rows) * 100 + (random() - 0.5) * (100 / rows) * SCENE_JITTER,
      scale: 0.9 + random() * 0.2,
    };
  });

  return {
    id: 'attention-faces',
    domain: 'attention',
    domainLabel: '注意力',
    instruction: '下面这幅图里混着一些人脸和一些圆圆的东西。请数一数总共有几张人脸，然后点选正确的数字。',
    mode: 'single',
    scene,
    options: shuffled(nearMisses(faceCount, random), random),
    correct: [`n${faceCount}`],
    columns: 4,
    seconds: 75,
  };
}

/* ------------------------------------------------------------------ *
 * 领域 4 · 计算力（数感）
 * ------------------------------------------------------------------ */

/**
 * How many items are in the two piles together. The total is drawn from a range
 * rather than fixed: a constant answer is learnable, and the second time someone
 * sees this screen they would be recalling 12 rather than counting. It also has
 * to stay in a range where counting is the honest strategy — above the four or
 * five you can take in at a glance, below the point where the piles stop fitting
 * on a phone.
 */
const TOTAL_MIN = 9;
const TOTAL_MAX = 16;
/**
 * How far off an even split a side may fall. Kept small for two reasons: a side
 * of three is subitised rather than counted, and a lopsided split puts a dozen
 * items in one panel, which on a phone wraps into a block too tall to count.
 */
const SPLIT_SKEW = 2;
/** Below four, a pile is taken in at a glance rather than counted. */
const MIN_PER_SIDE = 4;

/**
 * Counting two piles and combining them, rather than serial subtraction. The
 * arithmetic is trivial on purpose: what is being measured is holding two counts
 * in mind at once, not whether the user can do sums.
 *
 * One question, not two. The earlier build asked both a sum and a difference off
 * two piles of identical same-coloured items, and on a phone neither one read as
 * left-versus-right. Here the two sides differ by heading, by tint and by fruit,
 * and only the sum is asked — a second pass at the same unreadable layout was
 * buying a second chance to be confused, not a second measurement.
 */
function countingTask(random: () => number): SelectionTask {
  const answer = TOTAL_MIN + Math.floor(random() * (TOTAL_MAX - TOTAL_MIN + 1));
  // The split is drawn separately from the total, so 12 does not always come
  // apart as 7 + 5.
  const half = Math.floor(answer / 2);
  // Narrowed at the bottom of the total range, where the full skew would leave
  // one side small enough to take in at a glance.
  const skew = Math.min(SPLIT_SKEW, half - MIN_PER_SIDE);
  const leftCount = half + Math.floor(random() * (2 * skew + 1)) - skew;

  const left: CountSide = {
    heading: '左边',
    tone: 'border-rose-400/40 bg-rose-500/10',
    group: { glyph: 'apple', count: leftCount, label: '红苹果' },
  };
  const right: CountSide = {
    heading: '右边',
    tone: 'border-amber-400/40 bg-amber-500/10',
    group: { glyph: 'banana', count: answer - leftCount, label: '黄香蕉' },
  };

  return {
    id: 'calculation-total',
    domain: 'calculation',
    domainLabel: '计算力',
    instruction: '左边是红苹果，右边是黄香蕉。两边加起来一共有多少个？请点选正确的数字。',
    mode: 'single',
    sides: [left, right],
    options: shuffled(nearMisses(answer, random), random),
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
  { glyph: 'citrus', label: '橙子' },
  { glyph: 'banana', label: '香蕉' },
  { glyph: 'watermelon', label: '西瓜' },
];

/**
 * 胡萝卜, 玉米 and 蘑菇 are drawn in the same filled, coloured style as the
 * fruit. Without them, "which cards are filled" would answer the question
 * without the user ever having to think about the category — and the category is
 * the whole item. They are also the honest near misses: food, not fruit.
 */
const NON_FRUIT: { glyph: string; label: string }[] = [
  { glyph: 'carrot', label: '胡萝卜' },
  { glyph: 'corn', label: '玉米' },
  { glyph: 'mushroom', label: '蘑菇' },
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
  { glyph: 'boat', label: '帆船' },
];

/**
 * The design replaces "name as many fruits as you can" with "pick out the
 * fruit", which drops the typing and the speech recognition but keeps the thing
 * being measured: how quickly the category comes to mind.
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
    instruction: '下面这些图片里，请把所有属于「水果」的都点出来。蔬菜和别的东西不要点。',
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

/**
 * Six tasks in administration order. The first four sit inside the two memory
 * blocks, two apiece, paired so that a block's delay is filled by two different
 * domains rather than two of a kind; the last two run after the game.
 */
export function buildSelectionTasks(random: () => number, now: Date): SelectionTask[] {
  return [
    seasonTask(now),
    cancellationTask(random),
    countingTask(random),
    fluencyTask(random),
    daypartTask(now),
    faceCountTask(random),
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

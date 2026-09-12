/**
 * 认知快测 — item bank, task construction and scoring.
 *
 * A run is: two memory blocks (place items in a grid, hold, do two other tasks,
 * put them back, then a cued-recall rescue), one light game, and two more
 * selection tasks. The stimuli are entirely our own: MoCA's items are
 * copyrighted and its publisher restricts electronic administration, so nothing
 * from the published test is reproduced. See docs/MoCA式认知筛查题目设计.md in
 * the zeneEdu repo for the clinical rationale behind the domain weights and the
 * triage bands.
 *
 * Everything a run needs is derived from one integer seed, so a retest produces
 * a parallel form (different items, same structure) rather than the form the
 * user has already learned.
 *
 * Two deliberate departures from the earlier build, both aimed at the same
 * problem — it was measuring figure discrimination and IQ rather than
 * recognition and memory:
 *
 * 1. The abstract-shape memory family is gone. Remembering "rectangle with a
 *    diagonal through it" is hard in a way that has nothing to do with the thing
 *    being screened for, and there was no clinical basis for those shapes.
 *    Concrete, nameable, coloured items also have a real memory advantage over
 *    abstract figures, so this lowers difficulty without lowering signal.
 * 2. Free recall is followed by a cued-recognition rescue (设计文档 7.2/7.3).
 *    Cue benefit and false recognition separate "never encoded it" from "could
 *    not retrieve it", which is more informative than the free-recall count, and
 *    a second chance is also what stops the screen feeling like a trap.
 */

import {
  buildSelectionTasks,
  DOMAIN_LABELS,
  scoreSelection,
  type SelectionDomain,
  type SelectionScore,
  type SelectionTask,
} from './selectionTasks';

export type ItemFamily = 'object' | 'animal' | 'food';

export interface ScreenItem {
  /** Unique across every family; also the glyph key in ItemGlyph. */
  id: string;
  family: ItemFamily;
  /** Shown as the caption, in the result breakdown, and as the accessible name. */
  label: string;
}

/**
 * The memory families. The encode palette takes 8 and the recall palette grows to
 * 15, so the recall step adds 7 items the user has never seen — items chosen from
 * those are false recognitions, which separate an encoding failure from a
 * retrieval failure.
 *
 * Each family runs well past those 15 on purpose. Two independent draws of 8 from
 * a pool of n share n-over-8-squared items on average, so at 15 — where the pool
 * was — a retake repeated four of its eight items and the recall palette was the
 * entire family every single time. It varied, and it did not look like it varied,
 * which for a test whose whole premise is "you have not seen this form before" is
 * the same problem as not varying. Adding items is the only lever: the palette
 * sizes are what set the difficulty and cannot be traded against it.
 */
const OBJECTS: ScreenItem[] = [
  { id: 'chair', family: 'object', label: '椅子' },
  { id: 'spoon', family: 'object', label: '勺子' },
  { id: 'key', family: 'object', label: '钥匙' },
  { id: 'truck', family: 'object', label: '卡车' },
  { id: 'candle', family: 'object', label: '蜡烛' },
  { id: 'fork', family: 'object', label: '叉子' },
  { id: 'bulb', family: 'object', label: '灯泡' },
  { id: 'table', family: 'object', label: '桌子' },
  { id: 'coat', family: 'object', label: '外套' },
  { id: 'bucket', family: 'object', label: '水桶' },
  { id: 'broom', family: 'object', label: '扫帚' },
  { id: 'car', family: 'object', label: '汽车' },
  { id: 'door', family: 'object', label: '门' },
  { id: 'glasses', family: 'object', label: '眼镜' },
  { id: 'umbrella', family: 'object', label: '雨伞' },
  { id: 'hammer', family: 'object', label: '锤子' },
  { id: 'wrench', family: 'object', label: '扳手' },
  { id: 'flashlight', family: 'object', label: '手电筒' },
  { id: 'lock', family: 'object', label: '锁' },
  { id: 'backpack', family: 'object', label: '书包' },
  { id: 'watch', family: 'object', label: '手表' },
  { id: 'fridge', family: 'object', label: '冰箱' },
  { id: 'microwave', family: 'object', label: '微波炉' },
  { id: 'pot', family: 'object', label: '锅' },
  { id: 'helmet', family: 'object', label: '安全帽' },
  { id: 'guitar', family: 'object', label: '吉他' },
  { id: 'drum', family: 'object', label: '鼓' },
  { id: 'radio', family: 'object', label: '收音机' },
  { id: 'headphones', family: 'object', label: '耳机' },
];

const ANIMALS: ScreenItem[] = [
  { id: 'bird', family: 'animal', label: '小鸟' },
  { id: 'rabbit', family: 'animal', label: '兔子' },
  { id: 'cat', family: 'animal', label: '猫' },
  { id: 'dog', family: 'animal', label: '狗' },
  { id: 'fish', family: 'animal', label: '鱼' },
  { id: 'panda', family: 'animal', label: '熊猫' },
  { id: 'mouse', family: 'animal', label: '老鼠' },
  { id: 'squirrel', family: 'animal', label: '松鼠' },
  { id: 'snail', family: 'animal', label: '蜗牛' },
  { id: 'turtle', family: 'animal', label: '乌龟' },
  { id: 'beetle', family: 'animal', label: '甲虫' },
  { id: 'shell', family: 'animal', label: '贝壳' },
  { id: 'shrimp', family: 'animal', label: '虾' },
  { id: 'worm', family: 'animal', label: '毛虫' },
  { id: 'cow', family: 'animal', label: '牛' },
  { id: 'butterfly', family: 'animal', label: '蝴蝶' },
  { id: 'frog', family: 'animal', label: '青蛙' },
  { id: 'pig', family: 'animal', label: '猪' },
  { id: 'sheep', family: 'animal', label: '绵羊' },
  { id: 'hedgehog', family: 'animal', label: '刺猬' },
  { id: 'crab', family: 'animal', label: '螃蟹' },
  { id: 'spider', family: 'animal', label: '蜘蛛' },
  { id: 'octopus', family: 'animal', label: '章鱼' },
];

/** The game's stimuli. Drawn filled and in colour — see ItemGlyph. */
const FOODS: ScreenItem[] = [
  { id: 'apple', family: 'food', label: '苹果' },
  { id: 'banana', family: 'food', label: '香蕉' },
  { id: 'grape', family: 'food', label: '葡萄' },
  { id: 'cherry', family: 'food', label: '樱桃' },
  { id: 'citrus', family: 'food', label: '橙子' },
  { id: 'pear', family: 'food', label: '梨' },
  { id: 'watermelon', family: 'food', label: '西瓜' },
  { id: 'strawberry', family: 'food', label: '草莓' },
];

export const ITEM_BANK: Record<ItemFamily, ScreenItem[]> = {
  object: OBJECTS,
  animal: ANIMALS,
  food: FOODS,
};

export const ALL_ITEMS: ScreenItem[] = [...OBJECTS, ...ANIMALS, ...FOODS];

const ITEM_BY_ID = new Map(ALL_ITEMS.map((item) => [item.id, item]));

export function itemById(id: string): ScreenItem | undefined {
  return ITEM_BY_ID.get(id);
}

/* ------------------------------------------------------------------ *
 * Seeded shuffling
 * ------------------------------------------------------------------ */

/** mulberry32 — small, fast, and good enough to lay out a questionnaire. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Memory blocks
 * ------------------------------------------------------------------ */

/**
 * Four cells, not five. Five self-ordered items over a filled delay is at the
 * hard end even for a healthy 70-year-old, and a screen that healthy users fail
 * measures the screen rather than the user.
 */
export const CELLS_PER_BLOCK = 4;
const ENCODE_PALETTE_SIZE = 8;
/**
 * Both palettes have to stay comfortably below the size of the smallest family,
 * or the recall step serves the whole pool and every run shows the same items in
 * a different order. Adding an item to a family is safe; raising these is not,
 * without adding items first.
 */
const RECALL_PALETTE_SIZE = 15;

export interface MemoryBlock {
  family: ItemFamily;
  /** The 8 items offered while encoding. */
  encodePalette: ScreenItem[];
  /** The 15 items offered at recall: the 8 above plus 7 unseen distractors. */
  recallPalette: ScreenItem[];
}

function buildBlock(family: ItemFamily, random: () => number): MemoryBlock {
  const pool = shuffled(ITEM_BANK[family], random);
  const encodePalette = pool.slice(0, ENCODE_PALETTE_SIZE);
  const distractors = pool.slice(ENCODE_PALETTE_SIZE, RECALL_PALETTE_SIZE);
  return {
    family,
    encodePalette,
    recallPalette: shuffled([...encodePalette, ...distractors], random),
  };
}

/* ------------------------------------------------------------------ *
 * Cued recognition
 * ------------------------------------------------------------------ */

/** One three-choice trial: the missed item against two never-shown items. */
export interface RecognitionTrial {
  /** The item the user failed to recall freely. */
  targetId: string;
  /** Target plus two distractors, in display order. */
  options: ScreenItem[];
}

const RECOGNITION_DISTRACTORS = 2;

/**
 * Built after recall rather than up front, because which items were missed is
 * only known then. Distractors are drawn from the block's unseen half, so a
 * correct answer cannot come from "this one at least looked familiar".
 */
export function buildRecognitionTrials(
  block: MemoryBlock,
  encoded: (string | null)[],
  recalled: (string | null)[],
  seed: number,
): RecognitionTrial[] {
  const random = makeRandom(seed);
  const encodeIds = new Set(block.encodePalette.map((item) => item.id));
  const recalledIds = new Set(recalled.filter((id): id is string => id !== null));
  const unseen = block.recallPalette.filter((item) => !encodeIds.has(item.id));

  return encoded
    .filter((id): id is string => id !== null && !recalledIds.has(id))
    .map((targetId, index) => {
      const target = itemById(targetId);
      // Rotate the distractor window so two trials in the same block do not
      // offer the same pair of wrong answers.
      const offset = (index * RECOGNITION_DISTRACTORS) % Math.max(1, unseen.length);
      const picked = Array.from(
        { length: RECOGNITION_DISTRACTORS },
        (_, n) => unseen[(offset + n) % unseen.length],
      );
      return {
        targetId,
        options: shuffled([target, ...picked].filter((item): item is ScreenItem => !!item), random),
      };
    });
}

/* ------------------------------------------------------------------ *
 * The game — 滚下来的水果
 * ------------------------------------------------------------------ */

/**
 * Six on the stairs, three of them fall.
 *
 * It was seven and four, and four was too many. Reproducing a four-item sequence
 * is above the span of a healthy older adult under time pressure, so the item was
 * failing people it should pass — and a screen that everyone fails separates
 * nobody. Three is the length a word-list recall expects, and it cuts the order
 * problem from 24 arrangements to 6.
 */
export const FALLING_ON_STAIRS = 6;
export const FALLING_COUNT = 3;

/**
 * Six fruits sit on a staircase and three of them roll down, one at a time;
 * afterwards the user picks which three fell, in the order they fell.
 *
 * The point is that it measures the same thing a word list does — hold a short
 * sequence over a few seconds and reproduce it — while looking like a game and
 * asking nothing of reasoning. Real objects, in motion, in colour.
 */
export interface FallingRound {
  /** The 7 fruits on the stairs, top step first. */
  stair: ScreenItem[];
  /** The 4 that roll down, in falling order. */
  fell: string[];
}

function buildFallingRound(random: () => number): FallingRound {
  const stair = shuffled(ITEM_BANK.food, random).slice(0, FALLING_ON_STAIRS);
  return {
    stair,
    fell: shuffled(stair, random)
      .slice(0, FALLING_COUNT)
      .map((item) => item.id),
  };
}

export interface FallingScore {
  /** Fell and was picked. */
  setHits: number;
  /** Picked in the same position in the falling order. */
  orderHits: number;
  /** Picked but never fell. */
  falsePicks: number;
  /** 0..1 share of the game earned. */
  credit: number;
}

/**
 * Membership carries most of the credit and order the rest: naming the three is
 * the memory, and getting them in sequence is the extra that only some people
 * manage. All-or-nothing on order would throw away most of what the item sees.
 *
 * Picking fewer than three costs only the hits not made — an honest blank is
 * never worse than a guess, which is what lets the step be left unfinished.
 */
const FALLING_SET_SHARE = 0.7;

export function scoreFalling(round: FallingRound, picked: string[]): FallingScore {
  const fell = new Set(round.fell);
  const setHits = picked.filter((id) => fell.has(id)).length;
  const orderHits = picked.filter((id, index) => round.fell[index] === id).length;
  const falsePicks = picked.length - setHits;

  const setCredit = Math.max(0, setHits - falsePicks) / FALLING_COUNT;
  const orderCredit = orderHits / FALLING_COUNT;

  return {
    setHits,
    orderHits,
    falsePicks,
    credit: setCredit * FALLING_SET_SHARE + orderCredit * (1 - FALLING_SET_SHARE),
  };
}

/* ------------------------------------------------------------------ *
 * A run
 * ------------------------------------------------------------------ */

/**
 * Seconds allowed per screen. Every one of these is a ceiling, not a target —
 * each screen has a NEXT that lights up as soon as it is answered.
 */
export const TIMING = {
  encode: 90,
  hold: 10,
  recall: 90,
  recognition: 45,
  /** Answer phase only; the fruits rolling down are not on the clock. */
  falling: 60,
} as const;

/** Selection tasks placed between a block's hold screen and its recall screen. */
export const DISTRACTORS_PER_BLOCK = 2;

/**
 * Two blocks, not three. The game covers the third one's ground with a fifth of
 * the tedium, and 15 minutes of grids was the single most common way to abandon
 * the run halfway.
 */
const MEMORY_FAMILIES: ItemFamily[] = ['object', 'animal'];

export interface ScreenSession {
  seed: number;
  blocks: MemoryBlock[];
  /** Administration order; the first `2 × blocks.length` sit inside the blocks. */
  selections: SelectionTask[];
  falling: FallingRound;
}

/**
 * `now` decides the answers to the 定向力 questions, so it is passed in rather
 * than read from the clock here — that keeps `buildSession` a pure function of
 * its arguments and makes those two items testable.
 */
export function buildSession(seed: number, now: Date): ScreenSession {
  const random = makeRandom(seed);
  const blocks = MEMORY_FAMILIES.map((family) => buildBlock(family, random));
  const selections = buildSelectionTasks(random, now);
  return { seed, blocks, selections, falling: buildFallingRound(random) };
}

/* ------------------------------------------------------------------ *
 * Scoring
 * ------------------------------------------------------------------ */

export type Band = 'green' | 'amber' | 'orange';

/**
 * 100 points. Memory still takes the largest share because delayed recall is the
 * highest-value signal in this kind of screen, but it is split three ways now:
 * recognising the items, placing them in order, and — new — getting them back
 * with a cue. The third one is small on purpose; it is a partial refund for a
 * retrieval failure, not a way to score well without remembering anything.
 */
export const WEIGHTS = {
  /** 8 items across 2 blocks, position ignored. */
  set: 25,
  /** 8 positions across 2 blocks, adjacent placements earn half. */
  order: 15,
  /** Items recovered from a three-choice cue after a failed free recall. */
  recognition: 5,
  /** 滚下来的水果. */
  falling: 15,
  /** 2 items: current season and part of the day. */
  orientation: 10,
  /** 2 items: 图形划消 and 数一数有几张脸. */
  attention: 15,
  /** 1 item: 数感. */
  calculation: 8,
  /** 1 item: pick every fruit out of 20 mixed images. */
  fluency: 7,
} as const;

/** Half or less of a domain earned is worth calling out on the report. */
const WEAK_DOMAIN_CREDIT = 0.5;

/** Mirrors the +1/30 education correction used by pen-and-paper screeners. */
export const EDUCATION_BONUS = 3;
export const EDUCATION_BONUS_MAX_YEARS = 12;

export interface BlockResponse {
  family: ItemFamily;
  /**
   * What the user placed while encoding — this is the correct answer. A cell
   * can be null if the encode screen timed out unfinished; the denominator
   * still counts it, because not filling the grid inside the time is itself part
   * of what the screen measures.
   */
  encoded: (string | null)[];
  /** What the user placed at recall; null for a cell left empty. */
  recalled: (string | null)[];
  /** Which cued three-choice trials were answered correctly. */
  recognisedIds: string[];
  /** How many cued trials were offered. */
  cuedCount: number;
  /** Seconds between finishing the encode screen and starting recall. */
  delaySeconds: number;
}

export interface BlockScore extends BlockResponse {
  /** Right item in the right cell. */
  orderHits: number;
  /** Right item one cell out — the sequence is there, the anchoring is not. */
  adjacentHits: number;
  /** Right item anywhere. */
  setHits: number;
  /** Chosen at recall but never shown during encoding — a false recognition. */
  falseRecognitions: number;
  /** Shown during encoding but not chosen then — a within-palette intrusion. */
  intrusions: number;
}

export interface Demographics {
  age: number | null;
  educationYears: number | null;
  sex: 'female' | 'male' | 'other' | null;
}

/** One of the four selection domains, aggregated over its tasks. */
export interface DomainResult {
  domain: SelectionDomain;
  label: string;
  /** 0..1 share of the domain earned. */
  credit: number;
  hits: number;
  targets: number;
  falsePositives: number;
}

/**
 * One row of the report's "how this number was reached" table. The earlier build
 * showed a 74 and left the user to guess where it came from; every point is
 * accounted for here, and the rows sum to the total.
 */
export interface ScoreLine {
  key: string;
  label: string;
  /** What was actually achieved, e.g. '6/8 项'. */
  detail: string;
  hint: string;
  /** Points earned, one decimal place. */
  earned: number;
  max: number;
  /** Extra qualifier, e.g. how many wrong taps offset the right ones. */
  note?: string;
}

export interface ScreenResult {
  totalScore: number;
  band: Band;
  orderHits: number;
  adjacentHits: number;
  setHits: number;
  falseRecognitions: number;
  intrusions: number;
  recognisedCount: number;
  cuedCount: number;
  educationBonusApplied: boolean;
  blocks: BlockScore[];
  domains: DomainResult[];
  falling: FallingScore;
  lines: ScoreLine[];
  /** Why the band ended up where it did, in the order the rules fired. */
  flags: string[];
}

function scoreBlock(response: BlockResponse, encodePalette: ScreenItem[]): BlockScore {
  const paletteIds = new Set(encodePalette.map((item) => item.id));
  const encodedIds = new Set(response.encoded.filter((id): id is string => id !== null));
  const placed = response.recalled.filter((id): id is string => id !== null);

  let orderHits = 0;
  let adjacentHits = 0;
  response.recalled.forEach((id, index) => {
    if (id === null) return;
    if (id === response.encoded[index]) orderHits++;
    else if (id === response.encoded[index - 1] || id === response.encoded[index + 1]) adjacentHits++;
  });

  const setHits = new Set(placed.filter((id) => encodedIds.has(id))).size;
  const falseRecognitions = placed.filter((id) => !paletteIds.has(id)).length;
  const intrusions = placed.filter((id) => paletteIds.has(id) && !encodedIds.has(id)).length;

  return { ...response, orderHits, adjacentHits, setHits, falseRecognitions, intrusions };
}

/** Averages each domain's tasks. */
function aggregateDomains(scores: SelectionScore[]): DomainResult[] {
  const order: SelectionDomain[] = ['orientation', 'attention', 'calculation', 'fluency'];

  return order.map((domain) => {
    const own = scores.filter((score) => score.domain === domain);
    const credit = own.length > 0 ? own.reduce((sum, s) => sum + s.credit, 0) / own.length : 0;
    return {
      domain,
      label: DOMAIN_LABELS[domain],
      credit,
      hits: own.reduce((sum, s) => sum + s.hits, 0),
      targets: own.reduce((sum, s) => sum + s.targets, 0),
      falsePositives: own.reduce((sum, s) => sum + s.falsePositives, 0),
    };
  });
}

/** Points to one decimal, so the rows on the report add up to the total. */
function points(credit: number, max: number): number {
  return Math.round(credit * max * 10) / 10;
}

const DOMAIN_HINTS: Record<SelectionDomain, string> = {
  orientation: '知道现在是什么季节、大概什么时辰。',
  attention: '在一堆相似的东西里把目标一个不漏地找出来。',
  calculation: '同时记住两边的数量再合起来算。',
  fluency: '「水果」这个类别在脑子里浮现得有多快。',
};

export function scoreSession(
  session: ScreenSession,
  responses: BlockResponse[],
  selectionAnswers: string[][],
  fallingPicks: string[],
  demographics: Demographics,
): ScreenResult {
  const blocks = responses.map((response, index) =>
    scoreBlock(response, session.blocks[index].encodePalette),
  );

  const orderHits = blocks.reduce((sum, b) => sum + b.orderHits, 0);
  const adjacentHits = blocks.reduce((sum, b) => sum + b.adjacentHits, 0);
  const setHits = blocks.reduce((sum, b) => sum + b.setHits, 0);
  const falseRecognitions = blocks.reduce((sum, b) => sum + b.falseRecognitions, 0);
  const intrusions = blocks.reduce((sum, b) => sum + b.intrusions, 0);
  const recognisedCount = blocks.reduce((sum, b) => sum + b.recognisedIds.length, 0);
  const cuedCount = blocks.reduce((sum, b) => sum + b.cuedCount, 0);

  const domains = aggregateDomains(
    session.selections.map((task, index) => scoreSelection(task, selectionAnswers[index] ?? [])),
  );
  const falling = scoreFalling(session.falling, fallingPicks);

  const cells = CELLS_PER_BLOCK * session.blocks.length;
  // Adjacent placements earn half a cell each.
  const orderCredit = (orderHits + adjacentHits * 0.5) / cells;

  const educationBonusApplied =
    demographics.educationYears !== null &&
    demographics.educationYears <= EDUCATION_BONUS_MAX_YEARS;

  const lines: ScoreLine[] = [
    {
      key: 'set',
      label: '延迟识别',
      detail: `${setHits}/${cells} 项`,
      hint: '不论位置，认出自己当初放进格子的项目。这一项最接近临床上最看重的延迟回忆。',
      earned: points(setHits / cells, WEIGHTS.set),
      max: WEIGHTS.set,
    },
    {
      key: 'order',
      label: '顺序记忆',
      detail: `位置全对 ${orderHits}/${cells}，差一格 ${adjacentHits}`,
      hint: '把项目放回原来的位置。差一格算一半分——顺序记住了、只是起点偏了，和完全想不起来不是一回事。',
      earned: points(orderCredit, WEIGHTS.order),
      max: WEIGHTS.order,
    },
    {
      key: 'recognition',
      label: '提示后认出',
      detail: cuedCount > 0 ? `${recognisedCount}/${cuedCount} 项` : '不需要提示',
      hint: '自己想不起来、但在三个选项里能认出来。能靠提示找回来，说明当时记住了，只是提取慢。',
      earned:
        cuedCount > 0
          ? points(recognisedCount / cuedCount, WEIGHTS.recognition)
          : WEIGHTS.recognition,
      max: WEIGHTS.recognition,
      note: cuedCount === 0 ? '全部自己回忆出来了，直接给满分' : undefined,
    },
    {
      key: 'falling',
      label: '滚下来的水果',
      detail: `认出 ${falling.setHits}/${FALLING_COUNT}，顺序对 ${falling.orderHits}`,
      hint: '看着几样东西依次滚下来，然后按顺序说出是哪几样——短时记忆加顺序保持。',
      earned: points(falling.credit, WEIGHTS.falling),
      max: WEIGHTS.falling,
      note: falling.falsePicks > 0 ? `多选了 ${falling.falsePicks} 个` : undefined,
    },
    ...domains.map((domain) => ({
      key: domain.domain,
      label: domain.label,
      detail: `${domain.hits}/${domain.targets} 项`,
      hint: DOMAIN_HINTS[domain.domain],
      earned: points(domain.credit, WEIGHTS[domain.domain]),
      max: WEIGHTS[domain.domain],
      note: domain.falsePositives > 0 ? `多选了 ${domain.falsePositives} 个` : undefined,
    })),
  ];

  const raw =
    lines.reduce((sum, line) => sum + line.earned, 0) +
    (educationBonusApplied ? EDUCATION_BONUS : 0);
  const totalScore = Math.min(100, Math.round(raw));

  const flags: string[] = [];
  let band = bandFor(totalScore);

  // Memory can fail on its own while the other domains carry the total. Half the
  // items forgotten is the signal this screen exists to catch, so it decides
  // the band regardless of the total.
  if (setHits <= Math.floor(cells / 2)) {
    band = 'orange';
    flags.push(`延迟识别只有 ${setHits}/${cells} 项`);
  }

  // Picking items that were never shown points at a failure to encode rather
  // than a failure to retrieve, so it escalates one band.
  if (falseRecognitions >= 3) {
    if (band === 'green') band = 'amber';
    flags.push(`选了 ${falseRecognitions} 次从没出现过的项目`);
  }

  domains
    .filter((domain) => domain.credit <= WEAK_DOMAIN_CREDIT)
    .forEach((domain) => flags.push(`${domain.label}这一项得分偏低`));

  // Free recall low but the cue rescues it: retrieval, not storage. Worth saying
  // out loud, because it is the more reassuring of the two patterns.
  if (cuedCount >= 2 && recognisedCount === cuedCount) {
    flags.push('想不起来的项目在提示后都认出来了——更像一时提取不出来，而不是没记住');
  }

  return {
    totalScore,
    band,
    orderHits,
    adjacentHits,
    setHits,
    falseRecognitions,
    intrusions,
    recognisedCount,
    cuedCount,
    educationBonusApplied,
    blocks,
    domains,
    falling,
    lines,
    flags,
  };
}

/* ------------------------------------------------------------------ *
 * Bands
 * ------------------------------------------------------------------ */

export interface BandDefinition {
  band: Band;
  /** Inclusive lower bound; the band above starts one point higher. */
  min: number;
  max: number;
  /** Short name for the scale, e.g. '常见范围'. */
  name: string;
  /** Headline on the report. */
  title: string;
  /** What this range means, in one sentence. */
  meaning: string;
  /** What to do next. */
  action: string;
  tone: 'emerald' | 'amber' | 'orange';
}

/**
 * Three bands with their numbers stated, because a bare 74/100 answers nothing:
 * the user cannot tell whether it is a pass, and the one thing a screening
 * result has to communicate is what to do next.
 *
 * The boundaries are still ours, not a norming study's — they come from the
 * design document's reasoning about domain weights. That is why every band says
 * "compare with your own previous score" and why the report carries the caveat
 * whatever the number is. What changed is that they are now visible.
 */
export const BANDS: BandDefinition[] = [
  {
    band: 'green',
    min: 80,
    max: 100,
    name: '常见范围',
    title: '这次的表现落在常见范围内',
    meaning: '各项都在我们预期的范围里，没有哪一项明显掉下来。',
    action: '不需要做什么。建议每 12 个月再测一次，把这次的分数当成你自己的基线，以后看变化比看单次分数有用得多。',
    tone: 'emerald',
  },
  {
    band: 'amber',
    min: 65,
    max: 79,
    name: '值得留意',
    title: '有一两项值得留意',
    meaning: '总体还可以，但有项目低于我们预期的范围。单次结果说明不了什么——睡眠、情绪、用药和当下的注意力都会影响它。',
    action: '建议 6 个月后用同一个测试再做一次，对照两次的差值。如果家人也觉得你最近记性变化明显，不用等 6 个月，直接找医生聊一次。',
    tone: 'amber',
  },
  {
    band: 'orange',
    min: 0,
    max: 64,
    name: '建议找专业评估',
    title: '建议带这份结果做一次正式评估',
    meaning: '多个项目低于我们预期的范围。这只说明这一次的表现，不说明原因——原因可能是可以处理的，也可能需要进一步检查。',
    action:
      '建议携带这份结果去记忆门诊、神经内科，或找专业的心理医生／心理咨询师做一次正规评估，确认是否存在认知障碍（包括阿尔茨海默病），同时排查睡眠、甲状腺功能、维生素 B12、抑郁和药物这些可逆的因素。这些因素引起的认知变化，处理之后通常是会好转的。',
    tone: 'orange',
  },
];

export function bandFor(score: number): Band {
  return (BANDS.find((definition) => score >= definition.min) ?? BANDS[BANDS.length - 1]).band;
}

export function bandDefinition(band: Band): BandDefinition {
  return BANDS.find((definition) => definition.band === band) ?? BANDS[BANDS.length - 1];
}

export type { SelectionTask };

export const FAMILY_LABELS: Record<ItemFamily, string> = {
  object: '日常物品',
  animal: '动物',
  food: '水果',
};

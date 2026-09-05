/**
 * 认知快测 — item bank, task construction and scoring.
 *
 * The interaction paradigm follows the self-administered visual screeners in
 * this space (place items into a grid, hold, recall against an enlarged
 * distractor palette, plus a pattern-continuation attention task). The stimuli
 * here are entirely our own: MoCA's items are copyrighted and its publisher
 * restricts electronic administration, so nothing from the published test is
 * reproduced. See docs/MoCA式认知筛查题目设计.md in the zeneEdu repo for the
 * clinical rationale behind the domain weights and the triage bands.
 *
 * Everything a run needs is derived from one integer seed, so a retest produces
 * a parallel form (different items, same structure) rather than the form the
 * user has already learned.
 */

import {
  buildSelectionTasks,
  DOMAIN_LABELS,
  scoreSelection,
  type SelectionDomain,
  type SelectionScore,
  type SelectionTask,
} from './selectionTasks';

export type ItemFamily = 'shape' | 'object' | 'animal';

export interface ScreenItem {
  /** Unique across every family; also the glyph key in ItemGlyph. */
  id: string;
  family: ItemFamily;
  /** Shown only in the result breakdown and as the accessible name. */
  label: string;
}

/**
 * 15 members per family. The encode palette takes 8 and the recall palette
 * grows to 15, so the recall step adds 7 items the user has never seen — items
 * chosen from those are false recognitions, which separate an encoding failure
 * from a retrieval failure.
 */
const SHAPES: ScreenItem[] = [
  { id: 'square', family: 'shape', label: '正方形' },
  { id: 'rect-v', family: 'shape', label: '竖长方形' },
  { id: 'circle', family: 'shape', label: '圆形' },
  { id: 'triangle', family: 'shape', label: '三角形' },
  { id: 'circle-cross', family: 'shape', label: '带叉圆形' },
  { id: 'zigzag', family: 'shape', label: 'Z 形' },
  { id: 'tee', family: 'shape', label: 'T 形' },
  { id: 'wave', family: 'shape', label: '波浪线' },
  { id: 'rect-diag', family: 'shape', label: '带斜线长方形' },
  { id: 'zigzag-double', family: 'shape', label: '双 Z 形' },
  { id: 'rect-h', family: 'shape', label: '横长方形' },
  { id: 'cross', family: 'shape', label: '交叉线' },
  { id: 'rect-split', family: 'shape', label: '分格长方形' },
  { id: 'triangle-nested', family: 'shape', label: '嵌套三角形' },
  { id: 'circle-in-square', family: 'shape', label: '方中圆' },
];

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
];

export const ITEM_BANK: Record<ItemFamily, ScreenItem[]> = {
  shape: SHAPES,
  object: OBJECTS,
  animal: ANIMALS,
};

export const ALL_ITEMS: ScreenItem[] = [...SHAPES, ...OBJECTS, ...ANIMALS];

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

export const CELLS_PER_BLOCK = 5;
const ENCODE_PALETTE_SIZE = 8;
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
 * A run
 * ------------------------------------------------------------------ */

/** Seconds allowed per screen, mirroring the pacing of the reference tool. */
export const TIMING = {
  encode: 120,
  hold: 10,
  recall: 120,
} as const;

/**
 * Selection tasks placed between a block's hold screen and its recall screen.
 * They are the distraction interval, which is what the clinical guidance asks
 * for: the delay before recall should be filled by the other tests rather than
 * by dead time. Two is also close enough that a recall still reads as belonging
 * to the block it came from.
 */
export const DISTRACTORS_PER_BLOCK = 2;

const MEMORY_FAMILIES: ItemFamily[] = ['shape', 'object', 'animal'];

export interface ScreenSession {
  seed: number;
  blocks: MemoryBlock[];
  /** Grouped by block: `selections[block * DISTRACTORS_PER_BLOCK + n]`. */
  selections: SelectionTask[];
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
  return { seed, blocks, selections };
}

/* ------------------------------------------------------------------ *
 * Scoring
 * ------------------------------------------------------------------ */

export type Band = 'green' | 'amber' | 'orange';

/**
 * 100 points across the domains the design lays out. Memory keeps the majority
 * because delayed recall is the highest-value signal in this kind of screen, and
 * order recall outweighs bare recognition because reproducing a self-generated
 * sequence loads both the memory trace and the executive control that retrieves
 * it in order.
 */
export const WEIGHTS = {
  /** 15 positions across 3 blocks. */
  order: 30,
  /** 15 items across 3 blocks, position ignored. */
  set: 25,
  /** 2 items: current season and part of the day. */
  orientation: 10,
  /** 1 item: 图形划消, 6 targets among 20 cells. */
  attention: 15,
  /** 2 items: 数感 total and difference. */
  calculation: 10,
  /** 1 item: pick every fruit out of 20 mixed images. */
  fluency: 10,
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
   * still counts it, because not placing five items inside two minutes is
   * itself part of what the screen measures.
   */
  encoded: (string | null)[];
  /** What the user placed at recall; null for a cell left empty. */
  recalled: (string | null)[];
  /** Seconds between finishing the encode screen and starting recall. */
  delaySeconds: number;
}

export interface BlockScore extends BlockResponse {
  /** Right item in the right cell. */
  orderHits: number;
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
  /** This domain's slice of the 100. */
  points: number;
  hits: number;
  targets: number;
  falsePositives: number;
}

export interface ScreenResult {
  totalScore: number;
  band: Band;
  orderHits: number;
  setHits: number;
  falseRecognitions: number;
  intrusions: number;
  educationBonusApplied: boolean;
  blocks: BlockScore[];
  domains: DomainResult[];
  /** Why the band ended up where it did, in the order the rules fired. */
  flags: string[];
}

function scoreBlock(response: BlockResponse, encodePalette: ScreenItem[]): BlockScore {
  const paletteIds = new Set(encodePalette.map((item) => item.id));
  const encodedIds = new Set(response.encoded.filter((id): id is string => id !== null));
  const placed = response.recalled.filter((id): id is string => id !== null);

  let orderHits = 0;
  response.recalled.forEach((id, index) => {
    if (id !== null && id === response.encoded[index]) orderHits++;
  });

  const setHits = new Set(placed.filter((id) => encodedIds.has(id))).size;
  const falseRecognitions = placed.filter((id) => !paletteIds.has(id)).length;
  const intrusions = placed.filter((id) => paletteIds.has(id) && !encodedIds.has(id)).length;

  return { ...response, orderHits, setHits, falseRecognitions, intrusions };
}

/**
 * Bands are provisional. They come from the design document's own reasoning
 * about domain weights, not from a norming study, so nothing here is a
 * validated cut-off and the report has to say so.
 */
/** Averages each domain's tasks and attaches its slice of the 100. */
function aggregateDomains(scores: SelectionScore[]): DomainResult[] {
  const order: SelectionDomain[] = ['orientation', 'attention', 'calculation', 'fluency'];

  return order.map((domain) => {
    const own = scores.filter((score) => score.domain === domain);
    const credit = own.length > 0 ? own.reduce((sum, s) => sum + s.credit, 0) / own.length : 0;
    return {
      domain,
      label: DOMAIN_LABELS[domain],
      credit,
      points: WEIGHTS[domain],
      hits: own.reduce((sum, s) => sum + s.hits, 0),
      targets: own.reduce((sum, s) => sum + s.targets, 0),
      falsePositives: own.reduce((sum, s) => sum + s.falsePositives, 0),
    };
  });
}

export function scoreSession(
  session: ScreenSession,
  responses: BlockResponse[],
  selectionAnswers: string[][],
  demographics: Demographics,
): ScreenResult {
  const blocks = responses.map((response, index) =>
    scoreBlock(response, session.blocks[index].encodePalette),
  );

  const orderHits = blocks.reduce((sum, b) => sum + b.orderHits, 0);
  const setHits = blocks.reduce((sum, b) => sum + b.setHits, 0);
  const falseRecognitions = blocks.reduce((sum, b) => sum + b.falseRecognitions, 0);
  const intrusions = blocks.reduce((sum, b) => sum + b.intrusions, 0);

  const domains = aggregateDomains(
    session.selections.map((task, index) => scoreSelection(task, selectionAnswers[index] ?? [])),
  );

  const orderCells = CELLS_PER_BLOCK * session.blocks.length;

  const educationBonusApplied =
    demographics.educationYears !== null &&
    demographics.educationYears <= EDUCATION_BONUS_MAX_YEARS;

  const raw =
    (orderHits / orderCells) * WEIGHTS.order +
    (setHits / orderCells) * WEIGHTS.set +
    domains.reduce((sum, domain) => sum + domain.credit * domain.points, 0) +
    (educationBonusApplied ? EDUCATION_BONUS : 0);

  const totalScore = Math.min(100, Math.round(raw));

  const flags: string[] = [];
  let band: Band = totalScore >= 85 ? 'green' : totalScore >= 70 ? 'amber' : 'orange';
  if (band !== 'green') flags.push(`总分 ${totalScore}/100`);

  // Memory can fail on its own while the other domains carry the total. Half the
  // items forgotten is the signal this screen exists to catch, so it decides
  // the band regardless of the total.
  if (setHits <= Math.floor(orderCells / 2)) {
    band = 'orange';
    flags.push(`延迟识别仅 ${setHits}/${orderCells} 项`);
  }

  // Picking items that were never shown points at a failure to encode rather
  // than a failure to retrieve, so it escalates one band.
  if (falseRecognitions >= 4 && band === 'green') {
    band = 'amber';
    flags.push(`虚假识别 ${falseRecognitions} 次`);
  } else if (falseRecognitions >= 4) {
    flags.push(`虚假识别 ${falseRecognitions} 次`);
  }

  // A domain that collapses on its own is worth naming even when the total is
  // comfortable — a single weak domain is what a follow-up would look into.
  domains
    .filter((domain) => domain.credit <= WEAK_DOMAIN_CREDIT)
    .forEach((domain) => flags.push(`${domain.label}得分偏低`));

  return {
    totalScore,
    band,
    orderHits,
    setHits,
    falseRecognitions,
    intrusions,
    educationBonusApplied,
    blocks,
    domains,
    flags,
  };
}

export type { SelectionTask };

export const FAMILY_LABELS: Record<ItemFamily, string> = {
  shape: '图形',
  object: '日常物品',
  animal: '动物',
};

export const BAND_COPY: Record<Band, { title: string; tone: string; advice: string }> = {
  green: {
    title: '本次筛查未见明显异常',
    tone: 'emerald',
    advice: '建议每 12 个月复测一次，用你自己的分数作为基线来看变化。',
  },
  amber: {
    title: '本次筛查有若干值得留意的表现',
    tone: 'amber',
    advice:
      '单次结果说明不了什么，睡眠、情绪、用药和当下的注意力都会影响它。建议 6 个月后用同一工具复测，并对照两次的差值。',
  },
  orange: {
    title: '建议带这份结果去做一次正式评估',
    tone: 'orange',
    advice:
      '这不是诊断。请携带结果咨询神经内科或记忆门诊，由专业人员使用完整量表复核，并排查睡眠、甲状腺功能、维生素 B12、抑郁与药物等可逆因素。',
  },
};

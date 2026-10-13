import type { ZoneKey } from "@/lib/sandtray/zones"

export type FigureCategory = "人物" | "动物" | "建筑" | "工具" | "自然"

export type Figure = {
  id: string
  name: string
  category: FigureCategory
  modelUrl: string
  thumbUrl: string
  // 象征意义标签，AI 分析的核心输入
  symbolism: string[]
}

// 沙具最多能抬离沙面多高（沙盘单位，人 = 1.8）；往下最多降多少（沉进水里、坑里）
export const LIFT_MAX = 6
export const LIFT_MIN = -3

export type PlacedFigure = {
  id: string
  figureId: string
  x: number
  z: number
  rotation: number
  scale: number
  // 离开沙面的高度（沙盘单位），0 = 落在沙面上；负数 = 往下沉（水里、坑里），沉到坑底为止
  lift?: number
  // 摆放顺序，从 1 开始
  order: number
  placedAt: number
}

// 用户在沙盘上的每一个动作。t 是从进入沙盘算起的毫秒数，按发生顺序排列。
// 高频动作（塑沙、拖动）已经抽样，其余每次都记。
export type SandtrayEventKind =
  | "enter" // 进入沙盘
  | "away" // 切走 / 息屏
  | "back" // 回来
  | "tool" // 切工具
  | "category" // 切沙具分类
  | "pick" // 从沙具库选中一件（还没放下）
  | "unpick" // 又取消了
  | "place" // 放下
  | "move" // 拖动位置
  | "scale" // 改大小
  | "rotate" // 改角度
  | "lift" // 改离地高度
  | "remove" // 删除
  | "sculpt" // 挖 / 堆 / 抹平的一笔
  | "undo" // 撤销
  | "reset" // 重置
  | "camera" // 转视角 / 缩放
  | "save" // 保存

export type SandtrayEvent = {
  t: number
  kind: SandtrayEventKind
  // 场上沙具的实例 id
  id?: string
  figureId?: string
  tool?: "dig" | "mound" | "smooth" | "orbit" | "none"
  x?: number
  z?: number
  // 笔刷半径
  r?: number
  scale?: number
  rotation?: number
  lift?: number
  // 这个动作持续了多久（离开时长、某件沙具在场上待了多久）
  ms?: number
  // 分类名之类的附带值
  value?: string
}

// 旧格式的塑沙笔画记录，仅用于读取旧数据
export type SculptStroke = {
  t: number
  tool: "dig" | "mound" | "smooth"
  x: number
  z: number
  r: number
}

// 停顿与节奏：犹豫、长时间盯着不动、离开又回来，这些在沙盘里都是有意义的行为
export type PauseStats = {
  over3s: number
  over10s: number
  longestMs: number
  // 进沙盘到第一个动作
  beforeFirstMs: number
  // 最后一个动作到保存
  lastToSaveMs: number
}

// 各类动作的次数
export type ActionCounts = {
  place: number
  move: number
  scale: number
  rotate: number
  lift: number
  remove: number
  sculpt: number
  undo: number
  reset: number
  // 选了沙具又放弃
  pickWithoutPlace: number
  categorySwitch: number
  // 转视角 / 缩放的次数（抽样后）
  camera: number
}

// 摆放的空间结构
export type SpreadStats = {
  // 离沙盘中心的平均距离
  avgFromCenter: number
  // 最近邻距离的平均值：小=挤成一团，大=散开
  nearestAvg: number
  // 所有沙具的包围盒面积
  bboxArea: number
}

// 保存时结算的统计，AI 分析直接读这里，不用再从高度场倒推
export type LayoutStats = {
  figureCount: number
  // 沙具五区分布
  figureZones: Record<ZoneKey, number>
  // 挖低 / 堆高的面积（沙盘单位²）与各自的五区分布
  dugArea: number
  piledArea: number
  dugZones: Record<ZoneKey, number>
  piledZones: Record<ZoneKey, number>
  // 相对原始沙面的最深 / 最高
  maxDepth: number
  maxHeight: number
  // 是否挖到见水
  water: boolean
  strokeCount: number
  // 从进入沙盘到保存的用时
  durationMs: number
  // 真正在操作的时长（去掉长停顿与离开）
  activeMs: number
  // 切走的总时长
  awayMs: number
  pauses: PauseStats
  actions: ActionCounts
  spread: SpreadStats
}

export type SandtrayLayout = {
  figures: PlacedFigure[]
  // 塑过的沙：高度场量化压缩后的 base64，见 components/sandtray/terrain 的 encodeHeights
  heightField?: string
  // 全过程的动作流水（抽样后的），与摆放顺序一起进 AI 分析
  events?: SandtrayEvent[]
  // 旧格式字段，仅用于读取旧数据
  strokes?: SculptStroke[]
  stats?: LayoutStats
  // 保存时镜头的朝向，区域统计按它换算成用户看到的左右上下
  view?: { yaw: number; polar: number }
  updatedAt: number
}

export type RecordStatus = "draft" | "pending" | "analyzed"

export type SandtrayRecord = {
  id: string
  name: string
  story?: string
  status: RecordStatus
  favorite: boolean
  layout: SandtrayLayout
  snapshotUrl?: string
  direction?: ExploreDirection
  report?: Report
  createdAt: number
  updatedAt: number
}

// 确认弹窗中选择的探索方向，对应设计稿「沙盘_选择方向」
export type ExploreDirection = "self" | "career" | "future" | "free"

export type RiasecScores = {
  R: number
  I: number
  A: number
  S: number
  E: number
  C: number
}

// 报告以卡牌呈现：称号、观察、意味着什么、下一步。
// radar / careers 照常计算和存储，当前界面不展示；sections / actions 为旧版字段，用于显示旧记录。
export type Report = {
  title: string
  subtitle: string
  summary: string
  meaning?: string
  nextSteps?: string[]
  radar: RiasecScores
  careers: { title: string; match: number }[]
  sections?: { title: string; body: string }[]
  actions?: string[]
  generatedAt: number
}

// 自我觉察卡牌，维度使用 RIASEC
export type AwarenessCard = {
  index: number
  title: string
  subtitle: string
  imageUrl?: string
  summary: string
  trait: { title: string; body: string }
  scores: RiasecScores
  tip: string
}

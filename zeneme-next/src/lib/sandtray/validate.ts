import type {
  ActionCounts,
  PlacedFigure,
  SandtrayEvent,
  SandtrayEventKind,
  SandtrayLayout,
} from "@/types/sandtray"
import { LIFT_MAX, LIFT_MIN } from "@/types/sandtray"
import { emptyZones, ZONE_KEYS } from "./zones"

// 写库前清洗请求体：字段白名单、数值限定范围、体积封顶。
export const LIMITS = {
  name: 40,
  story: 2000,
  figures: 200,
  events: 4000,
  // 压缩后的高度场通常几十 KB
  heightField: 400_000,
  // 沙盘快照 data URL，约 1.5MB
  snapshot: 2_000_000,
}

export class BadRequest extends Error {}

const num = (v: unknown, min: number, max: number, fallback = 0) => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : fallback
  return Math.min(max, Math.max(min, n))
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "")

function figure(raw: unknown, i: number): PlacedFigure | null {
  if (!raw || typeof raw !== "object") return null
  const f = raw as Record<string, unknown>
  if (typeof f.id !== "string" || typeof f.figureId !== "string") return null
  return {
    id: f.id.slice(0, 80),
    figureId: f.figureId.slice(0, 80),
    x: num(f.x, -70, 70),
    z: num(f.z, -70, 70),
    rotation: num(f.rotation, -Math.PI * 4, Math.PI * 4),
    scale: num(f.scale, 0.2, 5, 1),
    lift: num(f.lift, LIFT_MIN, LIFT_MAX, 0),
    order: num(f.order, 1, LIMITS.figures, i + 1),
    placedAt: num(f.placedAt, 0, Number.MAX_SAFE_INTEGER, Date.now()),
  }
}

const KINDS: SandtrayEventKind[] = [
  "enter", "away", "back", "tool", "category", "pick", "unpick",
  "place", "move", "scale", "rotate", "lift", "remove", "sculpt", "undo", "reset", "camera", "save",
]
const TOOLS = ["dig", "mound", "smooth", "orbit", "none"]

function event(raw: unknown): SandtrayEvent | null {
  if (!raw || typeof raw !== "object") return null
  const e = raw as Record<string, unknown>
  const kind = KINDS.find((k) => k === e.kind)
  if (!kind) return null
  const out: SandtrayEvent = { t: num(e.t, 0, 24 * 3600 * 1000), kind }
  if (typeof e.id === "string") out.id = e.id.slice(0, 80)
  if (typeof e.figureId === "string") out.figureId = e.figureId.slice(0, 80)
  if (typeof e.tool === "string" && TOOLS.includes(e.tool)) out.tool = e.tool as SandtrayEvent["tool"]
  if (e.x !== undefined) out.x = num(e.x, -70, 70)
  if (e.z !== undefined) out.z = num(e.z, -70, 70)
  if (e.r !== undefined) out.r = num(e.r, 0.1, 20)
  if (e.scale !== undefined) out.scale = num(e.scale, 0.2, 5)
  if (e.rotation !== undefined) out.rotation = num(e.rotation, -Math.PI * 4, Math.PI * 4)
  if (e.lift !== undefined) out.lift = num(e.lift, LIFT_MIN, LIFT_MAX)
  if (e.ms !== undefined) out.ms = num(e.ms, 0, 24 * 3600 * 1000)
  if (typeof e.value === "string") out.value = e.value.slice(0, 40)
  return out
}

function actions(raw: unknown): ActionCounts {
  const src = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const keys: (keyof ActionCounts)[] = [
    "place", "move", "scale", "rotate", "lift", "remove", "sculpt", "undo", "reset",
    "pickWithoutPlace", "categorySwitch", "camera",
  ]
  return Object.fromEntries(keys.map((k) => [k, num(src[k], 0, 1e6)])) as ActionCounts
}

function zones(raw: unknown) {
  const out = emptyZones()
  if (raw && typeof raw === "object") {
    for (const k of ZONE_KEYS) out[k] = num((raw as Record<string, unknown>)[k], 0, 1e6)
  }
  return out
}

function view(raw: unknown) {
  if (!raw || typeof raw !== "object") return undefined
  const v = raw as Record<string, unknown>
  if (typeof v.yaw !== "number" || typeof v.polar !== "number") return undefined
  return { yaw: num(v.yaw, -Math.PI * 2, Math.PI * 2), polar: num(v.polar, 0, Math.PI) }
}

export function sanitizeLayout(raw: unknown): SandtrayLayout {
  const l = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const figures = Array.isArray(l.figures) ? l.figures : []
  if (figures.length > LIMITS.figures) throw new BadRequest("沙具数量超出上限")

  const heightField = typeof l.heightField === "string" ? l.heightField : undefined
  if (heightField && heightField.length > LIMITS.heightField) throw new BadRequest("地形数据过大")

  const events = Array.isArray(l.events) ? l.events.slice(0, LIMITS.events) : []
  const st = (l.stats && typeof l.stats === "object" ? l.stats : null) as Record<string, unknown> | null

  return {
    figures: figures.map(figure).filter((f): f is PlacedFigure => !!f),
    heightField,
    view: view(l.view),
    events: events.map(event).filter((e): e is SandtrayEvent => !!e),
    stats: st
      ? {
          figureCount: num(st.figureCount, 0, LIMITS.figures),
          figureZones: zones(st.figureZones),
          dugArea: num(st.dugArea, 0, 1e6),
          piledArea: num(st.piledArea, 0, 1e6),
          dugZones: zones(st.dugZones),
          piledZones: zones(st.piledZones),
          maxDepth: num(st.maxDepth, 0, 100),
          maxHeight: num(st.maxHeight, 0, 100),
          water: !!st.water,
          strokeCount: num(st.strokeCount, 0, 1e6),
          durationMs: num(st.durationMs, 0, 24 * 3600 * 1000),
          activeMs: num(st.activeMs, 0, 24 * 3600 * 1000),
          awayMs: num(st.awayMs, 0, 24 * 3600 * 1000),
          pauses: {
            over3s: num((st.pauses as Record<string, unknown>)?.over3s, 0, 1e6),
            over10s: num((st.pauses as Record<string, unknown>)?.over10s, 0, 1e6),
            longestMs: num((st.pauses as Record<string, unknown>)?.longestMs, 0, 24 * 3600 * 1000),
            beforeFirstMs: num((st.pauses as Record<string, unknown>)?.beforeFirstMs, 0, 24 * 3600 * 1000),
            lastToSaveMs: num((st.pauses as Record<string, unknown>)?.lastToSaveMs, 0, 24 * 3600 * 1000),
          },
          actions: actions(st.actions),
          spread: {
            avgFromCenter: num((st.spread as Record<string, unknown>)?.avgFromCenter, 0, 200),
            nearestAvg: num((st.spread as Record<string, unknown>)?.nearestAvg, 0, 200),
            bboxArea: num((st.spread as Record<string, unknown>)?.bboxArea, 0, 1e5),
          },
        }
      : undefined,
    updatedAt: Date.now(),
  }
}

export function sanitizeSnapshot(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw) return undefined
  if (!raw.startsWith("data:image/")) throw new BadRequest("快照格式不对")
  if (raw.length > LIMITS.snapshot) throw new BadRequest("快照过大")
  return raw
}

// 心路痕迹：最多 4 条，问题 200 字、回答 1000 字

export const sanitizeName = (v: unknown) => str(v, LIMITS.name)
export const sanitizeStory = (v: unknown) => str(v, LIMITS.story)

import { emptyZones, ZONE_LABEL, zoneOf, type View } from "./zones"
import type {
  ActionCounts,
  PauseStats,
  PlacedFigure,
  SandtrayEvent,
  SculptStroke,
  SpreadStats,
} from "@/types/sandtray"

export function figureZones(figures: PlacedFigure[], view?: View) {
  const zones = emptyZones()
  for (const f of figures) zones[zoneOf(f.x, f.z, view)]++
  return zones
}

// 原始笔画序列过长，按连续相同工具合并成段（时间、区域、工具、笔数），让模型看到节奏与顺序而非坐标。
function emptyActions(): ActionCounts {
  return {
    place: 0, move: 0, scale: 0, rotate: 0, lift: 0, remove: 0,
    sculpt: 0, undo: 0, reset: 0, pickWithoutPlace: 0, categorySwitch: 0, camera: 0,
  }
}

// 从动作流水结算行为节奏：停顿、离开、真正在操作的时长、各类动作次数
export function behaviourStats(events: SandtrayEvent[], durationMs: number) {
  const actions = emptyActions()
  let awayMs = 0
  const pauses: PauseStats = { over3s: 0, over10s: 0, longestMs: 0, beforeFirstMs: 0, lastToSaveMs: 0 }

  // enter 与 save 不计为沙盘内动作
  const timeline = events.filter((e) => e.kind !== "enter" && e.kind !== "save")
  for (const e of events) {
    switch (e.kind) {
      case "place": actions.place++; break
      case "move": actions.move++; break
      case "scale": actions.scale++; break
      case "rotate": actions.rotate++; break
      case "lift": actions.lift++; break
      case "remove": actions.remove++; break
      case "sculpt": actions.sculpt++; break
      case "undo": actions.undo++; break
      case "reset": actions.reset++; break
      case "unpick": actions.pickWithoutPlace++; break
      case "category": actions.categorySwitch++; break
      case "camera": actions.camera++; break
      case "back": awayMs += e.ms ?? 0; break
    }
  }

  let idle = 0
  let prev = 0
  for (const e of timeline) {
    const gap = e.t - prev
    // 离开期间不计为停顿
    if (e.kind !== "back" && gap > 3000) {
      pauses.over3s++
      if (gap > 10000) pauses.over10s++
      idle += gap
      if (gap > pauses.longestMs) pauses.longestMs = gap
    }
    prev = e.t
  }
  // 开始前停顿以第一个实质动作为准，不计转视角（进入时相机会自动动一下）
  const firstReal = timeline.find((e) => e.kind !== "camera")
  pauses.beforeFirstMs = firstReal ? firstReal.t : durationMs
  const lastReal = [...timeline].reverse().find((e) => e.kind !== "camera")
  pauses.lastToSaveMs = lastReal ? Math.max(0, durationMs - lastReal.t) : 0

  return {
    actions,
    pauses,
    awayMs,
    activeMs: Math.max(0, durationMs - idle - awayMs),
  }
}

// 摆放的空间结构：离中心距离、疏密、铺开面积
export function spreadStats(figures: PlacedFigure[]): SpreadStats {
  if (!figures.length) return { avgFromCenter: 0, nearestAvg: 0, bboxArea: 0 }
  const r2 = (v: number) => +v.toFixed(2)
  const avgFromCenter = figures.reduce((a, f) => a + Math.hypot(f.x, f.z), 0) / figures.length
  let nearest = 0
  for (const f of figures) {
    let best = Infinity
    for (const g of figures) {
      if (g === f) continue
      best = Math.min(best, Math.hypot(f.x - g.x, f.z - g.z))
    }
    nearest += Number.isFinite(best) ? best : 0
  }
  const xs = figures.map((f) => f.x)
  const zs = figures.map((f) => f.z)
  return {
    avgFromCenter: r2(avgFromCenter),
    nearestAvg: r2(figures.length > 1 ? nearest / figures.length : 0),
    bboxArea: r2((Math.max(...xs) - Math.min(...xs)) * (Math.max(...zs) - Math.min(...zs))),
  }
}

export function sculptStrokes(events: SandtrayEvent[]): SculptStroke[] {
  return events
    .filter((e) => e.kind === "sculpt" && e.tool && e.tool !== "orbit" && e.tool !== "none")
    .map((e) => ({ t: e.t, tool: e.tool as SculptStroke["tool"], x: e.x ?? 0, z: e.z ?? 0, r: e.r ?? 0 }))
}

export function strokePhases(strokes: SculptStroke[], max = 12, lang: "zh" | "en" = "zh", view?: View) {
  const toolName = lang === "en"
    ? ({ dig: "dig", mound: "pile", smooth: "smooth" } as const)
    : ({ dig: "挖", mound: "堆", smooth: "抹平" } as const)
  const phases: { tool: string; fromSec: number; toSec: number; zone: string; count: number }[] = []
  for (const s of strokes) {
    const last = phases[phases.length - 1]
    const zone = ZONE_LABEL[lang][zoneOf(s.x, s.z, view)]
    if (last && last.tool === toolName[s.tool] && last.zone === zone && s.t / 1000 - last.toSec < 3) {
      last.toSec = +(s.t / 1000).toFixed(1)
      last.count++
    } else {
      phases.push({ tool: toolName[s.tool], fromSec: +(s.t / 1000).toFixed(1), toSec: +(s.t / 1000).toFixed(1), zone, count: 1 })
    }
  }
  if (phases.length <= max) return phases
  // 段数过多时只保留笔数最多的几段，仍按时间排序
  return [...phases].sort((a, b) => b.count - a.count).slice(0, max).sort((a, b) => a.fromSec - b.fromSec)
}

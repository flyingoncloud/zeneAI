import { create } from "zustand"
import type { PlacedFigure, SandtrayEvent, SandtrayEventKind, SandtrayLayout } from "@/types/sandtray"
import { isSculpt, type Tool } from "@/components/sandtray/terrain"
import { CAM_VIEW } from "@/components/sandtray/scene"
import type { View } from "@/lib/sandtray/zones"

// 撤销项：塑沙（保存整份高度场）或沙具增删改
type UndoStep =
  | { kind: "terrain"; heights: number[] }
  | { kind: "add"; figure: PlacedFigure }
  | { kind: "remove"; figure: PlacedFigure }
  | { kind: "transform"; id: string; before: Partial<PlacedFigure> }

const UNDO_LIMIT = 12

// 动作流水：高频动作按间隔抽样，其余全记；总量封顶，超出时只丢弃高频类
const EVENT_LIMIT = 3000
const THROTTLE: Partial<Record<SandtrayEventKind, number>> = { sculpt: 125, move: 250, scale: 300, rotate: 300, camera: 1000 }

type SandtrayState = {
  layout: SandtrayLayout
  selectedId: string | null
  draggingId: string | null
  tool: Tool
  brush: number
  strength: number
  undo: UndoStep[]
  // 当前镜头朝向，保存时用于把区域换算为用户视角
  view: View
  // 进入沙盘的时刻，动作流水时间以此为基准
  startedAt: number
  events: SandtrayEvent[]

  setTool: (tool: Tool) => void
  setBrush: (v: number) => void
  setStrength: (v: number) => void
  setDragging: (id: string | null) => void
  log: (kind: SandtrayEventKind, extra?: Omit<SandtrayEvent, "t" | "kind">) => void
  pushUndo: (step: UndoStep) => void
  popUndo: () => UndoStep | null
  clearUndo: () => void

  place: (figure: Omit<PlacedFigure, "order" | "placedAt">) => void
  update: (id: string, patch: Partial<PlacedFigure>) => void
  remove: (id: string) => void
  removeSilently: (id: string) => void
  restore: (figure: PlacedFigure) => void
  select: (id: string | null) => void
  reset: () => void
}

const empty = (): SandtrayLayout => ({ figures: [], updatedAt: Date.now() })

export const useSandtray = create<SandtrayState>((set, get) => ({
  layout: empty(),
  selectedId: null,
  draggingId: null,
  tool: "none",
  view: CAM_VIEW,
  brush: 2.2,
  strength: 1.0,
  undo: [],
  startedAt: Date.now(),
  events: [{ t: 0, kind: "enter" }],

  log: (kind, extra) =>
    set((s) => {
      const t = Date.now() - s.startedAt
      const gap = THROTTLE[kind]
      if (gap) {
        if (s.events.length >= EVENT_LIMIT) return s
        const last = [...s.events].reverse().find((e) => e.kind === kind)
        if (last && t - last.t < gap) return s
      } else if (s.events.length >= EVENT_LIMIT * 1.2) {
        return s
      }
      const round = (v?: number) => (typeof v === "number" ? +v.toFixed(2) : undefined)
      const event: SandtrayEvent = { t, kind }
      if (extra) {
        if (extra.id) event.id = extra.id
        if (extra.figureId) event.figureId = extra.figureId
        if (extra.tool) event.tool = extra.tool
        if (extra.x !== undefined) event.x = round(extra.x)
        if (extra.z !== undefined) event.z = round(extra.z)
        if (extra.r !== undefined) event.r = round(extra.r)
        if (extra.scale !== undefined) event.scale = round(extra.scale)
        if (extra.rotation !== undefined) event.rotation = round(extra.rotation)
        if (extra.ms !== undefined) event.ms = Math.round(extra.ms)
        if (extra.value) event.value = extra.value.slice(0, 40)
      }
      return { events: [...s.events, event] }
    }),

  setTool: (tool) => {
    get().log("tool", { tool })
    set({ tool, selectedId: null })
  },
  setBrush: (brush) => set({ brush }),
  setStrength: (strength) => set({ strength }),
  setDragging: (draggingId) => set({ draggingId }),
  pushUndo: (step) => set((s) => ({ undo: [...s.undo, step].slice(-UNDO_LIMIT) })),
  popUndo: () => {
    const { undo } = get()
    if (!undo.length) return null
    const step = undo[undo.length - 1]
    set({ undo: undo.slice(0, -1) })
    return step
  },
  clearUndo: () => set({ undo: [] }),

  place: (figure) => {
    set((s) => {
      const placed: PlacedFigure = { ...figure, order: s.layout.figures.length + 1, placedAt: Date.now() }
      return {
        layout: { ...s.layout, figures: [...s.layout.figures, placed], updatedAt: Date.now() },
        undo: [...s.undo, { kind: "add" as const, figure: placed }].slice(-UNDO_LIMIT),
      }
    })
    get().log("place", {
      id: figure.id,
      figureId: figure.figureId,
      x: figure.x,
      z: figure.z,
      rotation: figure.rotation,
      scale: figure.scale,
    })
  },
  update: (id, patch) => {
    const kind: SandtrayEventKind | null =
      patch.x !== undefined || patch.z !== undefined ? "move" : patch.scale !== undefined ? "scale" : patch.rotation !== undefined ? "rotate" : patch.lift !== undefined ? "lift" : null
    if (kind) get().log(kind, { id, x: patch.x, z: patch.z, scale: patch.scale, rotation: patch.rotation, lift: patch.lift })
    set((s) => ({
      layout: {
        ...s.layout,
        figures: s.layout.figures.map((f) => (f.id === id ? { ...f, ...patch } : f)),
        updatedAt: Date.now(),
      },
    }))
  },
  remove: (id) => {
    const figure = get().layout.figures.find((f) => f.id === id)
    // 沙具在场时长，计入行为数据
    if (figure) get().log("remove", { id, figureId: figure.figureId, ms: Date.now() - figure.placedAt })
    set((s) => ({
      layout: { ...s.layout, figures: s.layout.figures.filter((f) => f.id !== id), updatedAt: Date.now() },
      selectedId: s.selectedId === id ? null : s.selectedId,
      undo: figure ? [...s.undo, { kind: "remove" as const, figure }].slice(-UNDO_LIMIT) : s.undo,
    }))
  },
  // 撤销放置时使用：删除但不再压入撤销栈，避免在放下与删除之间来回切换
  removeSilently: (id) =>
    set((s) => ({
      layout: { ...s.layout, figures: s.layout.figures.filter((f) => f.id !== id), updatedAt: Date.now() },
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
  restore: (figure) =>
    set((s) => ({
      layout: { ...s.layout, figures: [...s.layout.figures, figure], updatedAt: Date.now() },
    })),
  // 选中沙具时退出塑沙工具，避免点沙具旁边时误挖
  select: (selectedId) => {
    if (selectedId && isSculpt(get().tool)) {
      get().log("tool", { tool: "none" })
      set({ selectedId, tool: "none" })
    } else set({ selectedId })
  },
  reset: () =>
    set({
      layout: empty(),
      selectedId: null,
      draggingId: null,
      undo: [],
      startedAt: Date.now(),
      events: [{ t: 0, kind: "enter" }],
    }),
}))

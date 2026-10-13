"use client"

import { useRef } from "react"
import { IconTrash } from "@/components/icons"
import { figureById, figureName } from "@/content/figures"
import { useCopy, useLang } from "@/components/layout/LangProvider"
import { useSandtray } from "@/stores/sandtray"
import { LIFT_MAX, LIFT_MIN } from "@/types/sandtray"

// 选中沙具后的控制条。滑条之外，画布上还支持直接拖动、滚轮和双指调整。
export function FigureControls() {
  const lang = useLang()
  const copy = useCopy()
  const selectedId = useSandtray((s) => s.selectedId)
  const figure = useSandtray((s) => s.layout.figures.find((f) => f.id === s.selectedId))
  const update = useSandtray((s) => s.update)
  const remove = useSandtray((s) => s.remove)
  const select = useSandtray((s) => s.select)
  // 拖滑条前记录一次快照，松手才算一步撤销
  const snap = useRef<{ scale: number; rotation: number; lift: number } | null>(null)
  const hold = () => {
    const f = useSandtray.getState().layout.figures.find((x) => x.id === useSandtray.getState().selectedId)
    if (f) snap.current = { scale: f.scale, rotation: f.rotation, lift: f.lift ?? 0 }
  }
  const commit = () => {
    const s = useSandtray.getState()
    if (snap.current && s.selectedId) s.pushUndo({ kind: "transform", id: s.selectedId, before: snap.current })
    snap.current = null
  }

  if (!selectedId || !figure) return null
  const meta = figureById.get(figure.figureId)
  const deg = Math.round(((figure.rotation * 180) / Math.PI + 360) % 360)
  const lift = figure.lift ?? 0

  return (
    <div className="border-t border-border bg-white px-4 pt-3 pb-2">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold">{meta ? figureName(meta, lang) : ""}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => remove(selectedId)}
            className="flex min-h-11 items-center gap-1 px-1 text-sm text-ink-muted lg:min-h-0 lg:text-xs"
          >
            <IconTrash className="w-3.5" />
            删除
          </button>
          <button type="button" onClick={() => select(null)} className="min-h-11 px-2 text-sm font-semibold text-brand-dark lg:min-h-0 lg:text-xs">
            完成
          </button>
        </div>
      </div>

      <label className="mb-1 flex items-center gap-3 text-sm text-ink-muted lg:text-xs">
        <span className="w-8 shrink-0">{copy.ui.size}</span>
        <input
          type="range"
          min={0.5}
          max={2.2}
          step={0.02}
          value={figure.scale}
          onPointerDown={hold}
          onChange={(e) => update(selectedId, { scale: +e.target.value })}
          onPointerUp={commit}
          className="sand-range flex-1"
        />
        <span className="w-9 shrink-0 text-right">{Math.round(figure.scale * 100)}%</span>
      </label>

      <label className="flex items-center gap-3 text-sm text-ink-muted lg:text-xs">
        <span className="w-8 shrink-0">{copy.ui.angle}</span>
        <input
          type="range"
          min={0}
          max={360}
          step={1}
          value={deg}
          onPointerDown={hold}
          onChange={(e) => update(selectedId, { rotation: (+e.target.value * Math.PI) / 180 })}
          onPointerUp={commit}
          className="sand-range flex-1"
        />
        <span className="w-9 shrink-0 text-right">{deg}°</span>
      </label>

      <label className="mt-1 flex items-center gap-3 text-sm text-ink-muted lg:text-xs">
        <span className="w-8 shrink-0">{copy.ui.height}</span>
        <input
          type="range"
          min={LIFT_MIN}
          max={LIFT_MAX}
          step={0.05}
          value={lift}
          onPointerDown={hold}
          onChange={(e) => { const v = +e.target.value; update(selectedId, { lift: Math.abs(v) < 0.05 ? 0 : v }) }}
          onPointerUp={commit}
          className="sand-range flex-1"
        />
        <span className="w-9 shrink-0 text-right">{Math.abs(lift) < 0.05 ? copy.ui.onGround : `${lift > 0 ? "+" : ""}${lift.toFixed(1)}`}</span>
      </label>
    </div>
  )
}

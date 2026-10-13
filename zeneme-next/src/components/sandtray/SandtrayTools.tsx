"use client"

import { useEffect, useRef, useState } from "react"
import { IconOrbit, IconMound, IconShovel } from "@/components/icons"
import { SoundToggle } from "@/components/layout/SoundToggle"
import { useCopy } from "@/components/layout/LangProvider"
import { useSandtray } from "@/stores/sandtray"
import { cn } from "@/lib/utils"
import { isSculpt, type Terrain, type Tool } from "./terrain"


function IconSmooth(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="2.8" y="14.2" width="18.4" height="3.4" rx="1.7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 14.2v-3.1M9.3 7.4h5.4a1.6 1.6 0 0 1 0 3.2H9.3a1.6 1.6 0 0 1 0-3.2z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function IconUndo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M3.6 8.4h10.2a5.6 5.6 0 0 1 0 11.2H8.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="7.6,4 3.2,8.4 7.6,12.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconReset(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M20.2 12a8.2 8.2 0 1 1-2.7-6.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <polyline points="20.4,3.6 20.4,9 15,9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const sculptTools = [
  { id: "dig", Icon: IconShovel },
  { id: "mound", Icon: IconMound },
  { id: "smooth", Icon: IconSmooth },
] as const

function IconChevron(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <g transform="translate(1 4) translate(9 6) rotate(90) translate(-9 -6) translate(3 -3)">
        <path d="M4.86525,4.5 L8.46163599,8.75802903 C8.57965274,8.89775785 8.57965274,9.10224215 8.46163599,9.24197097 L4.86525,13.5 L3.393,13.5 L7.19399827,9 L3.393,4.5 L4.86525,4.5 Z" />
      </g>
    </svg>
  )
}

export function SandtrayTools({ terrain }: { terrain: Terrain }) {
  const copy = useCopy()
  const tool = useSandtray((s) => s.tool)
  const setTool = useSandtray((s) => s.setTool)
  const brush = useSandtray((s) => s.brush)
  const strength = useSandtray((s) => s.strength)
  const canUndo = useSandtray((s) => s.undo.length > 0)
  const sculpting = isSculpt(tool)
  const [open, setOpen] = useState(false)
  const [hint, setHint] = useState<{ text: string; index: number; key: number } | null>(null)
  const hintTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const hintSeq = useRef(0)
  const say = (text: string, index: number) => {
    clearTimeout(hintTimer.current)
    hintSeq.current += 1
    setHint({ text, index, key: hintSeq.current })
    hintTimer.current = setTimeout(() => setHint(null), 1400)
  }
  useEffect(() => () => clearTimeout(hintTimer.current), [])

  const pick = (id: Exclude<Tool, "none">, index: number) => {
    if (tool === id) {
      setTool("none")
      say(id === "orbit" ? copy.ui.toolHints.locked : copy.ui.toolHints.off, index)
    } else {
      setTool(id)
      say(copy.ui.toolHints[id], index)
    }
  }

  const undo = () => {
    const s = useSandtray.getState()
    const step = s.popUndo()
    if (!step) return
    s.log("undo", { value: step.kind })
    if (step.kind === "terrain") terrain.setHeights(step.heights)
    else if (step.kind === "add") s.removeSilently(step.figure.id)
    else if (step.kind === "remove") s.restore(step.figure)
    else if (step.kind === "transform") s.update(step.id, step.before)
    say(copy.ui.toolHints.undo, 3)
  }

  const reset = () => {
    useSandtray.getState().log("reset")
    terrain.reset()
    useSandtray.getState().reset()
    say(copy.ui.toolHints.reset, 4)
  }

  // 触控目标手机 44px，桌面 36px
  const btn = "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] lg:size-9"
  const idle = "bg-white text-[#4c4c4c]"
  const on = "bg-brand text-white"
  const Current = tool === "none" ? null : tool === "orbit" ? IconOrbit : tool === "smooth" ? IconSmooth : tool === "dig" ? IconShovel : IconMound

  return (
    <>
      <div className="absolute top-3 left-3 z-6 flex flex-col gap-2.5 lg:top-4 lg:left-4 lg:gap-3">
        <button
          type="button"
          aria-label={open ? copy.ui.toolsClose : copy.ui.toolsOpen}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(btn, "lg:hidden", !open && Current ? on : idle)}
        >
          {!open && Current ? <Current className="w-6" /> : <IconChevron className={cn("w-5 transition-transform", open && "rotate-180")} />}
        </button>
        <div
          className={cn(
            "relative flex-col gap-2.5 [--tool-size:2.75rem] [--tool-step:3.375rem] lg:flex lg:gap-3 lg:[--tool-size:2.25rem] lg:[--tool-step:3rem]",
            open ? "flex" : "hidden",
          )}
        >
          {sculptTools.map(({ id, Icon }, i) => (
            <button
              key={id}
              type="button"
              aria-label={copy.ui.tools[id]}
              aria-pressed={tool === id}
              onClick={() => pick(id, i)}
              className={cn(btn, tool === id ? on : idle)}
            >
              <Icon className="w-6 lg:w-5" />
            </button>
          ))}
          <button
            type="button"
            aria-label={copy.ui.tools.undo}
            onClick={undo}
            disabled={!canUndo}
            className={cn(btn, idle, "disabled:opacity-40")}
          >
            <IconUndo className="w-6 lg:w-5" />
          </button>
          <button type="button" aria-label={copy.ui.tools.reset} onClick={reset} className={cn(btn, idle)}>
            <IconReset className="w-6 lg:w-5" />
          </button>
          <SoundToggle
            className={cn(btn, idle)}
            onToggle={(v) => say(v ? copy.ui.toolHints.soundOn : copy.ui.toolHints.soundOff, 5)}
          />
          <button
            type="button"
            aria-label={copy.ui.tools.orbit}
            aria-pressed={tool === "orbit"}
            onClick={() => pick("orbit", 6)}
            className={cn(btn, tool === "orbit" ? on : idle)}
          >
            <IconOrbit className="w-6 lg:w-5" />
          </button>
          {hint && (
            <span
              key={hint.key}
              className="pointer-events-none absolute left-full ml-2 animate-in fade-in whitespace-nowrap rounded-full bg-black/55 px-2.5 py-1 text-xs text-white slide-in-from-left-1 lg:ml-2.5"
              style={{ top: `calc(${hint.index} * (var(--tool-step)) + (var(--tool-size) - 1.5rem) / 2)` }}
            >
              {hint.text}
            </span>
          )}
        </div>
      </div>

      {sculpting && (
        <div className="absolute right-3 bottom-3 z-6 w-48 rounded-2xl bg-white/95 px-3 py-2 shadow-[0_2px_10px_rgba(0,0,0,0.10)] lg:right-4 lg:bottom-4 lg:w-44">
          <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <span className="shrink-0">{copy.ui.brush}</span>
            <input
              type="range"
              min={1}
              max={5}
              step={0.1}
              value={brush}
              onChange={(e) => useSandtray.getState().setBrush(+e.target.value)}
              className="sand-range flex-1"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <span className="shrink-0">{copy.ui.force}</span>
            <input
              type="range"
              min={0.4}
              max={2.2}
              step={0.1}
              value={strength}
              onChange={(e) => useSandtray.getState().setStrength(+e.target.value)}
              className="sand-range flex-1"
            />
          </label>
        </div>
      )}

    </>
  )
}

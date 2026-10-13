"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { BottomSheet, SheetTitle } from "@/components/layout/BottomSheet"
import { ambient, musicPanel } from "@/lib/audio/ambient"
import { ambientTracks } from "@/content/audio"
import { useCopy, useLang } from "@/components/layout/LangProvider"
import { cn } from "@/lib/utils"

// 服务端快照必须是同一个对象，每次新建会让 React 判定成一直在变
const SSR = { on: false, volume: 0.2, trackId: "", error: false }

function IconNote({ on, className }: { on: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 18V5.6l10-2.1V16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="6.6" cy="18" rx="2.6" ry="2.3" stroke="currentColor" strokeWidth="1.7" />
      <ellipse cx="16.6" cy="16" rx="2.6" ry="2.3" stroke="currentColor" strokeWidth="1.7" />
      {!on && <path d="M3.5 3.5l17 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />}
    </svg>
  )
}

function Equalizer({ className }: { className?: string }) {
  return (
    <span className={cn("flex h-4 items-end gap-[3px]", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span key={i} className="eq-bar w-[3px] rounded-full bg-current" style={{ animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  )
}

// 背景音乐入口，点开是选曲目的底部面板。
export function MusicButton({ className }: { className?: string }) {
  const copy = useCopy()
  const lang = useLang()
  const state = useSyncExternalStore((l) => ambient.subscribe(l), () => ambient.get(), () => SSR)
  const [open, setOpen] = useState(false)
  // 没有登记曲目时整个控件不渲染
  const [ready, setReady] = useState(false)
  // 其他地方（如小精灵提示）也可以打开这张面板
  useEffect(() => musicPanel.subscribe(() => setOpen(true)), [])

  useEffect(() => {
    let alive = true
    void ambient.ready().then((ok) => {
      if (!alive || !ok) return
      setReady(true)
      ambient.init()
    })
    return () => {
      alive = false
    }
  }, [])
  if (!ready) return null

  return (
    <>
      <button
        type="button"
        aria-label={copy.music.label}
        onClick={() => setOpen(true)}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
          state.on ? "bg-[#ecffef] text-brand" : "text-ink-muted",
          className,
        )}
      >
        <IconNote on={state.on} className="w-5" />
      </button>

      <BottomSheet open={open} onOpenChange={setOpen}>
        <div className="mb-4 flex items-center justify-between">
          <SheetTitle>{copy.music.title}</SheetTitle>
          <button
            type="button"
            role="switch"
            aria-checked={state.on}
            aria-label={copy.music.label}
            onClick={() => void ambient.toggle()}
            className={cn(
              "relative -mt-5 h-7 w-12 shrink-0 rounded-full transition-colors",
              state.on ? "bg-brand" : "bg-[#dfe3e0]",
            )}
          >
            <span
              className={cn(
                "absolute top-1 size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-all",
                state.on ? "left-6" : "left-1",
              )}
            />
          </button>
        </div>

        <div className="mb-6 flex flex-col gap-2">
          {ambientTracks.map((t) => {
            const playing = state.on && state.trackId === t.id
            const picked = state.trackId === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => void ambient.select(t.id)}
                aria-current={playing}
                className={cn(
                  "flex h-13 items-center gap-3 rounded-2xl border px-4 text-left transition-colors",
                  picked ? "border-brand bg-[#ecffef]" : "border-[#ececec] bg-white",
                )}
              >
                <IconNote on className={cn("w-[18px] shrink-0", picked ? "text-brand" : "text-[#c3c9c4]")} />
                <span className={cn("flex-1 text-[15px] font-medium", picked ? "text-brand-dark" : "text-black")}>
                  {lang === "en" ? t.nameEn : t.name}
                </span>
                {playing ? <Equalizer className="text-brand" /> : <span className="text-xs text-ink-muted">{t.length}</span>}
              </button>
            )
          })}
        </div>

        {state.error && <p className="mb-4 text-sm text-[#ff812f]">{copy.music.failed}</p>}

        <div className="mb-2 flex items-center gap-3">
          <span className="text-sm text-ink-muted">{copy.music.volume}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(state.volume * 100)}
            onChange={(e) => ambient.setVolume(Number(e.target.value) / 100)}
            aria-label={copy.music.volume}
            className="sand-range flex-1"
          />
        </div>
      </BottomSheet>
    </>
  )
}

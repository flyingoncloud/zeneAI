"use client"

import { useSyncExternalStore } from "react"
import { sfx } from "@/lib/audio/sfx"
import { useCopy } from "@/components/layout/LangProvider"

// 沙水声开关，默认关。声音只在用户挖沙或碰到水时响。
export function SoundToggle({ className, onToggle }: { className?: string; onToggle?: (on: boolean) => void }) {
  const copy = useCopy()
  const on = useSyncExternalStore(
    (l) => sfx.subscribe(l),
    () => sfx.get().on,
    () => true,
  )

  return (
    <button
      type="button"
      aria-label={copy.sandtray.sound}
      aria-pressed={on}
      onClick={() => {
        sfx.toggle()
        onToggle?.(sfx.get().on)
      }}
      className={className ?? "flex size-9 items-center justify-center rounded-full bg-white/80 text-ink-muted"}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-6 lg:w-5">
        <path
          d="M4 9.2h3.4L12 5.2v13.6l-4.6-4H4z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        {on ? (
          <>
            <path d="M15.4 9.6a3.4 3.4 0 0 1 0 4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M18 7a7 7 0 0 1 0 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          </>
        ) : (
          <path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        )}
      </svg>
    </button>
  )
}

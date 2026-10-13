"use client"

import { LANG_LABEL } from "@/content/copy"
import { useLang, useSetLang } from "@/components/layout/LangProvider"
import { cn } from "@/lib/utils"

// 只有两种语言，按钮上直接显示要切换到的那一种。
export function LangButton({ className }: { className?: string }) {
  const lang = useLang()
  const setLang = useSetLang()
  const next = lang === "zh" ? "en" : "zh"

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={lang === "zh" ? "Switch to English" : "切换到中文"}
      className={cn(
        "flex h-9 shrink-0 items-center justify-center rounded-full px-2.5 text-xs font-semibold text-ink-muted transition-colors",
        className,
      )}
    >
      {LANG_LABEL[next]}
    </button>
  )
}

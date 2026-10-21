"use client"

import { useCopy } from "@/components/layout/LangProvider"
import { cn } from "@/lib/utils"

// 回 ZeneWe 主站，地址可用 NEXT_PUBLIC_HOME_URL 覆盖
const HOME_URL = process.env.NEXT_PUBLIC_HOME_URL || "https://zenewe.ai"

export function HomeLink({ className }: { className?: string }) {
  const copy = useCopy()
  return (
    <a
      href={HOME_URL}
      className={cn(
        "flex h-9 shrink-0 items-center justify-center rounded-full px-2.5 text-xs font-semibold text-ink-muted transition-colors",
        className,
      )}
    >
      {copy.ui.home}
    </a>
  )
}

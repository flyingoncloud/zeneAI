"use client"

import { cn } from "@/lib/utils"

type PillTabsProps = {
  items: readonly string[]
  value: string
  onChange: (v: string) => void
  className?: string
}

// 历史记录的筛选标签与沙盘的场景切换共用一套样式
export function PillTabs({ items, value, onChange, className }: PillTabsProps) {
  return (
    <div className={cn("no-scrollbar flex items-center gap-2 overflow-x-auto px-3 pt-2 pb-3", className)}>
      {items.map((item) => {
        const active = item === value
        return (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-lg px-4 text-sm whitespace-nowrap transition-colors",
              active
                ? "h-9 bg-brand font-semibold text-white"
                : "h-8 bg-white text-brand-dark",
            )}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

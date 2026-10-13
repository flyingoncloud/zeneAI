import { cn } from "@/lib/utils"

const tones = {
  ok: "bg-tag-ok-bg text-tag-ok",
  warn: "bg-tag-warn-bg text-tag-warn",
  count: "bg-tag-count-bg text-tag-count",
  mute: "bg-tag-mute-bg text-ink-muted",
} as const

export function Tag({
  tone = "mute",
  children,
}: {
  tone?: keyof typeof tones
  children: React.ReactNode
}) {
  return (
    <span className={cn("rounded-lg px-1.5 text-[11px] leading-4", tones[tone])}>{children}</span>
  )
}

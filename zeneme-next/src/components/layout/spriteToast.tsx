"use client"

import { toast } from "sonner"
import { Sprite } from "@/components/sprite/Sprite"

// 沙盘里的提示都是小精灵在说话，不是系统报错。
// 用 toast.custom 自己排版：sonner 默认的 icon 槽会把图压到 16px。
// 报错（保存失败之类）仍然走 toast.error，那才是系统在说话。
export function spriteToast(message: string, opts?: { description?: string; duration?: number }) {
  return toast.custom(
    () => (
      <div className="flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[0_6px_24px_rgba(40,70,50,0.16)] ring-1 ring-[#e9efea]">
        <Sprite speech={message} className="w-12 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-[1.55] text-[#3b423e]">{message}</p>
          {opts?.description && <p className="mt-1 text-[12px] leading-5 text-ink-muted">{opts.description}</p>}
        </div>
      </div>
    ),
    { duration: opts?.duration },
  )
}

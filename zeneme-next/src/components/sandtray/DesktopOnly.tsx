"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Sprite } from "@/components/sprite/Sprite"
import { useCopy } from "@/components/layout/LangProvider"

// 手机上不开放沙盘（屏幕太小，摆放和塑沙都不好操作），由小精灵提示换电脑。
// 历史和报告不受影响。按画面宽度判断，与沙盘内判手机的口径一致（< 640px）。
const NARROW = "(max-width: 639px)"

export function DesktopOnly({ children }: { children: React.ReactNode }) {
  const copy = useCopy()
  // 量出宽度之前不渲染，避免手机上先建好 3D 场景再拆掉
  const [narrow, setNarrow] = useState<boolean | null>(null)
  useEffect(() => {
    const mq = window.matchMedia(NARROW)
    const on = () => setNarrow(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])

  if (narrow === null) return null
  if (!narrow) return <>{children}</>

  const t = copy.mobileGate
  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#dcf2df] to-surface px-6 pb-10">
      <Sprite speech={t.body} className="w-28" />
      <div className="mt-3 w-full max-w-sm rounded-3xl bg-white px-5 py-4 shadow-[0_6px_24px_rgba(40,70,50,0.12)]">
        <p className="text-base font-bold">{t.title}</p>
        <p className="mt-2 text-sm leading-6 text-[#5c5f6e]">{t.body}</p>
      </div>
      <Link
        href="/sandtray/history"
        className="mt-6 flex min-h-12 w-full max-w-sm items-center justify-center rounded-2xl bg-brand-dark text-base font-bold text-white"
      >
        {t.history}
      </Link>
      <Link href="/" className="mt-3 min-h-11 px-4 py-2 text-sm text-ink-muted">
        {t.home}
      </Link>
    </div>
  )
}

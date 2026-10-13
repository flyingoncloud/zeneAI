"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Img as Image } from "@/components/layout/Img"
import { MusicButton } from "@/components/layout/MusicButton"
import { LangButton } from "@/components/layout/LangButton"
import { useCopy } from "@/components/layout/LangProvider"
import { HistoryDrawer } from "@/components/history/HistoryDrawer"
import { SampleCard } from "@/components/report/SampleCard"
import { Sprite } from "@/components/sprite/Sprite"
import { cn } from "@/lib/utils"

// 同心圆色标按设计稿沿半径取色，大圈先画、小圈盖在上面
const ripples = [
  {
    size: 101,
    bg: "radial-gradient(circle closest-side, rgb(179,219,189) 0%, rgb(179,219,189) 73%, rgb(180,220,190) 78%, rgb(187,225,195) 83%, rgb(193,228,201) 88%, rgb(200,231,206) 93%, rgb(197,230,203) 100%)",
  },
  {
    size: 68,
    bg: "radial-gradient(circle closest-side, rgb(150,210,164) 0%, rgb(150,210,164) 71%, rgb(153,212,166) 77%, rgb(163,216,175) 82%, rgb(174,220,184) 87%, rgb(184,224,193) 92%, rgb(188,224,196) 100%)",
  },
  {
    size: 43,
    bg: "radial-gradient(circle closest-side, rgb(146,214,168) 0%, rgb(146,214,168) 65%, rgb(143,212,165) 71%, rgb(142,210,164) 78%, rgb(143,211,164) 84%, rgb(158,215,175) 90%, rgb(174,221,188) 100%)",
  },
  {
    size: 23,
    bg: "radial-gradient(circle closest-side, rgb(112,202,135) 0%, rgb(119,206,142) 16%, rgb(130,210,155) 31%, rgb(141,215,167) 47%, rgb(149,218,175) 62%, rgb(168,224,188) 78%, rgb(177,227,195) 100%)",
  },
]

type Step = {
  section: "ready" | "meditation"
  lead?: string
  text: string
  visual: "rings" | "intro"
}

export function StartFlow({ initial = 0, badge }: { initial?: number; badge?: React.ReactNode }) {
  const copy = useCopy()
  const router = useRouter()
  // 只有三段冥想，不含引导图与示例卡
  const steps: Step[] = [
    ...copy.meditation.steps.map((text, i): Step => ({ section: "meditation", lead: i === 0 ? copy.sprite.hello : undefined, text, visual: "rings" })),
  ]

  // 兼容 ?step=meditation，第 1 页就是冥想
  const [index, setIndex] = useState(Math.min(Math.max(0, initial - 1), steps.length - 1))
  const [declined, setDeclined] = useState(false)
  const step = steps[index]
  const last = index === steps.length - 1
  const leaving = useRef(false)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const [bubbleH, setBubbleH] = useState(0)
  // 首帧前量好气泡高度，否则内容会先排在顶部再往下跳
  useLayoutEffect(() => {
    const el = bubbleRef.current
    if (!el) return
    setBubbleH(el.offsetHeight)
    const ro = new ResizeObserver(() => setBubbleH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const enter = useCallback(() => {
    if (leaving.current) return
    leaving.current = true
    router.push("/sandtray")
  }, [router])

  const go = useCallback(
    (delta: number) => {
      setDeclined(false)
      if (delta > 0 && last) return enter()
      setIndex((i) => Math.min(steps.length - 1, Math.max(0, i + delta)))
    },
    [enter, last, steps.length],
  )

  // 左右划 / 左右方向键前后翻，划够距离当场就翻，不等松手
  const swipe = useRef<{ x: number; y: number } | null>(null)
  const onSwipeMove = (e: React.PointerEvent) => {
    const s0 = swipe.current
    if (!s0) return
    const dx = e.clientX - s0.x
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(e.clientY - s0.y) * 1.2) return
    swipe.current = null
    go(dx < 0 ? 1 : -1)
  }
  // 点屏幕任意空白处也算「继续」；按钮、弹层里的点击和划动不算
  const tap = useRef<{ x: number; y: number } | null>(null)
  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const t = e.target as Element
    const t0 = tap.current
    if (!e.currentTarget.contains(t) || t.closest("button, a, input") || !t0) return
    if (Math.hypot(e.clientX - t0.x, e.clientY - t0.y) > 10) return
    go(1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go])

  const lead = declined ? undefined : step.lead
  const text = declined ? copy.prepare.exitReply : step.text
  const primary =
    step.section === "ready" ? copy.prepare.start : last ? copy.meditation.start : copy.meditation.next

  return (
    <div
      className="sandtray-root relative h-dvh w-full touch-pan-y overflow-hidden select-none bg-[linear-gradient(to_bottom,#ddf3dd_0%,#c8e8ce_45%,#d1eed4_100%)]"
      onPointerDown={(e) => {
        swipe.current = { x: e.clientX, y: e.clientY }
        tap.current = { x: e.clientX, y: e.clientY }
      }}
      onClick={onTap}
      onPointerMove={onSwipeMove}
      onPointerUp={() => { swipe.current = null }}
      onPointerCancel={() => { swipe.current = null }}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col px-6 md:max-w-[520px]">
        <header className="relative z-10 flex h-11 shrink-0 items-center justify-between">
          <span />
          <div className="flex h-9 items-center gap-2">
            <MusicButton className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]" />
            <LangButton className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]" />
            <HistoryDrawer className="flex h-9 items-center rounded-full bg-white px-3.5 text-sm font-semibold text-brand-dark shadow-[0_2px_8px_rgba(0,0,0,0.06)]" />
            {badge}
          </div>
        </header>

        <div className="relative min-h-0 flex-1">
          {step.visual === "rings" && (
            <div className="pointer-events-none absolute inset-0">
              {ripples.map((r) => (
                <div
                  key={r.size}
                  className={cn("absolute top-[56%] left-1/2 aspect-square -translate-1/2 rounded-full", step.section === "meditation" && "breathe")}
                  style={{ width: `${r.size}%`, background: r.bg }}
                />
              ))}
            </div>
          )}
          {step.visual === "intro" && (
            // 顶上按气泡的实际高度留空，气泡是浮层，盖不到这里
            <div
              className={cn("absolute inset-0 flex flex-col items-center gap-3 overflow-y-auto pb-2", !bubbleH && "invisible")}
              style={{ paddingTop: bubbleH + 12 }}
            >
              <Image
                src="/design/onboarding/what-tray.webp"
                alt=""
                width={1362}
                height={821}
                priority
                className="w-[88%] shrink-0"
              />
              <div className="w-full">
                <SampleCard />
              </div>
            </div>
          )}

          {/* 小精灵坐在气泡上沿，两者一起浮在最上层 */}
          <div ref={bubbleRef} className="pointer-events-none absolute inset-x-0 top-0 z-10">
            <Sprite speech={`${index}-${declined}-${text}`} className="relative z-1 ml-[5%] w-[19%] md:w-[16%]" />
            <div
              key={`${index}-${declined}`}
              className="animate-in rounded-[20px] bg-white px-4 py-3 shadow-[0_6px_20px_rgba(70,110,80,0.08)] duration-500 fade-in slide-in-from-bottom-1"
            >
              {lead && <p className="relative mb-1.5 text-[15px] leading-[1.6] font-semibold text-[#2f6b45]">{lead}</p>}
              <p className="relative text-[14px] leading-[1.7] text-[#2b2b2b]">{text}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => go(1)}
            className="flex h-12 w-full items-center justify-center rounded-3xl bg-white text-lg font-semibold text-brand shadow-[0_6px_20px_rgba(70,110,80,0.12)]"
          >
            {primary}
          </button>
          <button
            type="button"
            onClick={step.section === "ready" ? () => setDeclined(true) : enter}
            className="mt-1 flex h-9 w-full items-center justify-center text-sm text-[#4f6b58]"
          >
            {step.section === "ready" ? copy.prepare.exit : copy.onboarding.skip}
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { Img as Image } from "@/components/layout/Img"
import { Sprite } from "@/components/sprite/Sprite"
import { useCopy } from "@/components/layout/LangProvider"

// 示例觉察卡，与报告页的真卡同一套视觉
// （渐变描边 + 四角切线 + NO. 编号 + 小精灵徽标），只是内容更短。
export function SampleCard() {
  const copy = useCopy()
  const sample = copy.onboarding.cards[1].sample!
  return (
    <div>
      <div className="rounded-[22px] bg-[linear-gradient(160deg,#a8dab5,#eef5ef_45%,#ded3ff_100%)] p-[1.5px] shadow-[0_10px_28px_rgba(40,70,50,0.12)]">
        <div className="relative overflow-hidden rounded-[21px] bg-[linear-gradient(180deg,#fdfefd,#f4f8f4)] px-4 pt-3 pb-3.5">
          <Image
            src="/design/cloud.png"
            alt=""
            width={307}
            height={300}
            className="pointer-events-none absolute -top-14 -right-14 w-[190px] opacity-[0.13]"
          />
          <span className="pointer-events-none absolute top-2 left-2 size-3.5 border-t border-l border-[#cfe0d4]" />
          <span className="pointer-events-none absolute top-2 right-2 size-3.5 border-t border-r border-[#cfe0d4]" />
          <span className="pointer-events-none absolute bottom-2 left-2 size-3.5 border-b border-l border-[#cfe0d4]" />
          <span className="pointer-events-none absolute right-2 bottom-2 size-3.5 border-r border-b border-[#cfe0d4]" />

          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sprite small className="w-7" />
                <span className="text-[15px] font-bold text-brand-dark">{sample.badge}</span>
              </div>
              <span className="font-mono text-xs font-semibold tracking-[0.14em] text-[#7f9487]">NO.{sample.no}</span>
            </div>

            <h3 className="mt-1.5 text-[22px] leading-tight font-bold tracking-tight text-[#14502c] md:text-[26px]">
              {sample.title}
            </h3>
            <p className="mt-1 text-[13px] leading-[1.55] text-[#4d5852] md:text-sm">{sample.line}</p>

            <p className="mt-3 text-[11px] tracking-wide text-[#9aa79e]">{sample.skillsLabel}</p>
            <ul className="mt-1.5 space-y-1.5">
              {sample.skills.map((s) => (
                <li
                  key={s}
                  className="flex items-center gap-2 rounded-xl bg-[#f2f9f3] px-3 py-1.5 text-[12px] text-[#2f4a39] ring-1 ring-[#e2efe5]"
                >
                  <span className="size-1.5 shrink-0 rounded-full bg-brand" />
                  {s}
                </li>
              ))}
            </ul>

            <p className="mt-2.5 border-t border-dashed border-[#e2e9e4] pt-2.5 text-[11px] text-[#9aa79e]">{sample.foot}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

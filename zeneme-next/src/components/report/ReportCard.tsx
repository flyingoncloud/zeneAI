"use client"

import { Img as Image } from "@/components/layout/Img"
import { Sprite } from "@/components/sprite/Sprite"
import { useCopy } from "@/components/layout/LangProvider"
import { cn } from "@/lib/utils"
import type { Report } from "@/types/sandtray"

// 卡牌编号：按记录 id 稳定地取三位数，只是卡面上的装饰
function cardNo(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997
  return String(h % 999 + 1).padStart(3, "0")
}

// 模型偶尔会在句尾带出半个括号之类的 JSON 残渣，显示前去掉
const clean = (v: string) => v.replace(/[{}[\]]/g, "").trim()

export function ReportCard({ report, snapshotUrl, seed, name }: { report: Report; snapshotUrl?: string; seed: string; name?: string }) {
  const copy = useCopy()
  // 没起名时用的是默认名，不显示
  const title = name && !name.startsWith(copy.save.defaultName) ? name : ""
  const label = "text-[13px] font-semibold text-brand-dark"
  const body = "mt-1 text-[13px] leading-[1.75] text-[#4d5852]"

  return (
    // 外层做渐变描边，内层是卡面
    <article className="mx-auto w-full max-w-[440px] rounded-[26px] lg:max-w-[900px] bg-[linear-gradient(160deg,#a8dab5,#eef5ef_45%,#ded3ff_100%)] p-[1.5px] shadow-[0_14px_40px_rgba(40,70,50,0.13)]">
      <div className="relative overflow-hidden rounded-[25px] bg-[linear-gradient(180deg,#fdfefd,#f4f8f4)] px-5 pt-4 pb-5">
        {/* 卡面纹样，和其他页面的角落纹样同一张图，压到很淡 */}
        <Image
          src="/design/cloud.png"
          alt=""
          width={307}
          height={300}
          className="pointer-events-none absolute -top-16 -right-16 w-[240px] opacity-[0.13]"
        />
        <span className="pointer-events-none absolute top-2.5 left-2.5 size-4 border-t border-l border-[#cfe0d4]" />
        <span className="pointer-events-none absolute top-2.5 right-2.5 size-4 border-t border-r border-[#cfe0d4]" />
        <span className="pointer-events-none absolute bottom-2.5 left-2.5 size-4 border-b border-l border-[#cfe0d4]" />
        <span className="pointer-events-none absolute right-2.5 bottom-2.5 size-4 border-r border-b border-[#cfe0d4]" />

        <div className="relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sprite small className="w-8 lg:w-9" />
              <span className="text-base font-bold text-brand-dark lg:text-lg">{copy.report.badge}</span>
            </div>
            <div className="text-right leading-tight">
              <p className="font-mono text-sm font-semibold tracking-[0.14em] text-[#7f9487] lg:text-base">NO.{cardNo(seed)}</p>
              <p className="mt-0.5 text-[11px] text-[#9aa79e]">{new Date(report.generatedAt).toLocaleDateString("zh-CN")}</p>
            </div>
          </div>

          {/* 用户起了名字时名字做主标题，生成的称号并入副标题 */}
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-[24px] leading-tight font-bold tracking-tight text-[#14502c] lg:text-[28px]">{title || report.title}</h2>
            <p className="text-[14px] text-[#5d7a68] lg:text-[16px]">{title ? `${report.title} · ${report.subtitle}` : report.subtitle}</p>
          </div>

          <div className="lg:mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6">
          <div>
          <div className="mt-3 aspect-16/10 w-full overflow-hidden rounded-2xl bg-linear-to-b from-[#f5f7f9] to-[#eef1ee] ring-1 ring-[#e3ebe5] ring-inset">
            {snapshotUrl && (
              <Image src={snapshotUrl} alt="" width={640} height={480} unoptimized className="size-full object-cover" />
            )}
          </div>
          </div>

          <div className="mt-3.5 lg:mt-3">
            <p className={label}>{copy.report.seen}</p>
            <p className={body}>{clean(report.summary)}</p>

            {report.meaning ? (
              <>
                <p className={cn(label, "mt-3.5")}>{copy.report.meaning}</p>
                <p className={body}>{clean(report.meaning)}</p>
              </>
            ) : (
              report.sections?.map((sec) => (
                <div key={sec.title} className="mt-3.5">
                  <p className={label}>{clean(sec.title)}</p>
                  <p className={body}>{clean(sec.body)}</p>
                </div>
              ))
            )}

            {(report.nextSteps ?? report.actions ?? []).length > 0 && (
              <>
                {report.nextSteps && <p className={cn(label, "mt-3.5")}>{copy.report.next}</p>}
                <ul className="mt-2 space-y-1.5">
                  {(report.nextSteps ?? report.actions ?? []).slice(0, 3).map((a) => (
                    <li
                      key={a}
                      className="flex items-start gap-2 rounded-xl bg-[#f2f9f3] px-3 py-2 text-[13px] leading-[1.6] text-[#2f4a39] ring-1 ring-[#e2efe5]"
                    >
                      <span className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-brand" />
                      {clean(a)}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          </div>

          <div className="mt-3.5 flex items-center justify-end border-t border-dashed border-[#e2e9e4] pt-3 text-[11px] text-[#9aa79e]">
            <span>{copy.report.observation.note}</span>
          </div>
        </div>
      </div>
    </article>
  )
}

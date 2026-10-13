"use client"

import { useState } from "react"
import { Img as Image } from "@/components/layout/Img"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { IconArrowRight, IconEdit, IconHeart, IconTrash } from "@/components/icons"
import { toast } from "sonner"
import { PillTabs } from "@/components/layout/PillTabs"
import { Tag } from "@/components/layout/Tag"
import { useCopy } from "@/components/layout/LangProvider"
import { api } from "@/lib/sandtrayApi"
import type { Copy } from "@/content/copy"
import type { SandtrayRecord } from "@/types/sandtray"

const statusTone = { analyzed: "ok", pending: "warn", draft: "mute" } as const

// 每一条的主操作：草稿回沙盘接着摆，其余去报告（已分析=看，未分析=发起分析）
const main = (r: SandtrayRecord) =>
  r.status === "draft" ? `/sandtray?record=${r.id}` : `/sandtray/report/${r.id}`
const mainLabel = (r: SandtrayRecord, copy: Copy) =>
  r.status === "draft"
    ? copy.history.actions.resume
    : r.status === "analyzed"
      ? copy.history.actions.viewShort
      : copy.history.actions.analyzeShort

// 按下标筛选，不比较标签文字，否则切换语言后就对不上
const FILTERS = ["all", "analyzed", "pending", "favorite", "draft"] as const
type Filter = (typeof FILTERS)[number]

function match(record: SandtrayRecord, filter: Filter) {
  if (filter === "all") return true
  if (filter === "favorite") return record.favorite
  if (filter === "analyzed") return record.status === "analyzed"
  if (filter === "pending") return record.status === "pending"
  return record.status === "draft"
}

// 抽屉里是客户端取数，传 onChanged 刷新；整页时走 router.refresh
export function HistoryList({ records, onChanged, onNavigate }: { records: SandtrayRecord[]; onChanged?: () => void; onNavigate?: () => void }) {
  const router = useRouter()
  const refresh = () => (onChanged ? onChanged() : router.refresh())
  const copy = useCopy()
  const [filter, setFilter] = useState<Filter>("all")
  const [hidden, setHidden] = useState<string[]>([])
  const list = records.filter((r) => match(r, filter) && !hidden.includes(r.id))

  const toggleFavorite = async (r: SandtrayRecord) => {
    try {
      await api.updateRecord(r.id, { favorite: !r.favorite })
      refresh()
    } catch {
      toast.error(copy.history.failed)
    }
  }

  // 删除不弹确认：先本地隐藏，5 秒内可撤销，超时才真正删除
  const remove = (r: SandtrayRecord) => {
    setHidden((h) => [...h, r.id])
    const timer = setTimeout(async () => {
      try {
        await api.removeRecord(r.id)
        refresh()
      } catch {
        toast.error(copy.history.failed)
        setHidden((h) => h.filter((id) => id !== r.id))
      }
    }, 5000)
    toast(copy.history.removed, {
      action: {
        label: copy.history.undo,
        onClick: () => {
          clearTimeout(timer)
          setHidden((h) => h.filter((id) => id !== r.id))
        },
      },
    })
  }

  return (
    <>
      <div className="@container mx-auto w-full max-w-[1240px] @3xl:px-6 @3xl:pt-4">
        <PillTabs
          items={copy.history.filters}
          value={copy.history.filters[FILTERS.indexOf(filter)]}
          onChange={(v) => setFilter(FILTERS[copy.history.filters.indexOf(v)] ?? "all")}
          className="pb-2"
        />
      </div>
      {list.length === 0 ? (
        <p className="py-32 text-center text-sm text-ink-muted">{copy.history.empty}</p>
      ) : (
        <div className="@container mx-auto grid w-full max-w-[1240px] gap-3 p-3 pt-2 @3xl:grid-cols-2 @3xl:gap-4 @3xl:p-8 @6xl:grid-cols-3">
          {list.map((r) => (
            <article
              key={r.id}
              className="group relative flex min-h-[116px] gap-3 rounded-2xl bg-white p-2 transition-shadow hover:shadow-[0_4px_16px_rgba(40,70,50,0.08)]"
            >
              {/* 整张卡可点，触发主操作（草稿是回沙盘接着摆）；
                  卡上的小按钮靠 z 层级盖在这层透明链接之上，互不误触 */}
              <Link
                href={main(r)}
                onClick={onNavigate}
                aria-label={`${r.name}：${mainLabel(r, copy)}`}
                className="absolute inset-0 z-0 rounded-2xl"
              />
              <div className="pointer-events-none size-25 shrink-0 overflow-hidden rounded-xl bg-linear-to-b from-[#f5f7f9] to-[#f0f2f3]">
                {r.snapshotUrl && (
                  <Image
                    src={r.snapshotUrl}
                    alt=""
                    width={100}
                    height={100}
                    unoptimized
                    className="size-full object-cover"
                  />
                )}
              </div>

              <div className="pointer-events-none flex flex-1 flex-col pt-1">
                <h2 className="mb-1.5 text-base font-semibold text-black">{r.name}</h2>
                <div className="mb-3.5 flex gap-1.5">
                  <Tag tone={statusTone[r.status]}>{copy.history.status[r.status]}</Tag>
                  <Tag tone="count">{copy.ui.figureCount(r.layout.figures.length)}</Tag>
                </div>
                <div className="pointer-events-auto relative z-10 flex items-center gap-3">
                  <Link
                    href={`/sandtray?record=${r.id}`}
                    onClick={onNavigate}
                    aria-label={copy.history.actions.edit}
                    className="flex size-7 items-center justify-center rounded-full border border-[#eee] bg-white"
                  >
                    <IconEdit className="w-4 text-[#666]" />
                  </Link>
                  <button
                    type="button"
                    aria-label={copy.history.actions.remove}
                    onClick={() => remove(r)}
                    className="flex size-7 items-center justify-center rounded-full border border-[#eee] bg-white"
                  >
                    <IconTrash className="w-3.5 text-[#666]" />
                  </button>
                  <Link
                    href={main(r)}
                    onClick={onNavigate}
                    className="ml-auto flex h-7 items-center gap-1 rounded-full bg-[#ecffef] px-3.5 text-xs font-semibold text-brand"
                  >
                    {mainLabel(r, copy)}
                    <IconArrowRight className="w-2.5" />
                  </Link>
                </div>
              </div>

              <button
                type="button"
                aria-label={copy.history.filters[3]}
                onClick={() => toggleFavorite(r)}
                className="absolute top-3.5 right-3 z-10"
              >
                <IconHeart filled={r.favorite} className={r.favorite ? "w-5 text-purple" : "w-5 text-[#dcdcdc]"} />
              </button>
            </article>
          ))}
        </div>
      )}
    </>
  )
}

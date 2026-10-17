"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Sprite } from "@/components/sprite/Sprite"
import { Img as Image } from "@/components/layout/Img"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Screen } from "@/components/layout/Screen"
import { preloadSand, sfx } from "@/lib/audio/sfx"
import { spriteToast } from "@/components/layout/spriteToast"
import { BottomSheet, SheetTitle } from "@/components/layout/BottomSheet"
import { PrimaryButton, SecondaryButton } from "@/components/layout/Buttons"
import { useGLTF } from "@react-three/drei"
import { SandtrayStage, type TerrainHandle } from "@/components/sandtray/SandtrayStage"
import { isSculpt } from "@/components/sandtray/terrain"
import { CAM_VIEW } from "@/components/sandtray/scene"
import { FigureControls } from "@/components/sandtray/FigureControls"
import { HistoryDrawer } from "@/components/history/HistoryDrawer"
import { useCopy, useLang } from "@/components/layout/LangProvider"
import { figureById, figureName, figures, FIGURE_CATEGORIES } from "@/content/figures"
import { api } from "@/lib/sandtrayApi"
import { navDepth } from "@/lib/nav"
import { behaviourStats, figureZones, spreadStats } from "@/lib/sandtray/stats"
import { ambient, musicPanel } from "@/lib/audio/ambient"
import { useSandtray } from "@/stores/sandtray"
import { cn } from "@/lib/utils"
import type { ExploreDirection, SandtrayRecord } from "@/types/sandtray"
import { withBase } from "@/lib/base-path"

export function SandtrayEditor({ initial }: { initial?: SandtrayRecord | null }) {
  const copy = useCopy()
  const router = useRouter()
  const captureRef = useRef<(() => string) | null>(null)
  const placeRef = useRef<((clientX: number, clientY: number) => boolean) | null>(null)
  const terrainRef = useRef<TerrainHandle | null>(null)
  // 进入页面时用这一盘的内容初始化 store，只执行一次
  useState(() => {
    if (initial) useSandtray.setState({ layout: initial.layout, selectedId: null, undo: [], tool: "none", view: CAM_VIEW })
    else {
      useSandtray.getState().reset()
      useSandtray.setState({ tool: "none", view: CAM_VIEW })
    }
  })
  const lang = useLang()
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [activeFigure, setActiveFigure] = useState<string | null>(null)
  // 收尾两步（设计稿「沙盘_保存」「沙盘_选择方向」）：起名，然后选方向
  const [leaving, setLeaving] = useState(false)
  const [naming, setNaming] = useState(false)
  const [choosing, setChoosing] = useState(false)
  const [name, setName] = useState(initial?.name ?? "")
  const [story, setStory] = useState(initial?.story ?? "")
  const [direction, setDirection] = useState<ExploreDirection>(initial?.direction ?? "self")
  const [busy, setBusy] = useState(false)
  const [recordId, setRecordId] = useState<string | null>(initial?.id ?? null)
  // 沙具名字默认隐藏，避免文字影响凭直觉选择
  const [showNames, setShowNames] = useState(false)

  // 轻点卡片为选中，按住拖入沙盘则放到松手处
  const dragCard = useRef(false)
  // 拿起沙具时退出塑沙工具
  useEffect(() => {
    if (activeFigure && isSculpt(useSandtray.getState().tool)) useSandtray.getState().setTool("none")
  }, [activeFigure])
  const onCardPointerDown = (id: string, wasActive: boolean) => (e: React.PointerEvent) => {
    // 按下即开始预加载模型
    const glb = figureById.get(id)?.glb
    if (glb) useGLTF.preload(withBase(glb), withBase("/draco/"))
    dragCard.current = false
    const start = { x: e.clientX, y: e.clientY }
    const move = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > (ev.pointerType === "mouse" ? 8 : 12)) {
        dragCard.current = true
        if (useSandtray.getState().events.at(-1)?.figureId !== id) useSandtray.getState().log("pick", { figureId: id })
        setActiveFigure(id)
      }
    }
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", up)
      if (!dragCard.current) {
        useSandtray.getState().log(wasActive ? "unpick" : "pick", { figureId: id })
        setActiveFigure(wasActive ? null : id)
        if (!wasActive) spriteToast(copy.sandtray.placeHint, { duration: 2200 })
      }
      else if (placeRef.current?.(ev.clientX, ev.clientY)) setActiveFigure(null)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", up)
  }

  // 自动保存：放下第一个沙具后定时存草稿。
  // 快照导出开销大，不在这里拍，只在完成创作时拍。
  const savingRef = useRef(false)
  const lastSculpt = useRef(-1)
  const heightCache = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (naming || choosing) return
    const tick = async () => {
      const s = useSandtray.getState()
      if (savingRef.current || !s.layout.figures.length) return
      savingRef.current = true
      try {
        // 草稿同时保存地形。
        // 地形未变时沿用上次压缩的结果
        const sculptN = s.events.filter((e) => e.kind === "sculpt" || e.kind === "reset" || e.kind === "undo").length
        if (sculptN !== lastSculpt.current) {
          const encoded = await terrainRef.current?.encode()
          heightCache.current = encoded
          lastSculpt.current = sculptN
        }
        const heightField = heightCache.current ?? s.layout.heightField
        const body = { layout: { ...s.layout, heightField, view: s.view }, status: "draft" as const }
        const { record } = recordId
          ? await api.updateRecord(recordId, body)
          : await api.createRecord({ ...body, name: initial?.name })
        setRecordId(record.id)
      } catch {
        // 自动保存失败时静默，下一轮重试
      } finally {
        savingRef.current = false
      }
    }
    const timer = setInterval(tick, 15_000)
    return () => clearInterval(timer)
  }, [naming, choosing, recordId, initial?.name])

  // 无操作陪伴：30 秒底部淡出一句提示，60 秒中央出卡片给三个选择。
  // 全程不发声，避免打断来访者。
  const [idle, setIdle] = useState<0 | 1 | 2>(0)
  useEffect(() => {
    if (naming || choosing) return
    let soft: ReturnType<typeof setTimeout>
    let card: ReturnType<typeof setTimeout>
    const arm = () => {
      clearTimeout(soft)
      clearTimeout(card)
      soft = setTimeout(() => setIdle(1), 30_000)
      card = setTimeout(() => setIdle(2), 60_000)
    }
    arm()
    // 动作流水有新条目即重新计时
    const unsub = useSandtray.subscribe((now, prev) => {
      if (now.events.length !== prev.events.length) {
        setIdle(0)
        arm()
      }
    })
    return () => {
      clearTimeout(soft)
      clearTimeout(card)
      unsub()
    }
  }, [naming, choosing])
  // 底部提示 5 秒后消失
  useEffect(() => {
    if (idle !== 1) return
    const t = setTimeout(() => setIdle(0), 5000)
    return () => clearTimeout(t)
  }, [idle])

  // 切走或息屏也记录：回来时把离开时长写进流水
  useEffect(() => {
    let leftAt = 0
    const onVis = () => {
      const log = useSandtray.getState().log
      if (document.hidden) {
        leftAt = Date.now()
        log("away")
        sfx.suspend()
      } else if (leftAt) {
        log("back", { ms: Date.now() - leftAt })
        leftAt = 0
      }
    }
    // 预加载沙声音频（约 80KB）
    void preloadSand()
    document.addEventListener("visibilitychange", onVis)
    return () => {
      document.removeEventListener("visibilitychange", onVis)
      // 离开沙盘时停止沙声
      sfx.suspend()
    }
  }, [])

  const layout = useSandtray((s) => s.layout)
  const tool = useSandtray((s) => s.tool)
  const list = useMemo(
    () => figures.filter((f) => f.category === FIGURE_CATEGORIES[categoryIndex]),
    [categoryIndex],
  )

  // 完成创作：起名保存，选方向，然后生成 AI 分析或稍后再分析
  // leave=true（顶栏返回后选「离开」）：存完回到进入沙盘前的页面；其余情况回首页。
  // 不能一律 push，否则后退会回到沙盘，形成循环
  const finish = async (analyze: boolean, leave = false) => {
    setBusy(true)
    try {
      const snapshot = captureRef.current?.()
      const s = useSandtray.getState()
      // 地形未动时 encode 返回空，沿用打开记录时带入的地形，避免覆盖原沙面
      const heightField = (await terrainRef.current?.encode()) ?? s.layout.heightField
      const view = s.view
      const sculpt = terrainRef.current?.stats(view)
      s.log("save")
      const events = useSandtray.getState().events
      const durationMs = Date.now() - s.startedAt
      // 记录内容：沙具与五区分布、挖堆面积与区域、全过程动作流水与节奏
      const withTerrain = {
        ...layout,
        heightField,
        view,
        events,
        stats: sculpt && {
          figureCount: layout.figures.length,
          figureZones: figureZones(layout.figures, view),
          ...sculpt,
          strokeCount: events.filter((e) => e.kind === "sculpt").length,
          durationMs,
          ...behaviourStats(events, durationMs),
          spread: spreadStats(layout.figures),
        },
      }

      const body = {
        name: name.trim() || undefined,
        story: story.trim() || undefined,
        layout: withTerrain,
        direction,
      }
      const { record } = recordId
        ? await api.updateRecord(recordId, { ...body, snapshotUrl: snapshot })
        : await api.createRecord({ ...body, snapshot })
      setRecordId(record.id)

      if (analyze) {
        await api.analyze(record.id)
        router.push(`/sandtray/report/${record.id}`)
      } else {
        spriteToast("已存进心灵花园", { duration: 1600 })
        if (leave && navDepth() > 0) router.back()
        else router.replace("/")
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "保存失败")
      setBusy(false)
    }
  }

  return (
    <Screen
      title={copy.sandtray.title}
      // 摆过沙具后返回时先确认，避免误操作丢失
      back={layout.figures.length ? undefined : "/"}
      onBack={layout.figures.length ? () => setLeaving(true) : undefined}
      action={
        <div className="flex items-center gap-3">
          <HistoryDrawer className="flex h-9 items-center rounded-full bg-white px-3.5 text-sm font-semibold text-brand-dark ring-1 ring-border" />
          {/* 摆放沙具后「完成创作」变为实心按钮并闪两下提示；之前仅显示文字 */}
          <button
            type="button"
            onClick={() => {
              if (!layout.figures.length) return spriteToast(copy.sandtray.empty)
              setNaming(true)
            }}
            className={cn(
              "flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors md:text-base",
              layout.figures.length ? "done-nudge bg-brand-dark text-white" : "text-ink-muted",
            )}
          >
            {copy.sandtray.done}
          </button>
        </div>
      }
      headerClassName="bg-white"

      className="flex flex-col overflow-hidden md:flex-row"
    >
      <div className="relative mx-3 min-h-0 flex-1 overflow-hidden rounded-2xl bg-white md:my-4 md:ml-4 md:mr-4">
        <SandtrayStage
          activeFigureId={activeFigure}
          captureRef={captureRef}
          placeRef={placeRef}
          onPlaced={() => setActiveFigure(null)}
          terrainRef={terrainRef}
          heightField={initial?.layout.heightField}
        />

        {/* 不提示数量，由用户决定何时结束 */}
        {!isSculpt(tool) && layout.figures.length === 0 && (
          <p className="pointer-events-none absolute inset-x-0 bottom-5 flex items-center justify-center gap-2 px-8 text-center text-sm text-[#5b5f58]">
            {copy.sandtray.empty}
            {/* 箭头指向沙具库：宽屏在右，窄屏在下 */}
            <span aria-hidden className="hint-nudge hidden text-base text-brand-dark md:inline">→</span>
            <span aria-hidden className="hint-nudge-down text-base text-brand-dark md:hidden">↓</span>
          </p>
        )}

        {/* 30 秒无操作：底部小精灵提示，5 秒后消失 */}
        {idle === 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-20 flex animate-in items-center justify-center gap-2 fade-in px-8">
            <Sprite small speech={copy.sandtray.idle.soft} className="w-7 shrink-0" />
            <p className="text-sm text-[#6b6b6b]">{copy.sandtray.idle.soft}</p>
          </div>
        )}

        {/* 60 秒无操作：中央半透明卡片，给三个选择 */}
        {idle === 2 && (
          <div className="absolute inset-0 z-7 flex items-center justify-center bg-black/5 px-6">
            <div className="w-full max-w-[300px] rounded-3xl bg-white/95 px-6 pt-5 pb-6 text-center shadow-[0_10px_30px_rgba(40,70,50,0.14)] backdrop-blur-sm">
              <Sprite speech={copy.sandtray.idle.title} className="mx-auto mb-2 w-14" />
              <p className="mb-5 text-sm leading-6 text-[#3b423e]">{copy.sandtray.idle.title}</p>
              {/* 陪伴场景，主按钮用淡底而非重色 */}
              <button
                type="button"
                onClick={() => setIdle(0)}
                className="h-11 w-full rounded-full bg-[#eaf6ee] text-sm font-semibold text-brand-dark"
              >
                {copy.sandtray.idle.stay}
              </button>
              <div className="mt-3 flex items-center justify-center gap-5 text-sm text-ink-muted">
                <button
                  type="button"
                  onClick={() => {
                    spriteToast(copy.sandtray.idle.draftReply)
                    finish(false, true)
                  }}
                >
                  {copy.sandtray.idle.draft}
                </button>
                <span className="text-[#dfe5e1]">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setIdle(0)
                    // 与顶栏音乐按钮共用同一面板
                    void ambient.ready().then((ok) => {
                      if (ok) {
                        musicPanel.open()
                        spriteToast(copy.sandtray.idle.musicReply)
                      } else {
                        spriteToast(copy.sandtray.idle.musicReply, { description: copy.sandtray.idle.musicPending })
                      }
                    })
                  }}
                >
                  {copy.sandtray.idle.music}
                </button>
              </div>
            </div>
          </div>
        )}


      </div>

      <aside className="flex shrink-0 flex-col md:w-[340px] md:overflow-y-auto md:bg-white">
      <FigureControls />

      {/* 底部留出安全区，避免沙具卡片被 home 指示条遮挡 */}
      <div className="shrink-0 bg-surface px-3 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:bg-white md:pb-8">
        <div className="no-scrollbar mb-1 flex gap-6 overflow-x-auto px-2">
          {copy.sandtray.categories.map((c, i) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                useSandtray.getState().log("category", { value: FIGURE_CATEGORIES[i] })
                setCategoryIndex(i)
              }}
              className={cn(
                "min-h-11 shrink-0 px-1 text-base md:min-h-0",
                i === categoryIndex ? "font-semibold text-brand" : "text-[#4c4c4c]",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="mb-2 flex justify-end px-2">
            <button
              type="button"
              aria-pressed={showNames}
              onClick={() => setShowNames((v) => !v)}
              className="min-h-9 px-1 text-xs text-ink-muted md:min-h-0 md:py-1"
            >
              {showNames ? copy.sandtray.hideNames : copy.sandtray.showNames}
            </button>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:gap-2.5 md:overflow-visible">
          {list.map((f) => {
            const active = activeFigure === f.id
            const thumb = f.thumb
            return (
              <button
                key={f.id}
                type="button"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onPointerDown={onCardPointerDown(f.id, active)}
                onClick={(e) => { if (e.detail === 0) setActiveFigure(active ? null : f.id) }}
                className={cn(
                  // touch-pan-x：横滑滚动列表，竖向拖入沙盘不被滚动手势拦截
                  "flex w-20 shrink-0 touch-pan-x select-none flex-col items-center overflow-hidden rounded-xl border md:h-auto md:w-full",
                  showNames ? "h-25 md:pb-1.5" : "h-20",
                  active ? "border-brand bg-brand" : "border-transparent bg-white md:border-border",
                )}
              >
                <span className={cn("flex size-20 items-center justify-center bg-[#f1f3f2] md:aspect-square md:size-auto md:w-full", showNames ? "rounded-t-xl" : "rounded-xl")}>
                  {thumb ? (
                    <Image src={thumb} alt="" width={160} height={160} unoptimized draggable={false} className="max-h-17 w-auto object-contain md:max-h-none md:size-full md:p-1.5" />
                  ) : (
                    <span className="text-lg font-semibold text-[#b9c2bb]">{figureName(f, lang).slice(0, 1)}</span>
                  )}
                </span>
                {showNames && <span className={cn("mt-0.5 text-xs", active ? "text-white" : "text-black")}>{figureName(f, lang)}</span>}
              </button>
            )
          })}
        </div>
      </div>
      </aside>

      <BottomSheet open={leaving} onOpenChange={setLeaving}>
        <SheetTitle>{copy.sandtray.leave.title}</SheetTitle>
        <div className="flex gap-3">
          <SecondaryButton onClick={() => setLeaving(false)}>{copy.sandtray.leave.stay}</SecondaryButton>
          <PrimaryButton disabled={busy} onClick={() => finish(false, true)}>
            {copy.sandtray.leave.leave}
          </PrimaryButton>
        </div>
      </BottomSheet>

      {/* 第一步：给沙盘起名（设计稿「沙盘_保存」），第二问可跳过 */}
      <BottomSheet open={naming} onOpenChange={setNaming}>
        <SheetTitle step={1}>{copy.save.title}</SheetTitle>
        <p className="mb-3 text-sm text-ink-muted">{copy.save.subtitle}</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={copy.save.placeholder}
          className="mb-4 h-12 w-full rounded-lg bg-surface px-3.5 text-lg text-black outline-none placeholder:text-[#c6c6c6]"
        />
        <p className="mb-2 text-sm text-ink-muted">{copy.save.storyLabel}</p>
        <textarea
          value={story}
          onChange={(e) => setStory(e.target.value)}
          placeholder={copy.save.storyPlaceholder}
          rows={2}
          className="mb-6 w-full resize-none rounded-lg bg-surface px-3.5 py-3 text-base text-black outline-none placeholder:text-[#c6c6c6]"
        />
        <div className="flex gap-3">
          <SecondaryButton
            onClick={() => {
              setName("")
              setStory("")
              setNaming(false)
              setChoosing(true)
            }}
          >
            {copy.save.skip}
          </SecondaryButton>
          <PrimaryButton
            onClick={() => {
              setNaming(false)
              setChoosing(true)
            }}
          >
            {copy.onboarding.next}
          </PrimaryButton>
        </div>
      </BottomSheet>

      {/* 第二步：选择探索方向（设计稿「沙盘_选择方向」），结果写入记录并驱动报告 */}
      <BottomSheet open={choosing} onOpenChange={setChoosing}>
        <SheetTitle step={2}>{copy.confirm.title}</SheetTitle>
        <div className="mb-6 flex flex-col gap-3">
          {copy.confirm.directions.map((d) => {
            const active = d.id === direction
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDirection(d.id as ExploreDirection)}
                className={cn(
                  "flex h-12 items-center rounded-3xl border px-3",
                  active ? "grad-soft border-brand-dark" : "border-[#99999980] bg-white",
                )}
              >
                <span
                  className={cn(
                    "mr-3 flex size-5 shrink-0 items-center justify-center rounded-full border",
                    active ? "border-brand-dark bg-white" : "border-[#99999980]",
                  )}
                >
                  {active && <span className="size-2 rounded-full bg-brand-dark" />}
                </span>
                <span className={cn("flex-1 text-left text-sm", active ? "text-black" : "text-[#4a4a4a]")}>
                  {d.text}
                </span>
                <span className="rounded-lg bg-tag-count-bg px-1.5 text-[11px] leading-4 text-tag-count">{d.tag}</span>
              </button>
            )
          })}
        </div>
        <div className="flex gap-3">
          <SecondaryButton disabled={busy} onClick={() => finish(false)}>
            {copy.confirm.later}
          </SecondaryButton>
          <PrimaryButton disabled={busy} onClick={() => finish(true)}>
            {busy ? copy.sprite.waiting : copy.confirm.submit}
          </PrimaryButton>
        </div>
      </BottomSheet>

    </Screen>
  )
}

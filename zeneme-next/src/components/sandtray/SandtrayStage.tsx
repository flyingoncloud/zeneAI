"use client"

import { useEffect, useMemo, useSyncExternalStore, type RefObject } from "react"
import { SandtrayCanvas } from "./SandtrayCanvas"
import { SandtrayTools } from "./SandtrayTools"
import { useSandtray } from "@/stores/sandtray"
import { Terrain, decodeHeights, encodeHeights } from "./terrain"
import type { View } from "@/lib/sandtray/zones"

// 保存时需要：压缩后的高度场、塑沙统计
export type TerrainHandle = {
  encode: () => Promise<string | undefined>
  stats: (view: View) => ReturnType<Terrain["sculptStats"]>
}

const subscribe = () => () => {}

type Props = {
  activeFigureId: string | null
  captureRef: RefObject<(() => string) | null>
  placeRef: RefObject<((clientX: number, clientY: number) => boolean) | null>
  onPlaced: () => void
  terrainRef: RefObject<TerrainHandle | null>
  heightField?: string
}

export function SandtrayStage({ activeFigureId, captureRef, placeRef, onPlaced, terrainRef, heightField }: Props) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false)
  // 高度场只在浏览器里建，工具栏和画布共用同一份
  const terrain = useMemo(() => (typeof window === "undefined" ? null : new Terrain()), [])

  // 手机上笔刷默认小一号
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) useSandtray.getState().setBrush(1.6)
  }, [])

  useEffect(() => {
    if (!terrain) return
    terrainRef.current = {
      encode: async () => (terrain.dirty ? encodeHeights(terrain.heights()) : undefined),
      stats: (view) => terrain.sculptStats(view),
    }
    if (heightField) decodeHeights(heightField).then((h) => terrain.setHeights(h))
    return () => { terrainRef.current = null }
  }, [terrain, terrainRef, heightField])

  if (!isClient || !terrain) return <div className="size-full bg-[#eef3ef]" />

  return (
    <>
      <SandtrayCanvas activeFigureId={activeFigureId} captureRef={captureRef} placeRef={placeRef} terrain={terrain} onPlaced={onPlaced} />
      <SandtrayTools terrain={terrain} />
    </>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Img as Image } from "@/components/layout/Img"
import { cn } from "@/lib/utils"

const FRAMES = ["/design/sprite/idle.webp", "/design/sprite/blink.webp", "/design/sprite/talk.webp"] as const

// 三帧叠在一起切透明度：平时隔几秒眨一下眼，speech 变了就动几下嘴
// small：徽标、提示条里那种二三十像素的小头像，浮动幅度跟着收小
export function Sprite({ speech, small, className }: { speech?: string; small?: boolean; className?: string }) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const loop = () => {
      timer = setTimeout(() => {
        setFrame((f) => (f === 0 ? 1 : f))
        timer = setTimeout(() => {
          setFrame((f) => (f === 1 ? 0 : f))
          loop()
        }, 140)
      }, 2800 + Math.random() * 2200)
    }
    loop()
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!speech) return
    const beats = Math.min(12, Math.max(4, Math.round(speech.length / 5)))
    let n = 0
    const timer = setInterval(() => {
      n++
      setFrame(n >= beats * 2 ? 0 : n % 2 ? 2 : 0)
      if (n >= beats * 2) clearInterval(timer)
    }, 170)
    return () => clearInterval(timer)
  }, [speech])

  return (
    <div className={cn(small ? "sprite-float-sm" : "sprite-float", "relative aspect-427/388", className)}>
      {FRAMES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          width={427}
          height={388}
          priority
          draggable={false}
          className={cn("absolute inset-0 size-full object-contain", frame === i ? "opacity-100" : "opacity-0")}
        />
      ))}
    </div>
  )
}

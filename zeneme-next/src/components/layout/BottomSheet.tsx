"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Drawer } from "vaul"
import { useLang } from "@/components/layout/LangProvider"
import { cn } from "@/lib/utils"

type BottomSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: React.ReactNode
  className?: string
  children: React.ReactNode
}

export function BottomSheet({ open, onOpenChange, title, className, children }: BottomSheetProps) {
  // vaul 的内容是延迟挂载的，首次 effect 跑的时候 ref 还是空，所以挂上去时顺手触发一次重跑
  const ref = useRef<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(0)
  const setNode = useCallback((el: HTMLDivElement | null) => {
    ref.current = el
    setMounted((n) => n + 1)
  }, [])

  // vaul 自带的 repositionInputs 键盘补偿会把面板高度直接撑成整个可视区高度，
  // 微信 iOS 上就是面板被顶到最顶上、下面一大片白。关掉它，自己只做两件事：
  // 按键盘高度抬起，并把最大高度限制在键盘上方那块可视区里。
  useEffect(() => {
    const vv = window.visualViewport
    const el = ref.current
    if (!open || !vv || !el) return
    const update = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      el.style.bottom = `${inset}px`
      el.style.maxHeight = `${vv.height - 24}px`
    }
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      el.style.bottom = ""
      el.style.maxHeight = ""
    }
  }, [open, mounted])

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-30 bg-black/30" />
        <Drawer.Content
          ref={setNode}
          className={cn(
            "no-scrollbar fixed inset-x-0 bottom-0 z-31 mx-auto max-w-[430px] overflow-y-auto overscroll-contain rounded-t-2xl bg-white px-5 pt-3 pb-8 outline-none",
            className,
          )}
        >
          <div className="mx-auto mb-4 h-[5px] w-14 rounded-[3px] bg-[#dddee3]" />
          {title && <Drawer.Title asChild>{title}</Drawer.Title>}
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

// 序号直接写在标题文字里（「1、给这个沙盘起个名字」）
export function SheetTitle({ step, children }: { step?: number; children: React.ReactNode }) {
  const lang = useLang()
  return (
    <h2 className="mb-5 text-lg font-semibold text-black">
      {/* 顿号是中文标点，英文界面要用 "2. " */}
      {step !== undefined && (lang === "en" ? `${step}. ` : `${step}、`)}
      {children}
    </h2>
  )
}

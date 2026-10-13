"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { navDepth, setNavDepth } from "@/lib/nav"

// 每次站内换页 +1，浏览器后退 -1；整页刷新 / 新开标签从 0 开始
export function NavTracker() {
  const pathname = usePathname()
  const search = useSearchParams()
  const first = useRef(true)
  const popped = useRef(false)
  useEffect(() => {
    const onPop = () => { popped.current = true }
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])
  useEffect(() => {
    if (first.current) {
      first.current = false
      setNavDepth(0)
      return
    }
    if (popped.current) {
      popped.current = false
      setNavDepth(navDepth() - 1)
    } else setNavDepth(navDepth() + 1)
  }, [pathname, search])
  return null
}

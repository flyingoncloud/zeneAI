"use client"

import { createContext, useCallback, useContext, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LANG_COOKIE, copyOf, type Copy, type Lang } from "@/content/copy"

const Ctx = createContext<Lang>("zh")

// 语言由 RootLayout 从 cookie 读出来往下传，整棵树共用一个值
export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <Ctx value={lang}>{children}</Ctx>
}

export function useLang(): Lang {
  return useContext(Ctx)
}

export function useCopy(): Copy {
  return copyOf(useContext(Ctx))
}

// 切语言：写 cookie 供服务端组件读取，再 refresh 替换服务端渲染的部分。
// 不整页跳转，沙盘页的 3D 场景不会重建。
export function useSetLang() {
  const router = useRouter()
  const [, startTransition] = useTransition()
  return useCallback(
    (next: Lang) => {
      document.cookie = `${LANG_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
      startTransition(() => router.refresh())
    },
    [router],
  )
}

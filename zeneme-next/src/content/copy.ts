// 中英双语。中文在 copy.zh.ts、英文在 copy.en.ts，两边结构由 `typeof zh` 卡死，
// 一边加了 key 另一边没加就是类型错误。
//
// 取文案的方式：
//   服务端组件 / route handler  →  await getCopy()（src/lib/lang.ts，读 cookie）
//   客户端组件                  →  useCopy()（src/components/layout/LangProvider.tsx）
// 别在模块顶层直接引 zh / en，那样语言切了也不会变。
import { zh } from "./copy.zh"
import { en } from "./copy.en"

export type Lang = "zh" | "en"
export type Copy = typeof zh

export const LANGS: Lang[] = ["zh", "en"]
export const DEFAULT_LANG: Lang = "zh"
export const LANG_COOKIE = "zene.lang"

// 语言切换按钮上显示的是另一种语言的名字
export const LANG_LABEL: Record<Lang, string> = { zh: "中文", en: "EN" }

export const dict: Record<Lang, Copy> = { zh, en }

export function toLang(raw: string | undefined | null): Lang {
  return LANGS.includes(raw as Lang) ? (raw as Lang) : DEFAULT_LANG
}

export function copyOf(lang: Lang): Copy {
  return dict[lang]
}

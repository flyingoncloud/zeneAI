import "server-only"
import { cookies } from "next/headers"
import { LANG_COOKIE, copyOf, toLang, type Lang } from "@/content/copy"

// 服务端读取当前语言：只看 cookie，缺省为中文。
// 前端切换语言时写入 cookie 后调用 router.refresh()，服务端渲染部分随之更新。
export async function getLang(): Promise<Lang> {
  return toLang((await cookies()).get(LANG_COOKIE)?.value)
}

export async function getCopy() {
  return copyOf(await getLang())
}

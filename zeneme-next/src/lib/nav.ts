"use client"

// 站内后退：记录当前标签页在本站内的导航步数。有上一页时执行 history 后退，
// 直接打开链接（无上一页）时跳转到各页指定的兜底地址。
const KEY = "zene.navDepth"

export const navDepth = () => {
  try { return Number(sessionStorage.getItem(KEY) || 0) } catch { return 0 }
}
export const setNavDepth = (n: number) => {
  try { sessionStorage.setItem(KEY, String(Math.max(0, n))) } catch {}
}

import "server-only"
import { cookies } from "next/headers"
import { randomUUID } from "node:crypto"

const ANON = "zene_sandtray_uid"
const DEMO = "zene_sandtray_demo"

// ===== 接入宿主站点时修改此处 =====
// 沙盘不自带登录，使用宿主站点的登录态。将此函数替换为读取宿主会话，例如：
//   const session = await auth()
//   return session ? { id: session.user.id, name: session.user.name } : null
// 返回 null 时回落到下方的临时登录或匿名 id。
async function userFromHost(): Promise<{ id: string; name: string } | null> {
  return null
}
// ==================================

export type DemoUser = { id: string; name: string }

// 临时登录：昵称存在 cookie 中，供未接入宿主登录时使用。接入后连同登录页一并删除。
export async function demoUser(): Promise<DemoUser | null> {
  const raw = (await cookies()).get(DEMO)?.value
  if (!raw) return null
  try {
    const u = JSON.parse(decodeURIComponent(raw)) as DemoUser
    return u.id && u.name ? u : null
  } catch {
    return null
  }
}

export async function currentUser(): Promise<DemoUser | null> {
  return (await userFromHost()) ?? (await demoUser())
}

export async function currentUserId(): Promise<string | null> {
  const user = await currentUser()
  if (user) return user.id
  return (await cookies()).get(ANON)?.value ?? null
}

// 供写接口使用：无身份时签发匿名 id，允许游客使用
export async function requireUserId(): Promise<string> {
  const existing = await currentUserId()
  if (existing) return existing
  const uid = randomUUID()
  const jar = await cookies()
  jar.set(ANON, uid, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 })
  return uid
}

export async function setDemoUser(name: string) {
  const jar = await cookies()
  const existing = await demoUser()
  const user: DemoUser = { id: existing?.id ?? `demo-${randomUUID()}`, name }
  jar.set(DEMO, encodeURIComponent(JSON.stringify(user)), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
}

export async function clearDemoUser() {
  ;(await cookies()).delete(DEMO)
}

import { NextResponse } from "next/server"
import { store } from "@/lib/db"
import { requireUserId } from "@/lib/session"

// 沙盘快照：存储为 data URL，响应时解码为二进制以省去 base64 开销
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const uid = await requireUserId()
  const { id } = await params
  const data = await store.getSnapshot(uid, id)
  if (!data) return NextResponse.json({ error: "没有快照" }, { status: 404 })

  const m = /^data:(image\/[a-z+]+);base64,([\s\S]+)$/.exec(data)
  if (!m) return NextResponse.json({ error: "快照格式不对" }, { status: 500 })
  return new NextResponse(Buffer.from(m[2], "base64") as unknown as BodyInit, {
    headers: {
      "Content-Type": m[1],
      // 私有内容，禁止公共缓存
      "Cache-Control": "private, max-age=86400",
    },
  })
}

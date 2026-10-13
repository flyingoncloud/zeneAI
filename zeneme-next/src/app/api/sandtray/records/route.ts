import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { store } from "@/lib/db"
import { requireUserId } from "@/lib/session"
import { BadRequest, sanitizeLayout, sanitizeName, sanitizeSnapshot, sanitizeStory } from "@/lib/sandtray/validate"
import { getCopy, getLang } from "@/lib/lang"
import type { ExploreDirection, RecordStatus, SandtrayRecord } from "@/types/sandtray"

export async function GET() {
  const uid = await requireUserId()
  return NextResponse.json({ records: await store.list(uid) })
}

export async function POST(req: Request) {
  const uid = await requireUserId()
  try {
    const body = (await req.json()) as Record<string, unknown>
    const now = Date.now()
    const id = randomUUID()
    const lang = await getLang()
    const copy = await getCopy()
    const snapshot = sanitizeSnapshot(body.snapshot)
    if (snapshot) await store.putSnapshot(uid, id, snapshot)

    const record: SandtrayRecord = {
      id,
      name:
        sanitizeName(body.name) ||
        `${copy.save.defaultName} ${new Date(now).toLocaleDateString(lang === "en" ? "en-AU" : "zh-CN")}`,
      story: sanitizeStory(body.story) || undefined,
      direction: (["self", "career", "future", "free"] as ExploreDirection[]).find((d) => d === body.direction),
      status: (["draft", "pending"] as RecordStatus[]).find((x) => x === body.status) ?? "pending",
      favorite: false,
      layout: sanitizeLayout(body.layout),
      // 快照不存于记录文档，按 id 单独读取
      snapshotUrl: snapshot ? `/api/sandtray/records/${id}/snapshot` : undefined,
      createdAt: now,
      updatedAt: now,
    }
    await store.put(uid, record)
    return NextResponse.json({ record })
  } catch (e) {
    if (e instanceof BadRequest) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}

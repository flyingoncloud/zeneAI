import { NextResponse } from "next/server"
import { store } from "@/lib/db"
import { getCopy } from "@/lib/lang"
import { requireUserId } from "@/lib/session"
import {
  BadRequest,
  sanitizeLayout,
  sanitizeName,
  sanitizeSnapshot,
  sanitizeStory,
} from "@/lib/sandtray/validate"
import type { ExploreDirection, RecordStatus, SandtrayRecord } from "@/types/sandtray"

type Ctx = { params: Promise<{ id: string }> }

const DIRECTIONS: ExploreDirection[] = ["self", "career"]
const STATUSES: RecordStatus[] = ["draft", "pending", "analyzed"]

export async function GET(_req: Request, { params }: Ctx) {
  const uid = await requireUserId()
  const { id } = await params
  const record = await store.get(uid, id)
  if (!record) return NextResponse.json({ error: (await getCopy()).ui.errNoRecord }, { status: 404 })
  return NextResponse.json({ record })
}

export async function PATCH(req: Request, { params }: Ctx) {
  const uid = await requireUserId()
  const { id } = await params
  const record = await store.get(uid, id)
  if (!record) return NextResponse.json({ error: (await getCopy()).ui.errNoRecord }, { status: 404 })

  try {
    const patch = (await req.json()) as Record<string, unknown>
    const snapshot = sanitizeSnapshot(patch.snapshotUrl ?? patch.snapshot)
    if (snapshot) await store.putSnapshot(uid, id, snapshot)

    const direction = DIRECTIONS.find((d) => d === patch.direction)
    const status = STATUSES.find((s) => s === patch.status)
    const next: SandtrayRecord = {
      ...record,
      name: sanitizeName(patch.name) || record.name,
      story: patch.story === undefined ? record.story : sanitizeStory(patch.story) || undefined,
      favorite: typeof patch.favorite === "boolean" ? patch.favorite : record.favorite,
      layout: patch.layout ? sanitizeLayout(patch.layout) : record.layout,
      snapshotUrl: snapshot ? `/api/sandtray/records/${id}/snapshot` : record.snapshotUrl,
      direction: direction ?? record.direction,
      status: status ?? record.status,
      updatedAt: Date.now(),
    }
    await store.put(uid, next)
    return NextResponse.json({ record: next })
  } catch (e) {
    if (e instanceof BadRequest) return NextResponse.json({ error: e.message }, { status: 400 })
    throw e
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const uid = await requireUserId()
  const { id } = await params
  const ok = await store.remove(uid, id)
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 })
}

import { SandtrayEditor } from "@/components/sandtray/SandtrayEditor"
import { DesktopOnly } from "@/components/sandtray/DesktopOnly"
import { store } from "@/lib/db"
import { currentUserId } from "@/lib/session"

// ?record=xxx 表示继续编辑已有的那盘
export default async function SandtrayPage({
  searchParams,
}: {
  searchParams: Promise<{ record?: string }>
}) {
  const { record } = await searchParams
  const uid = record ? await currentUserId() : null
  const initial = uid && record ? await store.get(uid, record) : null

  return (
    <DesktopOnly>
      {/* 按记录换 key：从历史抽屉切到另一盘时路由不变，不重建会残留上一盘的沙具 */}
      <SandtrayEditor key={record ?? "new"} initial={initial} />
    </DesktopOnly>
  )
}

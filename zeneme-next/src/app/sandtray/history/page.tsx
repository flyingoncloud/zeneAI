import { Screen } from "@/components/layout/Screen"
import { HistoryList } from "@/components/history/HistoryList"
import { getCopy } from "@/lib/lang"
import { store } from "@/lib/db"
import { currentUserId } from "@/lib/session"

export default async function HistoryPage() {
  const copy = await getCopy()
  const uid = await currentUserId()
  const records = uid ? await store.list(uid) : []

  return (
    <Screen title={copy.history.title} back="/" decorated headerClassName="bg-white">
      <HistoryList records={records} />
    </Screen>
  )
}

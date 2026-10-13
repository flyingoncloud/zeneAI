"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Dialog, DialogContent, DialogTitle } from "@/components/sandtray/dialog"
import { HistoryList } from "@/components/history/HistoryList"
import { useCopy } from "@/components/layout/LangProvider"
import { api } from "@/lib/sandtrayApi"
import type { SandtrayRecord } from "@/types/sandtray"

// 桌面端历史记录从右侧滑出，不跳页；手机端走整页。
export function HistoryDrawer({ className }: { className?: string }) {
  const copy = useCopy()
  const [open, setOpen] = useState(false)
  const [records, setRecords] = useState<SandtrayRecord[] | null>(null)

  const load = () => api.listRecords().then((d) => setRecords(d.records)).catch(() => setRecords([]))
  useEffect(() => { if (open) load() }, [open])

  return (
    <>
      <Link href="/sandtray/history" className={className + " lg:hidden"}>
        {copy.prepare.history}
      </Link>
      <button type="button" onClick={() => setOpen(true)} className={className + " hidden lg:flex"}>
        {copy.prepare.history}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton
          className="top-0 right-0 left-auto flex h-dvh w-[520px] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-y-auto rounded-none border-0 bg-surface p-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
        >
          <DialogTitle className="sticky top-0 z-10 border-b border-border bg-white px-6 py-4 text-base font-semibold">
            {copy.history.title}
          </DialogTitle>
          {records === null ? (
            <p className="px-6 py-10 text-sm text-ink-muted">{copy.ui.loading}</p>
          ) : (
            <HistoryList records={records} onChanged={load} onNavigate={() => setOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

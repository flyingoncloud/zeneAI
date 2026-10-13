"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PrimaryButton } from "@/components/layout/Buttons"
import { api } from "@/lib/sandtrayApi"
import { useCopy } from "@/components/layout/LangProvider"

export function AnalyzeButton({ id }: { id: string }) {
  const copy = useCopy()
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const run = async () => {
    setBusy(true)
    try {
      await api.analyze(id)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : copy.history.failed)
      setBusy(false)
    }
  }

  return (
    <PrimaryButton className="w-40 flex-none" disabled={busy} onClick={run}>
      {busy ? copy.ui.generating : copy.confirm.submit}
    </PrimaryButton>
  )
}

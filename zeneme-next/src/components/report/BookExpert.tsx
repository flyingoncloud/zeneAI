"use client"

import { useState } from "react"
import { BottomSheet, SheetTitle } from "@/components/layout/BottomSheet"
import { PrimaryButton } from "@/components/layout/Buttons"
import { spriteToast } from "@/components/layout/spriteToast"
import { useCopy } from "@/components/layout/LangProvider"
import { CONTACT_EMAIL } from "@/content/contact"
import { withBase } from "@/lib/base-path"

// 预约专业解读：页面里填名字和邮箱，服务器代发到 CONTACT_EMAIL。
// 服务器未配置发信时，退回到复制邮箱 + 打开用户的邮件程序。
export function BookExpert({ title }: { title: string }) {
  const copy = useCopy()
  const t = copy.report.expert
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  // 各步单独兜底：任何一步在某些浏览器里抛错，都不能让用户看到「网络错误」
  const fallback = () => {
    try { navigator.clipboard?.writeText(CONTACT_EMAIL).catch(() => {}) } catch {}
    spriteToast(t.fallback, { description: CONTACT_EMAIL })
    try {
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`${t.subject} · ${title}`)}&body=${encodeURIComponent(message)}`
    } catch {}
  }

  const send = async () => {
    setError("")
    setBusy(true)
    let res: Response
    try {
      res = await fetch(withBase("/api/sandtray/booking"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message, title, link: window.location.href }),
      })
    } catch {
      setBusy(false)
      return setError(t.networkError)
    }
    setBusy(false)
    const data = await res.json().catch(() => ({}))
    if (res.status === 503) {
      setOpen(false)
      return fallback()
    }
    if (!res.ok) return setError(data.error || t.sendError)
    setOpen(false)
    spriteToast(t.sent, { duration: 3200 })
  }

  const input =
    "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-base outline-none focus:border-brand md:text-sm"
  return (
    <>
      <button
        type="button"
        onClick={() => { setError(""); setOpen(true) }}
        className="mt-3 flex h-10 items-center justify-center rounded-[20px] border border-brand-dark px-5 text-sm font-semibold text-brand-dark md:mt-0"
      >
        {t.button}
      </button>
      <BottomSheet open={open} onOpenChange={setOpen}>
        <SheetTitle>{t.formTitle}</SheetTitle>
        <p className="mb-4 text-sm text-ink-muted">{t.formBody}</p>
        <div className="flex flex-col gap-3">
          <input className={input} placeholder={t.name} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          <input className={input} type="email" placeholder={t.email} value={email} maxLength={120} onChange={(e) => setEmail(e.target.value)} />
          <textarea className={`${input} min-h-24 resize-none`} placeholder={t.message} value={message} maxLength={1000} onChange={(e) => setMessage(e.target.value)} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <PrimaryButton className="mt-1 flex-none" disabled={busy || !name.trim() || !email.trim()} onClick={send}>
            {busy ? t.sending : t.send}
          </PrimaryButton>
        </div>
      </BottomSheet>
    </>
  )
}

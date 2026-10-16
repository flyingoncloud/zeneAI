import type { Metadata } from "next"
import { GameShell } from "@/features/cover/GameShell"
import "./globals.css"

export const metadata: Metadata = {
  title: "情感密室 · The Emotional Room",
  description: "一个关于你与爱的探索之旅。每一次选择，都是一次靠近真实的自己。",
  robots: { index: false, follow: false },
}

export default function EscapeRoomLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="escape-room-root">
      <GameShell>{children}</GameShell>
    </div>
  )
}

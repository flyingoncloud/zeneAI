"use client"

import { GoogleOAuthProvider } from "@react-oauth/google"
import { ThemeProvider } from "next-themes"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/sonner"
import { NavTracker } from "@/components/layout/NavTracker"

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""

export function Providers({ children }: { children: React.ReactNode }) {
  const tree = (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <Suspense fallback={null}><NavTracker /></Suspense>
      {children}
      {/* 顶栏高 56px，不留这个偏移的话提示会盖住「完成创作」 */}
      <Toaster position="top-center" offset={{ top: 68 }} mobileOffset={{ top: 68 }} />
    </ThemeProvider>
  )

  // 没配 client id 时不挂 Google Provider，避免本地开发直接报错
  return googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>{tree}</GoogleOAuthProvider>
  ) : (
    tree
  )
}

"use server"

import { redirect } from "next/navigation"
import { clearDemoUser, setDemoUser } from "@/lib/session"

// 假登录，接入 ZeneWe 后删除
export async function signIn(formData: FormData) {
  const name = String(formData.get("name") || "").trim().slice(0, 20)
  if (!name) return
  await setDemoUser(name)
  redirect("/sandtray/start")
}

export async function signOut() {
  await clearDemoUser()
  redirect("/login")
}

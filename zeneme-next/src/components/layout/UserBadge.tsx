import { currentUser } from "@/lib/session"
import { getCopy } from "@/lib/lang"
import { signOut } from "@/app/login/actions"
import Link from "next/link"

// 导航右侧的登录状态。当前是假登录，接入 ZeneWe 后改读其会话。
export async function UserBadge() {
  const user = await currentUser()
  const copy = await getCopy()

  if (!user) {
    return (
      <Link href="/login" className="flex h-9 items-center text-sm text-[#5d635f] hover:text-foreground">
        {copy.ui.signIn}
      </Link>
    )
  }

  return (
    // 头像里已是名字首字，名字短时再写全名会重复，全名放在 title 里
    <div className="flex h-9 items-center gap-2">
      <span
        title={user.name}
        className="flex size-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-deep"
      >
        {user.name.slice(0, 1)}
      </span>
      <form action={signOut} className="flex items-center">
        <button type="submit" className="text-xs text-ink-muted hover:text-foreground">
          {copy.ui.signOut}
        </button>
      </form>
    </div>
  )
}

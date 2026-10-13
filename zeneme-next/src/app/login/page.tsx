import Link from "next/link"
import { getCopy } from "@/lib/lang"
import { signIn } from "./actions"

// 假登录页。接入 ZeneWe 后由其提供登录，此页删除。
export default async function LoginPage() {
  const copy = await getCopy()
  return (
    <div className="sandtray-root flex h-dvh w-full flex-col items-center justify-center bg-linear-to-b from-[#e9f5ef] to-surface px-6">
      <h1 className="text-2xl font-semibold text-foreground md:text-3xl">{copy.global.productName}</h1>
      <p className="mt-2 text-sm text-ink-muted">{copy.ui.loginTagline}</p>

      <form
        action={signIn}
        className="mt-10 w-full max-w-[360px] rounded-3xl bg-white p-6 shadow-[0_6px_24px_rgba(40,60,45,0.08)]"
      >
        <label className="text-sm font-medium text-foreground">
          怎么称呼你？
          <input
            name="name"
            required
            maxLength={20}
            placeholder={copy.ui.loginPlaceholder}
            className="mt-2 h-12 w-full rounded-lg bg-surface px-3.5 text-base text-black outline-none placeholder:text-[#c6c6c6]"
          />
        </label>
        <button
          type="submit"
          className="mt-5 flex h-11 w-full items-center justify-center rounded-[21px] bg-brand-dark text-base font-semibold text-white"
        >
          进入
        </button>
      </form>

      <Link href="/sandtray/start" className="mt-6 text-sm text-ink-muted underline underline-offset-4">
        游客体验
      </Link>
      <p className="mt-10 text-xs text-ink-muted">{copy.ui.loginNote}</p>
    </div>
  )
}

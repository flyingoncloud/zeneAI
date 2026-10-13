// 沙盘各页共用的外框。流程是线性的（引导 → 准备 → 冥想 → 沙盘 → 报告），
// 所以不放全局导航，各页自己的顶栏负责返回。
//
// 接入 ZeneWe 后，沙盘自带的语言、主题、提示等 Provider 收在这一层，
// 只作用于 /sandtray/* 路由，不影响站点根布局。
//
// 本文件由 sync-sandtray.sh 生成，手改会在下次同步时被覆盖。
import { Geist } from "next/font/google"
import { getLang } from "@/lib/lang"
import { LangProvider } from "@/components/layout/LangProvider"
import { Providers } from "./providers"

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] })

export default async function SandtrayLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang()
  return (
    <LangProvider lang={lang}>
      <Providers>
        <div className={`sandtray-root ${geist.variable} flex h-dvh w-full flex-col overflow-hidden bg-surface`}>
          {children}
        </div>
      </Providers>
    </LangProvider>
  )
}

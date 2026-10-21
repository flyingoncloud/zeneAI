"use client"

// 沙盘页是客户端组件却要用 Screen，所以这里不能碰 next/headers，语言走 context
import Link from "next/link"
import { useRouter } from "next/navigation"
import { navDepth } from "@/lib/nav"
import { Img as Image } from "@/components/layout/Img"
import { IconBack } from "@/components/icons"
import cloud from "../../../public/design/cloud.png"
import { MusicButton } from "@/components/layout/MusicButton"
import { LangButton } from "@/components/layout/LangButton"
import { HomeLink } from "@/components/layout/HomeLink"
import { useCopy } from "@/components/layout/LangProvider"
import { cn } from "@/lib/utils"

type ScreenProps = {
  title?: string
  back?: string
  // 离开前需要确认的页面用这个（如沙盘页已有摆放时）
  onBack?: () => void
  action?: React.ReactNode
  // 顶部淡绿渐变 + 云朵装饰，用于历史记录与报告页
  decorated?: boolean
  headerClassName?: string
  className?: string
  children: React.ReactNode
}

// 页面外框：手机是设计稿那套页面级顶栏，桌面换成整宽的全局导航，内容铺满窗口。
export function Screen({ title, back, onBack, action, decorated, headerClassName, className, children }: ScreenProps) {
  const copy = useCopy()
  const router = useRouter()
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-surface">
      {/* 角落纹样靠负偏移大部分溢出屏幕，只在角上留一小片。宽屏上不要放大，否则整张图连同直角边都会露出来 */}
      {decorated && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[271px] overflow-hidden md:h-[320px]">
          <div className="absolute inset-0 bg-linear-to-b from-[#e9f5ef] to-surface" />
          {/* 图走静态 import，URL 带内容哈希，换图后不会命中旧缓存。
              透明度加在外层：两张图在窄屏上会重叠，各自半透明会叠出一条更深的带 */}
          <div className="absolute inset-0 opacity-60">
            <Image
              src={cloud}
              alt=""
              sizes="307px"
              className="absolute -top-[168px] -left-[95px] w-[307px]"
            />
            <Image
              src={cloud}
              alt=""
              sizes="307px"
              className="absolute -top-[84px] -right-[94px] w-[307px]"
            />
          </div>
        </div>
      )}

      {(title || back || onBack || action) && (
        <header
          className={cn(
            "relative z-5 flex h-11 shrink-0 items-center justify-center px-3 md:h-14 md:px-6",
            headerClassName,
          )}
        >
          {back && !onBack && (
            <button
              type="button"
              aria-label={copy.ui.back}
              onClick={() => (navDepth() > 0 ? router.back() : router.push(back))}
              className="absolute left-3 text-[#2a2b3d] md:left-6"
            >
              <IconBack className="w-5" />
            </button>
          )}
          {onBack && (
            <button type="button" onClick={onBack} aria-label={copy.ui.back} className="absolute left-3 text-[#2a2b3d] md:left-6">
              <IconBack className="w-5" />
            </button>
          )}
          <h1 className="text-base font-medium text-foreground md:text-lg">{title}</h1>
          {/* 统一 h-9 + items-center，否则圆按钮和纯文字按钮的光学中心对不齐 */}
          <div className="absolute right-3 flex h-9 items-center gap-1 md:right-6 md:gap-2">
            <HomeLink />
            <MusicButton />
            <LangButton />
            {action}
          </div>
        </header>
      )}

      <main className={cn("relative z-5 min-h-0 flex-1 overflow-y-auto", className)}>{children}</main>
    </div>
  )
}

export function HeaderAction({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode
  onClick?: () => void
  href?: string
}) {
  const cls = "text-sm font-semibold text-brand-dark md:text-base"
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  )
}

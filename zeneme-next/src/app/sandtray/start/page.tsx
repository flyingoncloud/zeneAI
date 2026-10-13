import { StartFlow } from "@/components/flow/StartFlow"
import { UserBadge } from "@/components/layout/UserBadge"
import { DesktopOnly } from "@/components/sandtray/DesktopOnly"

// 开场：准备 → 引导 → 冥想，全程小精灵说话，一页走完
export default async function StartPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const { step } = await searchParams
  return (
    <DesktopOnly>
      <StartFlow initial={step === "meditation" ? 1 : 0} badge={<UserBadge />} />
    </DesktopOnly>
  )
}

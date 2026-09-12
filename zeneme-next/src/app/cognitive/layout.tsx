// src/app/cognitive/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "认知小测 · ZeneMe",
  description: "扫码即测：一组图片小题，看图点一点，约 8–12 分钟，无需登录。",
};

export default function CognitiveLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

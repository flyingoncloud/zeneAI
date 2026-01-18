// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // 引入你上传的 globals.css
import ClientLayout from "@/components/ClientLayout"; // 下一步创建这个文件

export const metadata: Metadata = {
  title: "Zeneme Web App",
  description: "Your emotional companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body className="antialiased bg-[#0a0a0a] text-slate-200">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
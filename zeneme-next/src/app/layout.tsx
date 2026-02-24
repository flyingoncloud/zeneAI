// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css"; // 引入你上传的 globals.css
import ClientLayout from "@/components/ClientLayout"; // 下一步创建这个文件

export const metadata: Metadata = {
  title: "ZeneWe Web App",
  description: "Your emotional companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof WeixinJSBridge == "object" && typeof WeixinJSBridge.invoke == "function") {
                  handleFontSize();
                } else {
                  if (document.addEventListener) {
                    document.addEventListener("WeixinJSBridgeReady", handleFontSize, false);
                  } else if (document.attachEvent) {
                    document.attachEvent("WeixinJSBridgeReady", handleFontSize);
                    document.attachEvent("onWeixinJSBridgeReady", handleFontSize);
                  }
                }

                function handleFontSize() {
                  WeixinJSBridge.invoke('setFontSizeCallback', { 'fontSize': 0 });
                  WeixinJSBridge.on('menu:setfont', function() {
                    WeixinJSBridge.invoke('setFontSizeCallback', { 'fontSize': 0 });
                  });
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-[#0a0a0a] text-slate-200">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}

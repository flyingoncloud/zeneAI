// src/app/cognitive/qr/page.tsx
"use client";

/**
 * The printable QR poster for 认知小测.
 *
 * The code is generated in the browser from `window.location.origin`, so the same
 * page produces a localhost code in development and a zeneme.ai code in
 * production without anyone having to remember to regenerate an asset. Pass
 * `?base=https://zeneme.ai` to point a code at another host — e.g. to print the
 * production poster from a laptop.
 */

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download, Printer } from "lucide-react";

/** Where the poster sends people. Kept next to the route it mirrors. */
const TARGET_PATH = "/cognitive";
/** Pixel size of the code on screen; the PNG is exported at 4x for print. */
const DISPLAY_SIZE = 260;
const EXPORT_SCALE = 4;

function normaliseBase(base: string): string {
  const trimmed = base.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function QrContent() {
  const searchParams = useSearchParams();
  const baseParam = searchParams.get("base");

  const [origin, setOrigin] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const canvasWrapRef = React.useRef<HTMLDivElement>(null);
  const svgWrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const base = baseParam ? normaliseBase(baseParam) : origin;
  const url = base ? `${base}${TARGET_PATH}` : "";

  const copyUrl = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is unavailable outside a secure context; the URL is on screen
      // to be copied by hand, so there is nothing to recover from here.
    }
  };

  const download = (href: string, filename: string) => {
    const link = document.createElement("a");
    link.href = href;
    link.download = filename;
    link.click();
  };

  const downloadPng = () => {
    const canvas = canvasWrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    download(canvas.toDataURL("image/png"), "zeneme-cognitive-qr.png");
  };

  const downloadSvg = () => {
    const svg = svgWrapRef.current?.querySelector("svg");
    if (!svg) return;
    const markup = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([markup], { type: "image/svg+xml;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    download(href, "zeneme-cognitive-qr.svg");
    URL.revokeObjectURL(href);
  };

  return (
    <div className="min-h-dvh w-full flex items-center justify-center p-6 print:p-0 print:bg-white">
      <div className="w-full max-w-sm space-y-6">
        {/* The poster itself — the only part that goes on paper. */}
        <div className="rounded-2xl border border-white/10 bg-white p-6 text-center space-y-4 print:border-0 print:shadow-none">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">认知小测</h1>
            <p className="text-sm text-slate-500">扫码即测 · 无需登录 · 约 8–12 分钟</p>
          </div>

          <div ref={canvasWrapRef} className="flex justify-center">
            {url ? (
              <QRCodeCanvas
                value={url}
                size={DISPLAY_SIZE * EXPORT_SCALE}
                level="M"
                marginSize={2}
                bgColor="#ffffff"
                fgColor="#0f172a"
                style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
              />
            ) : (
              <div style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }} />
            )}
          </div>

          <p className="text-xs text-slate-400 break-all">{url || "…"}</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            看图、点一点就行。结果只留在你的手机上，我们不会上传。
            这是一次自助小测，不能用来诊断任何疾病。
          </p>
        </div>

        {/* Vector copy, kept off screen purely as the source for the SVG export. */}
        <div ref={svgWrapRef} className="hidden" aria-hidden="true">
          {url ? (
            <QRCodeSVG value={url} size={1024} level="M" marginSize={2} bgColor="#ffffff" fgColor="#0f172a" />
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 print:hidden">
          <button
            type="button"
            onClick={downloadPng}
            disabled={!url}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            PNG
          </button>
          <button
            type="button"
            onClick={downloadSvg}
            disabled={!url}
            className="px-4 py-3 rounded-xl border border-white/10 text-slate-200 text-sm hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            SVG
          </button>
          <button
            type="button"
            onClick={copyUrl}
            disabled={!url}
            className="px-4 py-3 rounded-xl border border-white/10 text-slate-200 text-sm hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? "已复制" : "复制链接"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-3 rounded-xl border border-white/10 text-slate-200 text-sm hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            打印
          </button>
        </div>

        <p className="text-xs text-slate-500 text-center print:hidden">
          需要指向别的域名？加上 <code className="text-slate-400">?base=https://zeneme.ai</code>
        </p>
      </div>
    </div>
  );
}

export default function CognitiveQrPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh w-full" />}>
      <QrContent />
    </Suspense>
  );
}

// src/app/cognitive/page.tsx
"use client";

/**
 * Standalone entry point for 认知小测, reachable by QR code.
 *
 * The test itself keeps everything in local state and talks to no API, so it can
 * run for a walk-in visitor with no account. This route therefore deliberately
 * skips the welcome/auth flow that `/` puts in front of every view: a person who
 * has just scanned a poster should be looking at the first question, not a login
 * form. The invitation to sign up comes afterwards, on the thank-you panel.
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";

import { CognitiveScreen } from "@/components/features/tools/cognitive/CognitiveScreen";
import { WechatBanner } from "@/components/shared/WechatBanner";

export default function CognitivePublicPage() {
  const [done, setDone] = React.useState(false);
  // Bumped to rebuild the screen from scratch — a fresh seed, a fresh session —
  // when the next visitor takes over the same phone.
  const [runId, setRunId] = React.useState(0);

  const restart = () => {
    setRunId((n) => n + 1);
    setDone(false);
  };

  return (
    <div className="flex h-dvh w-full bg-transparent font-sans text-slate-200 overflow-hidden relative">
      <WechatBanner />

      <div className="absolute inset-0 -z-10">
        <Image src="/Cutting%20BG%203.png" alt="" fill priority className="object-cover" />
      </div>

      <main className="flex-1 relative overflow-hidden bg-transparent">
        {done ? (
          <div className="h-full overflow-y-auto flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-6 text-center">
              <h2 className="text-2xl font-bold text-white">谢谢参与</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                这次的结果只留在这台手机上，没有上传。想把每次的表现记下来、看变化，
                可以在 ZeneMe 里建一个账号。
              </p>
              <Link
                href="/"
                className="block w-full px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-500 hover:to-purple-500 transition-all"
              >
                了解 ZeneMe
              </Link>
              <button
                type="button"
                onClick={restart}
                className="w-full px-5 py-3 rounded-xl border border-white/10 text-slate-200 text-sm hover:bg-white/5 transition-colors"
              >
                换一个人再测一次
              </button>
            </div>
          </div>
        ) : (
          <CognitiveScreen key={runId} onExit={() => setDone(true)} />
        )}
      </main>
    </div>
  );
}

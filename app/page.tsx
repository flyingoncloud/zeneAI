'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Step0Page() {
  const router = useRouter();
  const [idx, setIdx] = useState(0);

  // 每一项就是“一屏”要展示的内容；点击【继续】只切换到下一屏，上一屏会消失
  const screens: React.ReactNode[] = [
    // 1
    <div className="space-y-3" key="s1">
      <p>你好，欢迎来到 <b>内视涂鸦</b>。这里，你将通过绘画或一些小问题来探索自己的内心。</p>
    </div>,
    // 2
    <div className="space-y-3" key="s2">
      <p>在这里，你可以安心地做自己。你所展现的任何情绪都没有对错，它们都是真实的、值得被看见的部分。</p>
    </div>,
    // 3
    <div className="space-y-3" key="s3">
      <p>
        在我们开始之前，先和你介绍两个简单的概念：每个人心里都会有一些不同的小声音或小角色，它们代表着各种情绪，
        比如担心的、愤怒的、想被理解的——我们把它们叫做 <b>Parts（局部小我）</b>。
        同时，在你的心里还有一个智慧、有力量、有爱的自己，它懂得如何照顾你，也能带来力量和平静感——我们把它叫做
        <b> Self（核心真我）</b>。
      </p>
    </div>,
    // 4
    <div className="space-y-3" key="s4">
      <p>
        在练习中，我们会一点点认识这些 Parts，然后慢慢靠近你的 Self。当你看见并理解这些情绪，它们的重量会变轻，
        你也能更清楚地感受到自己真正的需要。重要的是，无论最终是否找到 Self，每一个情绪的出现本身都很有价值，
        它们都能帮助你更好地了解自己。
      </p>
    </div>,
    // 5
    <div className="space-y-3" key="s5">
      <p>
        需要说明的是，这不是一个用来测试 AI 准确度的游戏。AI 在这里的角色更像是一面镜子，帮你整理思路，
        引导你看见自己的情绪。当你看见情绪，你已经在情绪之外，更加靠近 SELF 和你想要的答案。
      </p>
    </div>,
    // 6
    <div className="space-y-3" key="s6">
      <p>所以，无论你是否找到最后的 SELF，你都能在过程中收获：</p>
      <ul className="list-decimal pl-5 space-y-1">
        <li>看见并表达真实情绪本身，就是一种成长；</li>
        <li>情绪像信使一样向你传递信息，通过认识情绪了解自己；</li>
        <li>了解情绪出现时自己的解释、身体感受和行为冲动，便于及时觉察和预防因情绪引发的冲突；</li>
        <li>获得一份属于你自己的小报告，帮助你更好地理解自己的思维与行为模式。</li>
      </ul>
    </div>,
    // 7
    <div className="space-y-4" key="s7">
      <p>
        在开始之前，请选择一个让自己感到安全和舒适的方式坐下来，任何时候你感到不舒服都可以随时停下来。
      </p>

      <p>
        请放心，即使你觉得自己不擅长画画，也完全没关系。这里的涂鸦是帮助你表达情绪。哪怕是随手涂几笔，也同样有价值。
      </p>
    </div>,

    <div className="space-y-4" key="last">
      <p>准备好就开始吧。进入练习后，你可以自由选择以下多种方式：</p>

      {/* 功能说明：上传 / 拍照 / 画板 / 图库 / 文字 / 语音 */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-zinc-700">
        <li className="rounded-xl border p-3">
          <div className="font-medium">上传</div>
          <div className="text-zinc-500">从本地相册/文件中选择一张图片上传到网站。</div>
        </li>
        <li className="rounded-xl border p-3">
          <div className="font-medium">拍照</div>
          <div className="text-zinc-500">打开摄像头现场拍摄一张照片并使用（需要授予摄像头权限）。</div>
        </li>
        <li className="rounded-xl border p-3">
          <div className="font-medium">画板</div>
          <div className="text-zinc-500">在画布上自由涂鸦、写字或画图。</div>
        </li>
        <li className="rounded-xl border p-3">
          <div className="font-medium">图库</div>
          <div className="text-zinc-500">从系统提供的题图中挑选一张最贴近你当下感受的图片。</div>
        </li>
        <li className="rounded-xl border p-3">
          <div className="font-medium">文字</div>
          <div className="text-zinc-500">直接用文字描述你的想法或感受。</div>
        </li>
        <li className="rounded-xl border p-3">
          <div className="font-medium">语音</div>
          <div className="text-zinc-500">按下麦克风说出你的想法，我们会将语音转为文字后进入对话。</div>
        </li>
      </ul>

      <button
        className="rounded-xl bg-zinc-900 px-4 py-2 text-white"
        onClick={() => router.push('/flow')}
      >
        进入练习
      </button>

      <p className="text-xs text-zinc-400">
        提示：你可随时切换方式；拍照需浏览器/系统授权摄像头，线上推荐使用 HTTPS（本地 localhost 也可用）。
      </p>
    </div>



  ];

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Step 0 · 介绍</h1>
      <div className="min-h-[320px] rounded-2xl border bg-white p-5 shadow-sm">{screens[idx]}</div>
      <div className="flex items-center justify-between">
        <button className="rounded-xl border px-4 py-2 disabled:opacity-50" onClick={() => setIdx((n) => Math.max(0, n - 1))} disabled={idx === 0}>
          上一条
        </button>
        <span className="text-sm text-zinc-500">{idx + 1} / {screens.length}</span>
        <button className="rounded-xl border px-4 py-2 disabled:opacity-50" onClick={() => setIdx((n) => Math.min(screens.length - 1, n + 1))} disabled={idx === screens.length - 1}>
          继续
        </button>
      </div>
    </main>
  );
}

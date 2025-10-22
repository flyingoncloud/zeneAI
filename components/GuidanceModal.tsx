'use client';
import React from 'react';

type Variant = 'parts3' | 'noSelf' | 'selfFound';

export default function GuidanceModal({
    open,
    variant,
    onClose,
    onGenerate,
    onContinue,
    onNever,
}: {
    open: boolean;
    variant: Variant;
    onClose: () => void;
    onGenerate: () => void;
    onContinue?: () => void;
    onNever?: () => void;
}) {
    if (!open) return null;

    const lines: Record<Variant, string[]> = {
        parts3: [
            '恭喜你，你已经和内在的三个 Parts 认识了，你对⾃⼰的了解多了很多。',
            '你愿意继续探索更多的 Parts 吗？还是希望现在就先生成一份小报告，帮你回顾和整理目前的收获？',
        ],
        noSelf: [
            '那就请你看看这些被你画出来的 Parts，它们是不是已经帮助你更好地理解了自己？',
            '我已经为你整理了一份专属小报告，总结了你在本次探索中的情绪轨迹与关键洞察。',
        ],
        selfFound: [
            '你真的很棒，走到了这里。',
            '这些涂鸦展示了你内心的思维模式和行为模式。',
            '让我们一起回顾一下你画过的所有 Part 和 Self —— 你对 Part 的感受和视角，和刚开始相比，有什么变化吗？',
            '我已经为你整理了一份专属小报告，总结了你在本次探索中的情绪轨迹与关键洞察。',
            '需要我把它生成给你吗？',
        ],
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-xl rounded-2xl border bg-white p-6">
                <div className="space-y-3">
                    {lines[variant].map((t, i) => (
                        <p key={i} className="text-zinc-800">{t}</p>
                    ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                    {/* 仅在 parts3 时展示“不再提示” */}
                    {variant === 'parts3' && onNever && (
                        <button
                            className="rounded-xl border px-4 py-2 text-zinc-600"
                            onClick={onNever}
                        >
                            不再提示
                        </button>
                    )}

                    {onContinue && (
                        <button
                            className="rounded-xl border px-4 py-2 text-zinc-700"
                            onClick={onContinue}
                        >
                            继续探索
                        </button>
                    )}

                    <button
                        className="rounded-xl bg-zinc-900 px-4 py-2 text-white"
                        onClick={onGenerate}
                    >
                        生成报告
                    </button>

                    <button className="rounded-xl border px-4 py-2" onClick={onClose}>
                        取消
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatBox from '@/components/ChatBox';
import GuidanceModal from '@/components/GuidanceModal';
import Paywall from '@/components/Paywall';

// 与 ChatBox 的 onDetect 保持一致
export type DetectedItem = {
    type: 'self' | 'part';
    label: string;
};

// 本项目里所有会持久化的 key（localStorage）
// 方便重置时逐一清理
const ZENE_KEYS = [
    'zene_paid',
    'zene_parts_modal_lastK',
    'zene_parts_modal_optout',
    'zene_flow_unique',
    'zene_transcript',
];

function resetZeneState() {
    try {
        ZENE_KEYS.forEach((k) => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k); // 万一有遗留的 session 也一起清
        });
    } catch { }
}

export default function FlowPage() {
    const router = useRouter();

    // URL ?reset=1 -> 自动清零并刷新（且移除参数）
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        if (params.get('reset') === '1') {
            resetZeneState();
            // 去掉 reset 参数，避免刷新后再次触发
            params.delete('reset');
            const newUrl =
                window.location.pathname +
                (params.toString() ? `?${params.toString()}` : '');
            window.history.replaceState({}, '', newUrl);
            location.reload();
        }
    }, []);

    // 实时记录（原始轨迹，可能包含重复）
    const [records, setRecords] = useState<DetectedItem[]>([]);

    // ChatBox 回调：把识别结果并入轨迹
    function handleDetect(items: DetectedItem[]) {
        if (!Array.isArray(items) || items.length === 0) return;
        setRecords((prev) => [...prev, ...items]);
    }

    // 去重后的 Self / Parts 列表与数量 
    const { uniqSelf, uniqParts, selfCount, partCount } = useMemo(() => {
        const sSet = new Set<string>();
        const pSet = new Set<string>();
        const s: string[] = [];
        const p: string[] = [];

        for (const r of records) {
            if (r.type === 'self') {
                if (!sSet.has(r.label)) {
                    sSet.add(r.label);
                    s.push(r.label);
                }
            } else {
                if (!pSet.has(r.label)) {
                    pSet.add(r.label);
                    p.push(r.label);
                }
            }
        }
        return {
            uniqSelf: s,
            uniqParts: p,
            selfCount: s.length,
            partCount: p.length,
        };
    }, [records]);

    // 顶部 gating 提示 
    const gateOk = selfCount >= 1 || partCount >= 3;

    // 付费状态（localStorage 持久化）
    const [paid, setPaid] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('zene_paid') === '1';
    });
    const [payOpen, setPayOpen] = useState(false);

    function markPaid() {
        setPaid(true);
        try {
            localStorage.setItem('zene_paid', '1');
        } catch { }
        setPayOpen(false);
        nextToReport();
    }

    // 进入报告页 
    function nextToReport() {
        // 报告页会从 localStorage 里读 zene_transcript，以及 /flow 的去重记录
        try {
            localStorage.setItem(
                'zene_flow_unique',
                JSON.stringify({ self: uniqSelf, parts: uniqParts })
            );
        } catch { }
        router.push('/report');
    }

    // 生成按钮（被弹窗“生成报告”复用）
    function handleGenerateClicked() {
        if (!paid) {
            setPayOpen(true);
        } else {
            nextToReport();
        }
    }

    // 顶部“总结一下”点击：根据是否有 Self 选择 4.1/4.2 文案 
    const [guideOpen, setGuideOpen] = useState(false);
    const [guideVariant, setGuideVariant] =
        useState<'noSelf' | 'selfFound' | 'parts3'>('noSelf');

    function openSummary() {
        if (selfCount >= 1) {
            setGuideVariant('selfFound'); // 4.2
            setGuideOpen(true);
        } else if (partCount >= 3) {
            setGuideVariant('noSelf'); // 4.1
            setGuideOpen(true);
        } else {
            alert('先继续探索一下吧：需要出现 1 个 Self 或 Parts ≥ 3 才能总结。');
        }
    }

    // 3.2：每满 3 个 Parts 触发一次弹窗（可“不再提示”）
    const [partsModalOpen, setPartsModalOpen] = useState(false);
    const [partsModalLastK, setPartsModalLastK] = useState<number>(() => {
        if (typeof window === 'undefined') return 0;
        const s = localStorage.getItem('zene_parts_modal_lastK');
        return s ? Number(s) || 0 : 0;
    });
    const [partsModalOptOut, setPartsModalOptOut] = useState<boolean>(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem('zene_parts_modal_optout') === '1';
    });

    useEffect(() => {
        if (partsModalOptOut) return;
        const k = Math.floor(partCount / 3); // 0,1,2,3… 对应 0,3,6,9…
        if (k > 0 && k > partsModalLastK) {
            setPartsModalOpen(true);
            setPartsModalLastK(k);
            try {
                localStorage.setItem('zene_parts_modal_lastK', String(k));
            } catch { }
        }
    }, [partCount, partsModalLastK, partsModalOptOut]);

    function handlePartsNever() {
        setPartsModalOpen(false);
        setPartsModalOptOut(true);
        try {
            localStorage.setItem('zene_parts_modal_optout', '1');
        } catch { }
    }

    // 头部重置按钮 
    function handleResetClick() {
        if (
            confirm(
                '确认要重置测试数据吗？将清空：付费标记、Parts 弹窗提示状态、报告缓存、对话轨迹等本地记录。'
            )
        ) {
            resetZeneState();
            location.reload();
        }
    }

    return (
        <div className="mx-auto max-w-6xl space-y-4 p-4">
            {/* 顶部标题 & 按钮组 */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Step 1–3.3 固定布局</h1>

                <div className="flex items-center gap-2">
                    {/* 重置 */}
                    <button
                        className="rounded-xl bg-zinc-200 px-3 py-2 text-zinc-700"
                        onClick={handleResetClick}
                    >
                        重置测试
                    </button>

                    {/* 可选“总结一下”，不满足条件时置灰 */}
                    <button
                        className={[
                            'rounded-xl px-4 py-2',
                            gateOk
                                ? 'bg-zinc-900 text-white'
                                : 'cursor-not-allowed bg-zinc-200 text-zinc-500',
                        ].join(' ')}
                        onClick={openSummary}
                        disabled={!gateOk}
                    >
                        总结一下
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border p-3 text-sm text-zinc-600">
                {gateOk ? (
                    <span>
                        可以总结了：当前进度 Self <b>{selfCount}</b>，Parts{' '}
                        <b>{partCount}</b>。
                    </span>
                ) : (
                    <span>
                        生成报告条件未满足：需要出现 <b>1 个 Self</b> 或 <b>Parts ≥ 3</b>。 当前进度：
                        Self <b>{selfCount}</b>，Parts <b>{partCount}</b>。
                    </span>
                )}
            </div>

            {/* 主体两栏布局 */}
            <div className="grid grid-cols-12 gap-6">
                {/* 左侧：实时记录 */}
                <div className="col-span-4">
                    <div className="rounded-2xl border p-4">
                        <h3 className="mb-3 text-lg font-medium">实时记录</h3>

                        <div className="mb-4">
                            <div className="mb-1 font-medium">
                                Self <span className="text-sm text-zinc-500">({selfCount})</span>
                            </div>
                            {uniqSelf.length ? (
                                <ul className="space-y-1">
                                    {uniqSelf.map((s) => (
                                        <li key={s} className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-zinc-400">暂无 Self 记录</div>
                            )}
                        </div>

                        <div>
                            <div className="mb-1 font-medium">
                                Parts{' '}
                                <span className="text-sm text-zinc-500">({partCount})</span>
                            </div>
                            {uniqParts.length ? (
                                <ul className="space-y-1">
                                    {uniqParts.map((p) => (
                                        <li key={p} className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                                            <span>{p}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-zinc-400">暂无 Parts 记录</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 右侧：聊天盒子 */}
                <div className="col-span-8">
                    <div className="rounded-2xl border p-3">
                        <ChatBox onDetect={handleDetect} />
                    </div>
                </div>
            </div>

            {/* 3.2：每 3 个 Parts 弹一次 */}
            <GuidanceModal
                open={partsModalOpen}
                variant="parts3"
                onClose={() => setPartsModalOpen(false)}
                onContinue={() => setPartsModalOpen(false)}
                onGenerate={handleGenerateClicked}
                onNever={handlePartsNever}
            />

            {/* 4.1 / 4.2：总结引导（手动触发） */}
            <GuidanceModal
                open={guideOpen}
                variant={guideVariant}
                onClose={() => setGuideOpen(false)}
                onContinue={() => setGuideOpen(false)}
                onGenerate={handleGenerateClicked}
            />

            {/* 付费弹窗 */}
            <Paywall open={payOpen} onClose={() => setPayOpen(false)} onPaid={markPaid} />
        </div>
    );
}

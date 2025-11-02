'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ChatBox from '@/components/ChatBox';
import GuidanceModal from '@/components/GuidanceModal';
import Paywall from '@/components/Paywall';
import ImageGallery from '@/components/ImageGallery';
import SketchPad from '@/components/SketchPad';

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

    // 轨迹记录：每次 ChatBox 识别到 Parts/Self 时会调用 handleDetect
    const [records, setRecords] = useState<DetectedItem[]>([]);

    // ChatBox 回调：把识别结果并入轨迹
    function handleDetect(items: DetectedItem[]) {
        if (!Array.isArray(items) || items.length === 0) return;
        setRecords((prev) => [...prev, ...items]);
    }

    // 实时统计：去重后的 Self/Parts 列表 + 计数
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
        setPayOpen(false);
        try {
            localStorage.setItem('zene_paid', '1');
        } catch { }
        router.push('/report');
    }

    function handleGenerateClicked() {
        if (!paid) {
            setPayOpen(true);
        } else {
            router.push('/report');
        }
    }

    // 顶部"总结一下"点击：根据是否有 Self 选择 4.1/4.2 文案 
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

    // 3.2：每满 3 个 Parts 触发一次弹窗（可"不再提示"）
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

    // Image Gallery state
    const [galleryOpen, setGalleryOpen] = useState(false);
    const chatBoxRef = useRef<any>(null);

    const handleGalleryImageSelect = (imageUrl: string) => {
        if (chatBoxRef.current && chatBoxRef.current.handleGalleryImage) {
            chatBoxRef.current.handleGalleryImage(imageUrl);
        }
    };

    // Canvas state
    const [canvasOpen, setCanvasOpen] = useState(false);

    const handleCanvasExport = async (blob: Blob) => {
        try {
            const formData = new FormData();
            formData.append('file', blob, 'drawing.png');
            
            const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/zene/upload`, {
                method: 'POST',
                body: formData
            });
            
            const uploadData = await uploadResponse.json();
            if (uploadData.ok) {
                const fullImageUrl = uploadData.url.startsWith('http') 
                    ? uploadData.url 
                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${uploadData.url}`;
                
                // Add drawing to conversation like gallery images
                if (chatBoxRef.current && chatBoxRef.current.handleGalleryImage) {
                    chatBoxRef.current.handleGalleryImage(fullImageUrl);
                }
            }
        } catch (error) {
            console.error('Failed to upload drawing:', error);
        }
        setCanvasOpen(false);
    };

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 p-4">
                <div className="flex">
                    {/* Left side - matches sidebar width */}
                    <div className="w-[40%]">
                        <h1 className="text-xl font-semibold">内视涂鸦 - IFS 探索</h1>
                    </div>
                    {/* Right side - matches conversation width */}
                    <div className="w-[60%] flex justify-end">
                        <button
                            className="rounded-xl bg-zinc-200 px-3 py-2 text-zinc-700 hover:bg-zinc-300"
                            onClick={handleResetClick}
                        >
                            重置测试
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content - Two Column Layout */}
            <div className="flex-1 flex">
                {/* Left Sidebar - 40% */}
                <div className="w-[40%] bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
                    {/* Report Status */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">报告状态</h3>
                        <div className="bg-white rounded-lg p-4 border">
                            {gateOk ? (
                                <div className="text-green-600">
                                    <div className="flex items-center mb-2">
                                        <span className="text-green-500 mr-2">✓</span>
                                        <span>生成报告条件已满足</span>
                                    </div>
                                    <button
                                        onClick={openSummary}
                                        className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                    >
                                        总结一下
                                    </button>
                                </div>
                            ) : (
                                <div className="text-gray-600">
                                    <div className="flex items-center mb-2">
                                        <span className="text-gray-400 mr-2">○</span>
                                        <span>生成报告条件未满足</span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        需要：1个Self 或 3个Parts
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        当前：Self {selfCount}，Parts {partCount}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Real-time Records */}
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-3">实时记录</h3>
                        <div className="bg-white rounded-lg p-4 border h-full overflow-y-auto">
                            <div className="space-y-4">
                                {/* Self Records */}
                                <div>
                                    <h4 className="font-medium text-emerald-600 mb-2 flex items-center">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
                                        Self ({selfCount})
                                    </h4>
                                    {uniqSelf.length > 0 ? (
                                        <div className="space-y-1">
                                            {uniqSelf.map((item, i) => (
                                                <div key={i} className="bg-emerald-50 px-2 py-1 rounded text-sm">
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm">暂无 Self 记录</p>
                                    )}
                                </div>

                                {/* Parts Records */}
                                <div>
                                    <h4 className="font-medium text-blue-600 mb-2 flex items-center">
                                        <span className="h-2 w-2 rounded-full bg-blue-500 mr-2" />
                                        Parts ({partCount})
                                    </h4>
                                    {uniqParts.length > 0 ? (
                                        <div className="space-y-1">
                                            {uniqParts.map((item, i) => (
                                                <div key={i} className="bg-blue-50 px-2 py-1 rounded text-sm">
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 text-sm">暂无 Parts 记录</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Main Content - 60% */}
                <div className="w-[60%] flex flex-col">
                    <ChatBox 
                        ref={chatBoxRef}
                        onDetect={handleDetect} 
                        onGalleryOpen={() => setGalleryOpen(true)}
                        onCanvasOpen={() => setCanvasOpen(true)}
                    />
                </div>
            </div>

            {/* Modals */}
            <GuidanceModal
                open={partsModalOpen}
                variant="parts3"
                onClose={() => setPartsModalOpen(false)}
                onContinue={() => setPartsModalOpen(false)}
                onGenerate={handleGenerateClicked}
                onNever={handlePartsNever}
            />

            <GuidanceModal
                open={guideOpen}
                variant={guideVariant}
                onClose={() => setGuideOpen(false)}
                onContinue={() => setGuideOpen(false)}
                onGenerate={handleGenerateClicked}
            />

            <Paywall open={payOpen} onClose={() => setPayOpen(false)} onPaid={markPaid} />
            
            <ImageGallery 
                open={galleryOpen} 
                onClose={() => setGalleryOpen(false)} 
                onImageSelect={handleGalleryImageSelect}
            />
            
            <SketchPad 
                open={canvasOpen} 
                onClose={() => setCanvasOpen(false)} 
                onExport={handleCanvasExport}
            />
        </div>
    );
}

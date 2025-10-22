'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
    open: boolean;
    onClose: () => void;
    onExport: (blob: Blob) => Promise<void> | void;
};

export default function SketchPad({ open, onClose, onExport }: Props) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    const [color, setColor] = useState('#111111');
    const [size, setSize] = useState(6);
    const [isEraser, setIsEraser] = useState(false);
    const [drawing, setDrawing] = useState(false);
    const lastRef = useRef<{ x: number; y: number } | null>(null);
    const [busy, setBusy] = useState(false);

    // 撤销历史（基于画布像素）
    const historyRef = useRef<ImageData[]>([]);

    const COLORS = [
        '#111111', '#ef4444', '#f59e0b', '#22c55e', '#0ea5e9', '#6366f1', '#db2777',
        '#ffffff',
    ];

    // 安全的自适应尺寸 
    useEffect(() => {
        if (!open) return;

        const resize = () => {
            const parent = wrapRef.current;
            const canvas = canvasRef.current;
            if (!parent || !canvas) return; // 关键：防止 null

            const dpr = Math.max(1, window.devicePixelRatio || 1);
            const w = Math.max(1, Math.floor(parent.clientWidth));
            const h = Math.max(1, Math.floor(parent.clientHeight));

            // 只在尺寸变化时重置画布，避免把已有内容清空
            const needResize = canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr);
            if (needResize) {
                canvas.width = Math.floor(w * dpr);
                canvas.height = Math.floor(h * dpr);
                canvas.style.width = `${w}px`;
                canvas.style.height = `${h}px`;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, w, h); // 白底
                ctxRef.current = ctx;

                // 初始化历史快照（以画布像素为准）
                historyRef.current = [ctx.getImageData(0, 0, w, h)];
            }
        };

        // 等一帧确保 DOM 渲染完成
        const id = requestAnimationFrame(resize);

        const ro = new ResizeObserver(() => resize());
        if (wrapRef.current) ro.observe(wrapRef.current);

        return () => {
            cancelAnimationFrame(id);
            ro.disconnect();
        };
    }, [open]);

    // 绘制 
    function getPos(e: PointerEvent | React.PointerEvent) {
        const canvas = canvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const cx = (e as PointerEvent).clientX ?? (e as any).nativeEvent?.clientX;
        const cy = (e as PointerEvent).clientY ?? (e as any).nativeEvent?.clientY;
        return { x: cx - rect.left, y: cy - rect.top };
    }

    function pointerDown(e: React.PointerEvent) {
        if (!ctxRef.current) return;
        (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId); // 防异常
        const ctx = ctxRef.current!;
        const { x, y } = getPos(e);

        // 入栈当前画布快照（撤销使用）
        const c = canvasRef.current!;
        const w = Math.floor(c.width / (window.devicePixelRatio || 1));
        const h = Math.floor(c.height / (window.devicePixelRatio || 1));
        historyRef.current.push(ctx.getImageData(0, 0, w, h));
        if (historyRef.current.length > 40) historyRef.current.shift();

        setDrawing(true);
        lastRef.current = { x, y };
    }

    function pointerMove(e: React.PointerEvent) {
        if (!drawing || !ctxRef.current) return;
        const ctx = ctxRef.current!;
        const now = getPos(e);
        const last = lastRef.current!;
        ctx.save();
        if (isEraser) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
        }
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(now.x, now.y);
        ctx.stroke();
        ctx.restore();
        lastRef.current = now;
    }

    function pointerUp() {
        setDrawing(false);
        lastRef.current = null;
    }

    function undo() {
        const ctx = ctxRef.current;
        const c = canvasRef.current;
        if (!ctx || !c) return;
        if (historyRef.current.length <= 1) return;
        historyRef.current.pop(); // 丢弃当前
        const last = historyRef.current[historyRef.current.length - 1];
        ctx.putImageData(last, 0, 0);
    }

    function clearAll() {
        const ctx = ctxRef.current;
        const c = canvasRef.current;
        if (!ctx || !c) return;
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        const w = Math.floor(c.width / dpr);
        const h = Math.floor(c.height / dpr);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        historyRef.current = [ctx.getImageData(0, 0, w, h)];
    }

    async function exportPNG() {
        const c = canvasRef.current;
        if (!c) return;
        setBusy(true);
        try {
            const blob: Blob | null = await new Promise((r) => c.toBlob(r, 'image/png', 0.95));
            if (!blob) return;
            await onExport(blob);
            onClose();
        } finally {
            setBusy(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
            <div className="mx-4 w-[92vw] max-w-4xl rounded-2xl bg-white p-4">
                {/* 工具条 */}
                <div className="mb-3 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                className="h-6 w-6 rounded-full border"
                                style={{ backgroundColor: c, boxShadow: c === color ? '0 0 0 3px rgba(0,0,0,.15)' : 'none' }}
                                onClick={() => { setColor(c); setIsEraser(false); }}
                                title={c}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-zinc-600">线宽</label>
                        <input type="range" min={1} max={24} value={size} onChange={(e) => setSize(parseInt(e.target.value))} />
                        <span className="w-6 text-xs text-zinc-600">{size}</span>
                    </div>
                    <button
                        className={`rounded-lg border px-3 py-1 text-sm ${isEraser ? 'bg-zinc-900 text-white' : ''}`}
                        onClick={() => setIsEraser((v) => !v)}
                    >
                        橡皮擦
                    </button>
                    <button className="rounded-lg border px-3 py-1 text-sm" onClick={undo} disabled={historyRef.current.length <= 1}>
                        撤销
                    </button>
                    <button className="rounded-lg border px-3 py-1 text-sm" onClick={clearAll}>
                        清空
                    </button>

                    <div className="ml-auto flex items-center gap-2">
                        <button className="rounded-xl border px-4 py-2" onClick={onClose} disabled={busy}>
                            取消
                        </button>
                        <button className="rounded-xl bg-zinc-900 px-4 py-2 text-white disabled:opacity-60" onClick={exportPNG} disabled={busy}>
                            {busy ? '导出中…' : '完成并插入'}
                        </button>
                    </div>
                </div>

                {/* 画布容器 */}
                <div ref={wrapRef} className="h-[60vh] w-full overflow-hidden rounded-xl border bg-zinc-50">
                    <canvas
                        ref={canvasRef}
                        className="h-full w-full touch-none"
                        onPointerDown={pointerDown}
                        onPointerMove={pointerMove}
                        onPointerUp={pointerUp}
                        onPointerCancel={pointerUp}
                    />
                </div>
            </div>
        </div>
    );
}

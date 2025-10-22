// components/Paywall.tsx
'use client';
export default function Paywall({
    open,
    onClose,
    onPaid,
}: {
    open: boolean;
    onClose: () => void;
    onPaid: () => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60">
            <div className="mx-4 w-[92vw] max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="mb-2 text-xl font-semibold">解锁 AI 报告</h3>
                <p className="mb-4 text-sm text-zinc-600">
                    包含：对话要点、Self/Parts 概览、初步建议与练习建议，支持下载保存。
                </p>
                <ul className="mb-5 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                    <li>基于你的本次会话自动生成</li>
                    <li>更易复盘与持续跟进</li>
                    <li>后续可随时查看</li>
                </ul>
                <div className="flex items-center justify-between">
                    <button className="rounded-xl border px-4 py-2" onClick={onClose}>
                        取消
                    </button>

                    {/* 以下内容需要替换发起真实收银台的处理函数 */}
                    <button
                        className="rounded-xl bg-zinc-900 px-4 py-2 text-white"
                        onClick={onPaid}
                        title="模拟支付成功"
                    >
                        模拟支付成功
                    </button>
                </div>
            </div>
        </div>
    );
}

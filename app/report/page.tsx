'use client';

import { useEffect, useState } from 'react';
import { ApiService } from '@/lib/api';

type Report = {
    createdAt: string;
    sessionId?: string;
    parts: string[];
    self: string[];
    summary: string;
    suggestions: string[];
};

export default function ReportPage() {
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Try to load from localStorage first
        try {
            const raw = localStorage.getItem('zene_last_report');
            if (raw) setReport(JSON.parse(raw));
        } catch { }
    }, []);

    const generateReport = async () => {
        setLoading(true);
        try {
            // Get transcript from localStorage
            const transcript = JSON.parse(localStorage.getItem('zene_transcript') || '[]');
            
            // Extract parts and self from transcript (simplified)
            const parts: string[] = [];
            const self: string[] = [];
            
            // Get suggestions from API
            const suggestionsResult = await ApiService.getSuggestions(transcript, self, parts);
            
            const newReport: Report = {
                createdAt: new Date().toLocaleString('zh-CN'),
                parts,
                self,
                summary: '本次会话中，你通过多种方式表达了内心的感受。这是一个很好的开始。',
                suggestions: suggestionsResult.suggestions || [],
            };
            
            setReport(newReport);
            localStorage.setItem('zene_last_report', JSON.stringify(newReport));
        } catch (error) {
            console.error('Generate report failed:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!report) {
        return (
            <main className="mx-auto max-w-3xl p-6">
                <h1 className="mb-4 text-2xl font-semibold">报告</h1>
                <div className="text-center py-8">
                    <p className="text-zinc-600 mb-4">暂无可展示的报告</p>
                    <button
                        onClick={generateReport}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? '生成中...' : '生成报告'}
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-3xl p-6 space-y-6">
            <header className="flex items-baseline justify-between">
                <h1 className="text-2xl font-semibold">本次会话报告</h1>
                <span className="text-xs text-zinc-400">{report.createdAt}</span>
            </header>

            <section className="rounded-2xl border bg-white p-5">
                <h2 className="mb-2 text-lg font-medium">概览</h2>
                <p className="text-zinc-700">{report.summary}</p>
                {report.sessionId && (
                    <p className="mt-2 text-xs text-zinc-400">会话：{report.sessionId}</p>
                )}
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border bg-white p-5">
                    <h3 className="mb-2 font-medium">Self（特质）</h3>
                    {report.self.length ? (
                        <ul className="list-disc pl-5 text-zinc-700">
                            {report.self.map((s) => (
                                <li key={s}>{s}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-zinc-500">未检测到明显的 Self 特质。</p>
                    )}
                </div>
                <div className="rounded-2xl border bg-white p-5">
                    <h3 className="mb-2 font-medium">Parts（情绪/部分）</h3>
                    {report.parts.length ? (
                        <ul className="list-disc pl-5 text-zinc-700">
                            {report.parts.map((p) => (
                                <li key={p}>{p}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-zinc-500">未检测到明显的 Parts。</p>
                    )}
                </div>
            </section>

            <section className="rounded-2xl border bg-white p-5">
                <h3 className="mb-2 font-medium">建议</h3>
                <ul className="list-disc pl-5 text-zinc-700">
                    {report.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                    ))}
                </ul>
            </section>

            <div className="text-center">
                <button
                    onClick={generateReport}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                    {loading ? '重新生成中...' : '重新生成报告'}
                </button>
            </div>
        </main>
    );
}

'use client';
import NextSteps from '@/components/NextSteps';

export default function LinksLanding() {
    return (
        <main className="mx-auto max-w-3xl p-6 space-y-6">
            <h1 className="text-2xl font-semibold">继续探索</h1>
            <p className="text-zinc-600">
                这次我们先不生成报告。你可以从下面任意一个方向继续：
            </p>
            <NextSteps />
        </main>
    );
}

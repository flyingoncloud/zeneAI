// components/NextSteps.tsx
'use client';
import Link from 'next/link';

export default function NextSteps() {
    const items = [
        { key: 'a', title: 'A. AI 咨询师', desc: '你可以随时和 AI 咨询师对话，获得即时的回应和指引，让你在任何时间都不会感到孤单。', href: '/links/a' },
        { key: 'b', title: 'B. 专家陪伴服务', desc: '你也可以选择与⼼理咨询师/医⽣交流，获得另⼀种视⻆与⽀持。', href: '/links/b' },
        { key: 'c', title: 'C. 每⽇情绪追踪', desc: '⽤每天⼏分钟的⼩练习，逐渐形成属于⾃⼰的情⽤每天⼏分钟的⼩练习，逐渐形成属于⾃⼰的情绪成⻓⽇记。绪成⻓⽇记。', href: '/links/c' },
        { key: 'd', title: 'D. 个性化深度报告', desc: '想看到⾃⼰在不同阶段的变化和成⻓轨迹吗？深度报告能帮你梳理出清晰的路径。', href: '/links/d' },
    ];

    return (
        <section className="rounded-2xl border bg-white p-5">
            <h3 className="mb-3 text-lg font-medium">后续行动</h3>
            <div className="grid gap-3 sm:grid-cols-2">
                {items.map(it => (
                    <Link
                        key={it.key}
                        href={it.href}
                        className="rounded-xl border p-4 no-underline transition hover:bg-zinc-50"
                    >
                        <div className="mb-1 font-medium">{it.title}</div>
                        <div className="text-sm text-zinc-600">{it.desc}</div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

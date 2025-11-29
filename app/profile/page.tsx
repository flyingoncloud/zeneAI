// app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type BreathingType = 'box' | '478';

type User = {
    id: string;
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    preferredBreathing?: BreathingType | null;
};

type BreathingOption = {
    id: BreathingType;
    title: string;
    subtitle: string;
    description: string;
};

const BREATHING_OPTIONS: BreathingOption[] = [
    {
        id: 'box',
        title: '盒式呼吸',
        subtitle: '4-4-4-4',
        description: '四秒吸气、四秒停留、四秒呼气、四秒停顿，帮助神经系统回到稳定。',
    },
    {
        id: '478',
        title: '4-7-8 呼吸',
        subtitle: '4-7-8',
        description: '四秒吸气、七秒停留、八秒呼气，适合睡前或情绪比较难的时候。',
    },
];

// 后端接口：获取当前登录用户信息 GET /api/me
async function fetchCurrentUser(): Promise<User | null> {
    try {
        const res = await fetch('/api/me', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });

        if (!res.ok) {
            return null;
        }

        const data = await res.json();
        return (data && (data.user || data)) as User;
    } catch (e) {
        console.error('fetchCurrentUser error', e);
        return null;
    }
}

// 后端接口：更新用户呼吸偏好 PATCH /api/profile/breathing
// 请求体：{ preferredBreathing: 'box' | '478' }
async function updatePreferredBreathing(type: BreathingType) {
    const res = await fetch('/api/profile/breathing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferredBreathing: type }),
    });

    if (!res.ok) {
        throw new Error('failed to update preferredBreathing');
    }
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedBreathing, setSelectedBreathing] = useState<BreathingType>('box');
    const [previewBreathing, setPreviewBreathing] = useState<BreathingType | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            const u = await fetchCurrentUser();
            if (!cancelled) {
                setUser(u);
                setLoading(false);
                if (u && u.preferredBreathing) {
                    setSelectedBreathing(u.preferredBreathing);
                }
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleSetBreathing = async (id: BreathingType) => {
        try {
            setSaving(true);
            setError(null);
            await updatePreferredBreathing(id);
            setSelectedBreathing(id);
        } catch (e) {
            console.error(e);
            setError('保存呼吸偏好失败，请稍后再试。');
        } finally {
            setSaving(false);
        }
    };

    const goToFlow = () => {
        router.push('/flow?danmaku=1');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
                <p className="text-sm text-gray-500">正在加载个人资料…</p>
            </div>
        );
    }

    if (!user) {
        // 还没有接好登录/后端时的游客视图，占个位
        return (
            <div className="min-h-screen bg-white text-gray-900 px-4 py-10">
                <div className="mx-auto w-full max-w-2xl space-y-4">
                    <h1 className="text-2xl font-semibold">个人资料</h1>
                    <p className="text-sm text-gray-600">
                        当前还没有接入登录系统，你正在以游客模式使用 ZENE AI。
                        之后接入账号系统时，这里会显示你的账户信息和偏好设置。
                    </p>
                    <button
                        type="button"
                        onClick={goToFlow}
                        className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium bg-zinc-900 text-white hover:bg-black transition-colors"
                    >
                        返回内视涂鸦
                    </button>
                </div>
            </div>
        );
    }

    const displayName = user.name || user.email || '我的账号';


    return (
        <div className="min-h-screen bg-white text-gray-900 px-4 py-6">

            <div className="mx-auto w-full max-w-3xl space-y-6">
                <header className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden text-sm font-medium">
                            {user.avatarUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={user.avatarUrl}
                                    alt={displayName}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span>{displayName.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold">{displayName}</h1>
                            <p className="text-xs text-zinc-400">
                                情绪急救 · 内视涂鸦
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={goToFlow}
                        className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-medium border border-zinc-600 text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                        返回内视涂鸦
                    </button>
                </header>

                {error && (
                    <div className="rounded-2xl border border-red-400/40 bg-red-950/40 px-4 py-3 text-xs text-red-100">
                        {error}
                    </div>
                )}

                <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-4">
                    <div className="flex items-baseline justify-between gap-4">
                        <div>
                            <h2 className="text-base font-semibold">情绪急救设置</h2>
                            <p className="text-xs text-zinc-400 mt-1">
                                选择你更习惯的呼吸练习，作为进入网站时的默认情绪急救。
                            </p>
                        </div>
                        {saving && (
                            <span className="text-[11px] text-zinc-400">
                                正在保存…
                            </span>
                        )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        {BREATHING_OPTIONS.map((opt) => {
                            const active = selectedBreathing === opt.id;

                            return (
                                <div
                                    key={opt.id}
                                    className={`rounded-2xl border p-4 space-y-3 ${active
                                        ? 'border-zinc-100 bg-zinc-50 text-zinc-900'
                                        : 'border-zinc-700 bg-zinc-900'
                                        }`}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <div>
                                            <h3 className="text-sm font-semibold">
                                                {opt.title}
                                            </h3>
                                            <p className="text-xs text-zinc-400 mt-0.5">
                                                {opt.subtitle}
                                            </p>
                                        </div>
                                        {active && (
                                            <span className="text-[11px] rounded-full bg-zinc-900 text-zinc-50 px-2 py-0.5">
                                                当前默认
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs ${active ? 'text-zinc-700' : 'text-zinc-400'}`}>
                                        {opt.description}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewBreathing(opt.id)}
                                            className={`rounded-full px-3 py-1 border ${active
                                                ? 'border-zinc-800 text-zinc-900 hover:bg-zinc-200'
                                                : 'border-zinc-600 text-zinc-200 hover:bg-zinc-800'
                                                } transition-colors`}
                                        >
                                            预览视频
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleSetBreathing(opt.id)}
                                            disabled={active || saving}
                                            className={`rounded-full px-3 py-1 ${active
                                                ? 'bg-zinc-300 text-zinc-800 cursor-default'
                                                : 'bg-zinc-50 text-zinc-900 hover:bg-white'
                                                } text-xs font-medium transition-colors disabled:opacity-60`}
                                        >
                                            {active ? '已设为默认' : '设为默认'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 space-y-3">
                    <h2 className="text-base font-semibold">内视涂鸦</h2>
                    <p className="text-xs text-zinc-400">
                        进入与 ZENE AI 的深度对话，可以配合画板、情绪记录和弹幕，一起探索你内在的小宇宙。
                    </p>
                    <button
                        type="button"
                        onClick={goToFlow}
                        className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-medium bg-zinc-50 text-zinc-900 hover:bg-white transition-colors"
                    >
                        进入内视涂鸦
                    </button>
                </section>
            </div>

            {previewBreathing && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-xl rounded-3xl border border-zinc-700 bg-zinc-900 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                                    预览
                                </p>
                                <h3 className="text-sm font-semibold">
                                    {previewBreathing === 'box' ? '盒式呼吸' : '4-7-8 呼吸'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setPreviewBreathing(null)}
                                className="rounded-full px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800"
                            >
                                关闭
                            </button>
                        </div>
                        <div className="rounded-2xl overflow-hidden border border-zinc-700 bg-black">
                            <video
                                key={previewBreathing}
                                src={
                                    previewBreathing === '478'
                                        ? '/videos/breathing-478.mp4'
                                        : '/videos/breathing-box.mp4'
                                }
                                className="w-full h-auto"
                                loop
                                autoPlay
                                playsInline
                                controls
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

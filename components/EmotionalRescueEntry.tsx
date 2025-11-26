// components/EmotionalRescueEntry.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type BreathingType = 'box' | '478';

type User = {
    id: string;
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
    preferredBreathing?: BreathingType | null;
};

type EmotionOption = {
    id: string;
    emoji: string;
    label: string;
};

const EMOTION_OPTIONS: EmotionOption[] = [
    { id: 'happy', emoji: '😄', label: '开心' },
    { id: 'calm', emoji: '😊', label: '平静' },
    { id: 'grateful', emoji: '🙏', label: '感激' },
    { id: 'relaxed', emoji: '😌', label: '放松' },
    { id: 'hopeful', emoji: '🤗', label: '有希望' },

    { id: 'sad', emoji: '😢', label: '难过' },
    { id: 'lonely', emoji: '🥺', label: '孤单' },
    { id: 'tired', emoji: '🥱', label: '疲惫' },
    { id: 'overwhelmed', emoji: '😵‍💫', label: '太多了' },
    { id: 'empty', emoji: '😶', label: '空空的' },

    { id: 'angry', emoji: '😡', label: '生气' },
    { id: 'frustrated', emoji: '😤', label: '挫败' },
    { id: 'impatient', emoji: '⏰', label: '不耐烦' },
    { id: 'jealous', emoji: '😒', label: '吃醋' },
    { id: 'disgusted', emoji: '🤢', label: '厌恶' },

    { id: 'anxious', emoji: '😰', label: '焦虑' },
    { id: 'worried', emoji: '😟', label: '担心' },
    { id: 'guilty', emoji: '😔', label: '内疚' },
    { id: 'shame', emoji: '🙈', label: '羞耻' },
    { id: 'nervous', emoji: '😬', label: '紧张' },

    { id: 'excited', emoji: '🤩', label: '兴奋' },
    { id: 'curious', emoji: '🧐', label: '好奇' },
    { id: 'proud', emoji: '😎', label: '自豪' },
    { id: 'mixed', emoji: '🌀', label: '复杂' },
    { id: 'numb', emoji: '🧊', label: '麻木' },
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

type BreathingStepProps = {
    breathingType: BreathingType;
    onFinish: () => void;
};

function BreathingStep({ breathingType, onFinish }: BreathingStepProps) {
    const [hasCompletedOnce, setHasCompletedOnce] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [muted, setMuted] = useState(true);

    const videoSrc =
        breathingType === '478'
            ? '/videos/breathing-478.mp4'
            : '/videos/breathing-box.mp4';

    const label = hasCompletedOnce ? '继续' : '跳过';

    const handleEnded = () => {
        setHasCompletedOnce(true);
        const video = videoRef.current;
        if (video) {
            video.currentTime = 0;
            video.play().catch(() => {
            });
        }
    };

    const handleClick = async () => {
        try {
            const type = hasCompletedOnce ? 'breathing_completed_once' : 'breathing_skipped';

            await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, source: 'entry_breathing' }),
            });
        } catch (e) {
            console.warn('record breathing event failed', e);
        } finally {
            onFinish();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 px-4">
            <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white shadow-xl p-6 space-y-6">

                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Step 1</p>
                    <h1 className="text-2xl font-semibold">
                        先一起做一轮{breathingType === '478' ? ' 4-7-8 呼吸' : ' 盒式呼吸'}
                    </h1>
                    <p className="text-sm text-zinc-400">
                        跟着视频的节奏吸气、停留、呼气。你可以重复多轮，当你准备好时点击下面的按钮进入下一步。
                    </p>
                </div>

                <div className="rounded-2xl overflow-hidden border border-gray-200 bg-black/5">
                    <video
                        ref={videoRef}
                        key={videoSrc}
                        src={videoSrc}
                        className="w-full max-h-[480px] object-contain"
                        autoPlay
                        muted={muted}
                        playsInline
                        controls={false}
                        onEnded={handleEnded}
                    />
                </div>

                <div className="flex flex-col items-center gap-3">
                    <button
                        type="button"
                        onClick={handleClick}
                        className="inline-flex items-center justify-center rounded-full px-8 py-2.5 text-sm font-medium bg-zinc-50 text-zinc-900 hover:bg-white transition-colors"
                    >
                        {label}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const video = videoRef.current;
                            if (video) {
                                video.muted = !video.muted;
                                setMuted(video.muted);
                            }
                        }}
                        className="text-[11px] text-zinc-400 hover:text-zinc-600"
                    >
                        {muted ? '打开声音' : '静音'}
                    </button>
                </div>

            </div>
        </div>
    );
}

type EmotionStepProps = {
    onDone: () => void;
};

function EmotionStep({ onDone }: EmotionStepProps) {
    const handleSelect = async (opt: EmotionOption) => {
        try {
            // 后端接口：记录用户选择的情绪标签 POST /api/emotion
            // 请求体示例：{ emotionId, emoji, label, source: 'entry_breathing' }
            await fetch('/api/emotion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emotionId: opt.id,
                    emoji: opt.emoji,
                    label: opt.label,
                    source: 'entry_breathing',
                }),
            });
        } catch (e) {
            console.warn('record emotion failed', e);
        } finally {
            onDone();
        }
    };

    const handleSkip = async () => {
        try {
            await fetch('/api/emotion/skip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source: 'entry_breathing' }),
            });
        } catch (e) {
            console.warn('skip emotion failed', e);
        } finally {
            onDone();
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white text-gray-900 px-4">
            <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white shadow-xl p-6 space-y-6">
                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Step 2</p>
                    <h1 className="text-2xl font-semibold">帮自己给情绪取个名字</h1>
                    <p className="text-sm text-zinc-400">
                        不用思考太久，选择此刻最接近你的感受就好。
                    </p>
                </div>

                <div className="grid grid-cols-5 gap-2">
                    {EMOTION_OPTIONS.map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelect(opt)}
                            className="aspect-square rounded-2xl border border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 transition-colors flex flex-col items-center justify-center text-sm"
                        >
                            <span className="text-2xl mb-1">{opt.emoji}</span>
                            <span className="text-[11px] text-gray-700">{opt.label}</span>
                        </button>
                    ))}
                </div>

                <div className="flex flex-col items-center gap-3">
                    <button
                        type="button"
                        onClick={handleSkip}
                        className="inline-flex items-center justify-center rounded-full px-6 py-2 text-xs font-medium border border-zinc-600 text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                        跳过这一步，直接进入内视涂鸦
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function EmotionalRescueEntry() {
    const router = useRouter();
    const [step, setStep] = useState<'breathing' | 'emotion'>('breathing');
    // 目前手动换成478
    const [breathingType, setBreathingType] = useState<BreathingType>('box');

    useEffect(() => {
        let cancelled = false;

        const loadUser = async () => {
            const user = await fetchCurrentUser();
            if (!cancelled && user && user.preferredBreathing) {
                setBreathingType(user.preferredBreathing);
            }
        };

        loadUser();

        return () => {
            cancelled = true;
        };
    }, []);

    const goToEmotion = () => {
        setStep('emotion');
    };

    const goToFlow = () => {
        router.push('/flow?danmaku=1');
    };

    if (step === 'breathing') {
        return <BreathingStep breathingType={breathingType} onFinish={goToEmotion} />;
    }

    return <EmotionStep onDone={goToFlow} />;
}

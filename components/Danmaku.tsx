"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** 情绪和配色（可按需再调） */
type Mood =
    | "joy" | "love" | "gratitude" | "pride" | "excitement" | "calm" | "relief" | "hope"
    | "sadness" | "anxiety" | "stress" | "fatigue" | "overwhelm" | "lonely"
    | "anger" | "frustration" | "shame" | "guilt" | "jealousy" | "envy"
    | "confusion" | "bored" | "neutral";

type MsgInput = string | { text: string; mood?: Mood };

type Props = {
    open: boolean;
    messages: MsgInput[];
    onFinish: () => void;

    /** 本次最多发射多少条，防止过密（默认 28） */
    maxMessages?: number;
    /** 最大轨道数（默认 14；会受屏高自适应约束） */
    maxLanes?: number;
    /** 每条动画时长范围（秒），默认 [10, 18] */
    durationRange?: [number, number];
    /** 同一轨道相邻两条最小像素间隔（默认 80px，越大越不重叠） */
    laneMinGapPx?: number;
};

const MOOD_COLOR: Record<Mood, string> = {
    joy: "#22c55e",
    love: "#ec4899",
    gratitude: "#16a34a",
    pride: "#0ea5e9",
    excitement: "#f59e0b",
    calm: "#64748b",
    relief: "#14b8a6",
    hope: "#84cc16",
    sadness: "#3b82f6",
    anxiety: "#f59e0b",
    stress: "#7c3aed",
    fatigue: "#9333ea",
    overwhelm: "#ef4444",
    lonely: "#0ea5e9",
    anger: "#ef4444",
    frustration: "#f97316",
    shame: "#6b7280",
    guilt: "#57534e",
    jealousy: "#06b6d4",
    envy: "#10b981",
    confusion: "#64748b",
    bored: "#9ca3af",
    neutral: "#6b7280",
};

function tagMood(t: string): Mood {
    const s = t.toLowerCase();
    const hit = (ks: string[]) => ks.some(k => s.includes(k));
    if (hit(["开心", "快乐", "喜悦", "惊喜", "顺利", "offer", "通过", "升职", "表扬"])) return "joy";
    if (hit(["恋爱", "拥抱", "被爱", "告白", "牵手", "喜欢", "约会"])) return "love";
    if (hit(["感谢", "谢谢", "感恩"])) return "gratitude";
    if (hit(["自豪", "骄傲", "第一", "满分", "获奖", "award"])) return "pride";
    if (hit(["期待", "兴奋", "倒计时", "旅行", "演唱会"])) return "excitement";
    if (hit(["平静", "放松", "冥想", "散步", "咖啡", "读书", "安静"])) return "calm";
    if (hit(["松一口气", "如释重负", "终于结束", "放下"])) return "relief";
    if (hit(["希望", "盼望", "向往", "明天会更好"])) return "hope";
    if (hit(["难过", "伤心", "失恋", "想哭", "失望", "沮丧"])) return "sadness";
    if (hit(["焦虑", "担心", "害怕", "紧张", "心慌", "panic"])) return "anxiety";
    if (hit(["压力", "加班", "deadline", "ddl", "考核", "kpi"])) return "stress";
    if (hit(["累", "疲惫", "困", "熬夜", "通宵"])) return "fatigue";
    if (hit(["崩溃", "顶不住", "太多", "压垮", "overwhelm"])) return "overwhelm";
    if (hit(["孤独", "一个人", "没人", "空荡"])) return "lonely";
    if (hit(["生气", "愤怒", "气死", "吵架", "被骂"])) return "anger";
    if (hit(["挫败", "卡住", "不顺", "堵车", "排队"])) return "frustration";
    if (hit(["丢脸", "尴尬", "社恐", "怯场"])) return "shame";
    if (hit(["内疚", "愧疚", "对不起", "拖累"])) return "guilt";
    if (hit(["嫉妒", "羡慕", "envy"])) return "envy";
    if (hit(["吃醋", "占有欲"])) return "jealousy";
    if (hit(["迷茫", "搞不懂", "糊涂", "方向在哪"])) return "confusion";
    if (hit(["无聊", "boring", "百无聊赖"])) return "bored";
    return "neutral";
}

export default function Danmaku({
    open,
    messages,
    onFinish,
    maxMessages = 28,
    maxLanes = 14,
    durationRange = [10, 18],
    laneMinGapPx = 80,
}: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // 规范化 + 打标签 + 打乱 + 采样
    const data = useMemo(() => {
        const arr = messages.map((m) => {
            if (typeof m === "string") {
                const mood = tagMood(m);
                return { text: m, mood };
            } else if (m && typeof m === "object" && typeof m.text === "string") {
                const mood = m.mood ?? tagMood(m.text);
                return { text: m.text, mood };
            } else {
                // Fallback for invalid data
                console.warn("Invalid message format:", m, typeof m);
                return { text: String(m), mood: "neutral" as Mood };
            }
        });
        
        // Multiple shuffles for better randomization
        shuffle(arr);
        shuffle(arr);
        
        return arr.slice(0, Math.min(maxMessages, arr.length));
    }, [messages, maxMessages, Date.now()]); // Add timestamp to force re-randomization

    const finished = useRef(0);
    const total = data.length;

    // 屏幕尺寸（客户端安全）
    const [dimensions, setDimensions] = useState({ vw: 1200, vh: 800 });
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setDimensions({ vw: window.innerWidth, vh: window.innerHeight });
        }
    }, []);

    const { vw, vh } = dimensions;

    // 轨道：自适应高度 + 充分覆盖全屏
    const laneH = clamp(vh * 0.045, 26, 46);              // 每行高度
    const lanes = Math.min(maxLanes, Math.max(4, Math.floor(vh / laneH))); // 行数
    const topPad = laneH * 0.15;                          // 顶部少量留白（不是半屏起）

    /** 预排程：同一轨道“防碰撞”，尽量不重叠 */
    type Planned = { text: string; mood: Mood; lane: number; delay: number; dur: number; offset: number };
    const planned: Planned[] = [];
    const nextFreeTime: number[] = Array(lanes).fill(0);  // 每条轨道“最早可发射时间”（s）

    for (const m of data) {
        // 估算文本宽度 & 随机时长
        const w = 50 + m.text.length * 16;                 // 粗估文本宽
        const dur = rand(durationRange[0], durationRange[1]);
        const dist = vw + 24 + w;                           // 运动总距离（px）
        const speed = dist / dur;                           // px/s

        // 选择“最早可用”的轨道，并在其基础上加一点随机抖动
        let lane = 0;
        for (let i = 1; i < lanes; i++) if (nextFreeTime[i] < nextFreeTime[lane]) lane = i;
        const baseDelay = nextFreeTime[lane];
        const delay = baseDelay + rand(0, 0.6);             // 轻微错峰
        const offset = Math.floor(rand(0, 240));            // 初始右侧偏移，避免起跑太齐

        // 更新该轨道的 nextFreeTime：需等上一条让出“自身宽度 + 最小间隔”
        const gapTime = (w + laneMinGapPx) / speed;         // 该轨道最小间隔对应的时间
        nextFreeTime[lane] = delay + gapTime;

        planned.push({ text: m.text, mood: m.mood, lane, delay, dur, offset });
    }

    if (!mounted || !open) return null;
    // —— 用 Portal 渲染到 body（避免 Hydration mismatch）——
    return createPortal(
        <>
            <div className="fixed inset-0 z-[300] pointer-events-none select-none">
                {planned.map((p, idx) => {
                    const top = topPad + p.lane * laneH;
                    const start = `calc(100vw + ${p.offset}px)`;
                    const opacity = clamp(1 - p.lane * 0.035, 0.75, 1); // 行越靠下透明度略降，层次更柔和
                    const weight = p.lane % 3 === 0 ? 700 : 600;        // 行内粗细微调
                    const color = MOOD_COLOR[p.mood];

                    return (
                        <div
                            key={idx}
                            className="absolute left-0 top-0 whitespace-nowrap"
                            style={{
                                top,
                                color,
                                fontWeight: weight as any,
                                fontSize: "clamp(14px, 2vw, 22px)",
                                lineHeight: 1.25,
                                opacity,
                                // 延迟期间先放在屏外右侧，避免“左边堆一坨”
                                transform: `translate3d(${start}, 0, 0)`,
                                ["--dm-start" as any]: start,
                                // 细描边 + 轻阴影，保证任何背景上都清晰
                                WebkitTextStroke: "0.8px rgba(0,0,0,0.55)",
                                textShadow: "0 1px 1px rgba(0,0,0,0.25)",
                                // 动画
                                animationName: "dm-move",
                                animationDuration: `${p.dur}s`,
                                animationTimingFunction: "linear",
                                animationDelay: `${p.delay}s`,
                                animationIterationCount: 1,
                                animationFillMode: "forwards",
                                willChange: "transform",
                                padding: "0 8px",
                            }}
                            onAnimationEnd={() => {
                                finished.current += 1;
                                if (finished.current >= total) onFinish();
                            }}
                        >
                            {p.text}
                        </div>
                    );
                })}
            </div>

            <style jsx>{`
        @keyframes dm-move {
          0%   { transform: translate3d(var(--dm-start, 100vw), 0, 0); }
          100% { transform: translate3d(calc(-100% - 24px), 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation-name: dm-move"] {
            animation-duration: 8s !important;
          }
        }
      `}</style>
        </>,
        document.body
    );
}

/* 小工具 */
function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function shuffle<T>(arr: T[]) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[arr[i], arr[j]] = [arr[j], arr[i]]; } }

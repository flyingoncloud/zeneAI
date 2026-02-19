import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { cn } from '../../ui/utils';

// --- Configuration ---
const MAX_BUBBLES = 12;
const MIN_BUBBLES = 6;
const SPAWN_INTERVAL = 1800; // ms

// Mobile-specific config
const MOBILE_BREAKPOINT = 768;
const MOBILE_SPEED = 140; // px/s
const MOBILE_MIN_DURATION = 8;
const MOBILE_MAX_DURATION = 18;
const MOBILE_TRACK_COUNT = 4;
// Track → zone mapping: tracks 0,1 = top zone; tracks 2,3 = bottom zone
const MOBILE_TRACK_ZONE: ('top' | 'bottom')[] = ['top', 'top', 'bottom', 'bottom'];
// Track position as % within its own zone container
const MOBILE_TRACK_ZONE_POSITIONS = [25, 65, 25, 68]; // % within zone
const MOBILE_TRACK_MIN_GAP = 2200; // ms – same track minimum delay

// --- Messages ---
const MESSAGES = [
  "DDL快到了，心跳加速",
  "KPI 压在头上，喘不过气",
  "看见同龄人的成就，有点慌",
  "睡前脑子停不下来",
  "喜欢的人已读不回",
  "爸妈又不理解我",
  "不知道下一步该怎么走",
  "愿意听我说的人不多",
  "好想有个树洞",
  "先把自己抱住",
  "我被裁员了！",
  "突然发现父母老了！泪目了",
  "看错人了！这个所谓好友今天终于背刺了我",
  "钱到用时方恨少！我背负的网贷让我无法安睡",
  "我不喜欢我父亲！他总是强势支使我做事",
  "我母亲不尊重我！最近老骂我不成器",
  "我没脸进教室了！最近考试考太糟糕了",
  "不知道今后该干啥！迷茫中",
  "今天街上被一个痞子拦住抢了钱"
];

interface BubbleData {
  id: string;
  text: string;
  left: number; // percentage 0-100 (desktop)
  duration: number; // seconds
  sway: number; // pixels (desktop)
  delay: number; // seconds
  colorHue: number;
  size: 'normal' | 'large';
  // Mobile-specific
  track?: number; // 0 | 1 | 2
  estimatedWidth?: number; // px
}

export const SplashDanmakuLayer: React.FC = () => {
  const { messages, addMessage, setDanmakuPreviewText } = useZenemeStore();
  
  // Only show when there are no messages (Welcome State)
  const isWelcomeState = messages.length === 0;

  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const bubblesRef = useRef<BubbleData[]>([]); // Ref for instant access in interval
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Mobile detection ---
  const [isMobile, setIsMobile] = useState(false);
  const isMobileRef = useRef(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      isMobileRef.current = mobile;
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Track-based spawn timing for mobile (last spawn timestamp per track)
  const trackLastSpawnRef = useRef<number[]>([0, 0, 0, 0]);

  // --- Estimate bubble width from text ---
  const estimateBubbleWidth = (text: string, size: 'normal' | 'large') => {
    const charW = size === 'large' ? 15 : 14;
    // px-4 = 32px horizontal padding
    return text.length * charW + 40;
  };

  // --- Spawner Logic ---
  const spawnBubble = useCallback(() => {
    if (!isWelcomeState) return;
    if (bubblesRef.current.length >= MAX_BUBBLES) return;

    const mobile = isMobileRef.current;

    if (mobile) {
      // ====== MOBILE: right-to-left on tracks ======
      const now = Date.now();
      // Find tracks with enough gap since last spawn
      const availableTracks: number[] = [];
      for (let i = 0; i < MOBILE_TRACK_COUNT; i++) {
        if (now - trackLastSpawnRef.current[i] >= MOBILE_TRACK_MIN_GAP) {
          availableTracks.push(i);
        }
      }
      if (availableTracks.length === 0) return; // All tracks busy

      const track = availableTracks[Math.floor(Math.random() * availableTracks.length)];
      trackLastSpawnRef.current[track] = now;

      const text = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      const isLarge = Math.random() > 0.7;
      const size: 'normal' | 'large' = isLarge ? 'large' : 'normal';
      const estimatedWidth = estimateBubbleWidth(text, size);

      const screenWidth = window.innerWidth;
      let duration = (screenWidth + estimatedWidth + 32) / MOBILE_SPEED;
      duration = Math.max(MOBILE_MIN_DURATION, Math.min(MOBILE_MAX_DURATION, duration));

      const colorHue = 230 + Math.random() * 40;

      const newBubble: BubbleData = {
        id: Math.random().toString(36).substring(7),
        text,
        left: 0,
        duration,
        sway: 0,
        delay: 0,
        colorHue,
        size,
        track,
        estimatedWidth,
      };

      setBubbles(prev => {
        const next = [...prev, newBubble];
        bubblesRef.current = next;
        return next;
      });

    } else {
      // ====== DESKTOP: existing bottom-to-top logic ======
      const text = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

      const isLeft = Math.random() > 0.5;
      let candidateLeft = 0;
      if (isLeft) {
        candidateLeft = 5 + Math.random() * 25; 
      } else {
        candidateLeft = 70 + Math.random() * 25;
      }

      const tooClose = bubblesRef.current.some(b => Math.abs(b.left - candidateLeft) < 12);
      if (tooClose) return;

      const duration = 15 + Math.random() * 10;
      const sway = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 40);
      const colorHue = 230 + Math.random() * 40;

      const newBubble: BubbleData = {
        id: Math.random().toString(36).substring(7),
        text,
        left: candidateLeft,
        duration,
        sway,
        delay: 0,
        colorHue,
        size: Math.random() > 0.7 ? 'large' : 'normal',
      };

      setBubbles(prev => {
        const next = [...prev, newBubble];
        bubblesRef.current = next;
        return next;
      });
    }
  }, [isWelcomeState]);

  // --- Lifecycle ---
  useEffect(() => {
    // 1. 如果不在 welcome 状态，直接跳过不执行任何操作
    if (!isWelcomeState) return;

    // 2. 初始化：批量生成初始气泡
    const initialCount = 4;
    for(let i=0; i<initialCount; i++) {
        setTimeout(spawnBubble, i * 300);
    }

    // 3. 设置循环：定时生成气泡
    spawnTimerRef.current = setInterval(spawnBubble, SPAWN_INTERVAL);

    return () => {
        if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
        // 将重置状态和 refs 的操作放在这里，而不是在 effect 主体中同步调用
        setBubbles([]);
        bubblesRef.current = [];
        trackLastSpawnRef.current = [0, 0, 0, 0];
    };
  }, [isWelcomeState, spawnBubble]);

  // --- Handlers ---
  const handleBubbleClick = (e: React.MouseEvent, bubble: BubbleData) => {
    if (isMobile) return; // Mobile bubbles are non-interactive
    e.stopPropagation();
    addMessage(bubble.text, 'user');
    setDanmakuPreviewText(null);
    
    setBubbles(prev => {
        const next = prev.filter(b => b.id !== bubble.id);
        bubblesRef.current = next;
        return next;
    });
  };

  const handleMouseEnter = (text: string) => {
    if (isMobile) return;
    setDanmakuPreviewText(text);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setDanmakuPreviewText(null);
  };

  const handleAnimationEnd = (id: string) => {
    setBubbles(prev => {
        const next = prev.filter(b => b.id !== id);
        bubblesRef.current = next;
        return next;
    });
  };

  if (!isWelcomeState) return null;

  // --- Mobile: split bubbles into two zones ---
  const topBubbles = bubbles.filter(b => MOBILE_TRACK_ZONE[b.track ?? 0] === 'top');
  const bottomBubbles = bubbles.filter(b => MOBILE_TRACK_ZONE[b.track ?? 0] === 'bottom');

  const renderMobileBubble = (bubble: BubbleData) => {
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 400;
    const bw = bubble.estimatedWidth ?? 200;
    const travel = -(screenW + bw + 32);

    return (
      <div
        key={bubble.id}
        className="danmaku-bubble-mobile"
        style={{
          left: `calc(100% + 16px)`,
          top: `${MOBILE_TRACK_ZONE_POSITIONS[bubble.track ?? 0]}%`,
          '--travel': `${travel}px`,
          animationDuration: `${bubble.duration}s`,
          animationDelay: '0s',
        } as React.CSSProperties}
        onAnimationEnd={() => handleAnimationEnd(bubble.id)}
      >
        <div
          className={cn(
            "px-4 py-2.5 rounded-full border shadow-lg backdrop-blur-sm whitespace-nowrap",
            "bg-slate-900/60 border-white/10 text-slate-200"
          )}
          style={{
            fontSize: bubble.size === 'large' ? '15px' : '14px',
            lineHeight: '1.4',
          }}
        >
          {bubble.text}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          /* ===== Desktop: bottom → top ===== */
          @keyframes floatUp {
            0% {
              bottom: -60px;
              transform: translateX(0) scale(0.85);
              opacity: 0;
            }
            15% {
              opacity: 1;
              transform: translateX(calc(var(--sway) * 0.2)) scale(0.9);
            }
            50% {
              transform: translateX(var(--sway)) scale(1.15);
            }
            85% {
              opacity: 1;
              transform: translateX(calc(var(--sway) * 0.5)) scale(0.8);
            }
            100% {
              bottom: 110vh;
              transform: translateX(0) scale(0.6);
              opacity: 0;
            }
          }

          /* ===== Mobile: right → left ===== */
          @keyframes scrollLeft {
            0% {
              transform: translateX(0);
              opacity: 0;
            }
            3% {
              opacity: 1;
            }
            92% {
              opacity: 1;
            }
            100% {
              transform: translateX(var(--travel));
              opacity: 0;
            }
          }
          
          /* Desktop bubble */
          .danmaku-bubble-desktop {
            position: absolute;
            will-change: transform, bottom, opacity;
            animation-name: floatUp;
            animation-timing-function: linear;
            animation-fill-mode: forwards;
            cursor: pointer;
            user-select: none;
            z-index: 10;
            transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s, filter 0.2s;
          }
          .danmaku-bubble-desktop:hover {
            animation-play-state: paused;
            z-index: 50;
            filter: brightness(1.2);
          }

          /* Mobile bubble */
          .danmaku-bubble-mobile {
            position: absolute;
            will-change: transform, opacity;
            animation-name: scrollLeft;
            animation-timing-function: linear;
            animation-fill-mode: forwards;
            pointer-events: none;
            user-select: none;
            z-index: 10;
          }
        `}
      </style>

      {isMobile ? (
        <>
          {/* ===== Zone A — Top safe area (below nav, above title) ===== */}
          <div
            className="absolute left-0 right-0 overflow-hidden pointer-events-none"
            style={{
              top: 'calc(69px + env(safe-area-inset-top, 0px))',
              height: 'clamp(100px, 16vh, 160px)',
              zIndex: 1,
            }}
          >
            {topBubbles.map(renderMobileBubble)}
          </div>

          {/* ===== Zone B — Bottom safe area (below cards, above home indicator) ===== */}
          <div
            className="absolute left-0 right-0 overflow-hidden pointer-events-none"
            style={{
              bottom: 'calc(69px + env(safe-area-inset-bottom, 0px))',
              height: 'clamp(130px, 22vh, 200px)',
              zIndex: 1,
            }}
          >
            {bottomBubbles.map(renderMobileBubble)}
          </div>
        </>
      ) : (
        /* ===== Desktop: full-screen container (unchanged) ===== */
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {bubbles.map(bubble => (
            <div
              key={bubble.id}
              className="danmaku-bubble-desktop pointer-events-auto"
              style={{
                left: `${bubble.left}%`,
                '--sway': `${bubble.sway}px`,
                animationDuration: `${bubble.duration}s`,
                animationDelay: '0s',
              } as React.CSSProperties}
              onClick={(e) => handleBubbleClick(e, bubble)}
              onMouseEnter={() => handleMouseEnter(bubble.text)}
              onMouseLeave={handleMouseLeave}
              onAnimationEnd={() => handleAnimationEnd(bubble.id)}
            >
              <div 
                className={cn(
                  "px-4 py-2.5 rounded-full border shadow-lg backdrop-blur-sm transition-all duration-300",
                  "bg-slate-900/60 border-white/10 text-slate-200",
                  "hover:bg-violet-600/90 hover:border-violet-400 hover:text-white hover:shadow-violet-500/30"
                )}
                style={{
                  maxWidth: '220px',
                  fontSize: bubble.size === 'large' ? '15px' : '14px',
                  lineHeight: '1.4',
                }}
              >
                {bubble.text}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
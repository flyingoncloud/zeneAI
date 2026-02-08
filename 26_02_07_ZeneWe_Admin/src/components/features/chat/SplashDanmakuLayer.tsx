import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { cn } from '../../ui/utils';

// --- Configuration ---
const MAX_BUBBLES = 12;
const MIN_BUBBLES = 6;
const SPAWN_INTERVAL = 1800; // ms

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
  left: number; // percentage 0-100
  duration: number; // seconds
  sway: number; // pixels
  delay: number; // seconds
  colorHue: number;
  size: 'normal' | 'large'; // logic handled in CSS/transform
}

export const SplashDanmakuLayer: React.FC = () => {
  const { messages, addMessage, setDanmakuPreviewText } = useZenemeStore();
  
  // Only show when there are no messages (Welcome State)
  const isWelcomeState = messages.length === 0;

  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const bubblesRef = useRef<BubbleData[]>([]); // Ref for instant access in interval
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Spawner Logic ---
  const spawnBubble = useCallback(() => {
    if (!isWelcomeState) return;
    if (bubblesRef.current.length >= MAX_BUBBLES) return;

    // 1. Text
    const text = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

    // 2. Position (Left/Right Lanes to avoid center input)
    // Left Lane: 5% - 30%
    // Right Lane: 70% - 95%
    // Center Gap: 30% - 70% (40% width)
    const isLeft = Math.random() > 0.5;
    let candidateLeft = 0;
    
    if (isLeft) {
      candidateLeft = 5 + Math.random() * 25; 
    } else {
      candidateLeft = 70 + Math.random() * 25;
    }

    // 3. Collision Check (X-axis proximity with recent bubbles)
    // Since they move vertically, we mostly care about not stacking them on the same X line immediately.
    // We check against all currently active bubbles.
    const tooClose = bubblesRef.current.some(b => Math.abs(b.left - candidateLeft) < 12); // 12% gap
    if (tooClose) {
        // Retry once with the other lane? No, just skip to avoid clutter.
        return; 
    }

    // 4. Attributes
    const duration = 15 + Math.random() * 10; // 15-25s slow float
    const sway = (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 40); // -60px to 60px
    const colorHue = 230 + Math.random() * 40; // Violet/Purple range

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

  }, [isWelcomeState]);

  // --- Lifecycle ---
  useEffect(() => {
    if (!isWelcomeState) {
        setBubbles([]);
        bubblesRef.current = [];
        return;
    }

    // Initial Batch
    const initialCount = 4;
    for(let i=0; i<initialCount; i++) {
        setTimeout(spawnBubble, i * 300);
    }

    // Loop
    spawnTimerRef.current = setInterval(spawnBubble, SPAWN_INTERVAL);

    return () => {
        if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    };
  }, [isWelcomeState, spawnBubble]);

  // --- Handlers ---
  const handleBubbleClick = (e: React.MouseEvent, bubble: BubbleData) => {
    e.stopPropagation();
    addMessage(bubble.text, 'user');
    setDanmakuPreviewText(null); // Clear preview immediately
    
    // Remove bubble visual immediately
    setBubbles(prev => {
        const next = prev.filter(b => b.id !== bubble.id);
        bubblesRef.current = next;
        return next;
    });
  };

  const handleMouseEnter = (text: string) => {
    setDanmakuPreviewText(text);
  };

  const handleMouseLeave = () => {
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

  return (
    <>
      <style>
        {`
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
              transform: translateX(var(--sway)) scale(1.15); /* Midpoint Enlarge */
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
          
          .danmaku-bubble {
            position: absolute;
            will-change: transform, bottom, opacity;
            animation-name: floatUp;
            animation-timing-function: linear; /* Smooth linear vertical progress, sway handled by keyframes */
            animation-fill-mode: forwards;
            cursor: pointer;
            user-select: none;
            z-index: 10;
            transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s, filter 0.2s;
          }

          /* Hover Interaction */
          .danmaku-bubble:hover {
            animation-play-state: paused; /* FREEZE! */
            z-index: 50; /* Bring to top */
            filter: brightness(1.2);
          }
        `}
      </style>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {bubbles.map(bubble => (
          <div
            key={bubble.id}
            className="danmaku-bubble pointer-events-auto"
            style={{
              left: `${bubble.left}%`,
              // Using CSS variables for the animation
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
    </>
  );
};

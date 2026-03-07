import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useZenemeStore } from '@/hooks/useZenemeStore';
import { motion, AnimatePresence } from 'motion/react';

const BUBBLE_TEXTS = [
  "感觉很累", "想要放松", "压力好大", "睡不着", "有点焦虑",
  "寻求平静", "期待美好", "深呼吸", "想找人聊聊", "迷茫",
  "需要安慰", "开心不起来", "这是什么？", "治愈自己", "emo了"
];

const MAX_BUBBLES = 12;
const SPAWN_INTERVAL = 1200;

interface Bubble {
  id: number;
  text: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  swayAmplitude: number;
  swayFrequency: number;
  swayPhase: number;
  swayX: number;
  opacity: number;
  isClicking: boolean;
}

export const WelcomeDanmaku: React.FC = () => {
  const { enterGuestMode } = useAuthStore();
  const { addMessage, setCurrentView } = useZenemeStore();

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const nextId = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const lastSpawnTime = useRef<number>(0);

  const checkOverlap = (newX: number, currentBubbles: Bubble[]) => {
    return currentBubbles.some(b => b.y > window.innerHeight - 100 && Math.abs(b.x - newX) < 10);
  };

  const spawnBubble = useCallback(() => {
    setBubbles(prev => {
      if (prev.length >= MAX_BUBBLES) return prev;

      const isLeft = Math.random() > 0.5;
      const minX = isLeft ? 5 : 75;
      const maxX = isLeft ? 25 : 95;
      let spawnX = minX + Math.random() * (maxX - minX);

      if (checkOverlap(spawnX, prev)) {
        const altMinX = !isLeft ? 5 : 75;
        const altMaxX = !isLeft ? 25 : 95;
        spawnX = altMinX + Math.random() * (altMaxX - altMinX);
        if (checkOverlap(spawnX, prev)) return prev;
      }

      const isLarge = Math.random() > 0.85;

      const newBubble: Bubble = {
        id: nextId.current++,
        text: BUBBLE_TEXTS[Math.floor(Math.random() * BUBBLE_TEXTS.length)],
        x: spawnX,
        y: window.innerHeight + 60,
        size: isLarge ? 1.1 + Math.random() * 0.2 : 0.85 + Math.random() * 0.15,
        speed: 0.5 + Math.random() * 0.8,
        swayAmplitude: 15 + Math.random() * 20,
        swayFrequency: 0.002 + Math.random() * 0.003,
        swayPhase: Math.random() * Math.PI * 2,
        swayX: 0,
        opacity: 0,
        isClicking: false
      };

      return [...prev, newBubble];
    });
  }, []);

  function update(time: number) {
    if (time - lastSpawnTime.current > SPAWN_INTERVAL) {
      spawnBubble();
      lastSpawnTime.current = time;
    }

    setBubbles(prev => {
      return prev
        .map(b => {
          if (b.isClicking) return b;

          const newY = b.y - b.speed;

          let newOpacity = b.opacity;
          if (b.y > window.innerHeight - 100) {
            newOpacity = Math.min(1, b.opacity + 0.05);
          } else if (b.y < window.innerHeight * 0.2) {
            newOpacity = Math.max(0, b.opacity - 0.01);
          } else {
            newOpacity = 1;
          }

          const swayX = Math.sin(time * b.swayFrequency + b.swayPhase) * b.swayAmplitude;

          return {
            ...b,
            y: newY,
            opacity: newOpacity,
            swayX
          };
        })
        .filter(b => b.y > -100 && b.opacity > 0);
    });

    requestRef.current = requestAnimationFrame(update);
  }

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleBubbleClick = (e: React.MouseEvent, bubble: Bubble) => {
    e.stopPropagation();

    setBubbles(prev => prev.map(b => b.id === bubble.id ? { ...b, isClicking: true, opacity: 0 } : b));

    enterGuestMode();
    addMessage(bubble.text, 'user');
    setCurrentView('chat');
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
    >
      <AnimatePresence>
        {bubbles.map(b => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: b.isClicking ? 0 : b.opacity,
              scale: b.isClicking ? 1.5 : b.size,
              x: `calc(${b.x}vw + ${b.swayX}px)`,
              y: b.y
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0 }}
            className="absolute cursor-pointer pointer-events-auto select-none"
            onClick={(e) => handleBubbleClick(e, b)}
            style={{
              left: 0,
              top: 0,
            }}
          >
            <div className={`
              px-4 py-2 rounded-full border border-white/10 backdrop-blur-md shadow-lg
              text-slate-200 text-sm font-medium whitespace-nowrap
              transition-colors duration-200
              ${b.size > 1.0 ? 'bg-violet-500/20 hover:bg-violet-500/40 border-violet-500/30' : 'bg-slate-800/40 hover:bg-slate-700/60'}
            `}>
              {b.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

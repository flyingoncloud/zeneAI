import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useZenemeStore } from '../../hooks/useZenemeStore';
import { motion, AnimatePresence } from 'motion/react';

// Configuration
const BUBBLE_TEXTS = [
  "感觉很累", "想要放松", "压力好大", "睡不着", "有点焦虑", 
  "寻求平静", "期待美好", "深呼吸", "想找人聊聊", "迷茫",
  "需要安慰", "开心不起来", "这是什么？", "治愈自己", "emo了"
];

const MAX_BUBBLES = 12; // Max on screen
const MIN_BUBBLES = 6;
const SPAWN_INTERVAL = 1200; // ms
const SAFE_ZONE_WIDTH_PCT = 40; // Center 40% is safe zone (30% to 70%)

interface Bubble {
  id: number;
  text: string;
  x: number; // Percent 0-100
  y: number; // Pixel
  size: number; // Scale 0.8 - 1.2
  speed: number; // Pixels per frame
  swayAmplitude: number;
  swayFrequency: number;
  swayPhase: number;
  opacity: number;
  isClicking: boolean;
}

export const WelcomeDanmaku: React.FC = () => {
  const { enterGuestMode } = useAuthStore();
  const { addMessage, setCurrentView } = useZenemeStore();
  
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const nextId = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const lastSpawnTime = useRef<number>(0);

  // Helper to check overlap
  const checkOverlap = (newX: number, bubbles: Bubble[]) => {
    // Basic check: Don't spawn if another bubble is within X% range at the very bottom
    // Since Y is always bottom at spawn, we just check X
    // Convert % to rough relative comparison
    return bubbles.some(b => b.y > window.innerHeight - 100 && Math.abs(b.x - newX) < 10);
  };

  const spawnBubble = useCallback(() => {
    if (bubbles.length >= MAX_BUBBLES) return;

    // Determine Spawn X: Either 5-25% (Left) or 75-95% (Right)
    const isLeft = Math.random() > 0.5;
    const minX = isLeft ? 5 : 75;
    const maxX = isLeft ? 25 : 95;
    let spawnX = minX + Math.random() * (maxX - minX);

    // Collision Check (Simple retry)
    if (checkOverlap(spawnX, bubbles)) {
        // Try opposite side
        const altMinX = !isLeft ? 5 : 75;
        const altMaxX = !isLeft ? 25 : 95;
        spawnX = altMinX + Math.random() * (altMaxX - altMinX);
        if (checkOverlap(spawnX, bubbles)) return; // Give up this frame
    }

    const isLarge = Math.random() > 0.85; // 15% chance for large bubble

    const newBubble: Bubble = {
      id: nextId.current++,
      text: BUBBLE_TEXTS[Math.floor(Math.random() * BUBBLE_TEXTS.length)],
      x: spawnX,
      y: window.innerHeight + 60, // Start just below screen
      size: isLarge ? 1.1 + Math.random() * 0.2 : 0.85 + Math.random() * 0.15,
      speed: 0.5 + Math.random() * 0.8, // Speed
      swayAmplitude: 15 + Math.random() * 20, // Sway amount px
      swayFrequency: 0.002 + Math.random() * 0.003,
      swayPhase: Math.random() * Math.PI * 2,
      opacity: 0, // Start invisible, fade in
      isClicking: false
    };

    setBubbles(prev => [...prev, newBubble]);
  }, [bubbles]);

  const update = useCallback((time: number) => {
    if (time - lastSpawnTime.current > SPAWN_INTERVAL) {
        if (bubbles.length < MAX_BUBBLES) {
             spawnBubble();
        }
        lastSpawnTime.current = time;
    }

    setBubbles(prev => {
        return prev
            .map(b => {
                if (b.isClicking) return b; // Don't move if clicking/removing
                
                const newY = b.y - b.speed;
                
                // Opacity Logic
                let newOpacity = b.opacity;
                // Fade in at bottom
                if (b.y > window.innerHeight - 100) {
                    newOpacity = Math.min(1, b.opacity + 0.05);
                } 
                // Fade out at top (top 20%)
                else if (b.y < window.innerHeight * 0.2) {
                    newOpacity = Math.max(0, b.opacity - 0.01);
                } else {
                    newOpacity = 1;
                }

                return {
                    ...b,
                    y: newY,
                    opacity: newOpacity
                };
            })
            .filter(b => b.y > -100 && b.opacity > 0); // Remove if off screen or invisible
    });

    requestRef.current = requestAnimationFrame(update);
  }, [bubbles, spawnBubble]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [update]);

  const handleBubbleClick = (e: React.MouseEvent, bubble: Bubble) => {
    e.stopPropagation();
    
    // 1. Mark as clicking (stop movement, maybe effect)
    setBubbles(prev => prev.map(b => b.id === bubble.id ? { ...b, isClicking: true, opacity: 0 } : b));

    // 2. Add Message & Navigate
    // Small delay to allow fade out visual? No, "immediate" requested.
    enterGuestMode(); // Switch Auth State to Guest
    addMessage(bubble.text, 'user'); // Add message to chat
    setCurrentView('chat'); // Ensure Chat view is active
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
                        x: `calc(${b.x}vw + ${Math.sin(Date.now() * b.swayFrequency + b.swayPhase) * b.swayAmplitude}px)`,
                        y: b.y
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0 }} // Controlled by frame loop mostly, but exit uses Framer
                    className="absolute cursor-pointer pointer-events-auto select-none"
                    onClick={(e) => handleBubbleClick(e, b)}
                    style={{
                        left: 0, // Positioning handled by translate in animate
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

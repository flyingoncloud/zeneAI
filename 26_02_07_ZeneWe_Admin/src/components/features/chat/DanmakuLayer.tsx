import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

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
  "先把自己抱住"
];

interface BubbleData {
  id: string;
  text: string;
  size: number; // px
  x: number; // %
  y: number; // %
  baseColor: string; // hsla string
  textColor: string;
  duration: number;
  delay: number;
  swayAmplitude: number;
}

export const DanmakuLayer = () => {
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const [isExiting, setIsExiting] = useState(false);

  // Generate a random bubble
  const createBubble = (idPrefix: string, forceY?: number): BubbleData => {
    // Size: Small (44-56), Medium (60-84), Large (92-120)
    const sizeType = Math.random();
    let size;
    if (sizeType < 0.4) size = 44 + Math.random() * 12; // Small 40%
    else if (sizeType < 0.8) size = 60 + Math.random() * 24; // Medium 40%
    else size = 92 + Math.random() * 28; // Large 20%

    // Colors: Deep Blue/Purple/Grey-Blue
    // Hue: 210 (Blue) - 260 (Purple)
    const hue = 210 + Math.random() * 50;
    const sat = 20 + Math.random() * 20; // Low saturation 20-40%
    const light = 15 + Math.random() * 25; // Dark brightness 15-40%
    const alpha = 0.45 + Math.random() * 0.35; // Opacity 45-80%
    
    // Text color adaptation: if bg is lighter (alpha high + light high), text darker
    // Simple heuristic: if combined perceived brightness is high, use darker text
    // But since max light is 40%, it's mostly dark. 
    // However, prompt asks for adaptation.
    // Let's stick to whitish for dark bubbles, and maybe slightly dimmer white for very light ones?
    // Actually prompt says: "bubble lighter -> text darker".
    // Since our bubbles are never "light" (max 40% L), they are dark.
    // We'll use white/light-grey.
    // If alpha is low (transparent), text needs to be opaque.
    const textAlpha = 0.8 + Math.random() * 0.2;
    const textColor = `rgba(255, 255, 255, ${textAlpha})`;

    // Position
    const x = Math.random() * 90; // 0-90% width
    const y = forceY !== undefined ? forceY : 100 + Math.random() * 20; // Start below screen by default

    return {
      id: `${idPrefix}-${Date.now()}-${Math.random()}`,
      text: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
      size,
      x,
      y,
      baseColor: `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`,
      textColor,
      duration: 15 + Math.random() * 10, // Slow float 15-25s for full height
      delay: Math.random() * 2,
      swayAmplitude: 20 + Math.random() * 30 // Sway 20-50px
    };
  };

  useEffect(() => {
    // Initial batch: Scattered across the screen
    const initialBubbles: BubbleData[] = [];
    const count = 14; // 10-18 range
    
    // Grid approach to avoid overlap initially
    // Divide screen into cells
    const rows = 4;
    const cols = 3;
    const usedCells = new Set<string>();
    
    for (let i = 0; i < count; i++) {
        // Create bubble
        const b = createBubble(`init-${i}`, 0); // Y will be overwritten
        
        // Random cell
        let cellR = Math.floor(Math.random() * rows);
        let cellC = Math.floor(Math.random() * cols);
        
        // Simple retry to spread them out
        let attempts = 0;
        while (usedCells.has(`${cellR}-${cellC}`) && attempts < 5) {
             cellR = Math.floor(Math.random() * rows);
             cellC = Math.floor(Math.random() * cols);
             attempts++;
        }
        usedCells.add(`${cellR}-${cellC}`);

        // Map cell to percentage position with noise
        // Y: 10% to 90%
        b.y = (cellR / rows) * 80 + 10 + (Math.random() * 10 - 5); 
        // X: 5% to 85%
        b.x = (cellC / cols) * 80 + 5 + (Math.random() * 10 - 5);
        
        // Override duration for initial ones so they don't zoom off
        // They are already in position, so we just want them to drift up slowly
        b.duration = 20; 

        initialBubbles.push(b);
    }
    setBubbles(initialBubbles);

    // Continuous spawning (if needed to fill gaps)
    // Since initial fills screen, we just need to spawn from bottom occasionally
    const interval = setInterval(() => {
        if (!isExiting) {
            setBubbles(prev => {
                if (prev.length >= 18) return prev;
                return [...prev, createBubble('spawn')];
            });
        }
    }, 800);

    // Trigger exit sequence
    const exitTimer = setTimeout(() => {
        setIsExiting(true);
    }, 3500); // 3.5s duration

    return () => {
        clearInterval(interval);
        clearTimeout(exitTimer);
    };
  }, [isExiting]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {bubbles.map((bubble) => (
        <Bubble key={bubble.id} data={bubble} isExiting={isExiting} />
      ))}
      
      {/* Optional: Vignette or Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/40 via-transparent to-[#020617]/20 pointer-events-none" />
    </div>
  );
};

const Bubble = ({ data, isExiting }: { data: BubbleData, isExiting: boolean }) => {
  // We use state to store the "sway" duration so it doesn't reset on re-renders
  const swayDuration = useMemo(() => 6 + Math.random() * 4, []);
  
  return (
    <motion.div
      initial={{ 
          top: `${data.y}%`, 
          left: `${data.x}%`, 
          opacity: 0,
          scale: 0.5
      }}
      animate={isExiting ? {
          top: '-30%', // Fly out top further/faster
          opacity: 0,
          transition: { 
              duration: 1.2, // Fast exit
              ease: "easeIn" 
          }
      } : {
          top: '-20%', // Target top (drift up forever)
          opacity: [0, 1, 1, 0], // Fade in, stay, fade out at very top
          scale: 1,
          transition: {
              top: { 
                  duration: data.duration, 
                  ease: "linear", 
                  delay: 0
              },
              opacity: {
                  duration: data.duration,
                  times: [0, 0.1, 0.8, 1]
              },
              scale: { duration: 0.5 }
          }
      }}
      // Independent sway animation that continues regardless of vertical state
      style={{
        position: 'absolute',
        width: data.size,
        height: data.size,
        left: `${data.x}%`, // Base left position
        borderRadius: '50%',
        backgroundColor: data.baseColor,
        boxShadow: `0 0 15px rgba(139,92,246,0.15), inset 0 0 20px rgba(255,255,255,0.05)`, 
        border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        textAlign: 'center',
        zIndex: Math.floor(data.size),
        backdropFilter: 'blur(1px)',
        // Use transform for sway to avoid conflict with 'left' layout anim if we used it there
        // But here we set left via style, so we can animate x transform
      }}
    >
      {/* Sway Motion Wrapper */}
      <motion.div
        animate={{ x: [-15, 15, -15] }}
        transition={{ 
            repeat: Infinity, 
            duration: swayDuration, 
            ease: "easeInOut" 
        }}
        className="w-full h-full flex items-center justify-center relative"
      >
        {/* Highlight Arc */}
        <div className="absolute top-[10%] left-[10%] w-[30%] h-[20%] rounded-[100%] bg-gradient-to-br from-white/30 to-transparent blur-[1px] rotate-[-45deg]" />
        
        <span 
            style={{ 
                color: data.textColor,
                fontSize: Math.max(10, data.size / 5.5),
                lineHeight: 1.2,
                fontWeight: 400,
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}
            className="break-words w-full pointer-events-none select-none"
        >
            {data.text}
        </span>
      </motion.div>
    </motion.div>
  );
};

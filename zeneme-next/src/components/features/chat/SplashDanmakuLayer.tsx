import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAnimationFrame, motion, MotionValue } from 'motion/react';
import { useZenemeStore } from '../../../hooks/useZenemeStore';

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
  // 新增内容
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

// Configuration
const BUBBLE_COUNT_DESKTOP = 15;
const BUBBLE_COUNT_MOBILE = 10; // ~66% of desktop

// Gaps
const MIN_GAP_X_DESKTOP = 64;
const MIN_GAP_X_MOBILE = 96; // 80-120 range

const MIN_GAP_Y_DESKTOP = 48;
const MIN_GAP_Y_MOBILE = 52; // 44-60 range

// Physics
const VELOCITY_MIN = 35;
const VELOCITY_MAX = 55;
const VELOCITY_MOBILE_FIXED = 40; // Strictly constant for mobile

// Sway Config
const SWAY_AMP_MIN_DESKTOP = 24;
const SWAY_AMP_MAX_DESKTOP = 46;
const SWAY_AMP_MOBILE_FIXED = 8; // Reduced and constant for mobile

const SWAY_PERIOD_MIN = 1.8;
const SWAY_PERIOD_MAX = 3.5;

// Visual
const COLORS = [
  { fill: 'hsla(240, 50%, 20%, 0.25)', border: 'hsla(240, 50%, 80%, 0.15)', glow: 'transparent' },
  { fill: 'hsla(220, 50%, 20%, 0.25)', border: 'hsla(220, 50%, 80%, 0.15)', glow: 'transparent' },
  { fill: 'hsla(260, 50%, 20%, 0.25)', border: 'hsla(260, 50%, 80%, 0.15)', glow: 'transparent' },
];

type BubbleConfig = {
  id: string;
  text: string;

  // Dimensions
  width: number;
  height: number;

  // Placement
  baseX: number; // The "center" anchor
  initialY: number;

  // Motion
  velocity: number;
  amplitudeX: number;
  period: number;
  phase: number;
  startDelay: number;
  scale: number;

  // Dynamic offset for collision avoidance
  offsetX: number;

  // Visual
  fill: string;
  border: string;
  glow: string;

  // Motion Values
  xMV: MotionValue<number>;
  yMV: MotionValue<number>;
  opacityMV: MotionValue<number>;
  scaleMV: MotionValue<number>;
};

const random = (min: number, max: number) => min + Math.random() * (max - min);

const estimateSize = (text: string, scale: number) => {
  // Rough estimation based on text length (assuming font size ~14)
  const baseWidth = Math.min(280, Math.max(140, text.length * 10));
  const width = baseWidth * scale;
  const height = 44 * scale; // fixed height
  return { width, height };
};

const checkOverlap = (
  c1: { x: number, y: number, w: number, h: number },
  others: { x: number, y: number, w: number, h: number }[],
  gapX: number,
  gapY: number
) => {
  for (const o of others) {
    // Use center-to-center distance approx or AABB
    const dx = Math.abs(c1.x - o.x);
    const dy = Math.abs(c1.y - o.y);
    const minW = (c1.w + o.w)/2 + gapX;
    const minH = (c1.h + o.h)/2 + gapY;

    if (dx < minW && dy < minH) return true;
  }
  return false;
};

export const SplashDanmakuLayer = () => {
  const { isSidebarOpen } = useZenemeStore();
  const [bubbles, setBubbles] = useState<BubbleConfig[]>([]);
  const bubblesRef = useRef<BubbleConfig[]>([]);

  // Determine Safe Rect based on Container (relative coordinates)
  const getSafeRect = useCallback(() => {
    // Since this component is inside "absolute inset-0" of ChatInterface (which is flex-1 right of Sidebar),
    // our (0,0) is already at the left edge of the main content area.
    // So "leftBound" relative to us is just the padding.

    const isDesktop = window.innerWidth >= 768;
    const rightSidebarWidth = 0; // Placeholder for future right sidebar

    // Calculate Container Width (Window - Left Sidebar)
    // Note: We use window.innerWidth logic to approximate container width,
    // but strictly speaking we are rendering relative to container.
    // Container Width = Window - (SidebarOpen ? 280 : 72)

    const sidebarW = isDesktop ? (isSidebarOpen ? 280 : 72) : 0;
    const containerW = window.innerWidth - sidebarW;

    const safeLeft = 16; // leftBound = mainContentLeft (0) + 16
    const safeRight = containerW - rightSidebarWidth - 16; // rightBound = mainContentRight (containerW) - 16

    const safeTop = 12; // topBound = headerBottom (assumed 0 relative or offset) + 12?
    // Actually TopBar is above ChatInterface in flex col. ChatInterface starts below TopBar.
    // So top=0 is just below TopBar. safeTop = 12 is correct.

    const h = window.innerHeight; // Height is roughly window height minus topbar
    // But let's just use window height for physics calculation as it floats up

    return { safeLeft, safeRight, safeTop, h, containerW };
  }, [isSidebarOpen]);

  // Re-clamp bubbles when sidebar changes (Layout Shift)
  useEffect(() => {
    const { safeLeft, safeRight } = getSafeRect();
    const currentBubbles = bubblesRef.current;

    currentBubbles.forEach(b => {
      // Adjust bounds check
      const minX = safeLeft + b.width/2;
      const maxX = safeRight - b.width/2;

      if (b.baseX < minX) b.baseX = minX + random(0, 20);
      else if (b.baseX > maxX) b.baseX = maxX - random(0, 20);
    });
  }, [isSidebarOpen, getSafeRect]);

  // Initial Generation
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const { safeLeft, safeRight, h } = getSafeRect();
    const isMobile = window.innerWidth < 768;

    // Config based on device
    const bubbleCount = isMobile ? BUBBLE_COUNT_MOBILE : BUBBLE_COUNT_DESKTOP;
    const gapX = isMobile ? MIN_GAP_X_MOBILE : MIN_GAP_X_DESKTOP;
    const gapY = isMobile ? MIN_GAP_Y_MOBILE : MIN_GAP_Y_DESKTOP;

    // Message Pool
    const pool1 = [...MESSAGES].sort(() => 0.5 - Math.random());
    const pool2 = [...MESSAGES].sort(() => 0.5 - Math.random());
    const pool3 = [...MESSAGES].sort(() => 0.5 - Math.random()).slice(0, 2);
    const textPool = [...pool1, ...pool2, ...pool3];

    const generated: BubbleConfig[] = [];

    // Calculate batches for mobile vs desktop proportionally
    const batch1Limit = Math.floor(bubbleCount * 0.45);

    for (let i = 0; i < bubbleCount; i++) {
      const isBatch1 = i < batch1Limit;
      const text = textPool[i];

      const scale = random(0.85, 1.15);
      const { width, height } = estimateSize(text, scale);

      let placed = false;

      for (let attempt = 0; attempt < 50; attempt++) {
        const yMin = isBatch1 ? 1.1 : 1.4;
        const yMax = isBatch1 ? 1.5 : 1.9;
        const initialY = h * random(yMin, yMax);

        // Generate X within safe bounds
        const padding = isMobile ? 24 : 16;
        // Recalculate bounds based on specific mobile padding requirement
        // For desktop, safeLeft/Right from getSafeRect (16px) is fine.

        const minX = (isMobile ? padding : safeLeft) + width/2;
        // safeRight is containerW - 16. For mobile we want containerW - 24.
        const containerW = window.innerWidth - (isMobile ? 0 : (isSidebarOpen ? 280 : 72));
        const maxBound = containerW - padding;
        const maxX = maxBound - width/2;

        if (minX >= maxX) continue;

        let x = random(minX, maxX);

        if (isMobile) {
          // Mobile: Random distribution with right-side penalty
          // If falls in rightmost 20%, reroll once to avoid clustering on right
          const range = maxX - minX;
          if (x > minX + range * 0.8) {
            x = random(minX, maxX);
          }
        }

        // Check overlap with existing
        const overlap = checkOverlap(
          { x, y: initialY, w: width, h: height },
          generated.map(g => ({ x: g.baseX, y: g.initialY, w: g.width, h: g.height })),
          gapX,
          gapY
        );

        if (!overlap) {
          placed = true;
          const color = COLORS[i % COLORS.length];

          const isDesktopNow = window.innerWidth >= 768;
          const velocity = isMobile
            ? VELOCITY_MOBILE_FIXED
            : random(VELOCITY_MIN, VELOCITY_MAX);

          const amplitudeX = isMobile
            ? SWAY_AMP_MOBILE_FIXED
            : random(SWAY_AMP_MIN_DESKTOP, SWAY_AMP_MAX_DESKTOP);

          const period = random(SWAY_PERIOD_MIN, SWAY_PERIOD_MAX);
          const phase = random(0, Math.PI * 2);
          const startDelay = random(0, 0.9);

          generated.push({
            id: `b-${i}`,
            text,
            width,
            height,
            baseX: x,
            initialY,
            velocity,
            amplitudeX,
            period,
            phase,
            startDelay,
            scale,
            offsetX: 0,
            fill: color.fill,
            border: color.border,
            glow: color.glow,
            xMV: new MotionValue(x),
            yMV: new MotionValue(initialY),
            opacityMV: new MotionValue(0),
            scaleMV: new MotionValue(scale),
          });

          break;
        }
      }

      // If not placed, fallback (push somewhere)
      if (!placed) {
        const fallbackX = safeLeft + width + 20;
        const fallbackY = h * (1.8 + i*0.05);
        generated.push({
          id: `b-${i}`,
          text,
          width,
          height,
          baseX: fallbackX,
          initialY: fallbackY,
          velocity: 150,
          amplitudeX: 20,
          period: 2.5,
          phase: 0,
          startDelay: 0,
          scale,
          offsetX: 0,
          fill: `hsla(240, 50%, 20%, 0.25)`,
          border: `hsla(240, 50%, 80%, 0.15)`,
          glow: `transparent`,
          xMV: new MotionValue(fallbackX),
          yMV: new MotionValue(fallbackY),
          opacityMV: new MotionValue(0),
          scaleMV: new MotionValue(scale),
        });
      }
    }

    // ✅ 避免在 effect 里同步 setState：推到下一帧执行（逻辑等价）
    const raf = requestAnimationFrame(() => {
      setBubbles(generated);
      bubblesRef.current = generated;
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[10]">
      {/* z-index changed to 10 to be below buttons (z-30 is usually buttons) */}
      {bubbles.map(b => (
        <BubbleRenderer key={b.id} config={b} allBubblesRef={bubblesRef} />
      ))}
    </div>
  );
};

const BubbleRenderer = ({
  config,
  allBubblesRef
}: {
  config: BubbleConfig,
  allBubblesRef: React.MutableRefObject<BubbleConfig[]>
}) => {
  const { isSidebarOpen } = useZenemeStore();
  const startTimeRef = useRef<number | null>(null);

  // ✅ 用 ref 保存 offsetX，避免直接修改 props/config（immutability）
  const offsetXRef = useRef<number>(config.offsetX);

  // Keep initial offset (if any) in sync without mutating props
  useEffect(() => {
    offsetXRef.current = config.offsetX;
  }, [config.offsetX]);

  useAnimationFrame((time) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = time;
    }
    const elapsed = (time - startTimeRef.current) / 1000;
    if (elapsed < config.startDelay) return;

    const activeTime = elapsed - config.startDelay;
    const dt = 1/60;

    // 1. Opacity
    if (activeTime < 0.15) {
      config.opacityMV.set(activeTime / 0.15);
    } else {
      config.opacityMV.set(1);
    }

    // 2. Y Motion
    const nextY = config.initialY - (config.velocity * activeTime);

    // 3. X Motion (Base + Sway + Global Offset)
    const sway = Math.sin(activeTime * (2 * Math.PI / config.period) + config.phase) * config.amplitudeX;

    // 4. Safe Rect Calculation (Relative to Container)
    // Re-calculate dynamically because container width might change or sidebar might toggle

    const isDesktop = window.innerWidth >= 768;
    const sidebarW = isDesktop ? (isSidebarOpen ? 280 : 72) : 0;
    const containerW = window.innerWidth - sidebarW;

    // Define boundaries relative to THIS component
    const padding = !isDesktop ? 24 : 16; // Mobile 24px, Desktop 16px
    const safeLeft = padding;
    const safeRight = containerW - padding;

    // 5. Dynamic Avoidance & Clamping
    // No Global Offset needed anymore, we work in container coords directly
    const idealX = config.baseX + sway + offsetXRef.current;

    // A. Strict Clamping
    const minCenter = safeLeft + config.width/2;
    const maxCenter = safeRight - config.width/2;

    let currentX = idealX;

    if (currentX < minCenter) {
      currentX = minCenter;
      offsetXRef.current += 20 * dt;
    } else if (currentX > maxCenter) {
      currentX = maxCenter;
      offsetXRef.current -= 20 * dt;
    }

    // B. Buttons Exclusion Zone
    // Roughly center area relative to container
    const exLeft = containerW * 0.20;
    const exRight = containerW * 0.80;
    const exTop = window.innerHeight * 0.72;
    const exBottom = window.innerHeight * 0.95;

    const inY = nextY > exTop && nextY < exBottom;
    const inX = currentX > exLeft && currentX < exRight;

    if (inY && inX) {
      const distLeft = Math.abs(currentX - exLeft);
      const distRight = Math.abs(currentX - exRight);
      const push = 120 * dt;
      if (distLeft < distRight) offsetXRef.current -= push;
      else offsetXRef.current += push;
    }

    // C. Bubble Avoidance
    const others = allBubblesRef.current;
    const isMobile = window.innerWidth < 768;
    const gapX = isMobile ? MIN_GAP_X_MOBILE : MIN_GAP_X_DESKTOP;
    const gapY = isMobile ? MIN_GAP_Y_MOBILE : MIN_GAP_Y_DESKTOP;

    for (const o of others) {
      if (o.id === config.id) continue;
      const ox = o.xMV.get();
      const oy = o.yMV.get();
      const dy = Math.abs(nextY - oy);
      const dx = Math.abs(currentX - ox);

      if (dy < (config.height + o.height)/2 + gapY && dx < (config.width + o.width)/2 + gapX) {
        const dir = currentX > ox ? 1 : -1;
        offsetXRef.current += dir * (30 * dt);
      }
    }

    // Final strict clamp
    currentX = Math.max(minCenter, Math.min(maxCenter, currentX));

    config.yMV.set(nextY);
    config.xMV.set(currentX);
  });

  return (
    <motion.div
      style={{
        x: config.xMV,
        y: config.yMV,
        scale: config.scaleMV,
        opacity: config.opacityMV,
        position: 'absolute',
        top: 0,
        left: 0,
        willChange: 'transform, opacity',
        zIndex: 10,
      }}
    >
      <div
        className="rounded-2xl px-4 py-3 backdrop-blur-md border shadow-[0_8px_22px_rgba(0,0,0,0.25)]"
        style={{
          width: config.width,
          height: config.height,
          background: config.fill,
          borderColor: config.border,
          boxShadow: `0 0 14px ${config.glow}`,
        }}
      >
        <p className="text-white/85 text-sm font-medium leading-snug">
          {config.text}
        </p>
      </div>
    </motion.div>
  );
};

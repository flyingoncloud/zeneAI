import React from 'react';

// Common Props
interface EmotionIconProps {
  className?: string;
  size?: number;
}

// -----------------------------------------------------------------------------
// Base Shapes (Canvas 64x64)
// Center: 32, 32
// Shape Bounds: approx 44x44 to allow padding
// -----------------------------------------------------------------------------

// Rounded Star Path (Scaled for 64x64)
const StarPath = "M32 8 C33.5 8 34.5 9 35.5 12 L38.5 20 C39 21 40 22 41 22 L49.5 23 C53 23.5 54 26.5 51.5 29 L45 35 C44 36 43.5 37 44 38 L45.5 47 C46.5 50.5 43.5 53 40.5 51.5 L33 47.5 C32.5 47.2 31.5 47.2 31 47.5 L23.5 51.5 C20.5 53 17.5 50.5 18.5 47 L20 38 C20.5 37 20 36 19 35 L12.5 29 C10 26.5 11 23.5 14.5 23 L23 22 C24 22 25 21 25.5 20 L28.5 12 C29.5 9 30.5 8 32 8 Z";

// Droplet Path (Scaled for 64x64)
const DropletPath = "M32 8 C32 8 50 24 50 36 C50 46 42 54 32 54 C22 54 14 46 14 36 C14 24 32 8 32 8 Z";

// -----------------------------------------------------------------------------
// Updated Colors (Vibrant & Jelly-like)
// -----------------------------------------------------------------------------

const COLORS = {
  neg: {
    fill: "#7686FF", // Vibrant Blue-Purple
    stroke: "#3B3F7A", // Deep Navy Stroke
    face: "#1e1b4b", // Dark Blue Face
    highlight: "#B9C1FF", // Bright Jelly Highlight
    highlightOpacity: 0.6
  },
  pos: {
    fill: "#F7CF5A", // Vibrant Golden Yellow
    stroke: "#8A6726", // Warm Brown Stroke
    face: "#422006", // Dark Brown Face
    highlight: "#FFE9AE", // Bright Cream Highlight
    highlightOpacity: 0.7
  }
};

// -----------------------------------------------------------------------------
// Emotion Components
// -----------------------------------------------------------------------------

// 0. Anxious (焦虑) - 水滴
export const IconAnxious = ({ className = "", size = 64 }: EmotionIconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} overflow-visible`}>
    <path 
      d={DropletPath} 
      fill={COLORS.neg.fill} 
      stroke={COLORS.neg.stroke} strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
    />
    {/* Gloss Highlight */}
    <path d="M32 12 C32 12 40 22 40 28" stroke={COLORS.neg.highlight} strokeWidth="2.5" strokeLinecap="round" opacity={COLORS.neg.highlightOpacity} fill="none" />

    {/* Brows: Inner corners raised */}
    <path d="M22 28 Q26 24 29 28" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    <path d="M42 28 Q38 24 35 28" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    {/* Eyes */}
    <circle cx="26" cy="34" r="2" fill={COLORS.neg.face} />
    <circle cx="38" cy="34" r="2" fill={COLORS.neg.face} />
    {/* Mouth */}
    <path d="M26 44 Q29 42 32 44 T38 44" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    {/* Sweat Drop */}
    <path d="M46 18 C46 18 49 21 49 23 C49 24.5 47.8 25.5 46.5 25.5 C45.2 25.5 44 24.5 44 23 C44 21 46 18 46 18 Z" fill="#93c5fd" stroke="#60a5fa" strokeWidth="1" />
  </svg>
);

// 1. Sad (悲伤) - 水滴
export const IconSad = ({ className = "", size = 64 }: EmotionIconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} overflow-visible`}>
    <path 
      d={DropletPath} 
      fill={COLORS.neg.fill} 
      stroke={COLORS.neg.stroke} strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
    />
    {/* Gloss */}
    <path d="M32 12 C32 12 40 22 40 28" stroke={COLORS.neg.highlight} strokeWidth="2.5" strokeLinecap="round" opacity={COLORS.neg.highlightOpacity} fill="none" />

    {/* Brows: Drooping */}
    <path d="M22 28 L27 26" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    <path d="M42 28 L37 26" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    {/* Eyes: Closed downward */}
    <path d="M22 34 Q25 36 28 34" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    <path d="M36 34 Q39 36 42 34" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    {/* Mouth: Frown */}
    <path d="M26 46 Q32 42 38 46" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    {/* Tear */}
    <path d="M43 38 C43 38 45 40 45 42 C45 43.1 44.1 44 43 44 C41.9 44 41 43.1 41 42 C41 40 43 38 43 38 Z" fill="#93c5fd" stroke="#60a5fa" strokeWidth="1" />
  </svg>
);

// 2. Angry (愤怒) - 水滴
export const IconAngry = ({ className = "", size = 64 }: EmotionIconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} overflow-visible`}>
    <path 
      d={DropletPath} 
      fill={COLORS.neg.fill} 
      stroke={COLORS.neg.stroke} strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
    />
    {/* Gloss */}
    <path d="M32 12 C32 12 40 22 40 28" stroke={COLORS.neg.highlight} strokeWidth="2.5" strokeLinecap="round" opacity={COLORS.neg.highlightOpacity} fill="none" />

    {/* Brows: Sharp diagonal */}
    <path d="M20 26 L29 30" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    <path d="M44 26 L35 30" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    {/* Eyes */}
    <circle cx="27" cy="35" r="1.5" fill={COLORS.neg.face} />
    <circle cx="37" cy="35" r="1.5" fill={COLORS.neg.face} />
    {/* Mouth: Straight */}
    <path d="M28 44 L36 44" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    {/* Anger Mark */}
    <path d="M48 22 L44 26 M48 26 L44 22" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
  </svg>
);

// 3. Happy (开心) - 星星
export const IconHappy = ({ className = "", size = 64 }: EmotionIconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} overflow-visible`}>
    <path 
      d={StarPath} 
      fill={COLORS.pos.fill} 
      stroke={COLORS.pos.stroke} strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
    />
    {/* Gloss */}
    <path d="M32 12 L33 16" stroke={COLORS.pos.highlight} strokeWidth="3" strokeLinecap="round" opacity={COLORS.pos.highlightOpacity} />

    {/* Brows */}
    <path d="M22 28 Q25 25 28 28" stroke={COLORS.pos.face} strokeWidth="2" strokeLinecap="round" />
    <path d="M36 28 Q39 25 42 28" stroke={COLORS.pos.face} strokeWidth="2" strokeLinecap="round" />
    {/* Eyes: Happy arcs */}
    <path d="M22 34 Q25 31 28 34" stroke={COLORS.pos.face} strokeWidth="2" strokeLinecap="round" />
    <path d="M36 34 Q39 31 42 34" stroke={COLORS.pos.face} strokeWidth="2" strokeLinecap="round" />
    {/* Mouth: Smile */}
    <path d="M24 40 Q32 50 40 40 Z" fill={COLORS.pos.face} />
    {/* Sparkle */}
    <path d="M50 20 L51 23 L54 24 L51 25 L50 28 L49 25 L46 24 L49 23 Z" fill="#fffbeb" />
  </svg>
);

// 4. Relieved (宽慰) - 星星
export const IconRelieved = ({ className = "", size = 64 }: EmotionIconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} overflow-visible`}>
    <path 
      d={StarPath} 
      fill={COLORS.pos.fill} 
      stroke={COLORS.pos.stroke} strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
    />
    {/* Gloss */}
    <path d="M32 12 L33 16" stroke={COLORS.pos.highlight} strokeWidth="3" strokeLinecap="round" opacity={COLORS.pos.highlightOpacity} />

    {/* Brows: Relaxed */}
    <path d="M23 28 Q26 28 29 29" stroke={COLORS.pos.face} strokeWidth="2" strokeLinecap="round" />
    <path d="M35 29 Q38 28 41 28" stroke={COLORS.pos.face} strokeWidth="2" strokeLinecap="round" />
    {/* Eyes: Closed arcs */}
    <path d="M22 35 Q25 37 28 35" stroke={COLORS.pos.face} strokeWidth="2" strokeLinecap="round" />
    <path d="M36 35 Q39 37 42 35" stroke={COLORS.pos.face} strokeWidth="2" strokeLinecap="round" />
    {/* Mouth: Gentle smile */}
    <path d="M26 43 Q32 46 38 43" stroke={COLORS.pos.face} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 5. Confused (困惑) - 水滴
export const IconConfused = ({ className = "", size = 64 }: EmotionIconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} overflow-visible`}>
    <path 
      d={DropletPath} 
      fill={COLORS.neg.fill} 
      stroke={COLORS.neg.stroke} strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
    />
    {/* Gloss */}
    <path d="M32 12 C32 12 40 22 40 28" stroke={COLORS.neg.highlight} strokeWidth="2.5" strokeLinecap="round" opacity={COLORS.neg.highlightOpacity} fill="none" />

    {/* Brows */}
    <path d="M22 28 L28 28" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    <path d="M36 26 Q39 22 42 26" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    {/* Eyes */}
    <circle cx="25" cy="34" r="1.5" fill={COLORS.neg.face} />
    <circle cx="39" cy="34" r="2.5" fill={COLORS.neg.face} />
    {/* Mouth */}
    <path d="M28 44 Q32 42 36 45" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    {/* Question Mark */}
    <text x="48" y="24" fontFamily="sans-serif" fontSize="14" fontWeight="bold" fill="#6366f1" opacity="0.9">?</text>
  </svg>
);

// 6. Tired (疲惫) - 水滴
export const IconTired = ({ className = "", size = 64 }: EmotionIconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} overflow-visible`}>
    <path 
      d={DropletPath} 
      fill={COLORS.neg.fill} 
      stroke={COLORS.neg.stroke} strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
    />
    {/* Gloss */}
    <path d="M32 12 C32 12 40 22 40 28" stroke={COLORS.neg.highlight} strokeWidth="2.5" strokeLinecap="round" opacity={COLORS.neg.highlightOpacity} fill="none" />

    {/* Eyes: Straight lines */}
    <path d="M22 34 L28 34" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    <path d="M36 34 L42 34" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    {/* Eye Bags */}
    <path d="M23 37 L27 37" stroke={COLORS.neg.face} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    <path d="M37 37 L41 37" stroke={COLORS.neg.face} strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    {/* Mouth */}
    <path d="M30 46 L34 46" stroke={COLORS.neg.face} strokeWidth="2" strokeLinecap="round" />
    {/* Zzz */}
    <path d="M46 20 L50 20 L46 24 L50 24" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
  </svg>
);

// 7. Grateful (感激) - 星星
export const IconGrateful = ({ className = "", size = 64 }: EmotionIconProps) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} overflow-visible`}>
    <path 
      d={StarPath} 
      fill={COLORS.pos.fill} 
      stroke={COLORS.pos.stroke} strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
    />
    {/* Gloss */}
    <path d="M32 12 L33 16" stroke={COLORS.pos.highlight} strokeWidth="3" strokeLinecap="round" opacity={COLORS.pos.highlightOpacity} />

    {/* Brows */}
    <path d="M22 30 Q25 28 28 30" stroke={COLORS.pos.face} strokeWidth="2" strokeLinecap="round" />
    <path d="M36 30 Q39 28 42 30" stroke={COLORS.pos.face} strokeWidth="2" strokeLinecap="round" />
    {/* Eyes: Ovals */}
    <ellipse cx="25" cy="35" rx="2" ry="2.5" fill={COLORS.pos.face} />
    <ellipse cx="39" cy="35" rx="2" ry="2.5" fill={COLORS.pos.face} />
    {/* Mouth */}
    <path d="M28 42 Q32 45 36 42" stroke={COLORS.pos.face} strokeWidth="2" strokeLinecap="round" />
    {/* Blush */}
    <circle cx="21" cy="38" r="2.5" fill="#fca5a5" opacity="0.9" />
    <circle cx="43" cy="38" r="2.5" fill="#fca5a5" opacity="0.9" />
    {/* Heart */}
    <path d="M50 22 C50 20.5 48.5 19.5 47.5 20.5 C46.5 19.5 45 20.5 45 22 C45 24 47.5 26 47.5 26 C47.5 26 50 24 50 22 Z" fill="#fca5a5" />
  </svg>
);

// Export map for easy usage
export const ZeneMeEmotions = [
  IconAnxious,  // 0
  IconSad,      // 1
  IconAngry,    // 2
  IconHappy,    // 3
  IconRelieved, // 4
  IconConfused, // 5
  IconTired,    // 6
  IconGrateful  // 7
];

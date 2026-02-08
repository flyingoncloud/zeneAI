import React from 'react';

// ============================================================
// Types & Utilities
// ============================================================

interface EmotionIconProps {
  className?: string;
  size?: number;
  color?: string; // position-based theme color
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0'))
    .join('');
}

function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount));
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
}

/** Derive fill / stroke / highlight from a single theme color */
function c(color: string) {
  return { f: color, s: darken(color, 0.40), h: lighten(color, 0.55) };
}

// Shapes
const StarPath = "M32 8 C33.5 8 34.5 9 35.5 12 L38.5 20 C39 21 40 22 41 22 L49.5 23 C53 23.5 54 26.5 51.5 29 L45 35 C44 36 43.5 37 44 38 L45.5 47 C46.5 50.5 43.5 53 40.5 51.5 L33 47.5 C32.5 47.2 31.5 47.2 31 47.5 L23.5 51.5 C20.5 53 17.5 50.5 18.5 47 L20 38 C20.5 37 20 36 19 35 L12.5 29 C10 26.5 11 23.5 14.5 23 L23 22 C24 22 25 21 25.5 20 L28.5 12 C29.5 9 30.5 8 32 8 Z";
const DropletPath = "M32 8 C32 8 50 24 50 36 C50 46 42 54 32 54 C22 54 14 46 14 36 C14 24 32 8 32 8 Z";

// Face colors (constant, high contrast)
const FP = "#422006";  // dark brown on warm fills
const FN = "#1e1b4b";  // dark navy on cool fills

// Default mid-range colors (used when no color prop is passed, e.g. MoodTracker)
const DEF_POS = "#FFAE25";
const DEF_NEG = "#6050FF";

// ============================================================
// POSITIVE — Star Icons
// ============================================================

// Calm (平静) — Serene closed eyes, tiny peaceful smile
export const IconCalm = ({ className = "", size = 64, color = DEF_POS }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={StarPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 L33 16" stroke={h} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M22 35 Q25 38 28 35" stroke={FP} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M36 35 Q39 38 42 35" stroke={FP} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M29 43 Q32 46 35 43" stroke={FP} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
};

// Satisfied (满足) — Squinting arcs, wide closed smile, blush
export const IconSatisfied = ({ className = "", size = 64, color = DEF_POS }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={StarPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 L33 16" stroke={h} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M22 33 Q25 30 28 33" stroke={FP} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M36 33 Q39 30 42 33" stroke={FP} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M24 41 Q32 48 40 41" stroke={FP} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="21" cy="38" r="2.5" fill="#FDBA74" opacity="0.45" />
      <circle cx="43" cy="38" r="2.5" fill="#FDBA74" opacity="0.45" />
    </svg>
  );
};

// Warm (温暖) — Soft closed eyes, rosy cheeks, gentle smile, hearts
export const IconWarm = ({ className = "", size = 64, color = DEF_POS }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={StarPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 L33 16" stroke={h} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M23 29 Q26 28 29 29" stroke={FP} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M35 29 Q38 28 41 29" stroke={FP} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M22 34 Q25 37 28 34" stroke={FP} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M36 34 Q39 37 42 34" stroke={FP} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M25 42 Q32 48 39 42" stroke={FP} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="38" r="3" fill="#fca5a5" opacity="0.55" />
      <circle cx="44" cy="38" r="3" fill="#fca5a5" opacity="0.55" />
      <path d="M51 19 C51 17.8 49.8 17 49 17.8 C48.2 17 47 17.8 47 19 C47 20.8 49 22.5 49 22.5 C49 22.5 51 20.8 51 19 Z" fill="#fca5a5" opacity="0.7" />
    </svg>
  );
};

// Confident (自信) — Wink, raised brow, side smirk
export const IconConfident = ({ className = "", size = 64, color = DEF_POS }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={StarPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 L33 16" stroke={h} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M21 26 Q25 22 29 26" stroke={FP} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M36 29 L42 28" stroke={FP} strokeWidth="2" strokeLinecap="round" />
      <circle cx="25" cy="34" r="2.5" fill={FP} />
      <circle cx="24" cy="33" r="1" fill={h} />
      <path d="M36 35 Q39 32 42 35" stroke={FP} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M27 42 Q34 47 40 41" stroke={FP} strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
};

// Curious (好奇) — Asymmetric eyes, question mark
export const IconCurious = ({ className = "", size = 64, color = DEF_POS }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={StarPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 L33 16" stroke={h} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M22 29 L28 29" stroke={FP} strokeWidth="2" strokeLinecap="round" />
      <path d="M36 26 Q39 23 42 26" stroke={FP} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="25" cy="35" r="2" fill={FP} />
      <circle cx="39" cy="34" r="3.5" fill={FP} />
      <circle cx="38" cy="33" r="1.2" fill={h} />
      <ellipse cx="32" cy="44" rx="3" ry="2.5" fill={FP} />
      <text x="49" y="22" fontFamily="sans-serif" fontSize="13" fontWeight="bold" fill={s} opacity="0.7">?</text>
    </svg>
  );
};

// Expectant (期待) — Big sparkly eyes, excited open mouth
export const IconExpectant = ({ className = "", size = 64, color = DEF_POS }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={StarPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 L33 16" stroke={h} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M21 27 Q25 23 29 27" stroke={FP} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M35 27 Q39 23 43 27" stroke={FP} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="25" cy="34" r="4" fill={FP} />
      <circle cx="39" cy="34" r="4" fill={FP} />
      <circle cx="23" cy="32" r="1.5" fill={h} />
      <circle cx="37" cy="32" r="1.5" fill={h} />
      <path d="M27 33 L27.5 31.5 L28 33 L27.5 34.5 Z" fill={h} />
      <path d="M41 33 L41.5 31.5 L42 33 L41.5 34.5 Z" fill={h} />
      <ellipse cx="32" cy="44" rx="4" ry="3.5" fill={FP} />
      <path d="M52 16 L52.5 18 L54.5 18.5 L52.5 19 L52 21 L51.5 19 L49.5 18.5 L51.5 18 Z" fill={h} opacity="0.8" />
    </svg>
  );
};

// Grateful (感激) — Warm ovals, deep blush, heart
export const IconGrateful = ({ className = "", size = 64, color = DEF_POS }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={StarPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 L33 16" stroke={h} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M22 29 Q25 27 28 29" stroke={FP} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M36 29 Q39 27 42 29" stroke={FP} strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="25" cy="35" rx="2" ry="2.5" fill={FP} />
      <ellipse cx="39" cy="35" rx="2" ry="2.5" fill={FP} />
      <path d="M27 42 Q32 47 37 42" stroke={FP} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="38" r="3" fill="#fca5a5" opacity="0.7" />
      <circle cx="44" cy="38" r="3" fill="#fca5a5" opacity="0.7" />
      <path d="M50 20 C50 18.5 48.5 17.5 47.5 18.5 C46.5 17.5 45 18.5 45 20 C45 22 47.5 24 47.5 24 C47.5 24 50 22 50 20 Z" fill="#fca5a5" />
    </svg>
  );
};

// Happy (开心) — Big laugh, squeezed eyes, sparkles
export const IconHappy = ({ className = "", size = 64, color = DEF_POS }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={StarPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 L33 16" stroke={h} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <path d="M21 32 Q25 28 29 32" stroke={FP} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M35 32 Q39 28 43 32" stroke={FP} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M23 39 Q32 52 41 39 Z" fill={FP} />
      <path d="M26 39 L38 39" stroke={f} strokeWidth="1" opacity="0.3" />
      <path d="M50 18 L51 21 L54 22 L51 23 L50 26 L49 23 L46 22 L49 21 Z" fill={h} />
      <path d="M12 18 L13 20 L15 21 L13 22 L12 24 L11 22 L9 21 L11 20 Z" fill={h} opacity="0.6" />
    </svg>
  );
};

// ============================================================
// NEGATIVE — Droplet Icons
// ============================================================

// Lonely (孤独) — Small side-looking dots, tiny frown, shadow, single tear
export const IconLonely = ({ className = "", size = 64, color = DEF_NEG }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={DropletPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 C32 12 40 22 40 28" stroke={h} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" fill="none" />
      <path d="M22 31 L27 32" stroke={FN} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M37 32 L42 31" stroke={FN} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <circle cx="24" cy="36" r="1.5" fill={FN} />
      <circle cx="36" cy="36" r="1.5" fill={FN} />
      <path d="M29 46 Q32 44 35 46" stroke={FN} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M38 39 C38 39 39.5 41 39.5 42.5 C39.5 43.3 38.8 44 38 44 C37.2 44 36.5 43.3 36.5 42.5 C36.5 41 38 39 38 39 Z" fill="#93c5fd" opacity="0.5" />
      <ellipse cx="32" cy="53" rx="12" ry="2" fill="#1e1b4b" opacity="0.15" />
    </svg>
  );
};

// Repressed (压抑) — Heavy brows, barely-open slits, tight mouth, weight above
export const IconRepressed = ({ className = "", size = 64, color = DEF_NEG }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={DropletPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 C32 12 40 22 40 28" stroke={h} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" fill="none" />
      <path d="M21 30 L29 32" stroke={FN} strokeWidth="3" strokeLinecap="round" />
      <path d="M35 32 L43 30" stroke={FN} strokeWidth="3" strokeLinecap="round" />
      <path d="M23 36 L28 36" stroke={FN} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M36 36 L41 36" stroke={FN} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M23 38 Q25.5 39.5 28 38" stroke={FN} strokeWidth="1" strokeLinecap="round" opacity="0.35" fill="none" />
      <path d="M36 38 Q38.5 39.5 41 38" stroke={FN} strokeWidth="1" strokeLinecap="round" opacity="0.35" fill="none" />
      <path d="M27 46 L37 46" stroke={FN} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 14 Q28 11 32 14 Q36 11 40 14" stroke={s} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" fill="none" />
      <path d="M26 11 Q30 8 34 11 Q38 8 42 11" stroke={s} strokeWidth="1" strokeLinecap="round" opacity="0.2" fill="none" />
    </svg>
  );
};

// Wronged (委屈) — Sad brows, large watery eyes, pouty lip, tear streams
export const IconWronged = ({ className = "", size = 64, color = DEF_NEG }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={DropletPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 C32 12 40 22 40 28" stroke={h} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" fill="none" />
      <path d="M21 28 L28 31" stroke={FN} strokeWidth="2" strokeLinecap="round" />
      <path d="M43 28 L36 31" stroke={FN} strokeWidth="2" strokeLinecap="round" />
      <circle cx="26" cy="35" r="3" fill={FN} />
      <circle cx="38" cy="35" r="3" fill={FN} />
      <circle cx="25" cy="34" r="1" fill={h} />
      <circle cx="37" cy="34" r="1" fill={h} />
      <path d="M27 44 Q32 41 37 44" stroke={FN} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M29 45.5 Q32 47 35 45.5" stroke={FN} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M22 38 L20 44 L19 50" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.65" />
      <path d="M42 38 L44 44 L45 50" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.65" />
      <circle cx="19" cy="51" r="1.8" fill="#93c5fd" opacity="0.45" />
      <circle cx="45" cy="51" r="1.8" fill="#93c5fd" opacity="0.45" />
    </svg>
  );
};

// Sad (悲伤) — Heavy drooping brows, closed eyes, big frown, streaming tears
export const IconSad = ({ className = "", size = 64, color = DEF_NEG }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={DropletPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 C32 12 40 22 40 28" stroke={h} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" fill="none" />
      <path d="M21 27 L28 30" stroke={FN} strokeWidth="2" strokeLinecap="round" />
      <path d="M43 27 L36 30" stroke={FN} strokeWidth="2" strokeLinecap="round" />
      <path d="M22 35 Q25 38 28 35" stroke={FN} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M36 35 Q39 38 42 35" stroke={FN} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M25 47 Q32 41 39 47" stroke={FN} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M23 38 C23 38 21 42 21 46" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M41 38 C41 38 43 42 43 46" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
      <circle cx="21" cy="47" r="1.8" fill="#93c5fd" opacity="0.5" />
      <circle cx="43" cy="47" r="1.8" fill="#93c5fd" opacity="0.5" />
    </svg>
  );
};

// Confused (迷茫) — Spiral eyes, wavy mouth, question marks
export const IconConfused = ({ className = "", size = 64, color = DEF_NEG }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={DropletPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 C32 12 40 22 40 28" stroke={h} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" fill="none" />
      <path d="M22 29 L28 30" stroke={FN} strokeWidth="2" strokeLinecap="round" />
      <path d="M36 27 Q39 24 42 27" stroke={FN} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="25" cy="35" r="3.5" stroke={FN} strokeWidth="1.5" fill="none" />
      <path d="M25 32 Q27 33 26 35 Q25 37 23 36" stroke={FN} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="39" cy="35" r="3.5" stroke={FN} strokeWidth="1.5" fill="none" />
      <path d="M39 32 Q41 33 40 35 Q39 37 37 36" stroke={FN} strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M27 45 Q30 43 32 45 Q34 47 37 45" stroke={FN} strokeWidth="2" strokeLinecap="round" fill="none" />
      <text x="47" y="22" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill={s} opacity="0.7">?</text>
      <text x="12" y="26" fontFamily="sans-serif" fontSize="10" fontWeight="bold" fill={s} opacity="0.4">?</text>
    </svg>
  );
};

// Anxious (焦虑) — Worried brows, zigzag mouth, sweat drops
export const IconAnxious = ({ className = "", size = 64, color = DEF_NEG }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={DropletPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 C32 12 40 22 40 28" stroke={h} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" fill="none" />
      <path d="M22 28 Q26 24 29 28" stroke={FN} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M35 28 Q38 24 42 28" stroke={FN} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="26" cy="34" r="1.5" fill={FN} />
      <circle cx="38" cy="34" r="1.5" fill={FN} />
      <path d="M25 44 L28 42 L31 45 L34 42 L37 45 L40 43" stroke={FN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M46 18 C46 18 49 21 49 23 C49 24.5 47.8 25.5 46.5 25.5 C45.2 25.5 44 24.5 44 23 C44 21 46 18 46 18 Z" fill="#93c5fd" stroke="#60a5fa" strokeWidth="1" />
      <path d="M50 26 C50 26 51.5 28 51.5 29 C51.5 29.8 50.9 30.5 50 30.5 C49.1 30.5 48.5 29.8 48.5 29 C48.5 28 50 26 50 26 Z" fill="#93c5fd" stroke="#60a5fa" strokeWidth="0.8" opacity="0.7" />
    </svg>
  );
};

// Scared (害怕) — HUGE white eyes, tiny pupils, wide O mouth, tremble lines
export const IconScared = ({ className = "", size = 64, color = DEF_NEG }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={DropletPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 C32 12 40 22 40 28" stroke={h} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" fill="none" />
      <path d="M21 26 Q25 22 29 26" stroke={FN} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M35 26 Q39 22 43 26" stroke={FN} strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="26" cy="34" r="5" fill="white" stroke={FN} strokeWidth="1.5" />
      <circle cx="38" cy="34" r="5" fill="white" stroke={FN} strokeWidth="1.5" />
      <circle cx="26" cy="35" r="1.5" fill={FN} />
      <circle cx="38" cy="35" r="1.5" fill={FN} />
      <ellipse cx="32" cy="46" rx="4" ry="3.5" fill={FN} />
      <path d="M11 32 L13.5 32" stroke={s} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M10 36 L13 36" stroke={s} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
      <path d="M50.5 32 L53 32" stroke={s} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <path d="M51 36 L53.5 36" stroke={s} strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
};

// Angry (愤怒) — Steep V brows, fierce eyes, gritted teeth, anger marks
export const IconAngry = ({ className = "", size = 64, color = DEF_NEG }: EmotionIconProps) => {
  const { f, s, h } = c(color);
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={`${className} overflow-visible`}>
      <path d={DropletPath} fill={f} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 12 C32 12 40 22 40 28" stroke={h} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" fill="none" />
      <path d="M19 25 L29 31" stroke={FN} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M45 25 L35 31" stroke={FN} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="27" cy="35" r="1.5" fill={FN} />
      <circle cx="37" cy="35" r="1.5" fill={FN} />
      <rect x="26" y="42" width="12" height="5" rx="1" fill={FN} />
      <line x1="29" y1="42" x2="29" y2="47" stroke={f} strokeWidth="1" />
      <line x1="32" y1="42" x2="32" y2="47" stroke={f} strokeWidth="1" />
      <line x1="35" y1="42" x2="35" y2="47" stroke={f} strokeWidth="1" />
      <path d="M48 20 L45 23 M48 23 L45 20" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
      <path d="M16 22 L14 24 M16 24 L14 22" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
};

// ============================================================
// Backward-compatibility aliases (used by MoodTracker)
// ============================================================
export const IconRelieved = IconCalm;
export const IconTired = IconRepressed;

// ============================================================
// Ordered 16-icon array — matches EmotionPage display order
// Row 1 (Stars): 平静 → 满足 → 温暖 → 自信 → 好奇 → 期待 → 感激 → 开心
// Row 2 (Drops): 孤独 → 压抑 → 委屈 → 悲伤 → 迷茫 → 焦虑 → 害怕 → 愤怒
// ============================================================
export const ZeneWeEmotions = [
  IconCalm,       // 0  平静
  IconSatisfied,  // 1  满足
  IconWarm,       // 2  温暖
  IconConfident,  // 3  自信
  IconCurious,    // 4  好奇
  IconExpectant,  // 5  期待
  IconGrateful,   // 6  感激
  IconHappy,      // 7  开心
  IconLonely,     // 8  孤独
  IconRepressed,  // 9  压抑
  IconWronged,    // 10 委屈
  IconSad,        // 11 悲伤
  IconConfused,   // 12 迷茫
  IconAnxious,    // 13 焦虑
  IconScared,     // 14 害怕
  IconAngry,      // 15 愤怒
];

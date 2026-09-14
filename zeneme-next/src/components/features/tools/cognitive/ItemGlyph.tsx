'use client';

import React from 'react';
import { MOODS, MOOD_LOOKS, moodGlyph, type Mood } from '@/data/selectionTasks';
import {
  Armchair,
  Backpack,
  Bike,
  Bird,
  Bug,
  Bus,
  Car,
  Cat,
  CookingPot,
  DoorOpen,
  Dog,
  Drum,
  Eraser,
  Fish,
  Flame,
  Flashlight,
  Flower2,
  Glasses,
  Guitar,
  Hammer,
  HardHat,
  Headphones,
  Key,
  Leaf,
  Lightbulb,
  Lock,
  Microwave,
  Moon,
  NotebookPen,
  Panda,
  Paperclip,
  Pencil,
  Plane,
  Rabbit,
  Rat,
  Refrigerator,
  Ruler,
  Sailboat,
  Scissors,
  Shirt,
  Shrimp,
  Snail,
  Snowflake,
  Squirrel,
  Sun,
  Sunrise,
  Sunset,
  TrainFront,
  Truck,
  Turtle,
  Umbrella,
  Watch,
  Worm,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/**
 * 认知快测 — every stimulus the screen can draw.
 *
 * Four tiers, and which tier an item lands in is a deliberate choice rather
 * than an accident of what lucide ships:
 *
 * 1. `FOOD_ART` / `FACE_ART` / `MOOD_ART` — hand-drawn, filled, multi-colour.
 *    Used wherever the item has to read as a real thing at a glance.
 * 2. `OUTLINE_ART` — hand-drawn, but to lucide's conventions, for items lucide
 *    does not ship at all. Deliberately indistinguishable from tier 3.
 * 3. `LUCIDE_GLYPHS` + `GLYPH_COLOR` — outlines, but each in the colour the
 *    thing actually is. A monochrome outline grid is the single biggest reason
 *    the earlier build felt like an IQ test rather than a recognition task.
 * 4. `NEUTRAL_SHAPES` — the abstract shapes, drawn in one shared colour on
 *    purpose (see below).
 *
 * The abstract-shape *memory* family is gone. Remembering "rectangle with a
 * diagonal through it" measured figure discrimination, not memory, and there was
 * no clinical basis for choosing those shapes. Shapes survive only in 图形划消,
 * where an abstract target is the point.
 */

/* ------------------------------------------------------------------ *
 * Tier 3 · abstract shapes (图形划消 only)
 * ------------------------------------------------------------------ */

/**
 * 24x24, stroke-only. All three share `SHAPE_COLOR`: colouring the star would
 * let it pop out pre-attentively and the task would stop measuring visual
 * search. This is the one screen where uniformity is the design.
 */
const SHAPE_COLOR = '#cbd5e1';

const NEUTRAL_SHAPES: Record<string, React.ReactNode> = {
  circle: <circle cx="12" cy="12" r="7" />,
  triangle: <path d="M12 4 21 20 3 20Z" />,
  star: (
    <path d="M12 3.5 14.6 9.4 21 10.1 16.3 14.4 17.6 20.7 12 17.5 6.4 20.7 7.7 14.4 3 10.1 9.4 9.4Z" />
  ),
};

/* ------------------------------------------------------------------ *
 * Tier 1 · food
 * ------------------------------------------------------------------ */

/**
 * Filled, coloured produce. Fill marks *food*, not *fruit* — 胡萝卜, 玉米 and
 * 蘑菇 are drawn the same way as the fruit precisely so that "pick out the
 * fruit" cannot be solved by picking the filled cards. It turns the near misses
 * into real ones, which is what the category item is supposed to test.
 */
/**
 * 玉米 kernels — a staggered brick, light on a darker cob. Generated rather than
 * written out because the rows alternate 2 and 3 and the x positions have to stay
 * inside the cob ellipse at each y; by hand that is twenty numbers to keep in
 * step whenever the cob changes shape.
 */
const CORN_KERNELS = [6.2, 8.1, 10, 11.9, 13.8, 15.7, 17.5, 19.2].flatMap((cy, row) => {
  // Room either side of centre at this height: the cob's half-width less the
  // kernel radius. The rows narrow towards both tips, so the widest row has to
  // drop back to two kernels near the bottom or they poke out of the cob.
  const room = 4.9 * Math.sqrt(1 - ((cy - 12) / 8.4) ** 2) - 0.85;
  const xs = row % 2 === 1 && room >= 2.2 ? [9.8, 12, 14.2] : [10.9, 13.1];
  return xs.map((cx) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.85" fill="#fde047" />);
});

const FOOD_ART: Record<string, React.ReactNode> = {
  apple: (
    <>
      <path d="M12 4.2v3.4" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M12.3 5.6c1-1.7 2.9-2.4 4.4-2 .3 1.6-.7 3.4-2.3 4-.9.3-1.8.1-2.1-.5-.2-.5-.2-1 0-1.5Z"
        fill="#22c55e"
      />
      <path
        d="M8.6 6.6c1.3 0 2.4.6 3.4 1.6 1-1 2.1-1.6 3.4-1.6 2.6 0 4.3 2.3 4.3 5.3 0 4.2-3.4 8.5-6 8.5-.6 0-1.2-.2-1.7-.4-.5.2-1.1.4-1.7.4-2.6 0-6-4.3-6-8.5 0-3 1.7-5.3 4.3-5.3Z"
        fill="#ef4444"
      />
      <path d="M9.4 9.4c-1 .7-1.6 2-1.6 3.4" stroke="#fca5a5" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  banana: (
    <>
      <path
        d="M4.4 8.6c0 5.4 4.4 9.8 9.8 9.8 2.9 0 5.2-1.1 6.5-2.5.4-.5.1-1.2-.6-1.2-4.7 0-8.5-3.8-8.5-8.5 0-.8-.8-1.2-1.4-.8-2.9 1.5-3.8 2.2-5.8 3.2Z"
        fill="#facc15"
      />
      <path d="M20.1 15.9c.5-.4 1-1 1.3-1.6" stroke="#a16207" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.6 7.7c.4-.8.9-1.5 1.5-2" stroke="#a16207" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  grape: (
    <>
      <path d="M12 4v3" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12.2 5c1-1.3 2.5-1.8 3.8-1.5" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" />
      <g fill="#8b5cf6">
        <circle cx="9.2" cy="10" r="2.2" />
        <circle cx="14.8" cy="10" r="2.2" />
        <circle cx="12" cy="13.2" r="2.2" />
        <circle cx="7.4" cy="14" r="2.2" />
        <circle cx="16.6" cy="14" r="2.2" />
        <circle cx="9.6" cy="17.2" r="2.2" />
        <circle cx="14.4" cy="17.2" r="2.2" />
      </g>
    </>
  ),
  cherry: (
    <>
      <path d="M12 5.5c-2.4 1.6-3.8 4-4.3 6.6M12 5.5c2.4 1.6 3.8 4 4.3 6.6" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="7.3" cy="16" r="3.6" fill="#e11d48" />
      <circle cx="16.7" cy="16" r="3.6" fill="#e11d48" />
      <path d="M6.2 14.4c-.5.4-.8 1-.9 1.7" stroke="#fda4af" strokeWidth="1.2" strokeLinecap="round" />
    </>
  ),
  citrus: (
    <>
      <circle cx="12" cy="13" r="7.4" fill="#f97316" />
      <g stroke="#fed7aa" strokeWidth="1.2" strokeLinecap="round">
        <path d="M12 6.4v13.2M5.6 13h12.8M7.5 8.5l9 9M16.5 8.5l-9 9" />
      </g>
      <path d="M12 5.8c.9-1.2 2.2-1.7 3.4-1.5" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  pear: (
    <>
      <path d="M12 4.4v3" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M12 6.4c1.6 0 2.6 1.4 2.6 3 0 1.2 3.1 2.7 3.1 6.2 0 2.8-2.5 4.7-5.7 4.7s-5.7-1.9-5.7-4.7c0-3.5 3.1-5 3.1-6.2 0-1.6 1-3 2.6-3Z"
        fill="#a3e635"
      />
      <path d="M9.6 13.6c-.9.9-1.4 2.1-1.4 3.3" stroke="#ecfccb" strokeWidth="1.3" strokeLinecap="round" />
    </>
  ),
  watermelon: (
    <>
      <path d="M3.2 9.6h17.6c0 5.4-3.9 9.8-8.8 9.8S3.2 15 3.2 9.6Z" fill="#16a34a" />
      <path d="M5.2 10.8h13.6c0 4.3-3 7.6-6.8 7.6s-6.8-3.3-6.8-7.6Z" fill="#ef4444" />
      <g fill="#1c1917">
        <circle cx="9.4" cy="13.4" r=".85" />
        <circle cx="14.6" cy="13.4" r=".85" />
        <circle cx="12" cy="16.2" r=".85" />
      </g>
    </>
  ),
  strawberry: (
    <>
      <path
        d="M12 20.6c-3.4 0-6.2-3-6.2-6.4 0-2.3 2.8-3.9 6.2-3.9s6.2 1.6 6.2 3.9c0 3.4-2.8 6.4-6.2 6.4Z"
        fill="#e11d48"
      />
      <path
        d="M12 6.2c1.9 0 3.4.9 4.4 2.2-1.3.7-2.8 1.1-4.4 1.1s-3.1-.4-4.4-1.1c1-1.3 2.5-2.2 4.4-2.2Z"
        fill="#16a34a"
      />
      <path d="M12 6.2V4" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" />
      <g fill="#fecdd3">
        <circle cx="10" cy="14.4" r=".7" />
        <circle cx="14" cy="14.4" r=".7" />
        <circle cx="12" cy="17.2" r=".7" />
      </g>
    </>
  ),
  /**
   * 胡萝卜 tapers to a point at the *bottom*, and the taper is the whole
   * silhouette. Drawn as an equilateral triangle lying on its side, as this was,
   * it reads as a media play button — a tester asked what the picture was, which
   * on a recognition test scores as a memory error the drawing caused.
   */
  carrot: (
    <>
      <g stroke="#16a34a" strokeWidth="1.7" strokeLinecap="round">
        <path d="M12 8.6V3.8M12 8.6 8.7 5.2M12 8.6l3.3-3" />
      </g>
      <path d="M9.2 8.8c1.9-.8 3.7-.8 5.6 0l-2.3 12.1c-.1.6-.9.6-1 0Z" fill="#f97316" />
      <g stroke="#c2410c" strokeWidth=".8" strokeLinecap="round" opacity=".75">
        <path d="M10.1 11.2l1.5.6M13.6 13.4l-1.4.6M10.9 15.8l1.3.5" />
      </g>
    </>
  ),
  /**
   * 玉米 is kernels. Three long vertical stripes down a yellow oval — what this
   * was — read as a striped melon, and it was the second drawing a tester had to
   * ask about. A staggered brick of light kernels on a darker cob is the cue that
   * survives being 44px wide; the husk leaves are secondary.
   */
  corn: (
    <>
      <path d="M8.6 12.6C5.6 13.6 3.8 16.4 3.9 20.2 7.4 19.6 9.6 17.2 10 13.8Z" fill="#22c55e" />
      <path d="M15.4 14.4c2.4.9 3.9 2.9 4 5.8-2.7-.5-4.5-2-5.2-4.4Z" fill="#16a34a" />
      <ellipse cx="12" cy="12" rx="4.9" ry="8.4" fill="#eab308" />
      {CORN_KERNELS}
    </>
  ),
  mushroom: (
    <>
      <path d="M4.6 12.2c0-3.9 3.3-7 7.4-7s7.4 3.1 7.4 7c0 .7-.6 1.2-1.3 1.2H5.9c-.7 0-1.3-.5-1.3-1.2Z" fill="#dc2626" />
      <g fill="#fecaca">
        <circle cx="9" cy="9.4" r="1.3" />
        <circle cx="14.6" cy="10.2" r="1" />
      </g>
      <path d="M9.8 13.4h4.4v4.3c0 1.2-1 2.1-2.2 2.1s-2.2-.9-2.2-2.1v-4.3Z" fill="#fef3c7" />
    </>
  ),
  /**
   * The four that took the fruit family from 8 to 12. The game runs two rounds
   * off disjoint halves of the family, so 12 is the number that lets the second
   * round show six fruits the first one did not — without that, both rounds draw
   * from the same eight and the second reads as the first screen again.
   *
   * Each was picked for a silhouette and a hue nothing else in the family has:
   * the cleft and blush of 桃子, the crown and crosshatch of 菠萝, the ellipse
   * and nubs of 柠檬, the cut face of 猕猴桃. A 蓝莓 was the obvious twelfth and
   * was dropped for the opposite reason — a cluster of small purple circles is
   * 葡萄 at a glance, and a fruit the user confuses with another fruit is a
   * scoring error the drawing caused.
   */
  peach: (
    <>
      <path d="M12.3 7.6c.9-1.5 2.6-2.2 4-1.8.2 1.5-.7 3.1-2.2 3.6-.8.3-1.6 0-1.9-.5-.2-.4-.2-.9.1-1.3Z" fill="#22c55e" />
      <path d="M12 8.2c4 0 7 2.7 7 6.2 0 3.3-3.1 6-7 6s-7-2.7-7-6c0-3.5 3-6.2 7-6.2Z" fill="#fb923c" />
      {/* Highlight down the near cheek, not a blush laid over half the fruit — a
          filled half turned the peach into two flat colours meeting at a hard
          vertical line, which read as a cut fruit rather than a whole one. */}
      <path
        d="M9.2 9.2C7 10.4 5.8 12.3 5.8 14.4c0 1.7.8 3.2 2.2 4.3"
        stroke="#fdba74"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Off centre and short of both ends: a full-height line down the middle
          divides the fruit in two and reads as a cut. */}
      <path d="M10.6 9.4c-1 2.2-1 7.6.2 9.8" stroke="#c2410c" strokeWidth=".8" strokeLinecap="round" fill="none" />
    </>
  ),
  pineapple: (
    <>
      <g stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M12 8.6V3.4M12 8.6 8.8 4.8M12 8.6l3.2-3.8M12 8.6 8 6.8M12 8.6l4-1.8" />
      </g>
      <path d="M12 8.6c3.2 0 5.5 2.3 5.5 5.5 0 3.7-2.5 6.5-5.5 6.5s-5.5-2.8-5.5-6.5c0-3.2 2.3-5.5 5.5-5.5Z" fill="#eab308" />
      <g stroke="#854d0e" strokeWidth=".9" strokeLinecap="round" fill="none">
        <path d="M7.4 12.2 12 16.4l4.6-4.2M7.6 16.2 12 20.2l4.4-4M12 10.2l3.6 3.4M12 10.2l-3.6 3.4" />
      </g>
    </>
  ),
  lemon: (
    <>
      {/* The two tips are filled in the body colour and overlap the ellipse, so
          they merge into points. Drawn as separate strokes they stood off the
          fruit and read as handles screwed into an orange. */}
      <g fill="#fde047">
        <ellipse cx="12" cy="13.4" rx="7" ry="5.6" />
        <path d="M2.9 13.4c1-1.5 2.1-2.3 3.3-2.5v5c-1.2-.2-2.3-1-3.3-2.5Z" />
        <path d="M21.1 13.4c-1-1.5-2.1-2.3-3.3-2.5v5c1.2-.2 2.3-1 3.3-2.5Z" />
      </g>
      <ellipse cx="9.6" cy="11.2" rx="2.4" ry="1.2" fill="#fef9c3" transform="rotate(-16 9.6 11.2)" />
      <path d="M12.4 8c.4-1.3 1.5-2 2.8-1.9" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </>
  ),
  kiwi: (
    <>
      <circle cx="12" cy="12.6" r="8.2" fill="#7c5c34" />
      <circle cx="12" cy="12.6" r="6.6" fill="#84cc16" />
      <circle cx="12" cy="12.6" r="2" fill="#fef9c3" />
      <g fill="#1c1917">
        <circle cx="12" cy="8.6" r=".6" />
        <circle cx="15.4" cy="10.4" r=".6" />
        <circle cx="16" cy="14" r=".6" />
        <circle cx="13.4" cy="16.2" r=".6" />
        <circle cx="10" cy="16" r=".6" />
        <circle cx="8.2" cy="13" r=".6" />
        <circle cx="9.2" cy="9.8" r=".6" />
      </g>
    </>
  ),
};

/* ------------------------------------------------------------------ *
 * Tier 1 · faces (数一数有几张脸)
 * ------------------------------------------------------------------ */

/**
 * Four faces and the round things they hide among. The distractors are round
 * and patterned on purpose — a clock face and a flower centre are the near
 * misses that make counting faces a discrimination task rather than a
 * count-the-circles task.
 */
const FACE_ART: Record<string, React.ReactNode> = {
  'face-a': (
    <>
      <circle cx="12" cy="12" r="8.2" fill="#fbbf7d" />
      <g fill="#44403c">
        <circle cx="9.3" cy="10.6" r="1" />
        <circle cx="14.7" cy="10.6" r="1" />
      </g>
      <path d="M8.8 14.6c1.8 1.7 4.6 1.7 6.4 0" stroke="#44403c" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </>
  ),
  'face-b': (
    <>
      <circle cx="12" cy="12" r="8.2" fill="#f5c9a4" />
      <path d="M3.9 10.6c1.4-3.7 4.4-5.6 8.1-5.6s6.7 1.9 8.1 5.6c-2-.7-4.1-1.6-8.1-1.6s-6.1.9-8.1 1.6Z" fill="#3f3f46" />
      <g fill="#44403c">
        <circle cx="9.3" cy="12.4" r="1" />
        <circle cx="14.7" cy="12.4" r="1" />
      </g>
      <path d="M9.6 16.2h4.8" stroke="#44403c" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  'face-c': (
    <>
      <circle cx="12" cy="12" r="8.2" fill="#e8b48c" />
      <g stroke="#44403c" strokeWidth="1.5" strokeLinecap="round">
        <path d="M7.6 10.4h2.6M13.8 10.4h2.6" />
      </g>
      <circle cx="9.4" cy="12.4" r="2.4" stroke="#3f3f46" strokeWidth="1.2" fill="none" />
      <circle cx="14.6" cy="12.4" r="2.4" stroke="#3f3f46" strokeWidth="1.2" fill="none" />
      <path d="M11.8 12.4h.4" stroke="#3f3f46" strokeWidth="1.2" />
      <path d="M10.2 16.8c1.2.8 2.4.8 3.6 0" stroke="#44403c" strokeWidth="1.3" strokeLinecap="round" fill="none" />
    </>
  ),
  'face-d': (
    <>
      <circle cx="12" cy="12" r="8.2" fill="#d9a273" />
      <g fill="#44403c">
        <circle cx="9.3" cy="10.2" r="1" />
        <circle cx="14.7" cy="10.2" r="1" />
      </g>
      <path d="M6.6 13.6c0 3.5 2.4 6.2 5.4 6.2s5.4-2.7 5.4-6.2c-1.6 1-3.4 1.5-5.4 1.5s-3.8-.5-5.4-1.5Z" fill="#57534e" />
    </>
  ),
  // Round non-faces.
  ball: (
    <>
      <circle cx="12" cy="12" r="8.2" fill="#f97316" />
      <g stroke="#7c2d12" strokeWidth="1.2" fill="none">
        <path d="M3.8 12h16.4M12 3.8v16.4" />
      </g>
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.2" fill="#e2e8f0" />
      <circle cx="12" cy="12" r="8.2" stroke="#64748b" strokeWidth="1.2" fill="none" />
      <path d="M12 7.4V12l3.4 2.2" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </>
  ),
  'flower-round': (
    <>
      <g fill="#f472b6">
        <circle cx="12" cy="5.6" r="3.1" />
        <circle cx="12" cy="18.4" r="3.1" />
        <circle cx="5.6" cy="12" r="3.1" />
        <circle cx="18.4" cy="12" r="3.1" />
      </g>
      <circle cx="12" cy="12" r="3.4" fill="#facc15" />
    </>
  ),
  cup: (
    <>
      <path d="M5.4 8h11v6.4c0 2.6-2.1 4.6-4.7 4.6H10c-2.6 0-4.6-2-4.6-4.6V8Z" fill="#38bdf8" />
      <path d="M16.4 9.6h1.8c1.2 0 2.2 1 2.2 2.2s-1 2.2-2.2 2.2h-1.8" stroke="#0284c7" strokeWidth="1.5" fill="none" />
    </>
  ),
};

/* ------------------------------------------------------------------ *
 * Tier 1 · expressions (表情辨识)
 * ------------------------------------------------------------------ */

/**
 * The five expressions the 表情 questions use.
 *
 * Built by combining a look (skin and hair) with a set of features (brows, eyes,
 * mouth) rather than drawn one by one, because the questions need the same
 * expression on different faces and the same face with different expressions.
 * Writing out that grid by hand would be 25 near-identical drawings that drift
 * apart as they are edited, and the moment two of them drift the item stops
 * measuring the expression and starts measuring the drawing.
 *
 * The pairs that have to survive a 44px card were chosen against each other:
 * 开心 and 平静 differ at the mouth *and* the eyes (arcs versus dots), and
 * 生气 and 难过 differ by which way the brows slope plus the tear. A single cue
 * would be too easy to lose at that size.
 *
 * Which expressions exist and what they are called is decided in selectionTasks
 * — that file writes the questions, this one draws what they ask for.
 */

/**
 * Skin and hair, so two faces wearing one expression are not one drawing twice.
 *
 * Every cap starts and ends on the face circle and follows its arc over the
 * crown (`A8.2 8.2` — the same radius). Drawn as a free curve instead, the hair
 * leaves a crescent of scalp above it and reads as a headband, which is what the
 * first version did.
 */
const MOOD_LOOK_ART: { skin: string; hair: React.ReactNode }[] = [
  {
    skin: '#fbbf7d',
    hair: (
      <path
        d="M4.3 9.2A8.2 8.2 0 0 1 19.7 9.2C17.4 8.1 14.8 7.6 12 7.6S6.6 8.1 4.3 9.2Z"
        fill="#3f3f46"
      />
    ),
  },
  {
    skin: '#f5c9a4',
    hair: (
      <>
        {/* Long hair: the strands run down outside the cheeks rather than
            sitting on them, where two brown blobs level with the eyes looked
            like headphones. Each strand's inner edge closes on a chord *inside*
            the face — closed level with the cap's ends instead, the face bulges
            past it and a wedge of bare skin shows through at the temple. */}
        <path d="M4.1 9.6C2.6 12.6 2.9 16.4 4.6 19.4 6.2 18.6 6.8 15.2 6.3 10.6Z" fill="#7c2d12" />
        <path d="M19.9 9.6C21.4 12.6 21.1 16.4 19.4 19.4 17.8 18.6 17.2 15.2 17.7 10.6Z" fill="#7c2d12" />
        <path
          d="M4.1 9.6A8.2 8.2 0 0 1 19.9 9.6C17.5 8.2 14.8 7.4 12 7.4S6.5 8.2 4.1 9.6Z"
          fill="#7c2d12"
        />
      </>
    ),
  },
  {
    skin: '#e8b48c',
    hair: (
      <path
        d="M4.3 9.2A8.2 8.2 0 0 1 19.7 9.2C18.6 7.3 16 6.5 12.6 7.1 10.3 7.5 8.7 8.5 7.9 10 7.1 8.9 5.8 8.6 4.3 9.2Z"
        fill="#1c1917"
      />
    ),
  },
];

const MOOD_FEATURES: Record<Mood, React.ReactNode> = {
  happy: (
    <>
      {/* Squeezed-shut eyes and a wide arc. Two cues, so the card still reads at
          thumbnail size where the mouth alone would not. */}
      <path
        d="M8.2 11.6c.5-.9 1.6-.9 2.1 0M13.7 11.6c.5-.9 1.6-.9 2.1 0"
        stroke="#44403c"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M8.4 14.4c1.9 2.4 5.3 2.4 7.2 0" stroke="#44403c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </>
  ),
  calm: (
    <>
      <g fill="#44403c">
        <circle cx="9.3" cy="11.8" r="1" />
        <circle cx="14.7" cy="11.8" r="1" />
      </g>
      <path d="M10 15.6h4" stroke="#44403c" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  angry: (
    <>
      {/* Brows down towards the nose — the direction is the whole difference
          from 难过, which slopes them the other way. */}
      <path d="M7.8 9.8 10.6 11M16.2 9.8 13.4 11" stroke="#44403c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <g fill="#44403c">
        <circle cx="9.3" cy="12.6" r="1" />
        <circle cx="14.7" cy="12.6" r="1" />
      </g>
      <path d="M9.2 16.8c1.7-1.7 4-1.7 5.6 0" stroke="#44403c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </>
  ),
  sad: (
    <>
      <path d="M7.8 11.2 10.6 9.9M16.2 11.2 13.4 9.9" stroke="#44403c" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <g fill="#44403c">
        <circle cx="9.3" cy="12.6" r="1" />
        <circle cx="14.7" cy="12.6" r="1" />
      </g>
      <path d="M9.6 17c1.5-1.4 3.3-1.4 4.8 0" stroke="#44403c" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M9.3 14c.8 1 1.1 1.7 1.1 2.2 0 .6-.5 1-1.1 1s-1.1-.4-1.1-1c0-.5.3-1.2 1.1-2.2Z" fill="#38bdf8" />
    </>
  ),
  surprised: (
    <>
      <path d="M7.6 9.4c.7-.8 1.9-.8 2.6 0M13.8 9.4c.7-.8 1.9-.8 2.6 0" stroke="#44403c" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <g fill="#44403c">
        <circle cx="9.3" cy="12.2" r="1.4" />
        <circle cx="14.7" cy="12.2" r="1.4" />
      </g>
      <ellipse cx="12" cy="16.4" rx="1.7" ry="2.1" fill="#44403c" />
    </>
  ),
};

/**
 * Keyed off `MOOD_LOOKS` rather than off the array above, so every key
 * `moodGlyph` can produce has a drawing behind it whichever side of the pair
 * someone edits next — a missing key renders as an empty square, which on a
 * 找笑脸 grid is a cell the user cannot answer.
 */
const MOOD_ART: Record<string, React.ReactNode> = Object.fromEntries(
  MOODS.flatMap((mood) =>
    Array.from({ length: MOOD_LOOKS }, (_, index) => {
      const look = MOOD_LOOK_ART[index % MOOD_LOOK_ART.length];
      return [
        moodGlyph(mood, index),
        <>
          <circle cx="12" cy="12" r="8.2" fill={look.skin} />
          {look.hair}
          {MOOD_FEATURES[mood]}
        </>,
      ];
    }),
  ),
);

/* ------------------------------------------------------------------ *
 * Tier 2a · hand-drawn outlines
 * ------------------------------------------------------------------ */

/**
 * Animals lucide does not ship.
 *
 * They exist because the memory blocks draw 8 items from a family, and with only
 * the 15 animals lucide has, two runs in a row shared four of their eight items
 * on average — enough that a retake looked like the same test. lucide's animal
 * set is genuinely exhausted at those 15, so the rest had to be drawn.
 *
 * Drawn to lucide's conventions on purpose — 24x24, stroke only, round caps, and
 * rendered through the same colour map — because a hand-drawn item that looked
 * different from its neighbours would be more memorable for reasons that have
 * nothing to do with the user's memory.
 *
 * Every one was chosen for a silhouette unlike anything already in the family. A
 * bee next to 甲虫, or a duck next to 小鸟, would show up as false recognition
 * that says more about the drawings than about the person looking at them.
 */
const OUTLINE_ART: Record<string, React.ReactNode> = {
  /* --- 日常物品 lucide draws as something else -------------------------- *
   *
   * These eight were on lucide icons whose names match the item but whose
   * drawings do not: `Utensils` is a fork *and* knife, `UtensilsCrossed` the same
   * pair crossed, `Table` a spreadsheet, `ShoppingBasket` a supermarket basket,
   * `Brush` a paintbrush, `Radio` three signal arcs, `Beef` a cut of meat,
   * `Highlighter` an abstract nib. Two testers stopped to ask what a picture was,
   * and on a recognition test an unidentifiable stimulus is scored as the user's
   * memory error rather than ours — so each is drawn here instead.
   */
  // 勺子 and 叉子 are a pair in the same family, so they get the same handle: a
  // single stroke. Drawn as a tapered outline instead, the handle read as a hollow
  // tube and the spoon came out looking like a hand mirror.
  spoon: (
    <>
      <ellipse cx="12" cy="7" rx="3.4" ry="4.4" />
      <path d="M12 11.4v9.2" />
    </>
  ),
  fork: (
    <>
      <path d="M8.5 3.4v6.2M15.5 3.4v6.2" />
      <path d="M8.5 9.6c0 1.9 1.6 3.4 3.5 3.4s3.5-1.5 3.5-3.4" />
      {/* The middle tine runs straight on into the handle, which is what makes
          three prongs read as a fork rather than two. */}
      <path d="M12 3.4v17.2" />
    </>
  ),
  table: (
    <>
      <rect x="2.6" y="6.4" width="18.8" height="2.6" rx="0.6" />
      <path d="M6 9v9M18 9v9" />
    </>
  ),
  bucket: (
    <>
      {/* Tapered, so it reads as a pail rather than a bin. */}
      <path d="M5 9.2h14l-1.5 10.2c-.1 1-.9 1.6-1.8 1.6H8.3c-.9 0-1.7-.6-1.8-1.6Z" />
      <path d="M8 9.2V8a4 4 0 0 1 8 0v1.2" />
    </>
  ),
  broom: (
    <>
      <path d="M12 3v9" />
      <path d="M8.4 12h7.2l1.8 8.6H6.6Z" />
      {/* The band, and the bristles it holds. The flare alone is a lampshade. */}
      <path d="M9.4 15.4h5.2" />
      <path d="M8.6 20.6 9.9 15.6M12 20.6v-5M15.4 20.6 14.1 15.6" />
    </>
  ),
  radio: (
    <>
      <path d="M16.8 4.6 9.6 8.2" />
      <rect x="2.8" y="8.2" width="18.4" height="11" rx="2" />
      <circle cx="8.4" cy="13.7" r="3" />
      <path d="M14.6 11.4h3.8M14.6 14h3.8M14.6 16.6h3.8" />
    </>
  ),
  /**
   * 牛, front on. The horns carry it: without them a head this shape sits right
   * next to 猪 in the same palette, and the pair would show up as false
   * recognition between two items that are meant to be distinct.
   */
  cow: (
    <>
      {/* Flat forehead, so the horns rise from two corners rather than from a
          curve — round-headed with curled horns, it came out looking like a
          monkey. */}
      <path d="M7 10.2h10v3.6c0 2.9-2.2 5.2-5 5.2s-5-2.3-5-5.2Z" />
      <path d="M7 10.2C5.2 9.6 4 8.2 3.7 6.4M17 10.2c1.8-.6 3-2 3.3-3.8" />
      {/* Ears out sideways and pointed. Drawn hanging down the cheeks they read as
          a monkey's, which is the same mistake the horns made. */}
      <path d="M7 11.4 3.9 12.6 7 14M17 11.4l3.1 1.2L17 14" />
      <ellipse cx="12" cy="16.2" rx="3.2" ry="2.2" />
      <path d="M10.9 15.9h.01M13.1 15.9h.01" />
      <path d="M9.6 12.4h.01M14.4 12.4h.01" />
    </>
  ),
  /**
   * 荧光笔 — drawn upright with a chisel tip and the broad stroke it leaves, so it
   * cannot be mistaken for 铅笔, which is a thin diagonal with a point and sits in
   * the same distractor set.
   */
  highlighter: (
    <>
      {/* Held at an angle, with the broad nib flat on the page and the stroke it
          just laid down underneath. Drawn upright it read as a stapler. */}
      <path d="M18.2 3.6 20.4 5.8 11.6 14.6 9.4 12.4Z" />
      <path d="M9.4 12.4 11.6 14.6 9 17.2H6.4Z" />
      <path d="M15.6 6.2 17.8 8.4" />
      <path d="M5.4 20.4h11.2" />
    </>
  ),

  /**
   * A scallop, drawn by hand because lucide's `Shell` is a spiral nautilus and
   * nobody reads it as 贝壳 — it was the one item testers named wrongly every
   * time. A scallop is what the word means to a Chinese reader, and it is also
   * the easier silhouette: a hinge at the bottom, ridges fanning out of it, and
   * a ruffled edge along the top. The ridges do more of the work than the
   * ruffle; without them the outline is just a wide oval.
   *
   * The taper is what makes it a fan rather than a bowl: the sides have to meet
   * at a point at the hinge. A first attempt kept the outline nearly as wide at
   * the bottom as at the top, and with the ruffle along the upper edge the whole
   * thing read as a basket.
   */
  shell: (
    <>
      <path d="M12 20.4C7.9 19.2 4.2 15.3 3 10.4q1.5-2.4 3 0q1.5-2.4 3 0q1.5-2.4 3 0q1.5-2.4 3 0q1.5-2.4 3 0q1.5-2.4 3 0C19.8 15.3 16.1 19.2 12 20.4Z" />
      <path d="M12 20.4 6 10.4M12 20.4 9 10.4M12 20.4V10.4M12 20.4l3-10M12 20.4l6-10" />
      {/* The hinge. A scallop's two little ears are the detail that stops the
          fan from reading as a leaf. */}
      <path d="M9.9 20.6q2.1.9 4.2 0" />
    </>
  ),
  butterfly: (
    <>
      <path d="M12 7.4v9.8" />
      <path d="M12 7.4 9.6 4.6M12 7.4l2.4-2.8" />
      <path d="M12 9.6C9.6 5.5 4 4.7 3.6 8.7c-.3 3 4.4 4 8.4 3.4" />
      <path d="M12 9.6c2.4-4.1 8-4.9 8.4-.9.3 3-4.4 4-8.4 3.4" />
      <path d="M12 12.1c-3.4 0-7.2 1.4-6.6 4.8.5 2.8 4.8 2 6.6-1.2" />
      <path d="M12 12.1c3.4 0 7.2 1.4 6.6 4.8-.5 2.8-4.8 2-6.6-1.2" />
    </>
  ),
  frog: (
    <>
      <path d="M4.6 14.6c0-4.3 3.3-7 7.4-7s7.4 2.7 7.4 7c0 1.9-1.4 3.2-3.4 3.2H8c-2 0-3.4-1.3-3.4-3.2Z" />
      <circle cx="9" cy="9.6" r="1.5" />
      <circle cx="15" cy="9.6" r="1.5" />
      <path d="M9 14.4h6" />
      <path d="M7.2 17.8c-1.3.6-2.3 1.6-2.7 2.7M16.8 17.8c1.3.6 2.3 1.6 2.7 2.7" />
    </>
  ),
  // Pig and sheep are both front-on heads, so they are drawn to differ at the
  // silhouette: the pig has ears up and a wide snout, the sheep a fleece
  // topknot and ears down. Checked side by side at 44px.
  pig: (
    <>
      <path d="M4.8 12.6c0-3.5 3.2-6.2 7.2-6.2s7.2 2.7 7.2 6.2c0 3.7-3.2 6.2-7.2 6.2s-7.2-2.5-7.2-6.2Z" />
      <path d="M6.8 8 5.4 4.6l3.6 1.4M17.2 8l1.4-3.4-3.6 1.4" />
      <ellipse cx="12" cy="14.8" rx="3.4" ry="2.3" />
      <path d="M10.8 14.8h.01M13.2 14.8h.01" />
      <path d="M9 11h.01M15 11h.01" />
    </>
  ),
  sheep: (
    <>
      <path d="M12 18.4c-2.4 0-4.3-1.9-4.3-4.2 0-2.4 1.9-4.2 4.3-4.2s4.3 1.8 4.3 4.2c0 2.3-1.9 4.2-4.3 4.2Z" />
      <path d="M8.6 10.6c-1-.9-.8-2.5.4-3.1 1-.5 2.1-.1 2.5.8.5-1 1.9-1.3 2.7-.6.9.7 1 2 .2 2.9" />
      <path d="M7.9 12.4c-1.4-.3-2.8.5-3.3 1.9M16.1 12.4c1.4-.3 2.8.5 3.3 1.9" />
      <path d="M10.5 13.8h.01M13.5 13.8h.01" />
      <path d="M11 16.3c.6.5 1.4.5 2 0" />
    </>
  ),
  hedgehog: (
    <>
      <path d="M4.6 16.6c0-4.2 3.2-7.3 7.2-7.3 2 0 3.7.8 5 2" />
      <path d="M16.8 11.3 20.4 13l-3.2 2.2" />
      <path d="M4.6 16.6h12.6" />
      <path d="M6 12.6 4 10.6M8.4 10.6 7.2 8M11.8 9.4V6.6M15 10.2l1.4-2.4" />
      <path d="M19.4 13.6h.01" />
    </>
  ),
  crab: (
    <>
      <path d="M7 13.6h10c0 2.6-2.2 4.6-5 4.6s-5-2-5-4.6Z" />
      <path d="M9.8 13.6v-2.2M14.2 13.6v-2.2" />
      <path d="M9.8 10.6h.01M14.2 10.6h.01" />
      <path d="M7.2 14.4c-1.7-.4-2.9-1.5-3.8-3M4 11.2 2.4 12.6l2 1" />
      <path d="M16.8 14.4c1.7-.4 2.9-1.5 3.8-3M20 11.2l1.6 1.4-2 1" />
      <path d="M8 17.4 6.2 19.8M10.4 18.4l-.8 2.2M13.6 18.4l.8 2.2M16 17.4l1.8 2.4" />
    </>
  ),
  spider: (
    <>
      <circle cx="12" cy="12.4" r="3.4" />
      <path d="M8.8 10.8 5.6 8.6 3.6 10M8.6 12.6 5 12.8 3.4 14.4M9 14.2 6.4 16.4 5.6 18.6M10.4 15.4 9.2 18l.4 2.2" />
      <path d="M15.2 10.8 18.4 8.6 20.4 10M15.4 12.6 19 12.8l1.6 1.6M15 14.2l2.6 2.2.8 2.2M13.6 15.4l1.2 2.6-.4 2.2" />
    </>
  ),
  octopus: (
    <>
      <path d="M6.4 12.4c0-3.2 2.5-5.8 5.6-5.8s5.6 2.6 5.6 5.8v1.2H6.4Z" />
      <path d="M9.8 10.6h.01M14.2 10.6h.01" />
      <path d="M7.4 13.6c-1.1 1.8-1.5 3.7-1 5.8M10.2 13.6c-.6 2.2-.4 4.3.5 6.1M13.8 13.6c.6 2.2.4 4.3-.5 6.1M16.6 13.6c1.1 1.8 1.5 3.7 1 5.8" />
    </>
  ),
};

/* ------------------------------------------------------------------ *
 * Tier 2b · coloured outlines
 * ------------------------------------------------------------------ */

const LUCIDE_GLYPHS: Record<string, LucideIcon> = {
  // 日常物品
  chair: Armchair,
  key: Key,
  truck: Truck,
  candle: Flame,
  bulb: Lightbulb,
  coat: Shirt,
  car: Car,
  door: DoorOpen,
  glasses: Glasses,
  umbrella: Umbrella,
  hammer: Hammer,
  wrench: Wrench,
  flashlight: Flashlight,
  lock: Lock,
  backpack: Backpack,
  watch: Watch,
  fridge: Refrigerator,
  microwave: Microwave,
  pot: CookingPot,
  helmet: HardHat,
  guitar: Guitar,
  drum: Drum,
  headphones: Headphones,

  // 动物
  bird: Bird,
  rabbit: Rabbit,
  cat: Cat,
  dog: Dog,
  fish: Fish,
  panda: Panda,
  mouse: Rat,
  squirrel: Squirrel,
  snail: Snail,
  turtle: Turtle,
  beetle: Bug,
  shrimp: Shrimp,
  worm: Worm,

  // 定向力
  'season-spring': Flower2,
  'season-summer': Sun,
  'season-autumn': Leaf,
  'season-winter': Snowflake,
  'daypart-dawn': Sunrise,
  'daypart-midday': Sun,
  'daypart-dusk': Sunset,
  'daypart-night': Moon,

  // 语言流畅性 distractors
  pencil: Pencil,
  ruler: Ruler,
  eraser: Eraser,
  scissors: Scissors,
  paperclip: Paperclip,
  notebook: NotebookPen,
  bus: Bus,
  bike: Bike,
  train: TrainFront,
  plane: Plane,
  boat: Sailboat,
};

/**
 * The colour each outline is drawn in — roughly the colour the thing is in life.
 *
 * No two items *within a family* share a hue exactly, which is as strong as this
 * can be now that a family has 23–29 members and only 8 of them are drawn at a
 * time: with that many items some pairs are unavoidably close, and the greys in
 * particular (勺子, 叉子, 锤子, 扳手) have nowhere else to go. Hue is one cue of
 * three — the silhouette and the always-visible caption carry the rest — so near
 * neighbours are tolerable where exact repeats would not be.
 */
const GLYPH_COLOR: Record<string, string> = {
  chair: '#f59e0b',
  spoon: '#94a3b8',
  key: '#eab308',
  truck: '#3b82f6',
  candle: '#fb923c',
  fork: '#cbd5e1',
  bulb: '#fde047',
  table: '#92400e',
  coat: '#818cf8',
  bucket: '#38bdf8',
  broom: '#a16207',
  car: '#ef4444',
  door: '#b45309',
  glasses: '#22d3ee',
  umbrella: '#ec4899',
  hammer: '#a1a1aa',
  wrench: '#64748b',
  flashlight: '#facc15',
  lock: '#fbbf24',
  backpack: '#2dd4bf',
  watch: '#e879f9',
  fridge: '#7dd3fc',
  microwave: '#a5b4fc',
  pot: '#fda4af',
  helmet: '#f97316',
  guitar: '#d97706',
  drum: '#f87171',
  radio: '#a78bfa',
  headphones: '#4ade80',

  bird: '#38bdf8',
  rabbit: '#f9a8d4',
  cat: '#fb923c',
  dog: '#c084fc',
  fish: '#06b6d4',
  panda: '#e2e8f0',
  mouse: '#94a3b8',
  squirrel: '#d97706',
  snail: '#84cc16',
  turtle: '#16a34a',
  beetle: '#a78bfa',
  shell: '#f472b6',
  shrimp: '#fb7185',
  worm: '#a3e635',
  // A warm grey rather than the near-white it was: 熊猫 and 蜘蛛 are already cool
  // near-whites in this family, and a third one had nothing but its silhouette to
  // tell it apart from them.
  cow: '#a8a29e',
  butterfly: '#facc15',
  frog: '#4ade80',
  pig: '#fca5a5',
  sheep: '#fef3c7',
  hedgehog: '#b45309',
  crab: '#f97316',
  spider: '#cbd5e1',
  octopus: '#e879f9',

  'season-spring': '#f9a8d4',
  'season-summer': '#fbbf24',
  'season-autumn': '#f97316',
  'season-winter': '#7dd3fc',
  // 清晨 warm-pale vs 傍晚 purple: the two Jim could not tell apart. The colour
  // helps, but the card in SelectionGrid also carries a sky wash and a label —
  // the glyph is not asked to disambiguate on its own.
  'daypart-dawn': '#fdba74',
  'daypart-midday': '#fbbf24',
  'daypart-dusk': '#c084fc',
  'daypart-night': '#60a5fa',

  pencil: '#f59e0b',
  ruler: '#eab308',
  eraser: '#fb7185',
  scissors: '#94a3b8',
  paperclip: '#cbd5e1',
  highlighter: '#a3e635',
  notebook: '#60a5fa',
  bus: '#fbbf24',
  bike: '#22d3ee',
  train: '#ef4444',
  plane: '#e2e8f0',
  boat: '#38bdf8',
};

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

const ART: Record<string, React.ReactNode> = { ...FOOD_ART, ...FACE_ART, ...MOOD_ART };

interface ItemGlyphProps {
  itemId: string;
  className?: string;
  /**
   * Drop the item's own colour and inherit the parent's instead. The palette
   * uses it to grey out an item that is already on the board.
   */
  muted?: boolean;
}

export const ItemGlyph: React.FC<ItemGlyphProps> = ({
  itemId,
  className = 'w-8 h-8',
  muted = false,
}) => {
  const art = ART[itemId];
  if (art) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        aria-hidden="true"
        style={muted ? { opacity: 0.35 } : undefined}
      >
        {art}
      </svg>
    );
  }

  // Drawn with the same stroke width, caps and colour source as the lucide
  // icons below, so a hand-drawn animal is indistinguishable from a shipped one
  // sitting next to it in the palette.
  const outline = OUTLINE_ART[itemId];
  if (outline) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
        style={muted ? undefined : { color: GLYPH_COLOR[itemId] }}
      >
        {outline}
      </svg>
    );
  }

  const shape = NEUTRAL_SHAPES[itemId];
  if (shape) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke={muted ? 'currentColor' : SHAPE_COLOR}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        {shape}
      </svg>
    );
  }

  const Icon = LUCIDE_GLYPHS[itemId];
  if (!Icon) return <span className={className} aria-hidden="true" />;
  return (
    <Icon
      className={className}
      strokeWidth={1.9}
      aria-hidden="true"
      // Inline rather than a Tailwind class: the callers pass their own text
      // colour, and two competing utility classes resolve by stylesheet order
      // rather than by which one was written last.
      style={muted ? undefined : { color: GLYPH_COLOR[itemId] }}
    />
  );
};

ItemGlyph.displayName = 'ItemGlyph';

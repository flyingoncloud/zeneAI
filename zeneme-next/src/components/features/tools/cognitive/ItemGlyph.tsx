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
  CookingPot,
  DoorOpen,
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
  Paperclip,
  Pencil,
  Plane,
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
  Umbrella,
  Watch,
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
 * 玉米 kernels — a staggered brick of light kernels on a darker cob. Generated
 * rather than written out: rows alternate 3 and 2, every row has to fit inside the
 * cob at its own height, and by hand that is thirty numbers to keep in step
 * whenever the cob changes shape.
 *
 * The cob is deliberately a dark gold. Drawn in #eab308 with #fde047 kernels the
 * two were a shade apart, and at 44px the texture disappeared into a plain yellow
 * egg.
 */
const CORN_CX = 12;
const CORN_CY = 11.8;
const CORN_RX = 4.8;
const CORN_RY = 7.9;
const KERNEL_R = 0.82;

const CORN_KERNELS = [5.6, 7.4, 9.2, 11, 12.8, 14.6, 16.4, 18].flatMap((cy, row) => {
  // Room either side of centre at this height, less the kernel radius, so no
  // kernel pokes out of the cob as the rows narrow towards the tips.
  const room = CORN_RX * Math.sqrt(1 - ((cy - CORN_CY) / CORN_RY) ** 2) - KERNEL_R;
  const offsets = row % 2 === 0 ? [-2.1, 0, 2.1] : [-1.05, 1.05];
  return offsets
    .filter((offset) => Math.abs(offset) <= room)
    .map((offset) => (
      <circle
        key={`${offset}-${cy}`}
        cx={CORN_CX + offset}
        cy={cy}
        r={KERNEL_R}
        fill="#fde047"
      />
    ));
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
      {/* The husk sweeps *up* the sides of the cob, and the two leaves are
          different lengths. Drawn as a matched pair angling down and outward from
          the base, they read as fins and the whole thing came back as a rocket. */}
      <path d="M11 19.6C6.4 17.6 3.7 13 3.6 7.2c3.8 2.4 6.1 6.9 6.3 12.4Z" fill="#22c55e" />
      <path d="M13.2 19.8c3.5-2 5.3-5.5 5.4-10.4-2.9 2-4.6 5.7-4.8 10.1Z" fill="#16a34a" />
      <ellipse cx={CORN_CX} cy={CORN_CY} rx={CORN_RX} ry={CORN_RY} fill="#ca8a04" />
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
/* ------------------------------------------------------------------ *
 * Tier 1c · filled animals
 *
 * Most animals here are outlines, and for a round head with two eyes that is
 * enough. These are the ones where the *texture* is the animal — a hedgehog is
 * its spines, a tortoise is its shell — and texture is exactly what a 1.9 stroke
 * with round joins in a 24px box cannot hold: a spine long enough to read needs
 * a base narrower than the stroke, so the notches close up and the whole back
 * comes out as a row of bumps. Filled, the spikes can be genuinely sharp.
 * ------------------------------------------------------------------ */

const ANIMAL_ART: Record<string, React.ReactNode> = {
  /**
   * 刺猬, side on, facing left. Drawn as two masses: the spined body, and the bare
   * face in front of it. As an outline this was four separate rays over a dome,
   * which read as a crown or a rising sun, with the snout a detached triangle
   * that read as an arrowhead.
   */
  hedgehog: (
    <>
      {/* Feet, drawn first so the body sits over them and only the pads show. */}
      <g fill="#78350f">
        <rect x="9.2" y="16.8" width="2.1" height="2.7" rx="1.05" />
        <rect x="14.6" y="16.8" width="2.1" height="2.7" rx="1.05" />
      </g>
      {/* The spined body. Tips ride an outer arc and notches an inner one about a
          common centre, so the spines splay outward instead of all raking the
          same way; the outer radius is longest over the shoulders and shortens
          towards both ends, which reads as an animal hunched forward rather than
          as a saw blade. */}
      <path
        d="M8.41 12.38 7 10.38 9.45 10.25 8.44 6.85 11.36 8.86 12.02 4.98 13.71 8.53 16.07 5.51 15.94 9.34 19.07 8.11 17.53 11.1 19.8 11.76 18.1 13.4C19.6 14.5 19.4 16.8 17.6 17.4 14.6 18.2 9.4 18.1 7.6 17.2 6.6 16.6 6.9 13.6 8.41 12.38Z"
        fill="#92400e"
      />
      {/* The face, over the body: a hedgehog's snout is bare, and drawing it in
          front is also what makes the leftmost spine read as passing behind the
          head rather than growing out of its cheek. Kept small — at head-to-body
          parity the spines read as a crest on a bird. */}
      <path
        d="M3 14.6C4 12.2 6 11 8.6 11.4 9.2 13.4 8.8 15.8 7.4 17.1 5.4 17.6 3.6 17 3 15.6 2.8 15.2 2.8 14.9 3 14.6Z"
        fill="#d6a06a"
      />
      {/* The nose sits *on* the snout's leading edge and the eye well above and
          behind it. Level with each other, as they were, the two dots read as a
          pair of eyes and the animal turned to face the viewer. */}
      <g fill="#44280f">
        <circle cx="3.4" cy="15.1" r="0.72" />
        <circle cx="6.4" cy="13.3" r="0.75" />
      </g>
    </>
  ),
  /**
   * 乌龟, side on, facing right. lucide's `Turtle` is a segmented arch on four
   * stubs and reads as a table or a footbridge; what a tortoise needs is the
   * high domed shell with a flat rim under it, and plates on the dome. The rim
   * is doing more work than it looks: a dome alone is a hill, and it is the
   * straight line beneath the curve that says shell.
   */
  turtle: (
    <>
      {/* Tail, legs and neck first, all in the mid green. They run under the
          shell, so its edge crops them and no seam has to be drawn — and the dark
          rim is what keeps the leg tops from merging into the dome above. */}
      <g fill="#22c55e">
        <path d="M3.4 14.8C2.4 14.1 2 13.9 1.5 13.5 1.1 14.8 1.9 16 3.4 16.2Z" />
        <rect x="5.6" y="14.6" width="2.8" height="5" rx="1.4" />
        <rect x="12.4" y="14.6" width="2.8" height="5" rx="1.4" />
        <path d="M15.2 12.4C17 11.4 18.2 10 19.6 9.2 21.4 8.4 22.4 10.4 21.6 12 20.6 14 18 15.3 15.6 15.4Z" />
      </g>
      <circle cx="20.3" cy="10.7" r="0.85" fill="#14532d" />
      {/* The dome, and the flat rim beneath it. The rim is doing more work than it
          looks: a dome on its own is a hill, and it is the straight line under the
          curve that says shell. */}
      <path d="M3.2 15.4C3.2 10.9 6.6 7.6 10.2 7.6 13.8 7.6 17.2 10.9 17.2 15.4Z" fill="#4ade80" />
      {/* Scutes as division *lines* rather than as plates laid on top. Drawn as
          filled blobs the plates read as three eggs sitting in a nest; drawn as
          the seams between them, the same information reads as a shell. */}
      <g stroke="#15803d" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M4.5 15.4C4.5 12.2 7 9.9 10.2 9.9 13.4 9.9 15.9 12.2 15.9 15.4" />
        <path d="M7 9.3C6.6 11.4 6.5 13.4 6.6 15.4M13.4 9.3C13.8 11.4 13.9 13.4 13.8 15.4" />
      </g>
      <path d="M3.2 15.4H17.2c0 1.3-.8 1.8-1.7 1.8H4.9C4 17.2 3.2 16.7 3.2 15.4Z" fill="#15803d" />
    </>
  ),
  /**
   * 毛虫. lucide's `Worm` is a bare squiggle, which is a worm or a snake — the two
   * things a caterpillar has that neither of those has are *segments* and *legs*,
   * so both are drawn. The segments are separate circles rather than a lumpy
   * outline: overlapping discs keep a visible waist at every joint, and the waists
   * are the whole cue.
   */
  worm: (
    <>
      {/* Legs hang from each segment rather than reaching a common floor line —
          following the body's arch is what makes them read as attached. */}
      <g fill="#4d7c0f">
        <rect x="3.65" y="16.3" width="1.5" height="2" rx="0.75" />
        <rect x="7.05" y="15.3" width="1.5" height="2" rx="0.75" />
        <rect x="10.45" y="14.8" width="1.5" height="2" rx="0.75" />
        <rect x="13.85" y="15" width="1.5" height="2" rx="0.75" />
      </g>
      {/* Antennae, which also fix which end is the head. */}
      <g stroke="#4d7c0f" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <path d="M17.4 11.2 16.4 9.2M19.4 11 20.2 9" />
      </g>
      <g fill="#84cc16">
        <circle cx="4.4" cy="14.4" r="2.5" />
        <circle cx="7.8" cy="13.2" r="2.7" />
        <circle cx="11.2" cy="12.6" r="2.8" />
        <circle cx="14.6" cy="12.8" r="2.8" />
      </g>
      <circle cx="18.2" cy="13.8" r="3.1" fill="#65a30d" />
      <circle cx="19.4" cy="13" r="0.8" fill="#1a2e05" />
    </>
  ),
  /**
   * 螃蟹, front on. The claws have to be the biggest thing in the frame — as an
   * outline this was a small shell with six even legs and two thin nippers, and
   * even legs radiating off a dome read as a sunburst, or as 蜘蛛, which sits in
   * the same distractor set.
   */
  crab: (
    <>
      {/* Walking legs and claw arms. Stroked rather than filled: a round-capped
          stroke is already the right shape for a limb, and keeping them thin is
          what leaves the claws looking heavy by comparison. */}
      <g stroke="#ea580c" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M6.6 14 3.6 15.4M7 15.6 4.4 17.4M8.2 16.8 6.4 19" />
        <path d="M17.4 14 20.4 15.4M17 15.6 19.6 17.4M15.8 16.8 17.6 19" />
      </g>
      <g stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M7.6 12.2 5.2 10M16.4 12.2 18.8 10" />
      </g>
      {/* Each pincer is one filled shape with a wedge cut into it, so the gap
          between the jaws is the tile showing through. Two separate lobes kept
          drifting apart at 32px until the claw read as a mitten. */}
      <g fill="#f97316">
        <path d="M5.4 10.2C3.6 10.6 2.2 9.6 2.2 8.2 2.2 7 3.4 6.2 4.6 6.6L4.4 8.2 6 7.4C6.6 8.4 6.4 9.6 5.4 10.2Z" />
        <path d="M18.6 10.2C20.4 10.6 21.8 9.6 21.8 8.2 21.8 7 20.6 6.2 19.4 6.6L19.6 8.2 18 7.4C17.4 8.4 17.6 9.6 18.6 10.2Z" />
      </g>
      <ellipse cx="12" cy="13.4" rx="5.8" ry="3.9" fill="#f97316" />
      <g fill="#fff7ed">
        <circle cx="10.1" cy="12.2" r="1.1" />
        <circle cx="13.9" cy="12.2" r="1.1" />
      </g>
      <g fill="#7c2d12">
        <circle cx="10.1" cy="12.2" r="0.55" />
        <circle cx="13.9" cy="12.2" r="0.55" />
      </g>
      <path
        d="M10.7 15.4C11.4 16 12.6 16 13.3 15.4"
        stroke="#7c2d12"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  /**
   * 绵羊, side on, facing right. Third pass. The curls-all-round fleece was still
   * reading as weather, and the reason is that scalloping alone is not a species
   * cue — plenty of things are bumpy. What only a sheep has is the head: black,
   * long-muzzled, and carrying a horn that curls back behind the ear.
   *
   * So the fleece shrank and the animal grew around it. Legs are longer and stand
   * clear of the body so there is daylight under it, which is the difference between
   * something standing and something floating; the head is nearly a third of the
   * width; and the curled horn is the one mark in this bank that belongs to exactly
   * one animal.
   */
  sheep: (
    <>
      <g fill="#3f3f46">
        <rect x="7.2" y="13.4" width="1.8" height="6.4" rx="0.9" />
        <rect x="10" y="13.4" width="1.8" height="6.4" rx="0.9" />
        <rect x="13" y="13.4" width="1.8" height="6.4" rx="0.9" />
        <rect x="15.2" y="13.4" width="1.8" height="6.4" rx="0.9" />
      </g>
      <g fill="#18181b">
        <rect x="7.2" y="18.6" width="1.8" height="1.2" rx="0.6" />
        <rect x="10" y="18.6" width="1.8" height="1.2" rx="0.6" />
        <rect x="13" y="18.6" width="1.8" height="1.2" rx="0.6" />
        <rect x="15.2" y="18.6" width="1.8" height="1.2" rx="0.6" />
      </g>
      {/* Fleece: curls the whole way round, but smaller than before so the legs
          and head are what set the size of the animal. */}
      <g fill="#faf6ec">
        <circle cx="11.4" cy="11" r="2.9" />
        <circle cx="7.5" cy="10.9" r="2.2" />
        <circle cx="9.4" cy="9.2" r="2.2" />
        <circle cx="11.8" cy="8.7" r="2.3" />
        <circle cx="14.2" cy="9.4" r="2.1" />
        <circle cx="15.7" cy="11.1" r="2" />
        <circle cx="7.6" cy="12.8" r="2" />
        <circle cx="10" cy="13.4" r="2" />
        <circle cx="12.6" cy="13.5" r="2" />
        <circle cx="14.9" cy="12.9" r="1.9" />
        <circle cx="6.2" cy="12" r="1.4" />
      </g>
      {/* Horn behind the ear first, then the ear, then the head over both. A curl
          like this belongs to nothing else in the bank. */}
      <ellipse rx="1.2" ry="2.2" transform="translate(17.2,10.6) rotate(-42)" fill="#27272a" />
      <path
        d="M18.6 10.6C18.2 8.4 19.6 7 21 7.6 22.2 8.1 22.2 9.8 20.6 10.2"
        stroke="#e7e5e4"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="18.6" cy="13" rx="2.9" ry="3.3" fill="#3f3f46" />
      <ellipse cx="20.7" cy="15" rx="2" ry="1.7" fill="#71717a" />
      <circle cx="19.6" cy="12" r="0.9" fill="#fafafa" />
      <circle cx="19.8" cy="12" r="0.45" fill="#18181b" />
      <circle cx="22.2" cy="14.7" r="0.5" fill="#18181b" />
    </>
  ),
  /**
   * 兔子, sitting in profile, facing right. The previous version was three pink
   * discs of one flat colour with two thin ears, and flat colour is the problem:
   * same-fill shapes that overlap have no edge between them, so the head, chest
   * and haunch merged into one blob and only the ears said rabbit.
   *
   * Fixed by giving each mass its own value — a light chest over a mid haunch, a
   * near-white tail, deeper pink inside the ears — and by making the ears as tall
   * as the head is wide. Shorter than that and this becomes 老鼠, which is the
   * pair that was reported as indistinguishable in the first place.
   */
  rabbit: (
    <>
      {/* Tail behind the haunch, near-white so it reads as a separate puff. */}
      <circle cx="4.2" cy="14.4" r="2.3" fill="#fdf2f8" />
      {/* Ears as rotated ellipses: at this size a hand-written ear outline is all
          corner artefacts, and an ellipse splayed off the skull is neither. */}
      <g fill="#f9a8d4">
        <ellipse rx="1.6" ry="4.3" transform="translate(15.2,6.2) rotate(-13)" />
        <ellipse rx="1.5" ry="4.1" transform="translate(19,6.8) rotate(15)" />
      </g>
      <g fill="#fce7f3">
        <ellipse rx="0.75" ry="2.8" transform="translate(15.3,6.4) rotate(-13)" />
        <ellipse rx="0.7" ry="2.7" transform="translate(19,7) rotate(15)" />
      </g>
      {/* Haunch, then hind foot, then the chest and head over them. */}
      <ellipse cx="9.2" cy="14" rx="5.5" ry="4.7" fill="#f9a8d4" />
      <rect x="5.4" y="17.4" width="6.8" height="2.4" rx="1.2" fill="#fbcfe8" />
      <circle cx="16.2" cy="11.8" r="3.4" fill="#fbcfe8" />
      <rect x="14.2" y="16" width="2.4" height="2.9" rx="1.2" fill="#fbcfe8" />
      <ellipse cx="14.2" cy="14.6" rx="2.6" ry="3" fill="#fbcfe8" />
      <circle cx="17.8" cy="11.2" r="0.8" fill="#831843" />
      <ellipse cx="19.4" cy="12.8" rx="0.7" ry="0.55" fill="#db2777" />
    </>
  ),
  /**
   * 猫, front on. Pointed triangular ears, upright slit eyes and whiskers. The
   * whiskers are not decoration — they are the one feature that puts it outside
   * the silhouette every other front-facing head in the bank has, and 猫 and 猪
   * as two round outlined heads were reported as looking the same.
   */
  cat: (
    <>
      <g stroke="#fdba74" strokeWidth="1.1" strokeLinecap="round" fill="none">
        <path d="M4.6 13.6 1.8 12.8M4.6 15 1.8 15.4M19.4 13.6 22.2 12.8M19.4 15 22.2 15.4" />
      </g>
      <g fill="#fb923c">
        <path d="M6.4 9.4 5.4 4.2 10 7.2Z" />
        <path d="M17.6 9.4 18.6 4.2 14 7.2Z" />
        <path d="M5.6 12.6C5.6 9 8.4 6.6 12 6.6 15.6 6.6 18.4 9 18.4 12.6 18.4 16.2 15.6 18.6 12 18.6 8.4 18.6 5.6 16.2 5.6 12.6Z" />
      </g>
      <g fill="#fdba74">
        <path d="M7.2 8.8 6.6 6.2 9 7.8Z" />
        <path d="M16.8 8.8 17.4 6.2 15 7.8Z" />
      </g>
      {/* Upright slits, not round dots: a cat's pupil is the giveaway. */}
      <g fill="#1c1917">
        <ellipse cx="9.6" cy="11.8" rx="0.8" ry="1.3" />
        <ellipse cx="14.4" cy="11.8" rx="0.8" ry="1.3" />
      </g>
      <path d="M12 14 11.1 15.3h1.8Z" fill="#9f1239" />
      <path
        d="M12 15.3v.8M12 16.1C11.4 16.8 10.5 16.8 10.1 16.1M12 16.1C12.6 16.8 13.5 16.8 13.9 16.1"
        stroke="#7c2d12"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  /**
   * 老鼠, side on, facing right. The previous version was a body with a second
   * bulge stuck on the front for a head, and at 32px the two just read as one grey
   * lump with a pale bubble over it — the ear was doing so much work it stopped
   * looking like an ear.
   *
   * Now the whole animal is a single teardrop: fat at the rear, tapering to the
   * nose, so the head is part of the silhouette rather than an attachment. The ear
   * is pink inside and the nose and feet are pink too, which is both true of mice
   * and the thing that separates this from 兔子 at a glance — that pair was
   * reported as indistinguishable, and pale-pink-and-upright against
   * grey-and-horizontal is about as far apart as this bank can put them.
   */
  mouse: (
    <>
      {/* Tail: long, thin, and curling up at the tip. */}
      <path
        d="M5.6 15.8C3 15.6 1.3 16.8 1.4 18.6 1.5 19.8 2.8 20.4 3.6 19.4"
        stroke="#94a3b8"
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <g fill="#f9a8d4">
        <ellipse cx="8.6" cy="17.2" rx="1.4" ry="0.95" />
        <ellipse cx="13.6" cy="17.4" rx="1.4" ry="0.95" />
      </g>
      {/* Ear over the shoulder, pink inside. */}
      <circle cx="13.4" cy="9.6" r="3.1" fill="#94a3b8" />
      <circle cx="13.5" cy="9.9" r="1.8" fill="#f9a8d4" />
      {/* The body, from a round rear to a point at the nose. */}
      <path
        d="M4.6 14C4.6 11.2 7 9.4 10.2 9.4 13.6 9.4 16.4 10.8 20.6 13.4 16.4 15.6 13.6 17 10.2 17 6.6 17 4.6 16.2 4.6 14Z"
        fill="#94a3b8"
      />
      <g stroke="#cbd5e1" strokeWidth="0.8" strokeLinecap="round" fill="none">
        <path d="M19 14 21.2 15.2M19.2 12.4 21.4 11.6" />
      </g>
      <circle cx="16.4" cy="12.4" r="0.85" fill="#1e293b" />
      <circle cx="20.4" cy="13.4" r="0.7" fill="#ec4899" />
    </>
  ),
  /**
   * 猪, side on, facing right. Moved off a front-facing head for the same reason as
   * 狗: as two outlined round heads with ears, 猪 and 猫 were reported as looking
   * the same. The curly tail and the flat disc snout are both unique here.
   */
  pig: (
    <>
      <path
        d="M4.8 12.4C3.2 12 2.4 10.8 2.8 9.8 3.2 9 4.4 9.2 4.6 10.2"
        stroke="#f472b6"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <g fill="#f472b6">
        <rect x="7" y="16.6" width="1.5" height="3" rx="0.75" />
        <rect x="9.2" y="16.6" width="1.5" height="3" rx="0.75" />
        <rect x="13" y="16.6" width="1.5" height="3" rx="0.75" />
        <rect x="15.2" y="16.6" width="1.5" height="3" rx="0.75" />
      </g>
      <path d="M17.2 8.8 15.6 6.4 19.4 7.4Z" fill="#ec4899" />
      <path
        d="M4.6 14C4.6 11.4 6.8 9.4 9.8 9.4H13.8C16.4 9.4 18.2 11.2 18.2 13.6 18.2 15.8 16.6 17.2 14.2 17.2H8.4C6.2 17.2 4.6 16 4.6 14Z"
        fill="#f472b6"
      />
      <circle cx="18" cy="12" r="3.2" fill="#f472b6" />
      <ellipse cx="21" cy="13.2" rx="1.8" ry="1.5" fill="#ec4899" />
      <g fill="#831843">
        <circle cx="18.6" cy="11" r="0.7" />
        <circle cx="20.5" cy="13.2" r="0.4" />
        <circle cx="21.5" cy="13.2" r="0.4" />
      </g>
    </>
  ),
  /**
   * 熊猫, front on. The only white head left in the bank now that 绵羊 is a body —
   * the two of them as a pale round face each was the original collision.
   */
  panda: (
    <>
      <g fill="#1c1917">
        <circle cx="6.6" cy="7.4" r="2.6" />
        <circle cx="17.4" cy="7.4" r="2.6" />
      </g>
      <circle cx="12" cy="12.6" r="6.6" fill="#f8fafc" />
      <g fill="#1c1917">
        <ellipse cx="9.2" cy="11.6" rx="2" ry="2.4" />
        <ellipse cx="14.8" cy="11.6" rx="2" ry="2.4" />
      </g>
      <g fill="#f8fafc">
        <circle cx="9.2" cy="11.6" r="0.7" />
        <circle cx="14.8" cy="11.6" r="0.7" />
      </g>
      <path d="M12 14.2 11 15.5h2Z" fill="#1c1917" />
      <path
        d="M12 15.5v.7M12 16.2C11.4 16.9 10.5 16.9 10.1 16.2M12 16.2C12.6 16.9 13.5 16.9 13.9 16.2"
        stroke="#1c1917"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  /**
   * 青蛙, front on. The eyes have to sit *above* the head's outline — that is the
   * one silhouette cue no other animal in the bank has. Drawn inside a rounded
   * body, as they were, the pair read as headlights and the whole glyph came out
   * looking like the front of a car.
   */
  frog: (
    <>
      {/* Toes first, then the eye domes, then the body over both: the body's edge
          crops the domes into bulges rather than leaving two circles stuck on. */}
      <g fill="#16a34a">
        <circle cx="5.6" cy="18.8" r="1" />
        <circle cx="7" cy="19.2" r="1" />
        <circle cx="8.4" cy="18.8" r="1" />
        <circle cx="15.6" cy="18.8" r="1" />
        <circle cx="17" cy="19.2" r="1" />
        <circle cx="18.4" cy="18.8" r="1" />
        <circle cx="8.4" cy="6.8" r="2.4" />
        <circle cx="15.6" cy="6.8" r="2.4" />
      </g>
      <path
        d="M3.8 14.4C3.8 9.8 7.4 7 12 7 16.6 7 20.2 9.8 20.2 14.4 20.2 16.8 17.6 18 12 18 6.4 18 3.8 16.8 3.8 14.4Z"
        fill="#22c55e"
      />
      <g fill="#f0fdf4">
        <circle cx="8.4" cy="6.2" r="1.5" />
        <circle cx="15.6" cy="6.2" r="1.5" />
      </g>
      <g fill="#14532d">
        <circle cx="8.4" cy="6.2" r="0.8" />
        <circle cx="15.6" cy="6.2" r="0.8" />
        <circle cx="10.8" cy="10.4" r="0.4" />
        <circle cx="13.2" cy="10.4" r="0.4" />
      </g>
      {/* The wide mouth, corner to corner. A short one reads as a snout. */}
      <path
        d="M7 13.8C9 15.6 15 15.6 17 13.8"
        stroke="#15803d"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),
  /**
   * 狗, front on. Was lucide's Dog: a round outline head with two ears, which is
   * the same drawing as the outline 熊猫 was, differing only in colour — and colour
   * is the first thing that goes at 32px on a coloured tile.
   *
   * Filled, and built around the two things a dog has that the other two front
   * faces in this bank do not: ears that hang *down* past the jaw rather than
   * standing up like 猫's, and a snout that pushes out of the face with a tongue
   * under it. 熊猫 keeps the white face and the round ears on top; nothing here is
   * shared with it but the outline of a head.
   */
  dog: (
    <>
      {/* Ears down the sides, drawn first so the head crops their tops. */}
      <g fill="#8a5a2b">
        <ellipse rx="2.5" ry="5.1" transform="translate(5.3,12.9) rotate(11)" />
        <ellipse rx="2.5" ry="5.1" transform="translate(18.7,12.9) rotate(-11)" />
      </g>
      <ellipse cx="12" cy="11.4" rx="6.2" ry="5.9" fill="#c98d55" />
      {/* Pale mask over the lower face, then the snout on top of it. */}
      <ellipse cx="12" cy="14.4" rx="4.5" ry="3.6" fill="#f3ddc0" />
      <g fill="#1c1917">
        <circle cx="9.3" cy="10.4" r="1.1" />
        <circle cx="14.7" cy="10.4" r="1.1" />
      </g>
      <g fill="#fafafa">
        <circle cx="9.7" cy="10" r="0.38" />
        <circle cx="15.1" cy="10" r="0.38" />
      </g>
      <ellipse cx="12" cy="13.5" rx="1.5" ry="1.15" fill="#1c1917" />
      <path
        d="M12 14.7v0.9M12 15.6C11.4 16.4 10.4 16.4 10 15.7M12 15.6C12.6 16.4 13.6 16.4 14 15.7"
        stroke="#1c1917"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="12" cy="17.6" rx="1.1" ry="1.4" fill="#f472b6" />
    </>
  ),
};

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

  // Pig and sheep are both front-on heads, so they are drawn to differ at the
  // silhouette: the pig has ears up and a wide snout, the sheep a fleece
  // topknot and ears down. Checked side by side at 44px.
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
  octopus: (
    <>
      <path d="M6.4 12.4c0-3.2 2.5-5.8 5.6-5.8s5.6 2.6 5.6 5.8v1.2H6.4Z" />
      <path d="M9.8 10.6h.01M14.2 10.6h.01" />
      <path d="M7.4 13.6c-1.1 1.8-1.5 3.7-1 5.8M10.2 13.6c-.6 2.2-.4 4.3.5 6.1M13.8 13.6c.6 2.2.4 4.3-.5 6.1M16.6 13.6c1.1 1.8 1.5 3.7 1 5.8" />
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
  spider: (
    <>
      <circle cx="12" cy="12.4" r="3.4" />
      <path d="M8.8 10.8 5.6 8.6 3.6 10M8.6 12.6 5 12.8 3.4 14.4M9 14.2 6.4 16.4 5.6 18.6M10.4 15.4 9.2 18l.4 2.2" />
      <path d="M15.2 10.8 18.4 8.6 20.4 10M15.4 12.6 19 12.8l1.6 1.6M15 14.2l2.6 2.2.8 2.2M13.6 15.4l1.2 2.6-.4 2.2" />
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
  beetle: Bug,
  bird: Bird,
  fish: Fish,
  shrimp: Shrimp,
  snail: Snail,
  squirrel: Squirrel,
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

  // A warm grey rather than the near-white it was: 熊猫 and 蜘蛛 are already cool
  // near-whites in this family, and a third one had nothing but its silhouette to
  // tell it apart from them.

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
  beetle: '#a78bfa',

  bird: '#38bdf8',
  butterfly: '#facc15',
  cow: '#a8a29e',
  fish: '#06b6d4',
  octopus: '#e879f9',
  shell: '#f472b6',
  shrimp: '#fb7185',
  snail: '#84cc16',
  spider: '#cbd5e1',
  squirrel: '#d97706',
};

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

const ART: Record<string, React.ReactNode> = {
  ...FOOD_ART,
  ...FACE_ART,
  ...MOOD_ART,
  ...ANIMAL_ART,
};

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

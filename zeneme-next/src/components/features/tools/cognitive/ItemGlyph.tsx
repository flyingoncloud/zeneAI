'use client';

import React from 'react';
import {
  Armchair,
  Backpack,
  Bike,
  Bird,
  Brush,
  Bug,
  Bus,
  Car,
  Cat,
  Beef,
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
  Highlighter,
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
  Radio,
  Rat,
  Refrigerator,
  Ruler,
  Sailboat,
  Scissors,
  Shell,
  Shirt,
  ShoppingBasket,
  Shrimp,
  Snail,
  Snowflake,
  Squirrel,
  Sun,
  Sunrise,
  Sunset,
  Table,
  TrainFront,
  Truck,
  Turtle,
  Umbrella,
  Utensils,
  UtensilsCrossed,
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
 * 1. `FOOD_ART` / `FACE_ART` — hand-drawn, filled, multi-colour. Used wherever
 *    the item has to read as a real thing at a glance.
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
  carrot: (
    <>
      <path d="M11.4 8.4 7.6 20.3c-.2.6.4 1.1.9.8l10.2-6.4c.7-.4.6-1.5-.2-1.8l-6.1-4.5Z" fill="#f97316" />
      <g stroke="#16a34a" strokeWidth="1.7" strokeLinecap="round">
        <path d="M12.6 7.6 15 4.6M12.6 7.6 11 4M12.6 7.6 16.6 6.6" />
      </g>
    </>
  ),
  corn: (
    <>
      <path d="M12 4.4c3 0 5 3.2 5 7.5s-2 8.1-5 8.1-5-3.8-5-8.1S9 4.4 12 4.4Z" fill="#facc15" />
      <g stroke="#a16207" strokeWidth="1" strokeLinecap="round">
        <path d="M12 6v13M9.6 7.6v10M14.4 7.6v10" />
      </g>
      <path d="M7.2 11.4c-2 .6-3.4 2.6-3.4 4.9 2.2 0 4.1-1.3 4.9-3.2" fill="#22c55e" />
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
  spoon: Utensils,
  key: Key,
  truck: Truck,
  candle: Flame,
  fork: UtensilsCrossed,
  bulb: Lightbulb,
  table: Table,
  coat: Shirt,
  bucket: ShoppingBasket,
  broom: Brush,
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
  radio: Radio,
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
  shell: Shell,
  shrimp: Shrimp,
  worm: Worm,
  // lucide has no cow; Beef is the closest bovine outline it ships.
  cow: Beef,

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
  highlighter: Highlighter,
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
  cow: '#f8fafc',
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

const ART: Record<string, React.ReactNode> = { ...FOOD_ART, ...FACE_ART };

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

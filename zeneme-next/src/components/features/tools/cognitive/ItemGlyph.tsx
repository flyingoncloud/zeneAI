'use client';

import React from 'react';
import {
  Apple,
  Armchair,
  Banana,
  Beef,
  Bike,
  Bird,
  Brush,
  Bug,
  Bus,
  Car,
  Carrot,
  Cat,
  Cherry,
  Citrus,
  DoorOpen,
  Dog,
  Eraser,
  Fish,
  Flame,
  Flower2,
  Glasses,
  Grape,
  Highlighter,
  Key,
  Leaf,
  Lightbulb,
  Moon,
  NotebookPen,
  Panda,
  Paperclip,
  Pencil,
  Plane,
  Rabbit,
  Rat,
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
  Worm,
  type LucideIcon,
} from 'lucide-react';
import { itemById } from '@/data/cognitiveScreen';

/**
 * Objects and animals reuse lucide outlines; the abstract shapes are drawn here
 * because no icon set carries "rectangle with a diagonal through it".
 */
const LUCIDE_GLYPHS: Record<string, LucideIcon> = {
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

  // 定向力 — seasons and parts of the day, stood in for by their weather.
  'season-spring': Flower2,
  'season-summer': Sun,
  'season-autumn': Leaf,
  'season-winter': Snowflake,
  'daypart-dawn': Sunrise,
  'daypart-midday': Sun,
  'daypart-dusk': Sunset,
  'daypart-night': Moon,

  // 计算力 / 语言流畅性 — fruit, and the two categories it hides among.
  apple: Apple,
  cherry: Cherry,
  grape: Grape,
  citrus: Citrus,
  banana: Banana,
  carrot: Carrot,
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

/** 24x24 viewBox, stroke-only, so shapes sit alongside the lucide outlines. */
const SHAPE_PATHS: Record<string, React.ReactNode> = {
  square: <rect x="5" y="5" width="14" height="14" />,
  'rect-v': <rect x="8" y="3" width="8" height="18" />,
  circle: <circle cx="12" cy="12" r="7" />,
  triangle: <path d="M12 4 21 20 3 20Z" />,
  // The 划消 target. Drawn here rather than taken from lucide so it sits at the
  // same weight as the circles and triangles it has to be picked out from.
  star: <path d="M12 3.5 14.6 9.4 21 10.1 16.3 14.4 17.6 20.7 12 17.5 6.4 20.7 7.7 14.4 3 10.1 9.4 9.4Z" />,
  'circle-cross': (
    <>
      <circle cx="12" cy="12" r="7" />
      <path d="M7 7 17 17M17 7 7 17" />
    </>
  ),
  zigzag: <path d="M5 5h13l-13 14h13" />,
  tee: <path d="M4 5h16M12 5v15" />,
  wave: <path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />,
  'rect-diag': (
    <>
      <rect x="3" y="7" width="18" height="10" />
      <path d="M3 17 21 7" />
    </>
  ),
  'zigzag-double': <path d="M5 4h13l-13 8h13l-13 8h13" />,
  'rect-h': <rect x="3" y="8" width="18" height="8" />,
  cross: <path d="M5 5 19 19M19 5 5 19" />,
  'rect-split': (
    <>
      <rect x="3" y="7" width="18" height="10" />
      <path d="M9 7v10M15 7v10" />
    </>
  ),
  'triangle-nested': (
    <>
      <path d="M12 3 21 20 3 20Z" />
      <path d="M12 10 16.5 19h-9Z" />
    </>
  ),
  'circle-in-square': (
    <>
      <rect x="4" y="4" width="16" height="16" />
      <circle cx="12" cy="12" r="4.5" />
    </>
  ),
};

interface ItemGlyphProps {
  itemId: string;
  className?: string;
}

export const ItemGlyph: React.FC<ItemGlyphProps> = ({ itemId, className = 'w-8 h-8' }) => {
  const shape = SHAPE_PATHS[itemId];
  if (shape) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
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
  return <Icon className={className} strokeWidth={1.6} aria-hidden="true" />;
};

export function itemLabel(itemId: string): string {
  return itemById(itemId)?.label ?? itemId;
}

ItemGlyph.displayName = 'ItemGlyph';

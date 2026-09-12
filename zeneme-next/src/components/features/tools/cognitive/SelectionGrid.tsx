'use client';

import React from 'react';
import { Check } from 'lucide-react';
import type { SelectionTask } from '@/data/selectionTasks';
import { ItemGlyph } from './ItemGlyph';

interface SelectionGridProps {
  task: SelectionTask;
  selected: string[];
  onChange: (selected: string[]) => void;
}

/**
 * The two piles behind 数感.
 *
 * They are two bordered, tinted, captioned panels sitting in a two-column grid
 * that never collapses, with a divider between them. The earlier version laid
 * both piles out as one wrapping flex row, which on a phone put "left" above
 * "right" — so the question asked about a left and a right that were not on
 * screen. The tints and the two different fruits are the second half of the fix:
 * even side by side, two piles of identical grey apples do not read as two piles.
 */
const CountingPanels: React.FC<{ task: SelectionTask }> = ({ task }) => {
  if (!task.sides) return null;

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4">
      {task.sides.map((side) => (
        <div
          key={side.heading}
          className={`rounded-2xl border-2 p-3 md:p-4 flex flex-col items-center gap-2 ${side.tone}`}
        >
          <p className="text-sm md:text-base font-semibold text-white/90">
            {side.heading}
            <span className="ml-1.5 font-normal text-white/50">{side.group.label}</span>
          </p>
          <div className="flex flex-wrap justify-center gap-1 md:gap-2">
            {Array.from({ length: side.group.count }, (_, n) => (
              <ItemGlyph key={n} itemId={side.group.glyph} className="w-11 h-11 md:w-16 md:h-16" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * The scene behind 数一数有几张脸. Absolutely positioned off percentages so it
 * scales with the frame instead of reflowing — a scatter that reflows is a
 * different item every time the window changes.
 */
const Scene: React.FC<{ task: SelectionTask }> = ({ task }) => {
  if (!task.scene) return null;

  return (
    // Square, and narrower than the page. The scatter is a 5x5 jittered grid, so
    // a square frame is what keeps the horizontal and vertical spacing equal —
    // and capping the width is what keeps the cells near the size of the glyphs
    // inside them. Left full width, a desktop frame is 1000px across with 200px
    // cells, which reads as a dozen tiny things adrift in a lot of nothing.
    <div className="relative w-full max-w-md md:max-w-2xl mx-auto aspect-square rounded-2xl border border-white/10 bg-slate-800/40 overflow-hidden">
      {task.scene.map((cell) => (
        <span
          key={cell.id}
          className="absolute"
          style={{
            left: `${cell.xPct}%`,
            top: `${cell.yPct}%`,
            transform: `translate(-50%, -50%) scale(${cell.scale})`,
          }}
        >
          <ItemGlyph itemId={cell.glyph} className="w-14 h-14 md:w-24 md:h-24" />
        </span>
      ))}
    </div>
  );
};

/**
 * The grid behind 定向力, 注意力, 计算力 and 语言流畅性. Tapping is the whole
 * interaction — no dragging, no typing — which is what makes these the cheapest
 * items to ship and the most usable for someone with limited literacy.
 */
export const SelectionGrid: React.FC<SelectionGridProps> = ({ task, selected, onChange }) => {
  const chosen = new Set(selected);

  /**
   * `task.columns` is the desktop layout. A phone gets fewer columns, because
   * the cards are square and divide the width — five across a 360px screen is a
   * 60px card, and a 60px card cannot hold a picture anyone can identify. The
   * four-option questions drop to 2×2, which roughly doubles every image.
   */
  const mobileColumns = task.columns <= 4 ? 2 : 4;
  /** Dense grids have no captions, so the glyph gets the whole card. */
  const glyphSize =
    task.columns > 4 ? 'w-14 h-14 md:w-24 md:h-24' : 'w-24 h-24 md:w-28 md:h-28';

  const toggle = (id: string) => {
    if (task.mode === 'single') {
      // Re-tapping the chosen card clears it, so a misfire is recoverable
      // without having to pick a different wrong answer first.
      onChange(chosen.has(id) ? [] : [id]);
      return;
    }
    onChange(chosen.has(id) ? selected.filter((value) => value !== id) : [...selected, id]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      <CountingPanels task={task} />
      <Scene task={task} />

      <div
        className="grid gap-3 md:gap-4 grid-cols-[repeat(var(--cols-sm),minmax(0,1fr))] md:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
        style={
          {
            '--cols-sm': String(mobileColumns),
            '--cols': String(task.columns),
          } as React.CSSProperties
        }
      >
        {task.options.map((option) => {
          const isChosen = chosen.has(option.id);
          // A card with its own sky wash keeps it; the rest fall back to the
          // shared slate fill, and either way selection is carried by the border
          // and the ring rather than by the background.
          const background = option.tone
            ? `bg-gradient-to-b ${option.tone}`
            : isChosen
              ? 'bg-violet-500/20'
              : 'bg-slate-800/50 hover:bg-slate-800';
          const edge = isChosen
            ? 'border-violet-400 ring-2 ring-violet-400/40 text-violet-100'
            : 'border-white/10 text-slate-200 hover:border-violet-400/40';
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              aria-pressed={isChosen}
              aria-label={option.label}
              className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${background} ${edge}`}
            >
              {option.text ? (
                <span className="text-5xl md:text-6xl font-bold tabular-nums">{option.text}</span>
              ) : (
                <ItemGlyph itemId={option.glyph ?? ''} className={glyphSize} />
              )}

              {/* Captions carry the 定向力 cards. The item is "which one is now",
                  not "can you name this picture", so spelling out 清晨 / 傍晚
                  removes ambiguity from the picture without touching what is
                  being measured. */}
              {task.captions && (
                <span className="px-1 text-sm md:text-base leading-tight text-center text-slate-300">
                  {option.label}
                </span>
              )}

              {/* Multi-select needs a persistent mark: a border change alone is
                  easy to lose track of across twenty cells. */}
              {isChosen && task.mode === 'multi' && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {task.mode === 'multi' && (
        <p className="text-xs text-slate-500 text-center">
          已选 {selected.length} 个（点一下可取消）
        </p>
      )}
    </div>
  );
};

SelectionGrid.displayName = 'SelectionGrid';

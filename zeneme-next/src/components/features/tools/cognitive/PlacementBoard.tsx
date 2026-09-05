'use client';

import React, { useState } from 'react';
import type { ScreenItem } from '@/data/cognitiveScreen';
import { ItemGlyph } from './ItemGlyph';

interface PlacementBoardProps {
  palette: ScreenItem[];
  /** One entry per grid cell; null means empty. */
  cells: (string | null)[];
  onChange: (cells: (string | null)[]) => void;
  /**
   * Hold screen: same grid, no palette, nothing tappable. Reusing this
   * component rather than repeating the cell markup keeps the two screens from
   * drifting apart, which matters because the point of the hold screen is that
   * it shows exactly what the user just placed.
   */
  readOnly?: boolean;
}

/**
 * Palette above, numbered cells below.
 *
 * Tap-to-place is the primary interaction and drag-and-drop is a desktop
 * extra — HTML5 drag events never fire on touch, so a drag-only board would be
 * unusable on a phone for exactly the older users this screen is aimed at.
 */
export const PlacementBoard: React.FC<PlacementBoardProps> = ({
  palette,
  cells,
  onChange,
  readOnly = false,
}) => {
  const [dragging, setDragging] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<number | null>(null);

  const placedIds = new Set(cells.filter((id): id is string => id !== null));

  const placeInto = (cellIndex: number, itemId: string) => {
    const next = cells.slice();
    // An item lives in one cell at a time, so moving it clears the old cell.
    const previous = next.indexOf(itemId);
    if (previous !== -1) next[previous] = null;
    next[cellIndex] = itemId;
    onChange(next);
  };

  const handlePaletteTap = (itemId: string) => {
    if (placedIds.has(itemId)) {
      // Second tap on a placed item takes it back off the board.
      onChange(cells.map((id) => (id === itemId ? null : id)));
      return;
    }
    const firstEmpty = cells.indexOf(null);
    if (firstEmpty === -1) return;
    placeInto(firstEmpty, itemId);
  };

  const handleCellTap = (cellIndex: number) => {
    if (cells[cellIndex] === null) return;
    const next = cells.slice();
    next[cellIndex] = null;
    onChange(next);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {!readOnly && (
        <div>
          <p className="text-xs text-slate-500 mb-4 text-center">可选项目</p>
          {/* The palette items carry no box of their own: the only boxes on
              screen are the cells to fill, so there is no ambiguity about
              where an item is supposed to end up. */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-6">
            {palette.map((item) => {
              const used = placedIds.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  onDragStart={() => setDragging(item.id)}
                  onDragEnd={() => {
                    setDragging(null);
                    setHoverCell(null);
                  }}
                  onClick={() => handlePaletteTap(item.id)}
                  aria-label={item.label}
                  aria-pressed={used}
                  className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                    used
                      ? 'text-slate-700 opacity-40'
                      : 'text-slate-100 hover:bg-white/5 hover:text-violet-200'
                  }`}
                >
                  <ItemGlyph itemId={item.id} className="w-14 h-14 md:w-16 md:h-16" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        {!readOnly && (
          <p className="text-xs text-slate-500 mb-4 text-center">
            按你想要的顺序放入格子（点格子可取回）
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-3 md:gap-5">
          {cells.map((itemId, index) => (
            <button
              key={index}
              type="button"
              disabled={readOnly}
              onClick={() => handleCellTap(index)}
              onDragOver={(event) => {
                event.preventDefault();
                setHoverCell(index);
              }}
              onDragLeave={() => setHoverCell((current) => (current === index ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                setHoverCell(null);
                if (dragging) placeInto(index, dragging);
                setDragging(null);
              }}
              aria-label={
                itemId
                  ? `第 ${index + 1} 格：${palette.find((i) => i.id === itemId)?.label ?? itemId}`
                  : `第 ${index + 1} 格：空`
              }
              className={`relative w-24 h-24 md:w-32 md:h-32 rounded-2xl border-2 flex items-center justify-center transition-all ${
                readOnly
                  ? 'border-amber-400/40 bg-slate-800/80 text-amber-100'
                  : hoverCell === index
                    ? 'border-violet-400 bg-violet-500/15 border-solid'
                    : itemId
                      ? 'border-solid border-violet-400/40 bg-slate-800/80 text-violet-100'
                      : 'border-dashed border-white/20 bg-white/[0.02]'
              }`}
            >
              <span
                className={`absolute top-1.5 left-2 text-xs tabular-nums ${
                  readOnly ? 'text-amber-400/60' : 'text-slate-500'
                }`}
              >
                {index + 1}
              </span>
              {itemId && <ItemGlyph itemId={itemId} className="w-14 h-14 md:w-[4.5rem] md:h-[4.5rem]" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

PlacementBoard.displayName = 'PlacementBoard';

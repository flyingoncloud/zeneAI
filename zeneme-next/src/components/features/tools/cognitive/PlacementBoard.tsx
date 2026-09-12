'use client';

import React, { useState } from 'react';
import type { ScreenItem } from '@/data/cognitiveScreen';
import { ItemGlyph } from './ItemGlyph';

/**
 * Desktop column count per cell count, spelled out rather than interpolated:
 * Tailwind scans source text for class names, so `md:grid-cols-${n}` would never
 * be generated. The board is generic over cell count; today it is always 4.
 */
const CELL_COLUMNS: Record<number, string> = {
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
  5: 'md:grid-cols-5',
  6: 'md:grid-cols-6',
};

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
 *
 * Every item is captioned. What is being measured is whether you can get the
 * item back later, not whether you can identify a line drawing under time
 * pressure, so an item the user cannot name is pure noise — and with outline
 * icons there is always one that reads as something else entirely.
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
  const labelFor = (id: string) => palette.find((item) => item.id === id)?.label ?? id;

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
    <div className="max-w-5xl mx-auto space-y-8 md:space-y-10">
      {!readOnly && (
        <div>
          {/* Named, not just positioned: the instruction refers to this heading
              by name, so the two cannot drift apart and no one has to work out
              which part of the screen "上面" or "下面" meant. */}
          <p className="text-xs text-slate-500 mb-4 text-center">可选项目（从这里挑）</p>
          {/* The palette items carry no box of their own: the only boxes on
              screen are the cells to fill, so there is no ambiguity about
              where an item is supposed to end up.

              A grid rather than a wrapping row, because a row of fixed-width
              items leaves the leftover width empty; a grid spends it on the
              pictures. Four across on a phone, eight on a desktop. */}
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-3">
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
                  className={`rounded-2xl py-2 flex flex-col items-center gap-1 transition-all active:scale-95 ${
                    used ? 'text-slate-600 opacity-45' : 'text-slate-100 hover:bg-white/5'
                  }`}
                >
                  <ItemGlyph
                    itemId={item.id}
                    muted={used}
                    className="w-16 h-16 md:w-20 md:h-20"
                  />
                  <span className="text-xs md:text-sm leading-tight text-center">
                    {item.label}
                  </span>
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
        {/* Fluid rather than fixed-size cells, so the pictures inside grow with
            the screen instead of staying phone-sized on a desktop. Two across on
            a phone; one row on a desktop. */}
        <div
          className={`grid gap-3 md:gap-5 grid-cols-2 ${CELL_COLUMNS[cells.length] ?? 'md:grid-cols-4'} max-w-md md:max-w-3xl mx-auto`}
        >
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
                  ? `第 ${index + 1} 格：${labelFor(itemId)}`
                  : `第 ${index + 1} 格：空`
              }
              className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
                readOnly
                  ? 'border-amber-400/40 bg-slate-800/80'
                  : hoverCell === index
                    ? 'border-violet-400 bg-violet-500/15 border-solid'
                    : itemId
                      ? 'border-solid border-violet-400/40 bg-slate-800/80'
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
              {itemId && (
                <>
                  <ItemGlyph itemId={itemId} className="w-20 h-20 md:w-28 md:h-28" />
                  <span className="text-xs md:text-sm text-slate-300 leading-tight">
                    {labelFor(itemId)}
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

PlacementBoard.displayName = 'PlacementBoard';

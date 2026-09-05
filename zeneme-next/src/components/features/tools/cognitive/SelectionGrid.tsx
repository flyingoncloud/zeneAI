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
 * The grid behind 定向力, 注意力（图形划消）, 计算力（数感）and
 * 语言流畅性（类别识别）. Tapping is the whole interaction — no dragging, no
 * typing — which is what makes these four the cheapest items to ship and the
 * most usable for someone with limited literacy.
 */
export const SelectionGrid: React.FC<SelectionGridProps> = ({ task, selected, onChange }) => {
  const chosen = new Set(selected);

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
    <div className="max-w-4xl mx-auto space-y-8">
      {task.groups && (
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
          {task.groups.map((group, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="text-2xl text-slate-600">|</span>}
              <div className="flex flex-wrap justify-center gap-1.5 md:gap-2 max-w-[15rem] text-slate-100">
                {Array.from({ length: group.count }, (_, n) => (
                  <ItemGlyph
                    key={n}
                    itemId={group.glyph}
                    className="w-9 h-9 md:w-11 md:h-11"
                  />
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      <div
        className="grid gap-3 md:gap-4"
        style={{ gridTemplateColumns: `repeat(${task.columns}, minmax(0, 1fr))` }}
      >
        {task.options.map((option) => {
          const isChosen = chosen.has(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              aria-pressed={isChosen}
              aria-label={option.label}
              className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                isChosen
                  ? 'border-violet-400 bg-violet-500/20 text-violet-100'
                  : 'border-white/10 bg-slate-800/50 text-slate-200 hover:border-violet-400/40 hover:bg-slate-800'
              }`}
            >
              {option.text ? (
                <span className="text-3xl md:text-4xl font-bold tabular-nums">{option.text}</span>
              ) : (
                <ItemGlyph itemId={option.glyph ?? ''} className="w-12 h-12 md:w-16 md:h-16" />
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

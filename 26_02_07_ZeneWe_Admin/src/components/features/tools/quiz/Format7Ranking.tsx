import React, { useState, useEffect } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { X, GripVertical } from 'lucide-react';
import { QuizQuestion, Choice } from './QuizData';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface Format7Props {
  question: QuizQuestion;
  value: any;
  onChange: (val: any) => void;
}

const ItemType = 'RANKING_ITEM';

interface RankingItem {
  id: string;
  text: string;
}

// Sub-component: Draggable Source Item
const DraggableSourceItem = ({ item, isSelected, onClick }: { item: Choice, isSelected: boolean, onClick: () => void }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: { id: item.id, text: item.text },
    canDrag: !isSelected,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [isSelected, item]);

  return (
    <div
      ref={drag}
      onClick={onClick}
      className={`
        relative px-4 py-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 select-none
        ${isSelected 
          ? 'bg-white/5 border-white/5 text-white/20 cursor-default' 
          : 'bg-slate-900/40 border-white/10 text-white hover:bg-slate-800/60 hover:border-violet-500/30'
        }
        ${isDragging ? 'opacity-50' : 'opacity-100'}
      `}
    >
      {!isSelected && <GripVertical size={16} className="text-white/20" />}
      <span className="font-medium text-sm">{item.text}</span>
    </div>
  );
};

// Sub-component: Target Slot
const TargetSlot = ({ 
  rank, 
  item, 
  onRemove, 
  onDrop 
}: { 
  rank: number; 
  item: RankingItem | null; 
  onRemove: () => void;
  onDrop: (item: RankingItem) => void;
}) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (droppedItem: RankingItem) => {
      onDrop(droppedItem);
      return { rank };
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }), [item, onDrop]);

  return (
    <div
      ref={drop}
      className={`
        relative w-full h-16 rounded-xl border-2 transition-all flex items-center px-3 gap-3
        ${isOver && canDrop ? 'border-violet-500 bg-violet-500/10' : ''}
        ${!isOver && item ? 'border-violet-500/50 bg-slate-900/60' : 'border-dashed border-white/10 bg-white/5'}
      `}
    >
      {/* Rank Number Badge */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-inner shrink-0
        ${item ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/30'}
      `}>
        {rank}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-between overflow-hidden min-w-0">
        {item ? (
          <motion.div 
            initial={{ opacity: 0, x: -10 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between w-full"
          >
            <span className="font-semibold text-white truncate mr-2">{item.text}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </motion.div>
        ) : (
          <span className="text-xs text-white/20 italic truncate">拖入或点击左侧选择</span>
        )}
      </div>
    </div>
  );
};

export const Format7Ranking: React.FC<Format7Props> = ({ question, value, onChange }) => {
  const [slots, setSlots] = useState<(RankingItem | null)[]>([null, null, null]);

  // Sync internal state with external value on mount (or if value changes externally)
  useEffect(() => {
    if (Array.isArray(value)) {
      const newSlots = [null, null, null] as (RankingItem | null)[];
      let hasData = false;
      value.forEach((v: any) => {
        if (v.rank >= 1 && v.rank <= 3) {
          const choice = question.choices?.find(c => c.id === v.id);
          if (choice) {
            newSlots[v.rank - 1] = { id: choice.id, text: choice.text };
            hasData = true;
          }
        }
      });
      if (hasData) setSlots(newSlots);
    } else {
      // If value is undefined (cleared), reset slots? 
      // Usually we want to persist local state if it's just a re-render, but if we switch questions, we reset.
      // Since this component is unmounted/remounted for new question, useState defaults to empty.
      // If navigating back, value will be present.
    }
  }, [value, question.choices]);

  const updateAnswers = (newSlots: (RankingItem | null)[]) => {
    setSlots(newSlots);
    
    // Convert to answer format
    const output = newSlots
      .map((item, index) => item ? { rank: index + 1, id: item.id } : null)
      .filter(Boolean);
    
    onChange(output.length > 0 ? output : undefined);
  };

  const handleSourceClick = (choice: Choice) => {
    // Check if already selected
    if (slots.some(s => s?.id === choice.id)) {
      // If selected, remove it (toggle)
      const idx = slots.findIndex(s => s?.id === choice.id);
      if (idx !== -1) {
        const newSlots = [...slots];
        newSlots[idx] = null;
        updateAnswers(newSlots);
      }
      return;
    }

    // Add to first empty
    const emptyIndex = slots.findIndex(s => s === null);
    if (emptyIndex === -1) {
      toast.error('最多选择 3 个，请先移除一个');
      return;
    }

    const newSlots = [...slots];
    newSlots[emptyIndex] = { id: choice.id, text: choice.text };
    updateAnswers(newSlots);
  };

  const handleDrop = (item: RankingItem, targetRank: number) => {
    const targetIndex = targetRank - 1;
    const existingIndex = slots.findIndex(s => s?.id === item.id);
    const newSlots = [...slots];

    if (existingIndex !== -1) {
      // Swap or Move
      const targetItem = newSlots[targetIndex];
      newSlots[targetIndex] = item;
      newSlots[existingIndex] = targetItem;
    } else {
      // Add new / Replace
      newSlots[targetIndex] = { id: item.id, text: item.text };
    }
    
    updateAnswers(newSlots);
  };

  const handleRemove = (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = null;
    updateAnswers(newSlots);
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 md:h-[400px]">
      {/* Source List */}
      <div className="flex-1 flex flex-col min-h-0">
        <h4 className="text-xs font-semibold text-white/40 uppercase mb-3 tracking-wider">可选列表</h4>
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-2 pb-4">
            {question.choices?.map(choice => {
              const isSelected = slots.some(s => s?.id === choice.id);
              return (
                <DraggableSourceItem 
                  key={choice.id} 
                  item={choice} 
                  isSelected={isSelected} 
                  onClick={() => handleSourceClick(choice)} 
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Target Slots */}
      <div className="md:w-1/2 flex flex-col justify-center gap-4">
        <h4 className="text-xs font-semibold text-white/40 uppercase mb-1 tracking-wider">你的排序</h4>
        {[1, 2, 3].map(rank => (
          <TargetSlot
            key={rank}
            rank={rank}
            item={slots[rank - 1]}
            onRemove={() => handleRemove(rank - 1)}
            onDrop={(item) => handleDrop(item, rank)}
          />
        ))}
      </div>
    </div>
  );
};

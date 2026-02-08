import React from 'react';
import { motion } from 'motion/react';

interface ScaleCircles5SymProps {
  value: number | undefined;
  onChange: (val: number) => void;
  leftLabel?: string;
  rightLabel?: string;
  disabled?: boolean;
}

export const ScaleCircles5Sym: React.FC<ScaleCircles5SymProps> = ({
  value,
  onChange,
  leftLabel = "非常不同意",
  rightLabel = "非常同意",
  disabled = false
}) => {
  // Symmetrical sizes: Large - Medium - Small - Medium - Large
  const circleConfig = [
    { id: 1, size: 56, label: 'Very Disagree' },
    { id: 2, size: 44, label: 'Disagree' },
    { id: 3, size: 32, label: 'Neutral' },
    { id: 4, size: 44, label: 'Agree' },
    { id: 5, size: 56, label: 'Very Agree' },
  ];

  return (
    <div className="w-full flex flex-col items-center gap-2 py-4">
      {/* 1. Circles Row */}
      <div className="w-full flex justify-between items-center px-4 max-w-[420px] mx-auto h-[60px]">
        {circleConfig.map((item) => {
          const isSelected = value === item.id;
          
          return (
            <div key={item.id} className="relative flex items-center justify-center w-[60px]">
               <motion.button
                whileHover={!disabled ? { scale: 1.05 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                onClick={() => !disabled && onChange(item.id)}
                disabled={disabled}
                className={`
                  rounded-full flex items-center justify-center transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                  ${isSelected 
                    ? 'border-[3px] border-white bg-white/10 shadow-[0_0_20px_rgba(139,92,246,0.6)]' 
                    : 'border-2 border-white/60 bg-transparent hover:border-white/90'
                  }
                  ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                `}
                style={{ 
                  width: item.size, 
                  height: item.size,
                }}
                aria-label={item.label}
              />
            </div>
          );
        })}
      </div>

      {/* 2. Labels Row (Below) */}
      <div className="flex justify-between w-full px-4 max-w-[420px] mx-auto mt-2">
        <span className="text-xs md:text-sm font-medium text-white/80 w-24 text-left leading-tight">
          {leftLabel}
        </span>
        <span className="text-xs md:text-sm font-medium text-white/80 w-24 text-right leading-tight">
          {rightLabel}
        </span>
      </div>
    </div>
  );
};

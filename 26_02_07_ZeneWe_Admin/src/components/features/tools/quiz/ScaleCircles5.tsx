import React from 'react';
import { motion } from 'motion/react';

interface ScaleCircles5Props {
  value: number | undefined;
  onChange: (val: number) => void;
  leftLabel?: string;
  rightLabel?: string;
  disabled?: boolean;
}

export const ScaleCircles5: React.FC<ScaleCircles5Props> = ({
  value,
  onChange,
  leftLabel = "非常不同意",
  rightLabel = "非常同意",
  disabled = false
}) => {
  // Define circle sizes from 1 to 5 (small to large)
  // Using Tailwind width/height classes logic or pixel values for precision
  const circleSizes = [
    { size: 36, scale: 1.0 },   // 1
    { size: 42, scale: 1.0 },   // 2
    { size: 48, scale: 1.0 },   // 3
    { size: 54, scale: 1.0 },   // 4
    { size: 60, scale: 1.0 },   // 5
  ];

  return (
    <div className="w-full flex flex-col items-center gap-6 py-4">
      {/* Interaction Area */}
      <div className="w-full flex items-center justify-between px-2 sm:px-4">
        {/* Left Label (Mobile Hidden or Small?) - Prompt says "Row... Left Label... Middle Circles... Right Label" */}
        {/* On Mobile, labels might need to be below or responsive. Let's try responsive row. */}
        
        <span className="hidden sm:block text-xs md:text-sm font-medium text-slate-400 w-20 text-right mr-4 leading-tight">
          {leftLabel}
        </span>

        <div className="flex-1 flex justify-between items-center gap-2 max-w-[400px] mx-auto">
          {circleSizes.map((config, index) => {
            const level = index + 1;
            const isSelected = value === level;
            
            return (
              <div key={level} className="relative flex items-center justify-center">
                 <motion.button
                  whileHover={!disabled ? { scale: 1.1 } : {}}
                  whileTap={!disabled ? { scale: 0.95 } : {}}
                  onClick={() => !disabled && onChange(level)}
                  disabled={disabled}
                  className={`
                    rounded-full border-2 flex items-center justify-center transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
                    ${isSelected 
                      ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.5)]' 
                      : 'border-slate-600 bg-transparent hover:border-slate-400'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  style={{ 
                    width: config.size, 
                    height: config.size,
                    borderWidth: isSelected ? 3 : 2
                  }}
                  aria-label={`Select level ${level}`}
                  aria-pressed={isSelected}
                >
                   {/* Optional: Center dot for selected state? Prompt says "Bold outline + slight glow". */}
                </motion.button>
                
                {/* Mobile Label Helpers (Only for 1 and 5 if strictly needed, but let's stick to outer labels) */}
              </div>
            );
          })}
        </div>

        <span className="hidden sm:block text-xs md:text-sm font-medium text-slate-400 w-20 text-left ml-4 leading-tight">
          {rightLabel}
        </span>
      </div>

      {/* Mobile Labels (Below) */}
      <div className="flex sm:hidden justify-between w-full px-2">
        <span className="text-xs text-slate-500">{leftLabel}</span>
        <span className="text-xs text-slate-500">{rightLabel}</span>
      </div>
    </div>
  );
};

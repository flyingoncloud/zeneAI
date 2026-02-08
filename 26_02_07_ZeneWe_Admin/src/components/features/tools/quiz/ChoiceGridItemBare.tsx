import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

export interface ChoiceGridItemBareProps {
  id: string; // "A", "B", etc.
  image?: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export const ChoiceGridItemBare: React.FC<ChoiceGridItemBareProps> = ({
  id,
  image,
  title,
  subtitle,
  selected = false,
  disabled = false,
  onClick
}) => {
  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.01 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`
        relative flex flex-col w-full h-full p-2 transition-all duration-200 cursor-pointer
        border-2
        ${selected 
          ? 'border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.4)]' 
          : 'border-transparent hover:border-violet-500/30'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* 1. Image Area - Rectangular, sharp corners, 3:2 Aspect Ratio */}
      <div className="relative w-full aspect-[3/2] shrink-0 bg-slate-900/50 overflow-hidden">
        {image && (
          <img 
            src={image} 
            alt={title} 
            className="w-full h-full object-cover" 
          />
        )}
        
        {/* Dimming Overlay (15% black) to ensure consistency */}
        <div className="absolute inset-0 bg-black/15 pointer-events-none" />

        {/* Selected Check - Top Right */}
        {selected && (
           <div className="absolute top-2 right-2 w-6 h-6 bg-violet-500 flex items-center justify-center shadow-md">
              <Check size={16} className="text-white" />
           </div>
        )}
      </div>

      {/* 2. Text Area - Transparent, 12-16px gap */}
      <div className="mt-3 flex flex-col items-start w-full">
         <div className="text-sm md:text-base font-medium leading-snug text-white text-left">
            <span className="mr-2">{id}.</span>
            <span>{title}</span>
         </div>
         
         {subtitle && (
           <div className="text-xs text-white/50 mt-1 pl-5 text-left">
             {subtitle}
           </div>
         )}
      </div>
    </motion.div>
  );
};

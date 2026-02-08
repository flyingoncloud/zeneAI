import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

export interface ChoiceCardImageProps {
  id: string; // "A", "B", etc.
  image?: string;
  title: string;
  subtitle?: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  layout?: 'overlay' | 'stacked';
}

export const ChoiceCardImage: React.FC<ChoiceCardImageProps> = ({
  id,
  image,
  title,
  subtitle,
  selected = false,
  disabled = false,
  onClick,
  layout = 'overlay'
}) => {
  const isStacked = layout === 'stacked';

  // Base container styles
  const containerClasses = `
    relative rounded-xl overflow-hidden border transition-all duration-300 text-left group outline-none w-full cursor-pointer
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${selected 
      ? 'border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.5)] bg-slate-800' // Purple glow on selected
      : 'border-white/10 hover:border-white/40 bg-slate-900/40'
    }
  `;

  if (isStacked) {
    return (
      <motion.div
        layout
        whileHover={!disabled ? { y: -4 } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        onClick={!disabled ? onClick : undefined}
        className={`${containerClasses} flex flex-col h-full min-h-[220px]`}
      >
        {/* Top: Image Area (Fixed height ~60-65% of typical card) */}
        <div className="relative w-full h-40 overflow-hidden bg-slate-800 shrink-0">
          {image && (
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
          )}
          {/* Subtle gradient on image bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60" />
          
          {/* Selected Check overlay on image (Optional) */}
          {selected && (
             <div className="absolute top-2 right-2 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center shadow-md">
                <Check size={14} className="text-white" />
             </div>
          )}
        </div>

        {/* Bottom: Content Area - No extra border, but dark bg */}
        {/* Bottom: Content Area - Light Purple bg, Unified Text */}
        <div className="flex flex-col flex-1 p-4 justify-start bg-[#B9A6FF]/20">
           {/* Unified Text Block: "A. Title" in single flow */}
           <div className={`text-sm md:text-base font-medium leading-snug text-left ${selected ? 'text-white' : 'text-white'}`}>
              <span>{id}.</span>
              <span className="ml-2">{title}</span>
           </div>
           
           {/* Optional Subtitle */}
           {subtitle && (
             <div className="text-xs text-white/60 mt-2 pl-0">
               {subtitle}
             </div>
           )}
        </div>
      </motion.div>
    );
  }

  // Fallback: Overlay Layout (Original)
  return (
    <motion.div
      whileHover={!disabled ? { y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={!disabled ? onClick : undefined}
      className={`${containerClasses} h-24 md:h-32 flex`}
    >
      {/* Image Background */}
      <div className="absolute inset-0 z-0">
        {image && <img src={image} alt={title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />}
        <div className={`absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent transition-colors ${selected ? 'from-violet-900/90' : ''}`} />
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 flex flex-col justify-center h-full w-full">
        <div className="flex justify-between items-start w-full">
          <div className={`
            w-6 h-6 rounded-md border flex items-center justify-center text-xs font-bold mb-1
            ${selected ? 'bg-violet-500 border-violet-500 text-white' : 'bg-black/40 border-white/30 text-slate-300'}
          `}>
            {id}
          </div>
          {selected && <Check size={16} className="text-violet-400" />}
        </div>
        <span className={`text-lg font-medium leading-tight ${selected ? 'text-white' : 'text-slate-200'}`}>
          {title}
        </span>
      </div>
    </motion.div>
  );
};

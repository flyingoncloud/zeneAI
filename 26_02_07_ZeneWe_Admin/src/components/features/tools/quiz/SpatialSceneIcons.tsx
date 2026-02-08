import React from 'react';
import { motion } from 'motion/react';
import { Home, Cat, Trees, CarFront, Octagon, Flower2 } from 'lucide-react';

export interface SceneItem {
  id: string;
  type: 'house' | 'cat' | 'tree' | 'car' | 'sign' | 'traffic_light' | 'flower';
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  state?: 'default' | 'active' | 'target' | 'facing';
}

interface SpatialSceneIconsProps {
  items: SceneItem[];
  variant?: 'circle' | 'rect';
}

// Custom Traffic Light Icon
const TrafficLightIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <circle cx="12" cy="6" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="18" r="2" />
  </svg>
);

const iconMap: Record<string, React.FC<any>> = {
  house: Home,
  cat: Cat,
  tree: Trees,
  car: CarFront,
  sign: Octagon, 
  traffic_light: TrafficLightIcon,
  flower: Flower2,
};

export const SpatialSceneIcons: React.FC<SpatialSceneIconsProps> = ({ items, variant = 'circle' }) => {
  const isRect = variant === 'rect';

  return (
    <div 
      className={`
        relative flex-shrink-0 mx-auto overflow-hidden
        ${isRect 
          ? 'w-full h-64 bg-slate-900/40 rounded-2xl border border-white/5 shadow-inner' 
          : 'w-48 h-48 md:w-64 md:h-64 bg-slate-800/50 rounded-full border border-white/10 shadow-inner'
        }
      `}
    >
       {/* Grid lines (Only for circle) */}
       {!isRect && (
         <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <div className="w-full h-[1px] bg-white absolute" />
            <div className="h-full w-[1px] bg-white absolute" />
         </div>
       )}
       
       {items.map((item) => {
         const IconComp = iconMap[item.type] || Home;
         const isActive = item.state && item.state !== 'default';
         
         return (
           <motion.div 
             key={item.id}
             className={`absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300
               ${isActive ? 'ring-2 ring-violet-500 bg-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.6)]' : ''}
             `}
             style={{ 
               left: `${item.x}%`, 
               top: `${item.y}%`,
               width: isActive ? '40px' : '32px',
               height: isActive ? '40px' : '32px',
               zIndex: isActive ? 10 : 1
             }}
             whileHover={{ scale: 1.1, filter: "brightness(1.2)" }}
           >
              <IconComp 
                size={isActive ? 20 : 24} 
                className={`drop-shadow-md transition-all duration-300 ${isActive ? 'text-white' : 'text-white/70'}`} 
                strokeWidth={1.5}
              />
              {/* Special detail for Stop Sign */}
              {item.type === 'sign' && (
                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-extrabold text-white select-none pointer-events-none tracking-tighter pt-[1px]">
                  STOP
                </span>
              )}
           </motion.div>
         );
       })}
    </div>
  );
};

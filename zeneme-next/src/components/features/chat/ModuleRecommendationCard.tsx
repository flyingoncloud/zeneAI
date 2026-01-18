import React from 'react';
import { motion } from 'motion/react';
import type { RecommendedModule } from '@/hooks/useZenemeStore';

interface ModuleRecommendationCardProps {
  module: RecommendedModule;
  isCompleted: boolean;
  onAccess: (moduleId: string) => void;
  delay?: number;
}

export const ModuleRecommendationCard = React.memo<ModuleRecommendationCardProps>(
  ({ module, isCompleted, onAccess, delay = 0 }) => {
    const handleClick = () => {
      onAccess(module.module_id);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onAccess(module.module_id);
      }
    };

    // Don't render if completed
    if (isCompleted) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay,
          duration: 0.4,
          type: 'spring',
          stiffness: 100,
        }}
        role="article"
        aria-label={`推荐模块：${module.name}`}
        className="group relative"
      >
        <motion.div
          whileHover={{
            scale: 1.02,
            boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)',
          }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          className="
            relative overflow-hidden rounded-2xl
            bg-slate-900/60 backdrop-blur-xl
            border border-violet-500/30
            shadow-[0_0_20px_rgba(139,92,246,0.2)]
            p-5
            cursor-pointer
            transition-all duration-300
            hover:border-violet-400/50
            focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:ring-offset-2 focus:ring-offset-slate-900
          "
        >
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Content */}
          <div className="relative flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 text-4xl filter drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]">
              {module.icon}
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white mb-1 tracking-wide">
                {module.name}
              </h3>
              <p className="text-sm text-slate-300/90 leading-relaxed">
                {module.description}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              aria-label={`开始${module.name}`}
              className="
                flex-shrink-0
                px-4 py-2
                bg-gradient-to-r from-violet-600 to-purple-600
                hover:from-violet-500 hover:to-purple-500
                text-white text-sm font-medium
                rounded-full
                shadow-lg shadow-violet-500/25
                transition-all duration-200
                hover:shadow-xl hover:shadow-violet-500/40
                focus:outline-none focus:ring-2 focus:ring-violet-500/50
              "
            >
              开始练习
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

ModuleRecommendationCard.displayName = 'ModuleRecommendationCard';

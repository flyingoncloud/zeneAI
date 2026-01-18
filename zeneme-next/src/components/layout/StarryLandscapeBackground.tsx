import React from 'react';
import { motion } from 'motion/react';
import backgroundImage from "figma:asset/3b6a5589c53301457230648f6d21f5eab8c4f69b.png";

export const StarryLandscapeBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#0f1016]">
      {/* 1. Base Background Image - FIXED, Unmodified */}
      <img 
        src={backgroundImage} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 2. Star Light Effects Layer */}
      {/* 
          Restricted to the upper 60% of the screen (sky area) 
          to ensure stars don't appear on mountains or trees.
      */}
      <div className="absolute top-0 left-0 right-0 h-[60%]">
        {[...Array(18)].map((_, i) => {
          // Randomized parameters for each star
          const size = Math.random() < 0.7 ? 1 : 1.5; // Mostly very small
          const top = Math.random() * 90; // Distribution within the sky container
          const left = Math.random() * 100;
          const duration = Math.random() * 7 + 8; // Slow: 8s to 15s
          const delay = Math.random() * 10;
          
          // Low opacity range for "barely perceptible" effect
          const minOpacity = Math.random() * 0.1 + 0.1; // 0.1 - 0.2
          const maxOpacity = minOpacity + (Math.random() * 0.15 + 0.05); // 0.15 - 0.4 total max

          return (
            <motion.div
              key={`star-${i}`}
              className="absolute rounded-full bg-[#E0E7FF]" // Soft indigo-white, not pure white
              style={{
                top: `${top}%`,
                left: `${left}%`,
                width: size,
                height: size,
                opacity: minOpacity,
                filter: 'blur(0.5px)', // Soft edge, no sharp pixels
              }}
              animate={{
                opacity: [minOpacity, maxOpacity, minOpacity],
              }}
              transition={{
                duration: duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: delay,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';
import { useZenemeStore } from '../../hooks/useZenemeStore';
import backgroundImage from "figma:asset/abaeff98ea9301451df67cf214335c95aa1b7162.png";
import chatActiveBackground from "figma:asset/70694564811c14528ff762ab45fcdfd1881bbdb8.png";

export const StarryLandscapeBackground: React.FC = () => {
  const { currentView, messages } = useZenemeStore();

  // Determine if we should show the specific background for the active chat session (screenshot state)
  // User requested "Current Page" (which shows active chat) to have the new background
  // but "Don't affect other pages (including Chat Page??)".
  // We interpret "Chat Page" as the "Empty/Welcome State", and "Current Page" as "Active Chat".
  const isChatActive = currentView === 'chat' && messages.length > 0;

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#4c1d95]">
      {/* 1. Background Image Swapping */}
      <img 
        src={isChatActive ? chatActiveBackground : backgroundImage} 
        alt="Background" 
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* 2. Star Light Effects Layer - Only show on original background (not the new one) */}
      {!isChatActive && (
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
      )}
    </div>
  );
};

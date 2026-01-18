import React from 'react';
import { motion } from 'motion/react';

export const StarryBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      {/* 1. Deep Blue/Purple Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#111827] to-[#0f172a]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/40 via-[#000000]/0 to-[#000000]/0" />

      {/* 2. Middle Layer: Clouds / Stardust / Soft Blurs */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[100px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[80px]" />
      </div>

      {/* 3. Foreground: Stars, Lines, Decorations */}
      {/* Static Stars */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150 mix-blend-overlay" />
      
      {/* Animated Twinkling Stars */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute bg-white rounded-full"
          initial={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: Math.random() * 2 + 1,
            height: Math.random() * 2 + 1,
            opacity: Math.random() * 0.5 + 0.2,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        />
      ))}

      {/* Geometric Lines / Constellation hints */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <line x1="10%" y1="10%" x2="20%" y2="30%" stroke="white" strokeWidth="0.5" strokeDasharray="5,5" />
        <circle cx="10%" cy="10%" r="2" fill="white" />
        <circle cx="20%" cy="30%" r="1" fill="white" />
        
        <line x1="80%" y1="20%" x2="90%" y2="15%" stroke="white" strokeWidth="0.5" strokeDasharray="2,2" />
        <circle cx="80%" cy="20%" r="1.5" fill="white" />
        <circle cx="90%" cy="15%" r="1" fill="white" />

        <line x1="60%" y1="80%" x2="65%" y2="85%" stroke="white" strokeWidth="0.5" />
        <circle cx="60%" cy="80%" r="1" fill="white" />
      </svg>
      
      {/* Floating Particles */}
       {[...Array(5)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute bg-blue-300 rounded-full blur-[1px]"
          initial={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            opacity: 0.1,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

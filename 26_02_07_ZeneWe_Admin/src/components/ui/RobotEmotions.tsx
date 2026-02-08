import React from 'react';

// Common components for the robot face
const RobotBody = ({ children, isSelected, faceGradient }: { children: React.ReactNode, isSelected?: boolean, faceGradient: string }) => (
  <svg viewBox="0 0 100 100" className={`w-full h-full transition-all duration-300 ${isSelected ? 'drop-shadow-[0_0_8px_rgba(167,139,250,0.6)] brightness-110' : ''}`}>
    {/* Body Shadow/Feet */}
    <ellipse cx="35" cy="92" rx="10" ry="5" fill="#A78BFA" opacity="0.5" />
    <ellipse cx="65" cy="92" rx="10" ry="5" fill="#A78BFA" opacity="0.5" />
    
    {/* Main Body - White, rounded */}
    <path 
      d="M50 10 C 25 10, 10 30, 10 55 C 10 80, 25 90, 50 90 C 75 90, 90 80, 90 55 C 90 30, 75 10, 50 10 Z" 
      fill="url(#bodyGradient)" 
    />
    <defs>
      <linearGradient id="bodyGradient" x1="50" y1="10" x2="50" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
      {/* Dynamic Face Gradients */}
      <linearGradient id="anxiousFace" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stopColor="#60A5FA" />
         <stop offset="100%" stopColor="#A78BFA" />
      </linearGradient>
      <linearGradient id="sadFace" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stopColor="#94A3B8" />
         <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
      <linearGradient id="angryFace" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stopColor="#F87171" />
         <stop offset="100%" stopColor="#FB923C" />
      </linearGradient>
      <linearGradient id="happyFace" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stopColor="#F472B6" />
         <stop offset="50%" stopColor="#FDE047" />
         <stop offset="100%" stopColor="#2DD4BF" />
      </linearGradient>
      <linearGradient id="relievedFace" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stopColor="#E2E8F0" />
         <stop offset="100%" stopColor="#A78BFA" />
      </linearGradient>
      <linearGradient id="confusedFace" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stopColor="#818CF8" />
         <stop offset="100%" stopColor="#C084FC" />
      </linearGradient>
      <linearGradient id="tiredFace" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stopColor="#475569" />
         <stop offset="100%" stopColor="#94A3B8" />
      </linearGradient>
       <linearGradient id="gratefulFace" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stopColor="#F472B6" />
         <stop offset="100%" stopColor="#A78BFA" />
      </linearGradient>
    </defs>

    {/* Ears/Antenna - Optional cute detail */}
    <path d="M40 10 Q 35 0 30 5" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
    <path d="M60 10 Q 65 0 70 5" fill="none" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />

    {/* Face Screen Area */}
    <rect x="20" y="30" width="60" height="45" rx="15" fill={faceGradient} opacity="0.9" />
    
    {/* Reflections on Face Screen */}
    <path d="M25 35 Q 50 30 75 35" fill="none" stroke="white" strokeWidth="2" opacity="0.4" />

    {/* Face Features (Eyes/Mouth) */}
    {children}
  </svg>
);

// 1. Anxiety: Small eyes, unstable, looking down
export const RobotAnxious = ({ isSelected }: { isSelected?: boolean }) => (
  <RobotBody isSelected={isSelected} faceGradient="url(#anxiousFace)">
    <ellipse cx="40" cy="50" rx="3" ry="3" fill="#1E293B" />
    <ellipse cx="60" cy="50" rx="3" ry="3" fill="#1E293B" />
    {/* Sweat drop */}
    <path d="M25 45 Q 22 40 25 35" fill="none" stroke="#93C5FD" strokeWidth="2" opacity="0.8" />
    {/* Slightly wobbly mouth */}
    <path d="M45 60 Q 50 58 55 60" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
  </RobotBody>
);

// 2. Sadness: Droopy eyes, soft, low saturation
export const RobotSad = ({ isSelected }: { isSelected?: boolean }) => (
  <RobotBody isSelected={isSelected} faceGradient="url(#sadFace)">
    {/* Droopy eyes */}
    <path d="M35 52 Q 40 48 45 52" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
    <path d="M55 52 Q 60 48 65 52" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
    {/* Sad mouth */}
    <path d="M45 62 Q 50 60 55 62" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
    {/* Tear */}
    <circle cx="35" cy="58" r="2" fill="#93C5FD" opacity="0.8" />
  </RobotBody>
);

// 3. Anger: Angled eyes, high contrast face
export const RobotAngry = ({ isSelected }: { isSelected?: boolean }) => (
  <RobotBody isSelected={isSelected} faceGradient="url(#angryFace)">
    {/* Angled eyes */}
    <rect x="35" y="48" width="10" height="4" rx="2" fill="#1E293B" transform="rotate(15 40 50)" />
    <rect x="55" y="48" width="10" height="4" rx="2" fill="#1E293B" transform="rotate(-15 60 50)" />
    {/* Frown */}
    <path d="M42 62 Q 50 58 58 62" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
  </RobotBody>
);

// 4. Happy: Curved eyes, bright gradient
export const RobotHappy = ({ isSelected }: { isSelected?: boolean }) => (
  <RobotBody isSelected={isSelected} faceGradient="url(#happyFace)">
    {/* Happy eyes ^ ^ */}
    <path d="M35 50 Q 40 45 45 50" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
    <path d="M55 50 Q 60 45 65 50" fill="none" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
    {/* Big smile */}
    <path d="M40 58 Q 50 68 60 58" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
  </RobotBody>
);

// 5. Relieved: Calm eyes, soft gradient
export const RobotRelieved = ({ isSelected }: { isSelected?: boolean }) => (
  <RobotBody isSelected={isSelected} faceGradient="url(#relievedFace)">
    {/* Closed relaxed eyes - - */}
    <path d="M35 50 L 45 50" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
    <path d="M55 50 L 65 50" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
    {/* Small smile */}
    <path d="M45 60 Q 50 62 55 60" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
    {/* Blush/Breath */}
    <circle cx="30" cy="55" r="2" fill="#F472B6" opacity="0.4" />
    <circle cx="70" cy="55" r="2" fill="#F472B6" opacity="0.4" />
  </RobotBody>
);

// 6. Confused: One eye higher, uneven gradient
export const RobotConfused = ({ isSelected }: { isSelected?: boolean }) => (
  <RobotBody isSelected={isSelected} faceGradient="url(#confusedFace)">
    {/* Asymmetric eyes */}
    <ellipse cx="40" cy="48" rx="4" ry="4" fill="#1E293B" />
    <ellipse cx="60" cy="52" rx="3" ry="3" fill="#1E293B" />
    {/* Question mark hint or small mouth */}
    <path d="M48 62 Q 50 60 52 62" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
    <path d="M68 40 Q 72 38 70 45" fill="none" stroke="#F472B6" strokeWidth="2" opacity="0.8" />
  </RobotBody>
);

// 7. Tired: Half closed, grey-blue
export const RobotTired = ({ isSelected }: { isSelected?: boolean }) => (
  <RobotBody isSelected={isSelected} faceGradient="url(#tiredFace)">
    {/* Heavy eyelids */}
    <path d="M35 52 L 45 52" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
    <path d="M55 52 L 65 52" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
    {/* Zzz */}
    <path d="M70 35 L 75 35 L 70 40 L 75 40" fill="none" stroke="#CBD5E1" strokeWidth="1.5" opacity="0.6" />
    {/* Straight mouth */}
    <path d="M45 62 L 55 62" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
  </RobotBody>
);

// 8. Grateful/Calm: Symmetric, warm gradient
export const RobotGrateful = ({ isSelected }: { isSelected?: boolean }) => (
  <RobotBody isSelected={isSelected} faceGradient="url(#gratefulFace)">
    {/* Shiny big eyes */}
    <ellipse cx="40" cy="50" rx="4" ry="5" fill="#1E293B" />
    <circle cx="41" cy="49" r="1.5" fill="white" />
    <ellipse cx="60" cy="50" rx="4" ry="5" fill="#1E293B" />
    <circle cx="61" cy="49" r="1.5" fill="white" />
    {/* Hands clasped (implied by simple shape at bottom) or just sweet smile */}
    <path d="M45 60 Q 50 63 55 60" fill="none" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
    {/* Sparkles */}
    <path d="M30 40 L 32 38 M 30 40 L 32 42 M 30 40 L 28 38 M 30 40 L 28 42" stroke="#FDE047" strokeWidth="1" />
  </RobotBody>
);

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QuizQuestion, Choice } from './QuizData';
import { Play, Pause, RotateCw, RefreshCw, PenTool, Check, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Slider } from '../../../ui/slider'; // Assuming we have or can use standard slider/input
import * as Icons from '../../../ui/icons';

import { ScaleCircles5Sym } from './ScaleCircles5Sym';
import { ChoiceCardImage } from './ChoiceCardImage';
import { ChoiceGridItemBare } from './ChoiceGridItemBare';
import { SpatialSceneIcons, SceneItem } from './SpatialSceneIcons';

// --- Format 1: Likert Circles ---
interface Format1Props {
  question: QuizQuestion;
  value: number | undefined;
  onChange: (val: number) => void;
}

export const Format1Likert: React.FC<Format1Props> = ({ question, value, onChange }) => {
  return (
    <ScaleCircles5Sym 
      value={value}
      onChange={onChange}
      leftLabel={question.uiHints?.leftLabel}
      rightLabel={question.uiHints?.rightLabel}
    />
  );
};

// --- Format 2: Image Header + Options ---
interface Format2Props {
  question: QuizQuestion;
  value: any;
  onChange: (val: any) => void;
}

export const Format2ImageHeader: React.FC<Format2Props> = ({ question, value, onChange }) => {
  return (
    <div className="w-full space-y-6">
      {/* Header Image */}
      {question.stimulus && (
        <div className="w-full h-40 rounded-xl overflow-hidden relative group">
          <img 
            src={question.stimulus.url} 
            alt={question.stimulus.alt} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {question.choices?.map((choice) => {
          const isSelected = value === choice.id; 
          // Let's assume value stores choice.id
          return (
            <motion.button
              key={choice.id}
              whileTap={{ scale: 0.99 }}
              onClick={() => onChange(choice.id)}
              className={`
                w-full p-4 rounded-xl border flex items-center gap-4 transition-all duration-200 text-left group outline-none
                ${isSelected 
                  ? 'bg-violet-500/20 border-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                }
              `}
            >
              <div className={`
                w-5 h-5 rounded-full border flex items-center justify-center transition-colors
                ${isSelected ? 'border-violet-400 bg-violet-400' : 'border-slate-500 group-hover:border-slate-400'}
              `}>
                {isSelected && <Check size={12} className="text-slate-900" />}
              </div>
              <span className={`text-base ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                {choice.text}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// --- Format 3: Image Grid ---
interface Format3Props {
  question: QuizQuestion;
  value: any;
  onChange: (val: any) => void;
}

export const Format3ImageGrid: React.FC<Format3Props> = ({ question, value, onChange }) => {
  // Use choices directly from question
  const choices = question.choices || [];
  
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {choices.map((choice, index) => {
          const isSelected = value === choice.id;
          // Ensure label is A, B, C, D
          const label = String.fromCharCode(65 + index); // 0->A, 1->B...
          
          return (
            <ChoiceGridItemBare
              key={choice.id}
              id={label}
              image={choice.image}
              title={choice.text}
              selected={isSelected}
              onClick={() => onChange(choice.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

// --- Format 4: Image Grid (6 Items) ---
interface Format4Props {
  question: QuizQuestion;
  value: any;
  onChange: (val: any) => void;
}

export const Format4ImageGrid: React.FC<Format4Props> = ({ question, value, onChange }) => {
  const choices = question.choices || [];
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {choices.map((choice, index) => {
          const isSelected = value === choice.id;
          const label = String.fromCharCode(65 + index);
          return (
            <ChoiceGridItemBare
              key={choice.id}
              id={label}
              image={choice.image}
              title={choice.text}
              selected={isSelected}
              onClick={() => onChange(choice.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

// --- Format 6: Spatial / Compass ---
interface Format6Props {
  question: QuizQuestion;
  value: number | undefined;
  onChange: (val: number) => void;
}

export const Format6Spatial: React.FC<Format6Props> = ({ question, value, onChange }) => {
  const [angle, setAngle] = useState(value || 0);
  const compassRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Sync prop value if it changes externally
  useEffect(() => {
    if (value !== undefined) setAngle(value);
  }, [value]);

  const handlePointerMove = (e: React.PointerEvent | PointerEvent) => {
    if (!isDragging || !compassRef.current) return;
    const rect = compassRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    // Calculate angle in degrees (0 = North/Up for UI consistency, but math is 0=Right)
    // Atan2(y, x) gives radians from X axis.
    // Let's standard: 0 = Top (North).
    // Math: 0 is Right (East), 90 is Down (South).
    // desired: 0 at -90deg.
    let deg = Math.atan2(dy, dx) * (180 / Math.PI); 
    deg += 90; // Rotate so -90 (Top) becomes 0
    if (deg < 0) deg += 360;
    
    setAngle(Math.round(deg));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    onChange(angle); // Commit change
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove as any);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove as any);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging]);

  // Define default 7 items if not provided, scattered circularly
  // Center: Cat. Top: Car. Right: Traffic Light. Bottom Right: Tree. Bottom Left: Flower. Left: House. Top Left: Sign.
  const defaultItems: SceneItem[] = [
    { id: 'cat', type: 'cat', x: 50, y: 55 }, // Centerish
    { id: 'house', type: 'house', x: 15, y: 50 }, // Left Mid
    { id: 'tree', type: 'tree', x: 85, y: 75 }, // Bottom Right
    { id: 'car', type: 'car', x: 35, y: 20 }, // Top Leftish
    { id: 'sign', type: 'sign', x: 65, y: 25 }, // Top Rightish
    { id: 'traffic', type: 'traffic_light', x: 90, y: 45 }, // Right Mid
    { id: 'flower', type: 'flower', x: 20, y: 80 }, // Bottom Left
  ];

  // Use default items if config is missing or has too few items (e.g. just the house placeholder)
  const incomingItems = question.spatialConfig?.sceneItems as SceneItem[];
  const displayItems: SceneItem[] = (incomingItems && incomingItems.length >= 7) ? incomingItems : defaultItems;

  return (
    <div className="w-full flex flex-col gap-8 items-center justify-center pt-2">
      {/* Scene Area (Icons) - Top */}
      <SpatialSceneIcons items={displayItems} variant="rect" />

      {/* Interaction Area (Compass) - Bottom */}
      <div className="flex flex-col items-center gap-6">
         <div 
           ref={compassRef}
           className="relative w-48 h-48 md:w-56 md:h-56 bg-gradient-to-b from-slate-800 to-slate-900 rounded-full border-4 border-slate-700 shadow-2xl cursor-pointer touch-none"
           onPointerDown={(e) => {
             setIsDragging(true);
             handlePointerMove(e); // Snap immediately on click
           }}
         >
            {/* Ticks */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
               <div 
                 key={deg} 
                 className="absolute top-0 left-1/2 w-[1px] h-3 bg-slate-500 origin-bottom transform -translate-x-1/2"
                 style={{ height: '50%', transform: `translateX(-50%) rotate(${deg}deg)`, transformOrigin: 'bottom' }}
               >
                  <div className="w-full h-2 bg-slate-400 absolute top-0" />
               </div>
            ))}
            
            {/* North Label */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-500">N</div>

            {/* The Arrow */}
            <div 
               className="absolute top-1/2 left-1/2 w-0.5 h-[40%] bg-violet-500 origin-bottom transition-transform duration-75"
               style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }}
            >
               <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-violet-500 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.6)]" />
               {/* Arrow Head */}
               <div className="absolute -top-4 left-1/2 -translate-x-1/2 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-violet-500" />
            </div>
            
            {/* Center Cap */}
            <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-slate-700 rounded-full border-2 border-slate-600 -translate-x-1/2 -translate-y-1/2 shadow-lg flex items-center justify-center">
              <span className="text-[10px] text-white font-mono">{Math.round(angle)}°</span>
            </div>
         </div>

         {/* Controls - Only Reset Button */}
         <Button 
           size="sm" 
           variant="ghost" 
           onClick={() => { setAngle(0); onChange(0); }} 
           className="text-xs text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all"
         >
            <RotateCw size={12} className="mr-1" /> 重置
         </Button>
      </div>
    </div>
  );
};

// --- Format 5: Media Stimulus ---
interface Format5Props {
  question: QuizQuestion;
  value: any;
  onChange: (val: any) => void;
}

export const Format5Media: React.FC<Format5Props> = ({ question, value, onChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
       if (isPlaying) videoRef.current.pause();
       else videoRef.current.play();
       setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    if (videoRef.current) videoRef.current.muted = !muted;
  };

  return (
    <div className="w-full space-y-6">
      {/* Media Player Card */}
      <div className="w-full bg-black rounded-xl overflow-hidden shadow-2xl relative aspect-video group">
         {question.stimulus?.type === 'video' ? (
           <video 
             ref={videoRef}
             src={question.stimulus.url}
             className="w-full h-full object-cover"
             loop
             playsInline
             muted={muted}
             onClick={togglePlay}
           />
         ) : (
           <img src={question.stimulus?.url} alt="stimulus" className="w-full h-full object-cover" />
         )}

         {/* Controls Overlay */}
         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all transform hover:scale-110"
            >
               {isPlaying ? <Pause className="text-white fill-current" /> : <Play className="text-white fill-current ml-1" />}
            </button>
         </div>
         
         {/* Bottom Bar */}
         <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-xs text-white/80 font-medium">Video Preview</div>
            <button onClick={toggleMute} className="text-white/80 hover:text-white">
               {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
         </div>
      </div>

      {/* Options (Radio List) */}
      <div className="grid grid-cols-1 gap-2">
        {question.choices?.map((choice) => {
          const isSelected = value === choice.id;
          return (
             <motion.button
              key={choice.id}
              whileTap={{ scale: 0.99 }}
              onClick={() => onChange(choice.id)}
              className={`
                w-full p-3 rounded-lg border flex items-center gap-3 transition-all duration-200 text-left outline-none
                ${isSelected 
                  ? 'bg-violet-500/20 border-violet-500/50' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
                }
              `}
            >
              <div className={`
                w-6 h-6 rounded-md border flex items-center justify-center text-xs font-bold
                ${isSelected ? 'bg-violet-500 border-violet-500 text-white' : 'bg-transparent border-slate-500 text-slate-400'}
              `}>
                {choice.id}
              </div>
              <span className={`text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                {choice.text}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

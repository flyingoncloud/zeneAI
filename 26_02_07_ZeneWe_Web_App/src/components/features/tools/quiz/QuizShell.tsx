import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../../../ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { QuizQuestion } from './QuizData';

interface QuizShellProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  question: QuizQuestion;
  children: React.ReactNode;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  canNext: boolean;
  isFirst: boolean;
  isLast: boolean;
}

export const QuizShell: React.FC<QuizShellProps> = ({
  currentQuestionIndex,
  totalQuestions,
  question,
  children,
  onNext,
  onPrev,
  onSkip,
  canNext,
  isFirst,
  isLast
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 pb-[max(24px,env(safe-area-inset-bottom))] overflow-y-auto w-full h-full relative">
      
      {/* Main Glass Card */}
      <div className="w-full max-w-[500px] mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[28px] p-6 shadow-[0_0_20px_rgba(139,92,246,0.05)] relative overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-violet-500/10 blur-[50px] pointer-events-none rounded-full" />

        {/* 1. Header: Progress */}
        <div className="relative z-10 flex flex-col items-center mb-6 w-full">
           <div className="w-full flex justify-between items-center mb-2 px-1">
             <span className="text-xs font-medium text-white/80 tracking-wide">Question {currentQuestionIndex + 1}/{totalQuestions}</span>
             {/* Deleted Format Label as requested */}
           </div>
           <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
           </div>
        </div>

        {/* 2. Question Stem */}
        <div className="relative z-10 text-left mb-6">
           <h3 className="text-xl md:text-2xl font-bold text-white leading-snug drop-shadow-md">
             {question.stem}
           </h3>
           {question.subtitle && (
             <p className="text-sm text-white/60 mt-2 font-medium">{question.subtitle}</p>
           )}
        </div>

        {/* 3. Interaction Area (Dynamic) */}
        <div className="relative z-10 flex-1 w-full flex flex-col justify-center">
           <AnimatePresence mode="wait">
             <motion.div
               key={question.id}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               transition={{ duration: 0.3 }}
               className="w-full"
             >
                {children}
             </motion.div>
           </AnimatePresence>
        </div>

        {/* 4. Footer: Navigation */}
        <div className="relative z-10 w-full mt-8 flex justify-between items-center gap-4 pt-4 border-t border-white/10">
           <Button
             variant="ghost"
             onClick={onPrev}
             disabled={isFirst}
             className="text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-colors"
           >
             <ArrowLeft size={20} />
           </Button>

           <Button
             onClick={onNext}
             disabled={!canNext}
             className={`
               px-6 rounded-full transition-all duration-300 font-medium flex items-center gap-2
               ${canNext 
                 ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.4)]' 
                 : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
               }
             `}
           >
             {isLast ? '完成' : '下一题'}
             <ArrowRight size={18} />
           </Button>
        </div>

      </div>
    </div>
  );
};
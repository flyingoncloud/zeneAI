import React, { useState } from 'react';
import * as Icons from '../../ui/icons';
import { Button } from '../../ui/button';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { BreathingPage } from './firstaid/BreathingPage';
import { EmotionPage } from './firstaid/EmotionPage';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft } from 'lucide-react';
import { completeModuleWithRetry } from '../../../lib/api';
import { toast } from 'sonner';

void X;
void ArrowLeft;

/**
 * Local icon typing helpers (avoid `any` without changing logic/imports)
 */
type IconLikeProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
  [key: string]: unknown;
};

type IconLike = React.ComponentType<IconLikeProps>;

const SafeIcon = ({ icon: Icon, ...props }: { icon?: IconLike } & IconLikeProps) => {
  if (!Icon) {
    const size = typeof props.size === 'number' ? props.size : 24;
    return (
      <span
        style={{
          width: size,
          height: size,
          display: 'inline-block',
          background: '#ccc',
          borderRadius: 4,
        }}
      />
    );
  }
  return <Icon {...props} />;
};

export const EmotionalFirstAid: React.FC = () => {
  const [step, setStep] = useState<'intro' | 'breathing' | 'naming'>('intro');
  const { t, setCurrentView, conversationId, setModuleStatus } = useZenemeStore();

  const handleExit = () => {
    setCurrentView('chat');
  };

  const handleComplete = async (emotionData: { emotion: string; intensity: number }) => {
    // Call module completion API with emotion data
    if (conversationId) {
      const result = await completeModuleWithRetry(
        conversationId,
        'emotional_first_aid',
        {
          completed_steps: ['breathing', 'emotion_naming'],
          emotion: emotionData.emotion,
          intensity: emotionData.intensity,
          timestamp: new Date().toISOString()
        }
      );

      if (result.ok) {
        if (result.module_status) {
          setModuleStatus(result.module_status);
        }
        console.log('[Module Completed]', {
          module_id: 'emotional_first_aid',
          conversation_id: conversationId,
          emotion: emotionData.emotion,
          intensity: emotionData.intensity,
          timestamp: new Date().toISOString()
        });
      } else {
        toast.error('保存完成状态失败，但您的练习已完成');
      }
    }

    // Reset and exit
    setStep('intro');
    handleExit();
  };

  const renderIntro = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-8 p-6 relative z-10"
    >
      <div className="p-8 bg-violet-500/10 rounded-full text-violet-300 animate-pulse border border-violet-400/20 shadow-[0_0_50px_rgba(139,92,246,0.15)] backdrop-blur-sm">
        <SafeIcon icon={Icons.Shield} size={64} />
      </div>
      <div className="space-y-6">
        <h2 className="text-4xl font-bold text-white tracking-tight">{t.firstAid.title}</h2>
        <p className="text-slate-300 text-xl leading-relaxed max-w-lg mx-auto font-light">
          {t.firstAid.subtitle}
        </p>
      </div>
      <div className="w-full flex justify-center pt-8">
        <Button
          className="h-16 text-lg bg-white text-slate-900 hover:bg-slate-100 rounded-full px-12 shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all font-medium"
          onClick={() => setStep('breathing')}
        >
          <SafeIcon icon={Icons.Wind} className="mr-2" /> {t.firstAid.startBreathing}
        </Button>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative flex flex-col w-full h-full overflow-hidden"
    >
      {/* 1. Page BG - Independent, Opaque, Immersive */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 opacity-100" />

      {/* Optional: Subtle ambient noise or overlay pattern for texture (Option B/C) */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none" />

      {/* 3. Content Area */}
      <div className="relative z-10 w-full h-full flex flex-col">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <div key="intro" className="w-full h-full flex items-center justify-center">
                {renderIntro()}
            </div>
          )}
          {step === 'breathing' && (
            <motion.div
                key="breathing"
                className="w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <BreathingPage
                  onComplete={() => setStep('naming')}
                />
            </motion.div>
          )}
          {step === 'naming' && (
             <motion.div
                key="naming"
                className="w-full h-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <EmotionPage
                  onComplete={handleComplete}
                  onBack={() => setStep('breathing')}
                />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

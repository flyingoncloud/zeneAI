import React from 'react';
import * as Icons from '../../ui/icons';
import { Button } from '../../ui/button';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { BreathingPage } from './firstaid/BreathingPage';
import { EmotionPage } from './firstaid/EmotionPage';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft } from 'lucide-react';

interface SafeIconProps {
  icon?: React.ElementType;
  size?: number;
  className?: string;
}

const SafeIcon = ({ icon: Icon, size = 24, className }: SafeIconProps) => {
  if (!Icon) {
    return (
      <span
        style={{ width: size, height: size, display: 'inline-block', background: '#ccc', borderRadius: 4 }}
        className={className}
      />
    );
  }
  const IconComp = Icon as React.ElementType;
  return <IconComp size={size} className={className} />;
};

export const EmotionalFirstAid: React.FC = () => {
  const { t, setCurrentView, currentView, conversationId, addMessage, setPendingModuleCompletion } = useZenemeStore();

  const step = currentView === 'breathing' ? 'breathing' : currentView === 'naming' ? 'naming' : 'intro';

  const handleExit = () => {
    setCurrentView('chat');
  };

  const handleComplete = async (emotionData: { emotion: string; intensity: number }) => {
    try {
      // Call module completion API with emotion data
      if (conversationId) {
        const { completeModuleWithRetry } = await import('../../../lib/api');
        const { toast } = await import('sonner');

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
          console.log('[Module Completed]', {
            module_id: 'emotional_first_aid',
            conversation_id: conversationId,
            emotion: emotionData.emotion,
            intensity: emotionData.intensity,
            timestamp: new Date().toISOString()
          });

          // Add system message to inform AI that module was completed
          addMessage("the user has completed the recommended module, you can continue the conversation and continue to recommend the remaining modules. Remember not to directly recommend the remaining module, but to patiently continue the conversation and recommend the remaining modules whenever appropriate.", "system");
          setPendingModuleCompletion('emotional_first_aid');

          toast.success('情绪急救已完成！');
        } else {
          console.error('[EmotionalFirstAid] Failed to complete module:', result.error);
          toast.error('保存完成状态失败，但您的练习已完成');
        }
      } else {
        console.error('[EmotionalFirstAid] No conversationId available!');
        const { toast } = await import('sonner');
        toast.error('无法保存：未找到会话ID');
      }
    } catch (error) {
      console.error('[EmotionalFirstAid] Error in handleComplete:', error);
      const { toast } = await import('sonner');
      toast.error('保存时出错：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      // Reset and exit
      handleExit();
    }
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
          这⾥是⼀个可以慢下来、整理呼吸的空间。⽤⼀分钟帮你把注意⼒带回当下，重回平静。
        </p>
      </div>
      <div className="w-full flex justify-center pt-3">
        <Button
          className="h-16 text-lg bg-white text-slate-900 hover:bg-slate-100 rounded-full px-12 shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all font-medium"
          onClick={() => setCurrentView('breathing')}
        >
          <SafeIcon icon={Icons.Wind} className="mr-2" /> 开始呼吸训练
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
      {/* 1. Page BG - Independent, Opaque, Immersive - positioned to not cover TopBar */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 opacity-100 -z-10" />

      {/* Optional: Subtle ambient noise or overlay pattern for texture (Option B/C) */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none -z-10" />

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
                  onComplete={() => setCurrentView('naming')}
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
                  onBack={() => setCurrentView('breathing')}
                />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

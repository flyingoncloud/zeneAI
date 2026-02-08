import React, { useState, useEffect, useRef } from 'react';
import * as Icons from '../../ui/icons';
import { Button } from '../../ui/button';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { BreathingPage } from './firstaid/BreathingPage';
import { BreathingWelcome } from './firstaid/BreathingWelcome';
import { EmotionPage } from './firstaid/EmotionPage';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft } from 'lucide-react';
import { guardGuestAction } from '../../../utils/authHelpers';

const SafeIcon = ({ icon: Icon, ...props }: any) => {
  if (!Icon) return <span style={{ width: props.size || 24, height: props.size || 24, display: 'inline-block', background: '#ccc', borderRadius: 4 }} />;
  return <Icon {...props} />;
};

export const EmotionalFirstAid: React.FC = () => {
  const { t, setCurrentView, currentView } = useZenemeStore();

  // Local gate: has the user clicked "开始呼吸训练" on the welcome card?
  const [breathingStarted, setBreathingStarted] = useState(false);

  // Ref to distinguish internal navigation (clicking "开始") from
  // external navigation (sidebar click) so we only reset on external.
  const internalNavRef = useRef(false);

  // Reset the gate whenever the store-level view changes externally
  // (e.g. user navigates via sidebar)
  useEffect(() => {
    if (internalNavRef.current) {
      internalNavRef.current = false;
      return;
    }
    setBreathingStarted(false);
  }, [currentView]);

  // Derive the visual step
  const step = (() => {
    if (currentView === 'naming') return 'naming' as const;
    if (breathingStarted) return 'breathing' as const;
    return 'breathing-welcome' as const;
  })();

  const handleExit = () => {
    setCurrentView('chat');
  };

  const handleStartBreathing = () => {
    setBreathingStarted(true);
    // Also update the store view so the sidebar highlights "呼吸训练"
    if (currentView !== 'breathing') {
      internalNavRef.current = true;
      setCurrentView('breathing');
    }
  };

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
      
      {/* Optional: Subtle ambient noise or overlay pattern for texture */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light pointer-events-none" />

      {/* 3. Content Area */}
      <div className="relative z-10 w-full h-full flex flex-col">
        <AnimatePresence mode="wait">
          {step === 'breathing-welcome' && (
            <motion.div
              key="breathing-welcome"
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BreathingWelcome
                onStart={handleStartBreathing}
              />
            </motion.div>
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
                  onComplete={() => {
                    if (guardGuestAction('naming')) return;
                    setCurrentView('naming');
                  }} 
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
                  onComplete={() => {
                      setCurrentView('first-aid');
                      handleExit(); 
                  }} 
                  onBack={() => setCurrentView('breathing')}
                />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
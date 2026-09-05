import React from 'react';
import * as Icons from '../ui/icons';
import { Button } from '../ui/button';
import { useZenemeStore } from '../../hooks/useZenemeStore';
/* eslint-disable @typescript-eslint/no-explicit-any */
const SafeIcon = ({ icon: Icon, ...props }: any) => {
  if (!Icon) return <span style={{ width: props.size || 24, height: props.size || 24, display: 'inline-block', background: '#ccc', borderRadius: 4 }} />;
  return <Icon {...props} />;
};

export const TopBar: React.FC = () => {
  const { currentView, setCurrentView, t, addMessage, setPendingModuleCompletion, exitMessage, exitModuleToComplete, clearExitAction } = useZenemeStore();

  // 'cognitive' draws its own header with an exit button and a countdown, so a
  // second back button on top of it would let the user leave mid-test by
  // accident, bypassing the confirmation.
  if (currentView === 'chat' || currentView ==='breathing' || currentView === 'sketch' || currentView ==='breathingtraining' || currentView === 'naming' || currentView ==='mood' || currentView ==='history' || currentView === 'cognitive') return null;
  console.log('[TopBar] currentView =', currentView);
  const handleBackToChat = () => {
    if (exitMessage) {
      addMessage(exitMessage, "system");
    }
    if (exitModuleToComplete) {
      setPendingModuleCompletion(exitModuleToComplete);
    }
    setCurrentView('chat');
    clearExitAction();
  };

  return (
    <div className="w-full px-1 md:px-6 pt-3 pb-1 flex items-center bg-transparent shrink-0 min-w-0 animate-in fade-in slide-in-from-top-2 duration-300">
      <Button
        variant="ghost"
        onClick={handleBackToChat}
        className="flex items-center gap-2 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 shadow-sm rounded-full pl-3 pr-4 py-5 transition-all group hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap max-w-[70vw]"
      >
        <div className="bg-white/10 rounded-full p-1 group-hover:bg-white/20 transition-colors">
          <SafeIcon icon={Icons.ArrowLeft} size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        </div>
        <span className="font-medium text-sm truncate">返回对话</span>
      </Button>
    </div>
  );
};
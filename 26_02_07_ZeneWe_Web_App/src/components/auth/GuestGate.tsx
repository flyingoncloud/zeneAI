import React from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Lock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useZenemeStore } from '../../hooks/useZenemeStore'; // to trigger nav

interface GuestGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  triggerType?: 'blocking' | 'soft'; // Blocking = user clicked action, Soft = auto-prompt
}

export const GuestGate: React.FC<GuestGateProps> = ({ 
  open, 
  onOpenChange, 
  title = "登录以保存你的进度", 
  description = "登录账号后，你的训练记录、情绪追踪和分析报告将永久保存并支持跨设备同步。",
  triggerType = 'blocking'
}) => {
  // We need to access the App's navigation to redirect to AuthPage
  // But wait, App.tsx controls view. 
  // We can add a specialized action in useZenemeStore to "request auth view" or just set it if we expose it.
  // Actually, we can use a global event or callback, but let's just stick to a simple strategy:
  // The Modal just renders. The PARENT handles navigation? No, that's messy.
  // Let's modify useZenemeStore to accept 'auth' as a view, or add a dedicated `showAuth` state?
  // Easier: Assume App.tsx passes a `onNavigateAuth` down context? No.
  
  // Let's use window event or store? 
  // Let's just modify the ZenemeStore to have a "auth" view or add a method.
  // Actually, I can just grab `setCurrentView`? But `auth` isn't a View type yet.
  // I will cheat slightly: I will emit a custom event or just export a navigation helper.
  // OR, I can make `Auth` a valid `View` in `useZenemeStore`? That requires editing the store type.
  // Let's try to keep it local. If the user clicks Login, we can execute a callback prop passed to this component?
  // But this component is used deeply nested.
  
  // Solution: In App.tsx, we will listen to `useAuthStore` status changes? No.
  // Let's add a global event listener for 'navigate-to-auth'.
  
  const handleLogin = () => {
    // Dispatch event that App.tsx listens to
    window.dispatchEvent(new CustomEvent('zeneme:navigate-auth'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-slate-900/95 backdrop-blur-2xl border-white/10 shadow-2xl p-0 overflow-hidden gap-0 rounded-3xl">
         
         {/* Visual Header */}
         <div className="h-32 bg-gradient-to-br from-violet-600/20 to-indigo-600/20 relative flex items-center justify-center border-b border-white/5">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.3)] backdrop-blur-md">
               <Lock className="w-8 h-8 text-violet-300" />
            </div>
         </div>

         <div className="p-6 space-y-4 text-center">
            <div className="space-y-2">
               <DialogTitle className="text-xl font-bold text-white tracking-wide">
                  {title}
               </DialogTitle>
               <DialogDescription className="text-slate-400 text-sm leading-relaxed">
                  {description}
               </DialogDescription>
            </div>

            <div className="pt-4 flex flex-col gap-3">
               <Button 
                 onClick={handleLogin}
                 className="w-full h-11 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 border border-white/10 font-medium tracking-wide"
               >
                 登录以解锁更多
                 <ArrowRight className="ml-2 w-4 h-4 opacity-70" />
               </Button>
               
               <Button 
                 variant="ghost" 
                 onClick={() => onOpenChange(false)}
                 className="w-full h-11 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 font-normal"
               >
                 {triggerType === 'soft' ? '暂时跳过' : '继续浏览'}
               </Button>
            </div>
         </div>
      </DialogContent>
    </Dialog>
  );
};

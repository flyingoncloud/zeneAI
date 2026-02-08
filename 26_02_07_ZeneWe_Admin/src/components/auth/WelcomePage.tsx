import React from 'react';
import { Button } from '../ui/button';
import Logo from '../../imports/Logo';
import sloganImg from "figma:asset/7c848eefc4ca2b79a23ba769f0697721287a80b8.png";
import { useAuthStore } from '../../hooks/useAuthStore';
import { motion } from 'motion/react';
import { ArrowRight, User } from 'lucide-react';
import { WelcomeDanmaku } from './WelcomeDanmaku';

interface WelcomePageProps {
  onNavigateAuth: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onNavigateAuth }) => {
  const { enterGuestMode } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative z-20 px-6 text-center overflow-hidden">
      
      {/* Background Danmaku Layer */}
      <WelcomeDanmaku />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center max-w-md w-full relative z-30"
      >
        {/* Logo Area */}
        <div className="w-48 mb-8 relative">
           <div className="w-full h-auto">
             <Logo />
           </div>
        </div>

        {/* Slogan */}
        <img 
          src={sloganImg} 
          alt="Slogan"
          className="h-8 w-auto mb-12 opacity-90 drop-shadow-lg"
        />

        {/* Main Card */}
        <div className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col gap-5">
           <h1 className="text-2xl font-bold text-white tracking-wide mb-2">
             开启你的情绪自愈之旅
           </h1>
           
           <Button 
             onClick={enterGuestMode}
             className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/10 transition-all transform hover:scale-[1.02]"
           >
             <User className="mr-2 h-5 w-5" />
             游客体验
           </Button>

           <div className="relative flex items-center py-2">
             <div className="flex-grow border-t border-white/10"></div>
             <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">或者</span>
             <div className="flex-grow border-t border-white/10"></div>
           </div>

           <Button 
             variant="ghost"
             onClick={onNavigateAuth}
             className="w-full h-12 text-base rounded-xl text-slate-300 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
           >
             登录 / 注册
           </Button>
        </div>

        <p className="mt-8 text-xs text-slate-500 max-w-xs leading-relaxed">
          游客模式下可浏���大部分功能，<br/>但由于为了保护隐私，退出后数据将无法保存。
        </p>
      </motion.div>
    </div>
  );
};

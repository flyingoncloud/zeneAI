import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/hooks/useAuthStore';
import { motion } from 'motion/react';
import { User } from 'lucide-react';
import { WelcomeDanmaku } from './WelcomeDanmaku';
import Logo from '../../imports/Logo';
import Image from "next/image"; 
interface WelcomePageProps {
  onNavigateAuth: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onNavigateAuth }) => {
  const { enterGuestMode } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative z-20 px-6 text-center overflow-hidden bg-gradient-to-b from-purple-700 via-purple-600 to-pink-500">

      {/* Background Danmaku Layer */}
      <WelcomeDanmaku />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center max-w-md w-full relative z-30"
      >
        {/* Logo Area */}
      <div className="w-48 mb-8 mt-16 relative">
           <div className="w-16 h-16 relative mb-0">
             <Logo />
           </div>

        {/* 2. 引用 slogan 2.png 图片 */}
      <div className="relative">
        <Image
          // 关键点：文件名中的空格在 URL 中需要写成 %20
          src="/slogan%202.png" 
          alt="遇见更好的自己"
          width={150} // 根据实际图片宽度调整
          height={40}  // 根据实际图片高度调整
          className="h-8 w-auto mb-12 opacity-90 drop-shadow-lg"
          priority // 登录页首屏图片建议加上这个属性
        />
      </div>
    </div>

        {/* Main Card */}
        <div className="w-full bg-purple-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col gap-5">
          <h2 className="text-2xl font-bold text-white tracking-wide mb-2">
            开启自我觉察之旅
          </h2>

          <Button
            onClick={enterGuestMode}
            className="w-full h-14 text-lg rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/10 transition-all transform hover:scale-[1.02]"
          >
            <User className="mr-2 h-5 w-5" />
            游客体验
          </Button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/20"></div>
            <span className="flex-shrink-0 mx-4 text-white/60 text-xs">或者</span>
            <div className="flex-grow border-t border-white/20"></div>
          </div>

          <Button
            variant="ghost"
            onClick={onNavigateAuth}
            className="w-full h-12 text-base rounded-xl text-white hover:text-white hover:bg-white/10 border-0 transition-colors"
          >
            登录 / 注册
          </Button>
        </div>

        <p className="mt-8 text-xs text-white/70 max-w-xs leading-relaxed">
          游客模式下可浏览大部分功能。
        </p>
      </motion.div>
    </div>
  );
};

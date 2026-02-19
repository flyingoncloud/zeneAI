/* eslint-disable @typescript-eslint/no-explicit-any */
import * as Icons from '../../../ui/icons';
import { Button } from '../../../ui/button';
import { Card } from '../../../ui/card';
import { Wind } from 'lucide-react';
import { useZenemeStore } from '../../../../hooks/useZenemeStore';

const SafeIcon = ({ icon: Icon, ...props }: any) => {
  if (!Icon) return <span style={{ width: props.size || 24, height: props.size || 24, display: 'inline-block', background: '#ccc', borderRadius: 4 }} />;
  return <Icon {...props} />;
};

interface BreathingWelcomeProps {
  onStart: () => void;
  onResume?: () => void;
  hasDraft?: boolean;
}

export function BreathingWelcome({ onStart, onResume, hasDraft }: BreathingWelcomeProps) {
  // 删除了无用的 toggleSidebar 引用

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 bg-[rgba(0,0,0,0)] relative">
      {/* 修复 1: 使用内联 style 强制 32px 圆角，彻底绕过 Tailwind JIT 和 Shadcn 默认属性的合并冲突 
        修复 2: 补回 overflow-hidden 确保毛玻璃和背景不溢出
      */}
      <Card 
       style={{ borderRadius: '32px', paddingBottom: '32px' }} // 32px = pb-8
       className="max-w-md w-full px-8 pt-8 text-center space-y-6 shadow-2xl border-white/10 bg-slate-900/50 backdrop-blur-xl overflow-hidden"
      >
        <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto text-violet-400 mb-4 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
          <Wind size={40} strokeWidth={2} />
        </div>
        
        <h2 className="text-3xl font-bold text-white tracking-wide">呼吸训练</h2>
        
        <p className="text-slate-400 text-lg max-w-2xl">
          用于情绪急救，帮助你快速稳定节奏，找回平静
        </p>
        
        <div className="space-y-2 pt-4 bg-[rgba(255,255,255,0)]">
          <div className="flex items-center gap-2 text-slate-300 text-base justify-center bg-[rgba(255,255,255,0)]">
            <SafeIcon icon={Icons.Check} size={18} className="text-violet-400" /> 约 1–2 分钟
          </div>
          <div className="flex items-center gap-2 text-slate-300 text-base justify-center bg-[rgba(255,255,255,0)]">
            <SafeIcon icon={Icons.Check} size={18} className="text-violet-400" /> 四步呼吸法（4-4-4-4）
          </div>
        </div>
        
        <div className="flex flex-col gap-4 w-full">
          {hasDraft && onResume && (
             <Button 
               onClick={onResume} 
               className="w-full h-12 rounded-2xl border border-white/10 text-lg text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition-all font-medium"
             >
               继续上一次
             </Button>
          )}

          {/* 修复 3: 还原设计师的高亮纯紫按钮，去掉了发灰的透明度渐变 
          */}
          <Button 
            onClick={onStart} 
            className="w-full bg-violet-600 hover:bg-violet-500 text-lg h-12 rounded-2xl border border-white/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all font-medium"
          >
            开始呼吸训练
          </Button>
        </div>
      </Card>
    </div>
  );
}
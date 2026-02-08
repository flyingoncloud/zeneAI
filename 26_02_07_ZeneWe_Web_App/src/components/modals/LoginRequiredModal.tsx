import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface LoginRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
  onContinueGuest: () => void;
}

export const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  open,
  onOpenChange,
  onLogin,
  onContinueGuest,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-[#1a1d2e]/90 backdrop-blur-xl border-white/10 text-slate-200 shadow-2xl p-6 rounded-2xl gap-0">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold text-white text-center tracking-wide">
            登录后解锁更多
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-6">
          <p className="text-slate-300 text-sm leading-relaxed">
            游客模式仅支持聊天。登录后可使用：<br />
            报告生成、情绪命名、历史记录与跨设备同步。
          </p>

          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={onLogin}
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all"
            >
              登录 / 注册
            </Button>
            <Button
              variant="ghost"
              onClick={onContinueGuest}
              className="w-full h-11 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              继续游客模式
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { User, Sparkles } from 'lucide-react';

interface GuestGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
  onContinueGuest: () => void;
}

export const GuestGate: React.FC<GuestGateProps> = ({
  open,
  onOpenChange,
  onLogin,
  onContinueGuest,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-slate-900/95 backdrop-blur-xl border-white/10 text-slate-200 shadow-2xl">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center text-white">
            解锁完整体验
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400 mt-2">
            登录后可以保存您的数据，查看历史记录，并享受更多个性化功能
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button
            onClick={onLogin}
            className="w-full h-12 text-base rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg"
          >
            <User className="mr-2 h-5 w-5" />
            登录 / 注册
          </Button>

          <Button
            variant="ghost"
            onClick={onContinueGuest}
            className="w-full h-10 text-sm text-slate-400 hover:text-white hover:bg-white/5"
          >
            继续游客模式
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

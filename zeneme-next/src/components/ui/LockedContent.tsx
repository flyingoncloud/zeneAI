import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { useZenemeStore } from '../../hooks/useZenemeStore';
import { UpgradeSource } from '../../hooks/useZenemeStore';

interface LockedContentProps {
  title?: string;
  description?: string;
  source: UpgradeSource;
  className?: string;
}

export const LockedContent: React.FC<LockedContentProps> = ({ 
  title, 
  description, 
  source,
  className = "" 
}) => {
  const { t, openUpgradeModal } = useZenemeStore();

  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/5 bg-slate-900/40 p-8 text-center backdrop-blur-sm ${className}`}>
      {/* Background Pattern for "Locked" feel */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-900 via-slate-900 to-black" />
      
      <div className="relative z-10 flex flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/50 shadow-inner ring-1 ring-white/10">
          <Lock className="h-5 w-5 text-violet-400" />
        </div>
        
        <div className="space-y-2 max-w-sm">
          <h3 className="text-lg font-semibold text-white tracking-wide">
            {title || t.upgrade.lockedTitle}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {description || t.upgrade.lockedDesc}
          </p>
        </div>

        <Button 
          onClick={() => openUpgradeModal(source)}
          className="mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)] border border-white/10 px-8"
        >
          {t.common.upgradePro}
        </Button>
      </div>
    </div>
  );
};

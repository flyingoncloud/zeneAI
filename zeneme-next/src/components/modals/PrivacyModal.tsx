import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useZenemeStore } from '../../hooks/useZenemeStore';

interface PrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ open, onOpenChange }) => {
  const { t } = useZenemeStore();
  const privacy = (t && t.privacy) || {
    title: t?.common?.privacyPolicy || 'Privacy',
    subtitle: '',
    sections: [] as { title?: string; content?: string }[],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#1a1d2e] border-white/10 text-slate-200 shadow-2xl p-0 gap-0 overflow-hidden rounded-xl">
        
        {/* Fixed Header */}
        <div className="p-6 pb-4 bg-[#1a1d2e] border-b border-white/5 relative z-10">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium tracking-tight text-white">
              {privacy.title}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm mt-1">
              {privacy.subtitle}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content Area */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#161825] p-6 space-y-8 animate-in fade-in-50 duration-300">
          {(privacy.sections || []).map((section, index) => (
            <div key={index} className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                {section.title}
              </h3>
              <div className="text-sm leading-relaxed text-slate-400 space-y-2">
                <p>{section.content}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Fixed Footer */}
        <div className="p-6 pt-4 bg-[#1a1d2e] border-t border-white/5 flex justify-end gap-3 z-10">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            className="text-slate-400 hover:text-slate-200 hover:bg-white/5 min-w-[80px]"
          >
            {t.common.close}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};

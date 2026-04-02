'use client';

import React from 'react';
import { X } from 'lucide-react';
import { InnerQuickTest } from '@/components/features/tools/InnerQuickTest';
import { ZenemeProvider } from '@/hooks/useZenemeStore';

interface QuestionPreviewProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Full-screen preview of the InnerQuickTest questionnaire.
 * Wraps InnerQuickTest in its own ZenemeProvider so it doesn't
 * interfere with the admin store state.
 */
export const QuestionPreview: React.FC<QuestionPreviewProps> = ({ isOpen, onClose }) => {
  // Set debug flag so InnerQuickTest shows question IDs and categories
  React.useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      window.sessionStorage.setItem('debug', 'true');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-gradient-to-b from-[#1a1040] to-[#2d1b69]">
      {/* Close bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-black/30 border-b border-white/10">
        <span className="text-xs text-violet-300/60 uppercase tracking-widest font-semibold">
          预览模式 — 答案不会保存
        </span>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Full InnerQuickTest */}
      <div className="flex-1 overflow-hidden">
        <ZenemeProvider>
          <InnerQuickTest />
        </ZenemeProvider>
      </div>
    </div>
  );
};

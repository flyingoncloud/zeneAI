import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Loader2, RefreshCw, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { cn } from '../ui/utils';
import { useZenemeStore } from '../../hooks/useZenemeStore';

// --- 1. Toast Notification ---
export const Toast = ({ message, type = 'success', visible, onClose }: { message: string, type?: 'success' | 'error' | 'info', visible: boolean, onClose: () => void }) => {
  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={cn(
            "fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border flex items-center gap-3",
            type === 'success' && "bg-emerald-900/80 border-emerald-500/30 text-emerald-200",
            type === 'error' && "bg-red-900/80 border-red-500/30 text-red-200",
            type === 'info' && "bg-slate-900/80 border-slate-500/30 text-slate-200"
          )}
        >
          {type === 'success' && <Check size={18} />}
          {type === 'error' && <AlertCircle size={18} />}
          {type === 'info' && <Loader2 size={18} className="animate-spin" />}
          <span className="text-sm font-medium">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- 2. Generic Confirm Dialog ---
export const ConfirmDialog = ({ open, title, desc, cancelText, confirmText, onCancel, onConfirm, isDestructive = false }: any) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[400px] bg-slate-900 border-white/10 text-slate-200 z-[100]">
        <DialogHeader>
          <DialogTitle className={cn("text-lg", isDestructive && "text-red-400")}>{title}</DialogTitle>
          <DialogDescription className="text-slate-400">{desc}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-white hover:bg-white/5">{cancelText}</Button>
          <Button 
            onClick={onConfirm} 
            className={cn(
              isDestructive ? "bg-red-600 hover:bg-red-500" : "bg-violet-600 hover:bg-violet-500",
              "text-white"
            )}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- 3. Loading Overlay (Breathing Animation) ---
export const LoadingOverlay = ({ visible, text }: { visible: boolean, text: string }) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[50] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <div className="relative">
            {/* Breathing Halo */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute inset-0 bg-violet-500 rounded-full blur-xl"
            />
            {/* Particles */}
            <div className="absolute inset-0">
               {[...Array(3)].map((_, i) => (
                 <motion.div
                   key={i}
                   className="absolute w-2 h-2 bg-white rounded-full opacity-50"
                   animate={{ 
                     y: [-20, -40], 
                     x: Math.sin(i) * 20, 
                     opacity: [0, 1, 0] 
                   }}
                   transition={{ 
                     repeat: Infinity, 
                     duration: 2, 
                     delay: i * 0.5,
                     ease: "easeOut"
                   }}
                   style={{ left: '50%', top: '50%' }}
                 />
               ))}
            </div>
            <div className="relative z-10 w-16 h-16 bg-slate-900/50 rounded-full border border-white/10 flex items-center justify-center backdrop-blur-md">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-slate-200 font-medium tracking-widest text-sm uppercase"
          >
            {text}
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- 4 & 5. Success/Fail Result Overlay ---
export const ResultOverlay = ({ 
  visible, 
  type, 
  title, 
  onPrimary, 
  primaryText, 
  onSecondary, 
  secondaryText 
}: { 
  visible: boolean;
  type: 'success' | 'error';
  title: string;
  onPrimary: () => void;
  primaryText: string;
  onSecondary?: () => void;
  secondaryText?: string;
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[50] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center max-w-sm text-center"
          >
            {type === 'success' ? (
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                <svg className="w-10 h-10 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    d="M20 6L9 17l-5-5"
                  />
                </svg>
              </div>
            ) : (
              <motion.div 
                animate={{ x: [-5, 5, -5, 5, 0] }}
                transition={{ duration: 0.4 }}
                className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/30"
              >
                <X className="w-10 h-10 text-red-400" />
              </motion.div>
            )}

            <h3 className="text-xl font-bold text-white mb-8">{title}</h3>

            <div className="flex flex-col w-full gap-3">
              <Button onClick={onPrimary} className={cn("w-full h-11", type === 'success' ? "bg-white text-black hover:bg-slate-200" : "bg-red-600 text-white hover:bg-red-500")}>
                {primaryText}
              </Button>
              {onSecondary && (
                <Button variant="ghost" onClick={onSecondary} className="w-full text-slate-400 hover:text-white">
                  {secondaryText}
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- 6. Empty State ---
export const EmptyState = ({ title, desc, actionLabel, onAction }: any) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6 animate-in fade-in duration-500">
    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
      <RefreshCw className="text-slate-600" />
    </div>
    <h4 className="text-lg font-medium text-slate-300 mb-2">{title}</h4>
    <p className="text-sm text-slate-500 max-w-xs mb-6">{desc}</p>
    {actionLabel && (
      <Button variant="outline" onClick={onAction} className="border-white/10 hover:bg-white/5 text-slate-300">
        {actionLabel} <ArrowRight size={14} className="ml-2" />
      </Button>
    )}
  </div>
);

// --- 7. Error State ---
export const ErrorState = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useZenemeStore();
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6">
      <AlertCircle className="w-10 h-10 text-red-400/50 mb-4" />
      <p className="text-slate-400 mb-4">{t.modals.failed}</p>
      <Button variant="ghost" size="sm" onClick={onRetry} className="text-xs text-white bg-white/5 hover:bg-white/10">
        <RefreshCw size={12} className="mr-2" /> {t.modals.retry}
      </Button>
    </div>
  );
};

// --- 8. Skeletons ---
export const ListSkeleton = () => (
  <div className="space-y-3 w-full animate-pulse">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-20 bg-white/5 rounded-xl w-full" />
    ))}
  </div>
);

export const CalendarSkeleton = () => (
  <div className="grid grid-cols-7 gap-2 animate-pulse mt-4">
    {[...Array(30)].map((_, i) => (
      <div key={i} className="aspect-square bg-white/5 rounded-md" />
    ))}
  </div>
);

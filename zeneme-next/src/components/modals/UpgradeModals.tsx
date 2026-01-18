import React, { useState, useEffect } from 'react';
import { useZenemeStore } from '../../hooks/useZenemeStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Check, X, Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { cn } from '../ui/utils';
import { motion, AnimatePresence } from 'motion/react';

type UpgradeStep = 'intro' | 'confirm' | 'processing' | 'success' | 'failed';

export const UpgradeModals: React.FC = () => {
  const { 
    isUpgradeModalOpen, 
    closeUpgradeModal, 
    upgradeSource, 
    setProStatus, 
    t 
  } = useZenemeStore();
  
  const [step, setStep] = useState<UpgradeStep>('intro');
  const [agreed, setAgreed] = useState(false);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isUpgradeModalOpen) {
      setStep('intro');
      setAgreed(false);
    }
  }, [isUpgradeModalOpen]);

  const handleSubscribeClick = () => {
    setStep('confirm');
  };

  const handleConfirmPayment = () => {
    if (!agreed) return;
    setStep('processing');
    
    // Simulate API call
    setTimeout(() => {
      // Success simulation (90% chance)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        setProStatus(true);
        setStep('success');
      } else {
        setStep('failed');
      }
    }, 2000);
  };

  const handleSuccessAction = () => {
    closeUpgradeModal();
    // Logic for redirect is handled by simply closing, as the calling component 
    // (ReportDetail, Settings, etc.) will react to the `isPro` state change.
    // Or we could have specific navigation logic here if routes were complex.
  };

  const BenefitItem = ({ text, highlight = false }: { text: string; highlight?: boolean }) => (
    <div className="flex items-start gap-2 text-sm text-slate-300">
      <Check size={16} className={cn("mt-0.5 shrink-0", highlight ? "text-violet-400" : "text-slate-500")} />
      <span className={highlight ? "text-white font-medium" : "text-slate-400"}>{text}</span>
    </div>
  );

  return (
    <Dialog open={isUpgradeModalOpen} onOpenChange={(open) => !open && closeUpgradeModal()}>
      <DialogContent className="sm:max-w-[480px] bg-[#1a1d2e] border-white/10 text-slate-200 p-0 overflow-hidden shadow-2xl z-[60]">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: INTRO */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="relative h-32 bg-gradient-to-br from-violet-600 to-indigo-900 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                <div className="relative z-10 text-center">
                   <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow-md">{t.upgrade.title}</h2>
                   <p className="text-violet-200 text-sm mt-1">{t.upgrade.subtitle}</p>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Free Plan Column */}
                  <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/5 opacity-70">
                    <h3 className="font-semibold text-slate-400 text-center border-b border-white/5 pb-2">{t.upgrade.freePlan}</h3>
                    <div className="space-y-3">
                      {t.upgrade.freeFeatures.map((feat, i) => <BenefitItem key={i} text={feat} />)}
                    </div>
                  </div>

                  {/* Pro Plan Column */}
                  <div className="space-y-4 p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-violet-600 text-[10px] px-2 py-0.5 text-white rounded-bl-lg font-bold">RECOMMENDED</div>
                    <h3 className="font-semibold text-violet-300 text-center border-b border-white/5 pb-2">{t.upgrade.proPlan}</h3>
                    <div className="space-y-3">
                      {t.upgrade.proFeatures.map((feat, i) => <BenefitItem key={i} text={feat} highlight />)}
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2">
                   <div className="text-2xl font-bold text-white">{t.upgrade.price}</div>
                   <div className="text-xs text-slate-400 mt-1">{t.upgrade.autoRenew}</div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" className="flex-1 text-slate-400 hover:text-white" onClick={closeUpgradeModal}>
                    {t.upgrade.cancel}
                  </Button>
                  <Button className="flex-[2] bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/20" onClick={handleSubscribeClick}>
                    {t.upgrade.subscribe}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CONFIRM */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <DialogHeader className="mb-6">
                <DialogTitle>{t.upgrade.confirmTitle}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mb-8">
                <div className="p-4 rounded-xl bg-slate-900 border border-white/5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{t.upgrade.planLabel}</span>
                    <span className="text-white font-medium">{t.upgrade.proPlan}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{t.upgrade.priceLabel}</span>
                    <span className="text-white font-medium">{t.upgrade.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">{t.upgrade.renewLabel}</span>
                    <span className="text-slate-300">{t.upgrade.autoRenew}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 px-1">
                   <Checkbox id="terms" checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} className="mt-1 border-white/30 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600" />
                   <label htmlFor="terms" className="text-sm text-slate-400 leading-tight cursor-pointer">
                     {t.upgrade.terms}
                   </label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setStep('intro')}>
                   {t.common.back}
                </Button>
                <Button 
                  className="flex-[2] bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed" 
                  disabled={!agreed}
                  onClick={handleConfirmPayment}
                >
                  {t.common.confirm}
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PROCESSING */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 flex flex-col items-center justify-center text-center h-[400px]"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-violet-500 blur-xl opacity-20 animate-pulse rounded-full" />
                <Loader2 size={48} className="text-violet-400 animate-spin relative z-10" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t.upgrade.processing}</h3>
              <p className="text-slate-400 text-sm">Please do not close this window</p>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-emerald-500/30">
                <ShieldCheck size={40} className="text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.upgrade.successTitle}</h3>
              <p className="text-slate-400 mb-8 max-w-xs leading-relaxed">
                {t.upgrade.successDesc}
              </p>
              
              <Button 
                onClick={handleSuccessAction}
                className="w-full bg-white text-black hover:bg-slate-200 font-medium"
              >
                {upgradeSource === 'report' && t.upgrade.unlockReport}
                {upgradeSource === 'limit' && t.upgrade.continueSession}
                {upgradeSource === 'settings' && t.upgrade.viewBenefits}
                {!upgradeSource && t.common.continue}
              </Button>
            </motion.div>
          )}

          {/* STEP 5: FAILED */}
          {step === 'failed' && (
            <motion.div
              key="failed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
            >
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/30">
                <X size={40} className="text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t.upgrade.failedTitle}</h3>
              <p className="text-slate-400 mb-8 max-w-xs leading-relaxed">
                {t.upgrade.failedDesc}
              </p>
              
              <div className="flex gap-3 w-full">
                <Button variant="ghost" className="flex-1" onClick={closeUpgradeModal}>
                  {t.modals.later}
                </Button>
                <Button className="flex-1 bg-white text-black hover:bg-slate-200" onClick={() => setStep('intro')}>
                  {t.upgrade.retry}
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

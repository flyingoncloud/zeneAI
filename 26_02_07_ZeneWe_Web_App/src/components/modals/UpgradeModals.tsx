import React, { useState, useEffect, useRef } from 'react';
import { useZenemeStore } from '../../hooks/useZenemeStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Check, X, Loader2, CreditCard, ShieldCheck, ChevronLeft, ArrowDown } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import { cn } from '../ui/utils';
import { motion, AnimatePresence } from 'motion/react';

// --- Legal Texts ---
const LEGAL_TEXTS = {
  terms: `**生效日期：**2025 年 01 月 15 日
**更新日期：**2025 年 01 月 15 日

欢迎使用 ZeneWe（以下简称“本服务”或“ZeneWe”）。在使用本服务前，请你仔细阅读并理解本《服务条款》（以下简称“本条款”）。当你注册、登录、访问或使用本服务，即表示你已阅读、理解并同意受本条款约束。

**重要提示：**ZeneWe 提供的是情绪支持与自我觉察工具，并不构成医疗诊断、治疗建议或紧急救助服务。若你处于紧急危险或自伤/他伤风险，请立即联系当地紧急救助电话或专业机构。

1. 服务内容与适用范围

ZeneWe 提供的功能可能包括但不限于：AI 对话与情绪支持引导、情绪急救、内视涂鸦（绘图输入与 AI 分析反馈）、内视快测（问卷/测评与结果报告）、情绪追踪（趋势/日历/记录）、觉察报告（Lite/Pro 等）、订阅服务、额度（credit）管理、导出/保存等权益。

你理解并同意：本服务会持续迭代更新，功能、界面、权益与定价可能调整，我们会以合理方式提示或说明。

2. 账号与使用资格

你应提供真实、准确、完整的注册信息并保持更新。

你应妥善保管账号凭证，不得转让、出租、出借或售卖账号。

若发现未经授权使用，请及时通知我们；因你保管不善导致的损失由你自行承担。

3. 订阅、付费与额度（Credit）

ZeneWe 可能提供免费版本与付费订阅版本（例如“深度版/Pro”），权益差异以页面展示为准。

付费订阅可能按月/按年自动续费，你可以在订阅管理中取消续费；取消后通常在当前计费周期结束时生效。

免费或付费用户可能存在使用上限（例如一定时间内生成报告次数上限），额度规则以产品说明为准。

退款与撤销以实际支付渠道规则及当时公示政策为准（如适用）。

4. 使用规范与禁止行为

你不得利用本服务从事违法犯罪、骚扰威胁、传播恶意软件、批量注册/爬虫、绕过限制、攻击系统、侵犯他人隐私与知识产权等行为。我们有权对违规行为采取限制功能、暂停/终止服务、删除内容等措施。

5. 用户内容与许可

你在 ZeneWe 中提交的文字、图片、涂鸦、测评答案、情绪记录等均属于“用户内容”。你对用户内容负责。为向你提供服务（生成回复/报告、同步、故障排查与安全防护），我们会在必要范围内处理你的用户内容，并按照《隐私政策》保护数据。

6. AI 输出性质与免责声明

ZeneWe 的回复与报告可能由算法自动生成，可能存在不准确或不适用于个体的情况。你应结合自身判断使用；涉及医疗/心理治疗/法律/财务等高风险决策，请咨询专业人士。ZeneWe 不提供紧急救助服务。

7. 知识产权

ZeneWe 的产品、界面、标识、文案、算法与结构等知识产权归我们或相关权利人所有。未经许可不得复制、传播、出售或用于商业用途（法律允许的除外）。

8. 服务中断、变更与终止

我们可能因维护升级或不可抗力导致服务中断，将尽量降低影响。若你违反本条款，我们可暂停或终止服务。你可随时停止使用并申请注销账号（如支持）。

9. 责任限制

在法律允许的最大范围内，我们对间接损失不承担责任；我们的责任以你就相关服务已实际支付的费用（如有）为限（以适用法律为准）��

10. 适用法律与争议解决

本条款适用【ZeneWe 运营方所在地适用法律】。争议优先协商，协商不成提交【ZeneWe 指定管辖法院】解决。

11. 联系我们

邮箱：support@zenewe.app
运营方：ZeneWe Inc.`,
  
  privacy: `**生效日期：**2025 年 01 月 15 日
**更新日期：**2025 年 01 月 15 日

ZeneWe 重视你的隐私。本《隐私政策》说明我们如何收集、使用、存储、共享与保护你的个人信息，以及你享有的权利。

**特别说明：**ZeneWe 涉及情绪、测评、对话与涂鸦内容，这些可能属于敏感信息。请仅提交你愿意让系统处理的内容。

1. 我们收集哪些信息

账号与基础信息：昵称、头像（如你设置）、登录标识（邮箱/手机号/第三方登录如适用）、订阅状态。

你提交的内容（可能为敏感信息）：对话内容、情绪记录、测评作答与结果、内视涂鸦图片与说明、Lite/Pro 报告与历史记录。

设备与日志信息：设备/系统/浏览器、语言时区、IP、访问与崩溃日志、必要的操作事件。

支付信息（如订阅）：订单号、计划、支付状态、账单周期；支付通常由第三方处理，我们不保存完整银行卡信息（以实际接入为准）。

2. 我们如何使用你的信息

用于提供与维护服务、生成对话与报告、历史同步、个性化体验（在你使用对应功能时）、安全与反作弊、客服支持、产品改进（尽量去标识化/聚合）、法律合规。

3. AI 处理与模型相关说明

为生成回复/报告，我们需要处理你的输入内容。我们会采取合理措施减少不必要的数据暴露并进行权限控制。若未来涉及用于训练/改进模型，我们会在产品内明确告知并提供可选设置（如适用）。

4. 共享、转让与公开披露

我们不会出售你的个人信息。仅在为提供服务所必需（云存储/日志/支付/通知等服务商）、法律要求或安全原因下共享必要信息。未经同意不公开披露你的对话与情绪内容。

5. 数据存储与保留

我们在提供服务所需期限内保存数据；你注销或提出删除请求后，在合理期限内处理（法律另有规定除外）。数据可能存储在【ZeneWe 数据中心】，跨境传输遵循适用法律并采取保护措施。

6. 你的权利

你可访问与更正、删除或注销、撤回同意、在支持时导出数据，并可投诉与反馈（以适用法律为准）。

7. 安全措施

我们采取访问控制、加密传输、日志审计等措施保护数据，但无法保证绝对安全。

8. 未成年人保护

未满 18 周岁请在监护人同意与指导下使用。

9. 政策更新

若本政策发生重��变更，我们会以弹窗/公告等显著方式提示。继续使用视为接受更新。

10. 联系我们

邮箱：privacy@zenewe.app
运营方：ZeneWe Inc.`
};

type UpgradeStep = 'intro' | 'confirm' | 'reading-terms' | 'reading-privacy' | 'processing' | 'success' | 'failed';

// --- Reading View Component ---
const ReadingView: React.FC<{
  title: string;
  content: string;
  onConfirm: () => void;
  onBack: () => void;
  isRead: boolean;
}> = ({ title, content, onConfirm, onBack, isRead }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canConfirm, setCanConfirm] = useState(isRead);
  const [showScrollHint, setShowScrollHint] = useState(!isRead);

  const handleScroll = () => {
    if (canConfirm) return;
    const el = scrollRef.current;
    if (!el) return;

    const isBottom = Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 50;
    if (isBottom) {
      setCanConfirm(true);
      setShowScrollHint(false);
    }
  };

  // Initial check in case text is short
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollHeight <= el.clientHeight) {
       setCanConfirm(true);
       setShowScrollHint(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-[500px] w-full bg-[#1a1d2e]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
        <h3 className="font-semibold text-slate-200">{title}</h3>
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 text-slate-400 hover:text-white rounded-full">
          <X size={18} />
        </Button>
      </div>

      <div className="relative flex-1 min-h-0">
         <div 
           ref={scrollRef} 
           onScroll={handleScroll} 
           className="absolute inset-0 overflow-y-auto p-6 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-light tracking-wide custom-scrollbar"
         >
            {content}
            <div className="h-10" /> {/* Spacer */}
         </div>
         
         {/* Scroll Hint Overlay */}
         <AnimatePresence>
           {showScrollHint && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-slate-300 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow-lg border border-white/5 pointer-events-none"
             >
               <ArrowDown size={12} className="animate-bounce" />
               <span>请滑动到底部阅读</span>
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      <div className="p-6 border-t border-white/5 bg-[#1a1d2e] shrink-0 flex gap-3 z-10">
         <Button variant="ghost" className="flex-1 text-slate-400 hover:text-white hover:bg-white/5" onClick={onBack}>
           返回
         </Button>
         <Button 
           disabled={!canConfirm} 
           onClick={onConfirm}
           className="flex-[2] bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
         >
           {canConfirm ? "我已阅读并同意" : "请阅读完毕"}
         </Button>
      </div>
    </div>
  );
};

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
  
  // Legal Read States
  const [readTerms, setReadTerms] = useState(false);
  const [readPrivacy, setReadPrivacy] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isUpgradeModalOpen) {
      setStep('intro');
      setAgreed(false);
      setReadTerms(false);
      setReadPrivacy(false);
    }
  }, [isUpgradeModalOpen]);

  // Auto-check logic
  useEffect(() => {
    if (readTerms && readPrivacy) {
      setAgreed(true);
    }
  }, [readTerms, readPrivacy]);

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
        <AnimatePresence mode="wait" initial={false}>
          
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

                <div className="space-y-2">
                  <div className="flex items-start gap-3 px-1">
                     <Checkbox 
                        id="terms" 
                        checked={agreed} 
                        // Only allow manual check if both are read
                        disabled={!readTerms || !readPrivacy}
                        onCheckedChange={(c) => {
                          if (readTerms && readPrivacy) setAgreed(c === true);
                        }} 
                        className="mt-0.5 border-white/30 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600 disabled:opacity-30" 
                     />
                     <div className="text-sm text-slate-400 leading-normal select-none">
                       我已阅读并同意
                       <span 
                         onClick={() => setStep('reading-terms')}
                         className={cn(
                           "mx-1 cursor-pointer transition-colors border-b border-transparent hover:border-violet-400",
                           readTerms ? "text-violet-400/80" : "text-violet-400 font-medium hover:text-violet-300 hover:shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                         )}
                       >
                         《服务条款》
                       </span>
                       和
                       <span 
                         onClick={() => setStep('reading-privacy')}
                         className={cn(
                           "mx-1 cursor-pointer transition-colors border-b border-transparent hover:border-violet-400",
                           readPrivacy ? "text-violet-400/80" : "text-violet-400 font-medium hover:text-violet-300 hover:shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                         )}
                       >
                         《隐私政策》
                       </span>
                     </div>
                  </div>
                  
                  {/* Validation Hint */}
                  {(!readTerms || !readPrivacy) && (
                    <div className="pl-8 text-[11px] text-orange-400/80 font-normal">
                      * 请先点击上方蓝色链接，打开并滑动到底阅读完毕后再勾选
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1 text-slate-400 hover:text-white" onClick={() => setStep('intro')}>
                   {t.common.back}
                </Button>
                <Button 
                  className="flex-[2] bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-900/10" 
                  disabled={!agreed}
                  onClick={handleConfirmPayment}
                >
                  {t.common.confirm}
                </Button>
              </div>
            </motion.div>
          )}
          
          {/* STEP 2a: READING TERMS */}
          {step === 'reading-terms' && (
            <motion.div
               key="reading-terms"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
            >
              <ReadingView 
                title="服务条款" 
                content={LEGAL_TEXTS.terms}
                isRead={readTerms}
                onConfirm={() => {
                  setReadTerms(true);
                  setStep('confirm');
                }}
                onBack={() => setStep('confirm')}
              />
            </motion.div>
          )}

          {/* STEP 2b: READING PRIVACY */}
          {step === 'reading-privacy' && (
            <motion.div
               key="reading-privacy"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
            >
              <ReadingView 
                title="隐私政策" 
                content={LEGAL_TEXTS.privacy}
                isRead={readPrivacy}
                onConfirm={() => {
                  setReadPrivacy(true);
                  setStep('confirm');
                }}
                onBack={() => setStep('confirm')}
              />
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

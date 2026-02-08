import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import { ArrowLeft, Save, Check, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const REPORT_DATE = '2026年2月1日';

const REPORT_PARAGRAPHS = [
  '感谢你上传了专属绘画，完成这段 ZeneMe「心知维」内视涂鸦。',
  '此刻的你，正站在一个向内理解与自我觉察逐渐加深的节点上。以下内容是一份基于你所完成绘画的「自我内在系统」简要反馈，尝试从象征性的角度呈现你内在不同部分的互动方式与心理重心。这不是一份结论式的评估，而是一份引导你观察内在结构与情绪动力的参考说明，帮助你在既有认知之外，看见更多可能性与调节空间。',
  '在"自我内在系统"的视角下，这幅画呈现的是你内在世界的一次结构性表达：核心真我位于系统中心，不直接喧哗，却通过不同的局部小我与外界互动。整幅画不是情绪的宣泄，而是一种被组织、被管理过的内在秩序。',
  '画面中央由仙人掌构成的房子，象征你的核心真我所处的心理空间。它并未直接暴露在外，而是被厚实、带刺的结构包围，显示核心真我目前更偏向"被保护的状态"，而非主动外显的主导位置。核心真我依然存在，具备稳定、温和与整合能力，但更多通过背景支持系统运作，而不是直接发声。',
  '围绕核心真我的，是几个功能清晰的局部小我。最显著的是"防御型小我"，以仙人掌的尖刺形态呈现。这个小我对你的影响是：在关系或不确定情境中，优先确保安全、控制风险、保持边界。它帮助你避免受伤，但也可能让你在亲密、表达需求或尝试新路径时显得谨慎甚至退缩。',
  '房子内部透出的暖色灯光与心形窗户，代表一个情感型、需求型的小我。它渴望被理解、被回应，也承载柔软与依恋需求。这个小我对你的影响往往是内在的：你可能能感受到情绪，却不一定会立刻表达，而是先交由防御型小我判断"是否安全"。',
  '通往房子的道路由多种图案拼接而成，象征一个思考与决策型小我群体。它们负责分析、比较、分割情境，对你的影响是：在行动前会反复权衡，优点是理性与周全，代价是决策耗能较高，内在容易出现拉扯感。',
  '背景中的天空、云朵与重复的树木，象征一个稳定但安静的支持型小我，它接近核心真我的品质：包容、持续、不过度介入。当你放慢节奏、拉开与情绪的距离时，这部分更容易被感知。',
  '整体来看，你的系统由强有力的保护者维持秩序，核心真我稳固但偏内收。觉察这些角色及其影响，有助于你在需要时，让核心真我更有空间走到前台，协调各方，而不是被单一声音主导。',
];

export const SketchBriefReport: React.FC = () => {
  const { sketchReportImage, addReport, setCurrentView } = useZenemeStore();
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSave = () => {
    if (saveState === 'saved') return;

    setSaveState('saving');

    setTimeout(() => {
      // Simulate 95% success
      const success = Math.random() > 0.05;
      if (success) {
        addReport({
          id: `brief-${Date.now()}`,
          type: 'brief',
          date: REPORT_DATE,
          title: '内视觉察报告（简要版）',
          preview: '基于内视涂鸦的自我内在系统简要反馈…',
          imageUrl: sketchReportImage || undefined,
          fullContent: REPORT_PARAGRAPHS.join('\n\n'),
        });
        setSaveState('saved');
        toast.success('已保存到历史记录（简要版）');
      } else {
        setSaveState('error');
        toast.error('保存失败，请重试');
      }
    }, 1200);
  };

  const handleBack = () => {
    setCurrentView('sketch');
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#121212] overflow-hidden relative">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 md:px-8 pt-6 pb-4 border-b border-white/5 bg-[#121212]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-wide">
              内视觉察报告（简要版）
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">ZeneMe 心知维 · 内视涂鸦分析</p>
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saveState === 'saving' || saveState === 'saved'}
          className={`h-10 px-5 rounded-full font-medium text-sm transition-all border ${
            saveState === 'saved'
              ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30 cursor-default'
              : saveState === 'saving'
              ? 'bg-violet-600/50 text-white/70 border-violet-500/30'
              : saveState === 'error'
              ? 'bg-red-600 hover:bg-red-500 text-white border-red-500/30'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-white/10 shadow-[0_0_12px_rgba(139,92,246,0.25)]'
          }`}
        >
          {saveState === 'saving' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {saveState === 'saved' && <Check className="w-4 h-4 mr-2" />}
          {saveState === 'idle' && <Save className="w-4 h-4 mr-2" />}
          {saveState === 'error' && <Save className="w-4 h-4 mr-2" />}
          {saveState === 'idle' && '保存报告'}
          {saveState === 'saving' && '保存中…'}
          {saveState === 'saved' && '已保存'}
          {saveState === 'error' && '重试保存'}
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-2xl mx-auto px-6 md:px-8 py-8 space-y-8">
          {/* Drawing Preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden shadow-xl">
              {sketchReportImage ? (
                <img
                  src={sketchReportImage}
                  alt="内视涂鸦画作"
                  className="w-full h-auto max-h-[400px] object-contain"
                />
              ) : (
                <div className="w-full h-64 flex flex-col items-center justify-center text-slate-500 gap-3">
                  <FileText size={40} className="opacity-30" />
                  <span className="text-sm">画作预览不可用</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Report Body */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-5"
          >
            {REPORT_PARAGRAPHS.map((para, idx) => (
              <motion.p
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + idx * 0.06 }}
                className="text-slate-300 leading-[1.85] text-[15px] tracking-wide"
              >
                {para}
              </motion.p>
            ))}
          </motion.div>

          {/* Report Date Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="pt-6 pb-10 border-t border-white/5"
          >
            <p className="text-sm text-slate-500">
              报告日期：{REPORT_DATE}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

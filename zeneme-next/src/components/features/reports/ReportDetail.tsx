import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import {
  X,
  CheckCircle2,
  Zap,
  Lock,
  Save,
  Brain,
  Sparkles,
  Lightbulb,
  User
} from 'lucide-react';
import { Toast } from '../../shared/GlobalFeedback';

interface ReportDetailProps {
  onBack?: () => void; // Used for closing or going back
  date?: string;
  mode?: 'chat' | 'history'; // 'chat' = generated just now, 'history' = viewing old
  reportContent?: string | null; // Dynamic report content from backend
}

export const ReportDetail: React.FC<ReportDetailProps> = ({
  onBack,
  date = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
  mode = 'history',
  reportContent
}) => {
  const { t, isPro, openUpgradeModal, moodLogs, addReport } = useZenemeStore();
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Mock Data based on requirements
  const currentMood = moodLogs.length > 0 ? t.mood.moods[moodLogs[moodLogs.length-1].mood] || '平静' : '平静';

  const handleSave = () => {
    if (saved) return;

    // Simulate API call
    setTimeout(() => {
      // Add to store (mock)
      const newReport = {
        id: Date.now().toString(),
        type: 'chat',
        date: date,
        title: '觉察报告',
        preview: '基于本次对话，你的情绪整体趋于平稳...',
        isPro: isPro
      };
      // We assume addReport exists or we just simulate
      // addReport(newReport);

      setSaved(true);
      setToastMsg('已保存到历史记录');
      setShowToast(true);
    }, 500);
  };

  const handleUpgrade = () => {
    openUpgradeModal('report_lock');
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] text-slate-200 relative overflow-hidden">
      <Toast visible={showToast} message={toastMsg} onClose={() => setShowToast(false)} />

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#121212]/50 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">觉察报告</h1>
              <Badge variant="outline" className={`${isPro ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' : 'border-slate-500/50 text-slate-400 bg-slate-500/10'}`}>
                {isPro ? '深度版' : '基础版'}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">生成于 {date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'chat' && !saved && (
            <Button variant="ghost" size="sm" onClick={handleSave} className="text-slate-400 hover:text-white hidden md:flex">
              <Save size={16} className="mr-2" /> 保存到历史
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">

        {/* Dynamic Report Content (if available) */}
        {reportContent ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prose prose-invert prose-slate max-w-none"
          >
            <div className="space-y-6 text-slate-300 leading-relaxed">
              {/* Render the markdown content as formatted text */}
              {reportContent.split('\n\n').map((paragraph, idx) => {
                // Handle headers
                if (paragraph.startsWith('# ')) {
                  return (
                    <h2 key={idx} className="text-2xl font-bold text-white mt-8 mb-4">
                      {paragraph.replace('# ', '')}
                    </h2>
                  );
                }
                if (paragraph.startsWith('## ')) {
                  return (
                    <h3 key={idx} className="text-xl font-semibold text-white mt-6 mb-3">
                      {paragraph.replace('## ', '')}
                    </h3>
                  );
                }
                if (paragraph.startsWith('### ')) {
                  return (
                    <h4 key={idx} className="text-lg font-medium text-white mt-4 mb-2">
                      {paragraph.replace('### ', '')}
                    </h4>
                  );
                }
                // Handle bullet points
                if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
                  const items = paragraph.split('\n').filter(line => line.trim().startsWith('- '));
                  return (
                    <ul key={idx} className="list-disc list-inside space-y-2 ml-4">
                      {items.map((item, itemIdx) => (
                        <li key={itemIdx} className="text-slate-300">
                          {item.replace('- ', '')}
                        </li>
                      ))}
                    </ul>
                  );
                }
                // Regular paragraphs
                if (paragraph.trim()) {
                  return (
                    <p key={idx} className="text-slate-300 leading-relaxed">
                      {paragraph}
                    </p>
                  );
                }
                return null;
              })}
            </div>
          </motion.div>
        ) : (
          // Fallback to static content if no dynamic report
          <>

        {/* Top Section: Main Card + Intensity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-violet-900/40 to-slate-900/40 border border-violet-500/20 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-violet-500/5 group-hover:bg-violet-500/10 transition-colors" />
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-white mb-3">当前主情绪：{currentMood}</h3>
              <p className="text-slate-300 leading-relaxed font-light mb-6">
                基于本次对话，你的情绪整体趋于平稳。这种状态表明你对自己当下的处境有着清晰的认知，并且能够以一种客观的视角来审视周遭发生的一切。
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                <CheckCircle2 size={14} /> 已完成分析
              </div>
            </div>
          </motion.div>

          {/* Intensity Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/5 flex flex-col items-center justify-center text-center relative hover:border-violet-500/20 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center mb-4 border border-orange-500/20">
              <Zap size={24} />
            </div>
            <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">情绪强度</h4>
            <div className="text-3xl font-bold text-white mb-2">中等</div>
            <p className="text-xs text-slate-500">情绪波动处于可管理范围内。</p>
          </motion.div>
        </div>

        {/* Free User Upgrade Prompt (Visible if not Pro) */}
        {!isPro && mode === 'chat' && (
           <motion.div
             initial={{ opacity: 0, scale: 0.98 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.2 }}
             className="p-1 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600"
           >
             <div className="bg-[#121212] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-violet-500/20 rounded-lg text-violet-300">
                   <Sparkles size={20} />
                 </div>
                 <div>
                   <h4 className="text-white font-bold">升级至深度版</h4>
                   <p className="text-xs text-slate-400">解锁更完整的报告与长期情绪回顾</p>
                 </div>
               </div>
               <Button onClick={handleUpgrade} className="bg-white text-black hover:bg-slate-200 whitespace-nowrap">
                 立即升级
               </Button>
             </div>
           </motion.div>
        )}

        {/* Key Insights */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Brain size={18} className="text-violet-500" /> 关键洞察
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "你在面对挑战时展现了韧性",
              "你在反复寻找更清晰的方向",
              "你的情绪表达正在变得更丰富",
              "自我关怀可能是接下来值得练习的重点"
            ].map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + (idx * 0.1) }}
                className="p-4 bg-[#0a0a0a] rounded-xl border border-white/5 flex gap-3 hover:border-white/10 transition-colors"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center text-xs font-bold border border-violet-500/20 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-slate-300 text-sm leading-relaxed">{insight}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Deep Content (Locked/Unlocked) */}
        <div>
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <Lightbulb size={18} className="text-amber-500" /> 深度内容
             </h3>
             {!isPro && <Lock size={14} className="text-slate-500" />}
           </div>

           {!isPro ? (
             <div className="relative p-8 rounded-2xl border border-white/5 bg-[#0a0a0a] overflow-hidden text-center">
                {/* Blur Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0a0a] z-10" />
                <div className="filter blur-sm select-none opacity-30 pointer-events-none grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="h-32 bg-white/5 rounded-xl"></div>
                   <div className="h-32 bg-white/5 rounded-xl"></div>
                </div>

                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                   <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 backdrop-blur-md">
                     <Lock size={20} className="text-slate-400" />
                   </div>
                   <h4 className="text-white font-bold mb-1">深度内容已锁定</h4>
                   <p className="text-sm text-slate-500 mb-6">开通深度版后可查看内在角色卡片与建议卡片</p>
                   <Button onClick={handleUpgrade} className="bg-violet-600 hover:bg-violet-500 text-white">
                     升级至深度版
                   </Button>
                </div>
             </div>
           ) : (
             <div className="space-y-6">
                {/* Inner Roles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                     <div className="flex items-center gap-3 mb-3">
                       <User size={18} className="text-indigo-400" />
                       <h4 className="font-semibold text-indigo-100">观察者</h4>
                     </div>
                     <p className="text-sm text-indigo-200/70">你能够抽离出当下的情绪风暴，站在旁观者的角度分析局势。</p>
                  </div>
                  <div className="p-5 rounded-xl bg-rose-950/20 border border-rose-500/20">
                     <div className="flex items-center gap-3 mb-3">
                       <User size={18} className="text-rose-400" />
                       <h4 className="font-semibold text-rose-100">批判者</h4>
                     </div>
                     <p className="text-sm text-rose-200/70">内心深处有一个声音在不断审视你的决定，试图规避潜在风险。</p>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/10">
                      <h5 className="text-slate-200 font-medium mb-2">行动建议 1</h5>
                      <p className="text-sm text-slate-400">尝试记录每天的“微小成就”，对抗批判者的声音。</p>
                   </div>
                   <div className="p-4 rounded-xl bg-[#0a0a0a] border border-white/10">
                      <h5 className="text-slate-200 font-medium mb-2">行动建议 2</h5>
                      <p className="text-sm text-slate-400">在感到焦虑时，进行 3 分钟的箱式呼吸练习。</p>
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Mobile Save Button (Fixed at bottom or inline) */}
        {mode === 'chat' && !saved && (
           <Button variant="outline" onClick={handleSave} className="w-full md:hidden border-white/10 text-slate-300">
             <Save size={16} className="mr-2" /> 保存到历史
           </Button>
        )}
          </>
        )}
      </div>
    </div>
  );
};

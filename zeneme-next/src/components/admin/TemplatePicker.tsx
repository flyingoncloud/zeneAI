import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useAdminStore, TEMPLATE_INFO, TemplateType } from '@/hooks/useAdminStore';
import { motion, AnimatePresence } from 'motion/react';

export const TemplatePicker: React.FC = () => {
  const { isTemplatePickerOpen, setTemplatePickerOpen, addQuestion, setEditingQuestionId, setCurrentView, canAddQuestion } = useAdminStore();

  const handleSelect = (t: TemplateType) => {
    if (!canAddQuestion) return;
    const newQ = addQuestion(t);
    setEditingQuestionId(newQ.id);
    setCurrentView('editor');
    setTemplatePickerOpen(false);
  };

  if (!isTemplatePickerOpen) return null;

  const templates = Object.entries(TEMPLATE_INFO) as [TemplateType, typeof TEMPLATE_INFO[TemplateType]][];

  const gradients: Record<TemplateType, string> = {
    F1: 'from-violet-500/20 to-purple-500/10',
    F2: 'from-blue-500/20 to-cyan-500/10',
    F3: 'from-indigo-500/20 to-blue-500/10',
    F4: 'from-fuchsia-500/20 to-pink-500/10',
    F5: 'from-emerald-500/20 to-teal-500/10',
    F6: 'from-amber-500/20 to-orange-500/10',
    F7: 'from-cyan-500/20 to-sky-500/10',
    F8: 'from-rose-500/20 to-red-500/10',
  };

  const borderColors: Record<TemplateType, string> = {
    F1: 'hover:border-violet-500/40',
    F2: 'hover:border-blue-500/40',
    F3: 'hover:border-indigo-500/40',
    F4: 'hover:border-fuchsia-500/40',
    F5: 'hover:border-emerald-500/40',
    F6: 'hover:border-amber-500/40',
    F7: 'hover:border-cyan-500/40',
    F8: 'hover:border-rose-500/40',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={() => setTemplatePickerOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-[#1A1B23] border border-white/[0.08] rounded-2xl w-full max-w-[840px] max-h-[85vh] overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
            <div>
              <h2 className="text-lg text-white">选择模板</h2>
              <p className="text-xs text-slate-500 mt-0.5">选择一个题目模板以创建新题目</p>
            </div>
            <button onClick={() => setTemplatePickerOpen(false)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-72px)]">
            <div className="grid grid-cols-2 gap-4">
              {templates.map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleSelect(key)}
                  className={`group text-left p-5 rounded-xl bg-gradient-to-br ${gradients[key]} border border-white/[0.06] ${borderColors[key]} transition-all hover:shadow-lg cursor-pointer`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/[0.06]">{key}</span>
                          <span className="text-sm text-white">{info.name}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all mt-1" />
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{info.desc}</p>
                  <p className="text-[11px] text-slate-500">可编辑字段：{info.fields}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

import React, { useState } from 'react';
import { useAdminStore, TEMPLATE_INFO, TemplateType } from '@/hooks/useAdminStore';
import { ArrowRight, Search, Layers } from 'lucide-react';

export const TemplateLibrary: React.FC = () => {
  const { addQuestion, setEditingQuestionId, setCurrentView, canAddQuestion, questions } = useAdminStore();
  const [search, setSearch] = useState('');

  const templates = (Object.entries(TEMPLATE_INFO) as [TemplateType, typeof TEMPLATE_INFO[TemplateType]][]).filter(
    ([key, info]) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return key.toLowerCase().includes(s) || info.name.toLowerCase().includes(s) || info.desc.toLowerCase().includes(s);
    }
  );

  const handleUse = (t: TemplateType) => {
    if (!canAddQuestion) return;
    const newQ = addQuestion(t);
    setEditingQuestionId(newQ.id);
    setCurrentView('editor');
  };

  const getUsageCount = (t: TemplateType) => questions.filter(q => q.template === t).length;

  const gradients: Record<TemplateType, string> = {
    F1: 'from-violet-500/20 to-purple-600/10',
    F2: 'from-blue-500/20 to-cyan-600/10',
    F3: 'from-indigo-500/20 to-blue-600/10',
    F4: 'from-fuchsia-500/20 to-pink-600/10',
    F5: 'from-emerald-500/20 to-teal-600/10',
    F6: 'from-amber-500/20 to-orange-600/10',
    F7: 'from-cyan-500/20 to-sky-600/10',
    F8: 'from-rose-500/20 to-red-600/10',
  };

  const accentColors: Record<TemplateType, string> = {
    F1: 'border-violet-500/30 hover:border-violet-400/50',
    F2: 'border-blue-500/30 hover:border-blue-400/50',
    F3: 'border-indigo-500/30 hover:border-indigo-400/50',
    F4: 'border-fuchsia-500/30 hover:border-fuchsia-400/50',
    F5: 'border-emerald-500/30 hover:border-emerald-400/50',
    F6: 'border-amber-500/30 hover:border-amber-400/50',
    F7: 'border-cyan-500/30 hover:border-cyan-400/50',
    F8: 'border-rose-500/30 hover:border-rose-400/50',
  };

  const previewBgs: Record<TemplateType, React.ReactNode> = {
    F1: (
      <div className="flex items-center justify-between gap-1.5 px-2">
        {[1,2,3,4,5].map(n => (
          <div key={n} className={`flex-1 h-6 rounded-md border border-violet-500/20 flex items-center justify-center text-[9px] text-violet-300/40 ${n===3?'bg-violet-500/20':''}`}>{n}</div>
        ))}
      </div>
    ),
    F2: (
      <div className="space-y-1.5 px-2">
        {['A','B','C'].map((l,i) => (
          <div key={l} className={`h-5 rounded-md border flex items-center px-2 text-[9px] ${i===0?'border-blue-500/30 bg-blue-500/10 text-blue-300/60':'border-white/5 text-slate-600'}`}>{l}</div>
        ))}
      </div>
    ),
    F3: (
      <div className="px-2 space-y-1.5">
        <div className="h-10 rounded-md bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center text-[9px] text-indigo-300/40">🖼 Image</div>
        <div className="h-4 rounded-md border border-white/5 bg-white/[0.02]" />
        <div className="h-4 rounded-md border border-white/5 bg-white/[0.02]" />
      </div>
    ),
    F4: (
      <div className="grid grid-cols-2 gap-1 px-2">
        {['A','B','C','D'].map(l => (
          <div key={l} className="h-8 rounded-md bg-fuchsia-500/8 border border-fuchsia-500/15 flex items-center justify-center text-[9px] text-fuchsia-300/40">{l}</div>
        ))}
      </div>
    ),
    F5: (
      <div className="grid grid-cols-3 gap-1 px-2">
        {[1,2,3,4,5,6].map(n => (
          <div key={n} className="h-6 rounded-md bg-emerald-500/8 border border-emerald-500/15" />
        ))}
      </div>
    ),
    F6: (
      <div className="space-y-1 px-2">
        {[1,2,3].map(n => (
          <div key={n} className="flex items-center gap-1.5">
            <span className="text-[8px] text-amber-400/40 w-3">{n}</span>
            <div className="flex-1 h-4 rounded-md border border-amber-500/15 bg-amber-500/5" />
          </div>
        ))}
      </div>
    ),
    F7: (
      <div className="flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border border-dashed border-cyan-500/20 flex items-center justify-center relative">
          <div className="w-2 h-2 rounded-full bg-cyan-400/40" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-px text-[8px] text-cyan-400/30">N</div>
        </div>
      </div>
    ),
    F8: (
      <div className="space-y-1.5 px-2">
        <div className="h-10 rounded-md bg-rose-500/8 border border-rose-500/15 flex items-center justify-center text-[9px] text-rose-300/40">▶ Video</div>
        <div className="h-4 rounded-md border border-white/5 bg-white/[0.02]" />
      </div>
    ),
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl text-white flex items-center gap-2"><Layers size={20} className="text-violet-400" /> 模板库</h1>
            <p className="text-xs text-slate-500 mt-1">8 种内置题目模板，选择后自动创建题目骨架</p>
          </div>
        </div>
        <div className="relative max-w-[320px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索模板…"
            className="w-full h-9 pl-9 pr-4 bg-[#13141A] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-2 gap-5">
          {templates.map(([key, info]) => (
            <div
              key={key}
              className={`group relative bg-gradient-to-br ${gradients[key]} border ${accentColors[key]} rounded-2xl overflow-hidden transition-all hover:shadow-lg`}
            >
              {/* Preview Area */}
              <div className="p-5 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{info.icon}</span>
                    <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/[0.06]">{key}</span>
                  </div>
                  <span className="text-[10px] text-slate-600">{getUsageCount(key)} 题使用</span>
                </div>
                <h3 className="text-sm text-white mb-1">{info.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{info.desc}</p>

                {/* Mini Preview */}
                <div className="bg-black/20 rounded-xl p-3 border border-white/[0.04] min-h-[80px] flex flex-col justify-center">
                  {previewBgs[key]}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 pb-4 pt-2 flex items-center justify-between border-t border-white/[0.04]">
                <p className="text-[10px] text-slate-600 max-w-[60%] truncate">字段：{info.fields}</p>
                <button
                  onClick={() => handleUse(key)}
                  disabled={!canAddQuestion}
                  className="h-7 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-[11px] text-slate-300 hover:bg-white/10 hover:text-white flex items-center gap-1.5 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  Use <ArrowRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

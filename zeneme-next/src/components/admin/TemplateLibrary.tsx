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

  // 1. 重新定义更清新、高亮度的配色（浅色模式专用）
  const accentColors: Record<TemplateType, { bg: string, text: string, border: string, lightBg: string }> = {
    F1: { bg: 'bg-[#7C3AED]', text: 'text-[#7C3AED]', border: 'border-violet-100', lightBg: 'bg-violet-50' },
    F2: { bg: 'bg-[#2563EB]', text: 'text-[#2563EB]', border: 'border-blue-100', lightBg: 'bg-blue-50' },
    F3: { bg: 'bg-[#4F46E5]', text: 'text-[#4F46E5]', border: 'border-indigo-100', lightBg: 'bg-indigo-50' },
    F4: { bg: 'bg-[#DB2777]', text: 'text-[#DB2777]', border: 'border-fuchsia-100', lightBg: 'bg-fuchsia-50' },
    F5: { bg: 'bg-[#059669]', text: 'text-[#059669]', border: 'border-emerald-100', lightBg: 'bg-emerald-50' },
    F6: { bg: 'bg-[#D97706]', text: 'text-[#D97706]', border: 'border-amber-100', lightBg: 'bg-amber-50' },
    F7: { bg: 'bg-[#0891B2]', text: 'text-[#0891B2]', border: 'border-cyan-100', lightBg: 'bg-cyan-50' },
    F8: { bg: 'bg-[#E11D48]', text: 'text-[#E11D48]', border: 'border-rose-100', lightBg: 'bg-rose-50' },
    F9: { bg: 'bg-[#8B5CF6]', text: 'text-[#8B5CF6]', border: 'border-purple-100', lightBg: 'bg-purple-50' },
  };

  const previewBgs: Record<TemplateType, React.ReactNode> = {
    F1: (
      <div className="flex items-center justify-between gap-1.5 px-2">
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} className={`flex-1 h-7 rounded-lg border flex items-center justify-center text-[10px] font-bold ${n === 3 ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200' : 'bg-white border-gray-100 text-gray-300'}`}>{n}</div>
        ))}
      </div>
    ),
    F2: (
      <div className="space-y-1.5 px-2">
        {['A', 'B', 'C'].map((l, i) => (
          <div key={l} className={`h-6 rounded-lg border flex items-center px-3 text-[10px] font-bold ${i === 0 ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 bg-white text-gray-300'}`}>{l}</div>
        ))}
      </div>
    ),
    F3: (
      <div className="px-2 space-y-1.5">
        <div className="h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] text-indigo-400 font-bold">🖼 Image Area</div>
        <div className="h-4 w-2/3 rounded-full bg-gray-50 border border-gray-100" />
      </div>
    ),
    F4: (
      <div className="grid grid-cols-2 gap-2 px-2">
        {['A', 'B', 'C', 'D'].map(l => (
          <div key={l} className="h-9 rounded-xl bg-fuchsia-50 border border-fuchsia-100 flex items-center justify-center text-[10px] text-fuchsia-400 font-bold shadow-sm">{l}</div>
        ))}
      </div>
    ),
    F5: (
      <div className="grid grid-cols-3 gap-1.5 px-2">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <div key={n} className="h-7 rounded-lg bg-emerald-50 border border-emerald-100 shadow-sm" />
        ))}
      </div>
    ),
    F6: (
      <div className="space-y-1.5 px-2">
        {[1, 2, 3].map(n => (
          <div key={n} className="flex items-center gap-2">
            <span className="text-[10px] font-black text-amber-500 w-3">{n}</span>
            <div className="flex-1 h-5 rounded-lg border border-amber-100 bg-amber-50 shadow-sm" />
          </div>
        ))}
      </div>
    ),
    F7: (
      <div className="flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-cyan-200 flex items-center justify-center relative bg-cyan-50/30">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm" />
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-black text-cyan-400">N</div>
        </div>
      </div>
    ),
    F8: (
      <div className="space-y-2 px-2">
        <div className="h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[10px] text-rose-400 font-bold">▶ Video Player</div>
        <div className="h-4 w-3/4 rounded-full bg-gray-50 border border-gray-100" />
      </div>
    ),
    F9: (
      <div className="px-2">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[8px] text-purple-600 font-bold">Left</span>
          <span className="text-[8px] text-gray-400">vs</span>
          <span className="text-[8px] text-purple-600 font-bold">Right</span>
        </div>
        <div className="flex items-center justify-between gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className={`flex-1 h-7 rounded-lg border flex items-center justify-center text-[10px] font-bold ${n === 3 ? 'bg-gray-100 border-gray-200 text-gray-400' : n < 3 ? 'bg-blue-50 border-blue-200 text-blue-400' : 'bg-purple-50 border-purple-200 text-purple-400'}`}>{n}</div>
          ))}
        </div>
      </div>
    ),
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#F7F8FC]">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl text-[#111827] font-bold flex items-center gap-2">
              <Layers size={22} className="text-violet-600" /> 模板库
            </h1>
            <p className="text-xs text-[#64748B] mt-1">8 种内置题目模板，点击 Use 即可快速创建</p>
          </div>
        </div>
        <div className="relative max-w-[320px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索模板名称或功能…"
            className="w-full h-10 pl-10 pr-4 bg-white border border-[#E6EAF2] rounded-xl text-sm text-[#111827] placeholder:text-[#94A3B8] focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/5 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 mt-2">
        <div className="grid grid-cols-2 gap-6">
          {templates.map(([key, info]) => (
            <div
              key={key}
              className={`group relative bg-white border border-[#E6EAF2] rounded-3xl overflow-hidden transition-all hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl ${accentColors[key].lightBg} flex items-center justify-center text-xl shadow-inner`}>
                      {info.icon}
                    </div>
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${accentColors[key].lightBg} ${accentColors[key].text} border ${accentColors[key].border}`}>
                      {key}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#94A3B8] bg-gray-50 px-2 py-1 rounded-lg">
                    {getUsageCount(key)} 题正在使用
                  </span>
                </div>

                <h3 className="text-[15px] text-[#111827] font-bold mb-1.5 group-hover:text-violet-600 transition-colors">
                  {info.name}
                </h3>
                <p className="text-xs text-[#64748B] mb-5 leading-relaxed h-8 line-clamp-2">
                  {info.desc}
                </p>

                {/* 2. 预览区域：改为更精致的浅色卡片 */}
                <div className="bg-[#F9FAFB] rounded-2xl p-4 border border-[#F1F3F7] min-h-[100px] flex flex-col justify-center shadow-inner">
                  {previewBgs[key]}
                </div>
              </div>

              <div className="px-6 py-4 flex items-center justify-between border-t border-[#F1F3F7] bg-[#FCFDFF]">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-tight mb-0.5">可配置字段</p>
                  <p className="text-[11px] text-[#4B5563] font-medium truncate">{info.fields}</p>
                </div>
                <button
                  onClick={() => handleUse(key)}
                  disabled={!canAddQuestion}
                  className={`ml-4 h-9 px-4 rounded-xl ${accentColors[key].bg} text-black text-xs font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-md shadow-gray-200 disabled:opacity-30 cursor-pointer`}
                >
                  Use <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
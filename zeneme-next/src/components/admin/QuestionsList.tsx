import React, { useState, useMemo } from 'react';
import { useAdminStore, TemplateType, TEMPLATE_INFO } from '@/hooks/useAdminStore';
import {
  Search, Plus, Filter, GripVertical, Edit3, Copy, Trash2, ChevronDown,
  AlertTriangle, X, ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const QuestionsList: React.FC = () => {
  const {
    questions, deleteQuestion, duplicateQuestion, canAddQuestion,
    setEditingQuestionId, setCurrentView, setTemplatePickerOpen,
    sortMode, setSortMode,
  } = useAdminStore();

  const [search, setSearch] = useState('');
  const [filterTemplate, setFilterTemplate] = useState<TemplateType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState('');

  const filtered = useMemo(() => {
    let list = [...questions];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(q => q.stem.toLowerCase().includes(s) || q.internalTitle.toLowerCase().includes(s) || `q${q.id}`.includes(s));
    }
    if (filterTemplate !== 'all') list = list.filter(q => q.template === filterTemplate);
    if (filterStatus !== 'all') list = list.filter(q => q.status === filterStatus);
    if (sortMode === 'id') list.sort((a, b) => a.id - b.id);
    else list.sort((a, b) => a.order - b.order);
    return list;
  }, [questions, search, filterTemplate, filterStatus, sortMode]);

  const handleEdit = (id: number) => {
    setEditingQuestionId(id);
    setCurrentView('editor');
  };

  const handleDuplicate = (id: number) => {
    const dup = duplicateQuestion(id);
    if (dup) {
      setToast(`已复制为 Q${dup.id}（草稿）`);
      setTimeout(() => setToast(''), 2500);
    }
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await deleteQuestion(deleteId);
        setDeleteId(null);
        setToast('已删除，题号已释放');
        setTimeout(() => setToast(''), 2500);
      } catch (error) {
        console.error('Delete failed:', error);
        setToast('删除失败，请重试');
        setTimeout(() => setToast(''), 2500);
      }
    }
  };

  const templateColors: Record<TemplateType, string> = {
    F1: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    F2: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    F3: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    F4: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
    F5: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    F6: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    F7: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    F8: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Limit Banner */}
      <AnimatePresence>
        {!canAddQuestion && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="shrink-0 mx-6 mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl px-5 py-3 flex items-center gap-3"
          >
            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
            <span className="text-sm text-amber-300">已达到题目上限（80），请删除后再新增。</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl text-white">题库管理</h1>
            <p className="text-xs text-slate-500 mt-1">管理内视快测所有题目</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 bg-white/5 border border-white/[0.06] px-3 py-1.5 rounded-lg">
              <span className="text-white">{questions.length}</span>
              <span className="text-slate-600"> / 80</span>
            </span>
            <button
              onClick={() => setTemplatePickerOpen(true)}
              disabled={!canAddQuestion}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm flex items-center gap-2 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
            >
              <Plus size={16} /> 新增题目
            </button>
          </div>
        </div>

        {/* Search + Filters Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[320px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索题号、标题或题干…"
              className="w-full h-9 pl-9 pr-4 bg-[#13141A] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40 transition-colors"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-9 px-3 rounded-lg border text-sm flex items-center gap-2 transition-colors cursor-pointer ${showFilters ? 'bg-violet-500/10 border-violet-500/30 text-violet-300' : 'bg-[#13141A] border-white/[0.06] text-slate-400 hover:text-white hover:border-white/10'}`}
          >
            <Filter size={14} /> 筛选 <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Sort Switch */}
          <div className="flex items-center bg-[#13141A] border border-white/[0.06] rounded-lg overflow-hidden">
            <button
              onClick={() => setSortMode('id')}
              className={`h-9 px-3 text-xs transition-colors cursor-pointer ${sortMode === 'id' ? 'bg-violet-500/15 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              By ID
            </button>
            <button
              onClick={() => setSortMode('custom')}
              className={`h-9 px-3 text-xs transition-colors cursor-pointer ${sortMode === 'custom' ? 'bg-violet-500/15 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">模板:</span>
                  {(['all', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFilterTemplate(f)}
                      className={`px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${filterTemplate === f ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
                    >
                      {f === 'all' ? '全部' : f}
                    </button>
                  ))}
                </div>
                <div className="w-px h-5 bg-white/[0.06]" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">状态:</span>
                  {(['all', 'draft', 'published'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${filterStatus === s ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
                    >
                      {s === 'all' ? '全部' : s === 'draft' ? 'Draft' : 'Published'}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {/* Table Header */}
        <div className="grid gap-4 px-4 py-2.5 text-[11px] text-slate-500 uppercase tracking-wider border-b border-white/[0.04] sticky top-0 bg-[#0F1115] z-10" style={{ gridTemplateColumns: '60px minmax(200px, 1fr) 80px 140px 120px 100px 120px 90px' }}>
          <div>ID</div>
          <div>题目</div>
          <div>模板</div>
          <div>类型</div>
          <div>评分类别</div>
          <div>状态</div>
          <div>更新</div>
          <div className="text-right">操作</div>
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <Search size={40} className="mb-3 opacity-30" />
            <p className="text-sm">暂无匹配结果</p>
          </div>
        ) : (
          <div>
            {filtered.map((q) => (
              <div
                key={q.id}
                className="grid gap-4 px-4 py-2.5 items-center border-b border-white/[0.02] group hover:bg-white/[0.02] transition-colors cursor-pointer"
                style={{ gridTemplateColumns: '60px minmax(200px, 1fr) 80px 140px 120px 100px 120px 90px' }}
                onClick={() => handleEdit(q.id)}
              >
                {/* ID */}
                <div className="text-sm text-white font-medium">
                  Q{q.id}
                </div>

                {/* Title - Single line with truncate */}
                <div className="min-w-0 overflow-hidden">
                  <p className="text-sm text-slate-200 truncate whitespace-nowrap">{q.stem || q.internalTitle}</p>
                </div>

                {/* Template */}
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border whitespace-nowrap ${templateColors[q.template]}`}>
                    {q.template}
                  </span>
                </div>

                {/* Type */}
                <div className="text-sm text-slate-400 truncate whitespace-nowrap">
                  {TEMPLATE_INFO[q.template].name}
                </div>

                {/* Category */}
                <div className="text-xs text-slate-400 truncate whitespace-nowrap" title={q.category || '未设置'}>
                  {q.category ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      {q.category.replace(/能力$/, '')}
                    </span>
                  ) : (
                    <span className="text-slate-600">--</span>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center">
                  {q.status === 'published' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20 whitespace-nowrap">
                      Draft
                    </span>
                  )}
                </div>

                {/* Updated */}
                <div className="text-sm text-slate-500 truncate whitespace-nowrap">{q.updatedAt}</div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleEdit(q.id)} className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-violet-400 transition-colors cursor-pointer" title="编辑">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDuplicate(q.id)} className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-colors cursor-pointer" title="复制">
                    <Copy size={14} />
                  </button>
                  <button onClick={() => setDeleteId(q.id)} className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors cursor-pointer" title="删除">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteId !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1A1B23] border border-white/[0.08] rounded-2xl p-6 w-full max-w-[400px] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg text-white text-center mb-2">确认删除 Q{deleteId}？</h3>
              <p className="text-sm text-slate-400 text-center mb-6">删除后题号 Q{deleteId} 将被释放，可被未来新增题目复用。此操作不可撤销。</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 h-10 rounded-xl border border-white/[0.08] text-sm text-slate-300 hover:bg-white/5 transition-colors cursor-pointer">
                  取消
                </button>
                <button onClick={confirmDelete} className="flex-1 h-10 rounded-xl bg-red-500/20 border border-red-500/30 text-sm text-red-300 hover:bg-red-500/30 transition-colors cursor-pointer">
                  确认删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1A1B23] border border-white/[0.08] rounded-xl px-5 py-3 shadow-2xl flex items-center gap-2"
          >
            <span className="text-sm text-white">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

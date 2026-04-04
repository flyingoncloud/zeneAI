import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAdminStore, TemplateType, TEMPLATE_INFO } from '@/hooks/useAdminStore';
import {
  Search, Plus, Filter, GripVertical, Edit3, Copy, Trash2, ChevronDown,
  AlertTriangle, X, ArrowUpDown, EyeOff, Eye
} from 'lucide-react';
import { getCategoryLabel } from '@/data/categoryHierarchy';
import { motion, AnimatePresence } from 'motion/react';
import { QuestionPreview } from './QuestionPreview';

export const QuestionsList: React.FC = () => {
  const {
    questions, deleteQuestion, duplicateQuestion, canAddQuestion,
    setEditingQuestionId, setCurrentView, setTemplatePickerOpen,
    sortMode, setSortMode, togglePublishQuestion, editingQuestionId,
    currentView,
  } = useAdminStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef(false);

  // Scroll to last edited question when the list view mounts/becomes visible
  useEffect(() => {
    if (currentView === 'questions' && editingQuestionId && !hasScrolledRef.current) {
      hasScrolledRef.current = true;
      setTimeout(() => {
        const row = scrollContainerRef.current?.querySelector(`[data-question-id="${editingQuestionId}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    }
    if (currentView !== 'questions') {
      hasScrolledRef.current = false;
    }
  }, [currentView, editingQuestionId]);

  const [search, setSearch] = useState('');
  const [filterTemplate, setFilterTemplate] = useState<TemplateType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast] = useState('');

  const filtered = useMemo(() => {
    let list = [...questions];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(q => q.stem.toLowerCase().includes(s) || q.internalTitle.toLowerCase().includes(s) || `q${q.id}`.includes(s));
    }
    if (filterTemplate !== 'all') list = list.filter(q => q.template === filterTemplate);
    if (filterStatus !== 'all') list = list.filter(q => q.status === filterStatus);
    if (filterCategory !== 'all') list = list.filter(q => (q.category || '') === filterCategory);
    if (sortMode === 'id') list.sort((a, b) => a.id - b.id);
    else list.sort((a, b) => a.order - b.order);
    return list;
  }, [questions, search, filterTemplate, filterStatus, filterCategory, sortMode]);

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

  // 保留你本地的异步安全删除逻辑
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

  // 使用设计师的浅色主题颜色映射
  const templateColors: Record<TemplateType, string> = {
    F1: 'text-violet-700 bg-violet-50 border-violet-200',
    F2: 'text-blue-700 bg-blue-50 border-blue-200',
    F3: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    F4: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200',
    F5: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    F6: 'text-amber-700 bg-amber-50 border-amber-200',
    F7: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    F8: 'text-rose-700 bg-rose-50 border-rose-200',
    F9: 'text-purple-700 bg-purple-50 border-purple-200',
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Limit Banner */}
      <AnimatePresence>
        {!canAddQuestion && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="shrink-0 mx-6 mt-4 bg-[rgba(245,158,11,0.10)] border border-[rgba(245,158,11,0.30)] rounded-xl px-5 py-3 flex items-center gap-3"
          >
            <AlertTriangle size={18} className="text-[#F59E0B] shrink-0" />
            <span className="text-sm text-[#92400E]">已达到题目上限（80），请删除后再新增。</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="shrink-0 px-3 md:px-6 pt-4 md:pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl text-[#111827]">题库管理</h1>
            <p className="text-xs text-[#6B7280] mt-1">管理内视快测所有题目</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#4B5563] bg-[#F3F5FA] border border-[#E6EAF2] px-3 py-1.5 rounded-lg">
              <span className="text-[#111827]">{questions.length}</span>
              <span className="text-[#9CA3AF]"> / 80</span>
            </span>
            <button
              onClick={() => setShowPreview(true)}
              className="h-9 px-4 rounded-xl border border-[#E6EAF2] text-sm text-[#4B5563] hover:text-[#6D28D9] hover:border-[#6D28D9]/30 hover:bg-[rgba(109,40,217,0.04)] flex items-center gap-2 transition-all cursor-pointer"
            >
              <Eye size={16} /> 预览
            </button>
            <button
              onClick={() => setTemplatePickerOpen(true)}
              disabled={!canAddQuestion}
              className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#6D28D9] to-indigo-600 text-white text-sm flex items-center gap-2 hover:from-[#5B21B6] hover:to-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[rgba(109,40,217,0.15)] cursor-pointer"
            >
              <Plus size={16} /> 新增题目
            </button>
          </div>
        </div>

        {/* Search + Filters Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[320px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索题号、标题或题干…"
              className="w-full h-9 pl-9 pr-4 bg-[#F3F5FA] border border-[#E6EAF2] rounded-lg text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`h-9 px-3 rounded-lg border text-sm flex items-center gap-2 transition-colors cursor-pointer ${showFilters ? 'bg-[rgba(109,40,217,0.08)] border-[rgba(109,40,217,0.28)] text-[#6D28D9]' : 'bg-white border-[#E6EAF2] text-[#4B5563] hover:text-[#111827] hover:border-[#D8DEE9]'}`}
          >
            <Filter size={14} /> 筛选 <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Sort Switch */}
          <div className="flex items-center bg-white border border-[#E6EAF2] rounded-lg overflow-hidden">
            <button
              onClick={() => setSortMode('id')}
              className={`h-9 px-3 text-xs transition-colors cursor-pointer ${sortMode === 'id' ? 'bg-[rgba(109,40,217,0.08)] text-[#6D28D9]' : 'text-[#6B7280] hover:text-[#111827]'}`}
            >
              By ID
            </button>
            <button
              onClick={() => setSortMode('custom')}
              className={`h-9 px-3 text-xs transition-colors cursor-pointer ${sortMode === 'custom' ? 'bg-[rgba(109,40,217,0.08)] text-[#6D28D9]' : 'text-[#6B7280] hover:text-[#111827]'}`}
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
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#E6EAF2]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B7280]">状态:</span>
                  {(['all', 'draft', 'published'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${filterStatus === s ? 'bg-[rgba(109,40,217,0.08)] text-[#6D28D9] border border-[rgba(109,40,217,0.28)]' : 'text-[#6B7280] hover:text-[#111827] border border-transparent'}`}
                    >
                      {s === 'all' ? '全部' : s === 'draft' ? 'Draft' : 'Published'}
                    </button>
                  ))}
                </div>
                <div className="w-px h-5 bg-[#E6EAF2]" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-[#6B7280]">类别:</span>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="h-8 px-3 bg-white border border-[#E6EAF2] rounded-lg text-xs text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all cursor-pointer"
                  >
                    <option value="all">全部</option>
                    {Array.from(new Set(questions.map(q => q.category).filter((c): c is string => Boolean(c)))).sort().map(c => (
                      <option key={c} value={c}>{getCategoryLabel(c)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto overflow-x-auto px-3 md:px-6 pb-6" ref={scrollContainerRef}>
        <div className="bg-white border border-[#E6EAF2] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(17,24,39,0.06),0_1px_2px_rgba(17,24,39,0.04)] overflow-x-auto">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_60px_minmax(200px,1.5fr)_80px_120px_100px_80px_100px_100px] gap-4 px-4 py-2.5 text-xs text-[#6B7280] uppercase tracking-wider border-b border-[#E6EAF2] bg-[#F3F5FA] min-w-[900px]">
            <div></div>
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
            <div className="flex flex-col items-center justify-center py-20 text-[#9CA3AF]">
              <Search size={40} className="mb-3 opacity-30" />
              <p className="text-sm">暂无匹配结果</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E6EAF2]">
              {filtered.map((q) => (
                <div
                  key={q.id}
                  data-question-id={q.id}
                  className={`grid grid-cols-[40px_60px_minmax(200px,1.5fr)_80px_120px_100px_80px_100px_100px] gap-4 px-4 py-3.5 items-center group hover:bg-[#EEF2FF] transition-colors cursor-pointer min-w-[900px] ${editingQuestionId === q.id ? 'bg-[#EEF2FF] ring-1 ring-[#6D28D9]/20' : ''}`}
                  onClick={() => handleEdit(q.id)}
                >
                  {/* Drag */}
                  <div className={`flex justify-center ${sortMode === 'custom' ? 'opacity-30 group-hover:opacity-60' : 'opacity-0'} transition-opacity`}>
                    <GripVertical size={14} className="text-[#9CA3AF]" />
                  </div>

                  {/* ID */}
                  <div className="text-sm text-[#111827]">
                    Q{q.id}
                  </div>

                  {/* Title */}
                  <div className="min-w-0">
                    <p className="text-sm text-[#111827] truncate">{q.stem || q.internalTitle}</p>
                    <p className="text-[11px] text-[#9CA3AF] truncate mt-0.5">{q.internalTitle}</p>
                  </div>

                  {/* Template */}
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] border ${templateColors[q.template]}`}>
                      {q.template}
                    </span>
                  </div>

                  {/* Type */}
                  <div className="text-xs text-[#4B5563]">
                    {TEMPLATE_INFO[q.template].name}
                  </div>
                  {/* Category */}
                  <div className="text-xs text-slate-400 truncate whitespace-nowrap" title={q.category || '未设置'}>

                  {q.category ? (

                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      {getCategoryLabel(q.category)}
                    </span>

                  ) : (

                    <span className="text-[#9CA3AF]">--</span>

                  )}

                  </div>
                  {/* Status */}
                  <div>
                    {q.status === 'published' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[rgba(22,163,74,0.10)] text-[#16A34A] border border-[rgba(22,163,74,0.20)]">
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#F3F5FA] text-[#6B7280] border border-[#E6EAF2]">
                        Draft
                      </span>
                    )}
                  </div>

                  {/* Updated */}
                  <div className="text-xs text-[#6B7280]">{q.updatedAt}</div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={async () => {
                        try {
                          await togglePublishQuestion(q.id);
                          setToast(q.status === 'published' ? `Q${q.id} 已取消发布` : `Q${q.id} 已发布`);
                          setTimeout(() => setToast(''), 2500);
                        } catch {
                          setToast('操作失败，请重试');
                          setTimeout(() => setToast(''), 2500);
                        }
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                        q.status === 'published'
                          ? 'hover:bg-[rgba(245,158,11,0.08)] text-[#6B7280] hover:text-[#F59E0B]'
                          : 'hover:bg-[rgba(22,163,74,0.08)] text-[#6B7280] hover:text-[#16A34A]'
                      }`}
                      title={q.status === 'published' ? '取消发布' : '发布'}
                    >
                      {q.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => handleEdit(q.id)} className="w-7 h-7 rounded-lg hover:bg-[rgba(109,40,217,0.08)] flex items-center justify-center text-[#6B7280] hover:text-[#6D28D9] transition-colors cursor-pointer" title="编辑">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDuplicate(q.id)} className="w-7 h-7 rounded-lg hover:bg-[rgba(37,99,235,0.08)] flex items-center justify-center text-[#6B7280] hover:text-[#2563EB] transition-colors cursor-pointer" title="复制">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => setDeleteId(q.id)} className="w-7 h-7 rounded-lg hover:bg-[rgba(239,68,68,0.08)] flex items-center justify-center text-[#6B7280] hover:text-[#EF4444] transition-colors cursor-pointer" title="删除">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteId !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#E6EAF2] rounded-2xl p-6 w-full max-w-[400px] shadow-[0_16px_40px_rgba(17,24,39,0.12)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-xl bg-[rgba(239,68,68,0.10)] flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle size={24} className="text-[#EF4444]" />
              </div>
              <h3 className="text-lg text-[#111827] text-center mb-2">确认删除 Q{deleteId}？</h3>
              <p className="text-sm text-[#4B5563] text-center mb-6">删除后题号 Q{deleteId} 将被释放，可被未来新增题目复用。此操作不可撤销。</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 h-10 rounded-xl border border-[#E6EAF2] text-sm text-[#4B5563] hover:bg-[#F3F5FA] transition-colors cursor-pointer">
                  取消
                </button>
                <button onClick={confirmDelete} className="flex-1 h-10 rounded-xl bg-[rgba(239,68,68,0.10)] border border-[rgba(239,68,68,0.20)] text-sm text-[#EF4444] hover:bg-[rgba(239,68,68,0.16)] transition-colors cursor-pointer">
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
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-white border border-[#E6EAF2] rounded-xl px-5 py-3 shadow-[0_16px_40px_rgba(17,24,39,0.12)] flex items-center gap-2"
          >
            <span className="text-sm text-[#111827]">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Questionnaire Preview */}
      <QuestionPreview isOpen={showPreview} onClose={() => setShowPreview(false)} />
    </div>
  );
};
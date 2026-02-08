import React, { useState, useEffect } from 'react';
import { FileText, ChevronRight, Clock, Trash2, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { useAuthStore } from '../../../hooks/useAuthStore';
import { 
  ConfirmDialog, 
  Toast, 
  ListSkeleton, 
  EmptyState 
} from '../../shared/GlobalFeedback';

export const HistoryReports: React.FC = () => {
  const { t, reports, deleteReport, setSelectedReportId, setCurrentView } = useZenemeStore();
  const { status } = useAuthStore();
  
  // States
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Filter State
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulate initial loading
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteReport(deleteId);
      setDeleteId(null);
      setShowToast(true);
    }
  };

  const handleReportClick = (id: string) => {
    setSelectedReportId(id);
    setCurrentView('report-detail');
  };

  const handleLogin = () => {
    window.dispatchEvent(new CustomEvent('zeneme:navigate-auth'));
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'sketch': return <FileText className="text-violet-400" size={20} />;
      case 'test': return <FileText className="text-indigo-400" size={20} />;
      case 'brief': return <FileText className="text-cyan-400" size={20} />;
      case 'deep': return <FileText className="text-amber-400" size={20} />;
      default: return <FileText className="text-emerald-400" size={20} />;
    }
  };

  // Guest State Interception
  if (status === 'guest') {
    return (
        <div className="flex flex-col h-full w-full pt-[80px] overflow-hidden items-center justify-center px-6">
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                   <Lock className="w-8 h-8 text-violet-300" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                    登录以查看历史记录
                </h2>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    游客模式下数据仅临时保存。登录账号后，您可以查看完整的训练历史和分析报告。
                </p>
                <Button 
                    onClick={handleLogin}
                    className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 font-medium"
                >
                    立即登录 / 注册
                    <ArrowRight className="ml-2 w-4 h-4 opacity-80" />
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#2C2C2C] overflow-hidden relative">
      
      {/* Toast & Dialogs */}
      <Toast visible={showToast} message={t.modals.success} onClose={() => setShowToast(false)} />
      <ConfirmDialog 
        open={!!deleteId}
        title={t.modals.deleteItemTitle}
        desc={t.modals.deleteItemDesc}
        cancelText={t.common.cancel}
        confirmText={t.modals.delete}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        isDestructive
      />

      {/* 
        Main Layout Structure - Full Width, Left Aligned
        - pt-[80px]: Clears the global fixed TopBar (Back button)
        - px-6 md:px-8: Standard horizontal padding (24px-32px)
      */}
      <div className="flex flex-col h-full w-full pt-[80px] overflow-hidden">
        
        {/* 
            Header Section
            - Left aligned Title/Subtitle
            - Right aligned Tabs (Desktop) / Below (Mobile)
            - px-6 md:px-8 matches content
        */}
        <div className="shrink-0 px-6 md:px-8 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            
            {/* Left: Title Area */}
            <div className="flex flex-col items-start gap-1">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide text-left">
                    {t.history.title}
                </h1>
                <p className="text-slate-400 text-sm opacity-80 max-w-lg text-left">
                    {t.history.subtitle}
                </p>
            </div>
            
            {/* Right: Filter Tabs */}
            <div className="flex bg-slate-900/60 p-1 rounded-lg border border-white/5 backdrop-blur-sm self-start md:self-auto">
                {['all', 'brief', 'deep'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${filter === f ? 'bg-violet-500/20 text-violet-200 shadow-sm ring-1 ring-violet-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                    >
                        {f === 'all' ? t.history.filters.all : (f === 'brief' ? '简要版' : '深度版')}
                    </button>
                ))}
            </div>
        </div>

        {/* 
            Scrollable List Area
            - Full width container
            - px-6 md:px-8 matches header
            - pb-10 for bottom clearance
        */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 pb-10 w-full">
            {loading ? (
                <ListSkeleton />
            ) : reports.length === 0 ? (
                <div className="h-full flex flex-col items-start justify-center">
                    <div className="w-full flex justify-center">
                         <EmptyState 
                            title={t.modals.emptyHistory} 
                            desc={t.history.emptyDesc} 
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-3 w-full">
                    {reports
                    .filter(r => filter === 'all' || r.type === filter)
                    .map((report) => (
                    <div
                        key={report.id}
                        onClick={() => handleReportClick(report.id)}
                        className="group relative flex items-center gap-4 p-5 rounded-2xl bg-[#121212]/40 border border-white/5 hover:bg-[#1a1a1a]/60 hover:border-violet-500/30 transition-all cursor-pointer backdrop-blur-sm w-full"
                    >
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/5 to-white/0 border border-white/5 flex items-center justify-center shrink-0 group-hover:from-violet-500/20 group-hover:to-indigo-500/20 transition-all shadow-inner">
                            {getIcon(report.type)}
                        </div>
                        
                        {/* Text Content */}
                        <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-white font-medium truncate group-hover:text-violet-200 transition-colors">{report.title}</h3>
                                <span className="text-xs text-slate-500 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                <Clock size={10} /> {report.date}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 truncate group-hover:text-slate-300">{report.preview}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-slate-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0"
                                onClick={(e) => handleDelete(report.id, e)}
                            >
                                <Trash2 size={16} />
                            </Button>
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-500 group-hover:bg-violet-500/20 group-hover:text-violet-300 transition-all">
                                    <ChevronRight size={16} />
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
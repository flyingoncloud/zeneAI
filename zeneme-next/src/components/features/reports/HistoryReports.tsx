import React, { useState, useEffect } from 'react';
import { Calendar, FileText, ChevronRight, Clock, Trash2, Filter, Search } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { ReportDetail } from './ReportDetail';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { 
  ConfirmDialog, 
  Toast, 
  ListSkeleton, 
  EmptyState, 
  ErrorState 
} from '../../shared/GlobalFeedback';

export const HistoryReports: React.FC = () => {
  const { t, reports, deleteReport } = useZenemeStore();
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  
  // States
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Filter State
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulate initial loading
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

  const getIcon = (type: string) => {
    switch(type) {
      case 'sketch': return <FileText className="text-violet-400" size={20} />;
      case 'test': return <FileText className="text-indigo-400" size={20} />;
      default: return <FileText className="text-emerald-400" size={20} />;
    }
  };

  // Find selected report to pass date/details if needed
  const selectedReport = reports.find(r => r.id === selectedReportId);

  if (selectedReportId && selectedReport) {
    return (
      <ReportDetail 
        onBack={() => setSelectedReportId(null)} 
        date={selectedReport.date}
        mode="history"
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent p-6 md:p-12 overflow-hidden">
      
      <Toast visible={showToast} message={t.common.completed} onClose={() => setShowToast(false)} />
      
      <ConfirmDialog 
        open={!!deleteId}
        title={t.modals.deleteTitle}
        desc={t.modals.deleteDesc}
        cancelText={t.common.cancel}
        confirmText={t.common.confirm}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        isDestructive
      />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t.history.title}</h1>
          <p className="text-slate-400">{t.history.subtitle}</p>
        </div>
        
        {/* Simple Filter */}
        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/5">
           {['all', 'sketch', 'test', 'chat'].map(f => (
             <button
               key={f}
               onClick={() => setFilter(f)}
               className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${filter === f ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
               {f === 'all' ? t.history.filters.all : (f === 'sketch' ? '涂鸦' : (f === 'test' ? '测试' : '对话'))}
             </button>
           ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        
        {loading && <ListSkeleton />}
        
        {!loading && reports.length === 0 && (
          <EmptyState 
            title={t.history.emptyTitle} 
            desc={t.history.emptyDesc} 
          />
        )}

        {!loading && reports.length > 0 && (
          <div className="space-y-4">
            {reports
              .filter(r => filter === 'all' || r.type === filter)
              .map((report) => (
              <div
                key={report.id}
                onClick={() => setSelectedReportId(report.id)}
                className="group relative flex items-center gap-4 p-5 rounded-xl bg-[#121212]/60 border border-white/5 hover:bg-[#1a1a1a] hover:border-white/10 transition-all cursor-pointer backdrop-blur-sm"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                  {getIcon(report.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-medium truncate">{report.title}</h3>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={10} /> {report.date}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 truncate">{report.preview}</p>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button 
                     variant="ghost" 
                     size="icon" 
                     className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                     onClick={(e) => handleDelete(report.id, e)}
                   >
                     <Trash2 size={16} />
                   </Button>
                   <ChevronRight className="text-slate-600" size={18} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

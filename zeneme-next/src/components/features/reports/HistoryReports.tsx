import React, { useState, useEffect } from 'react';
import { FileText, ChevronRight, Clock, Trash2, Lock, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { useAuthStore } from '../../../hooks/useAuthStore';
import { DK } from '../../../styles/darktheme';
import { 
  ConfirmDialog, 
  Toast, 
  ListSkeleton, 
  EmptyState 
} from '../../shared/GlobalFeedback';
/* eslint-disable @typescript-eslint/no-explicit-any */

export const HistoryReports: React.FC = () => {
  // 【临时处理】使用 as any 绕过当前 store 类型缺失的问题，保证 UI 能跑起来
  const store: any = useZenemeStore();
  const { t, reports = [], deleteReport, setSelectedReportId, setCurrentView } = store;
  const { status } = useAuthStore();
  
  // States
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Filter State
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // 修复 ESLint 警告：去掉了同步的 setLoading(true)
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
      if (deleteReport) deleteReport(deleteId);
      setDeleteId(null);
      setShowToast(true);
    }
  };

  const handleReportClick = (id: string) => {
    if (setSelectedReportId) setSelectedReportId(id);
    if (setCurrentView) setCurrentView('report-detail');
  };

  const handleLogin = () => {
    window.dispatchEvent(new CustomEvent('zeneme:navigate-auth'));
  };

  const getIcon = (type: string) => {
    if (type === 'sketch' || type === 'brief') {
      return <FileText style={{ color: 'rgba(167,139,250,0.80)' }} size={20} />;
    }
    return <FileText style={{ color: '#FFC15A' }} size={20} />;
  };

  const getCategory = (type: string): 'brief' | 'deep' => {
    if (type === 'sketch' || type === 'brief') return 'brief';
    return 'deep'; 
  };

  const getCategoryLabel = (type: string): string => {
    return getCategory(type) === 'brief' ? '简要版' : '深度版';
  };

  const filteredReports = reports
    .filter((r: any) => {
      if (filter === 'all') return true;
      return getCategory(r.type) === filter;
    })
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Guest State Interception
  if (status === 'guest') {
    return (
        // 修复 Tailwind 警告：pt-[80px] 改为 pt-20
        <div className="flex flex-col h-full w-full pt-20 overflow-hidden items-center justify-center px-6" style={{ backgroundColor: DK.bgPage }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 10% 50%, rgba(139,92,246,0.08) 0%, transparent 60%)' }} />
            <div className="relative backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl" style={{ backgroundColor: DK.bgPanel, border: `1px solid ${DK.border}` }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(139,92,246,0.12)', border: `1px solid ${DK.border}`, boxShadow: '0 0 20px rgba(139,92,246,0.15)' }}>
                   <Lock className="w-8 h-8" style={{ color: '#8B5CF6' }} />
                </div>
                <h2 className="text-xl font-bold mb-2 text-white">
                    登录以查看历史记录
                </h2>
                <p className="text-sm mb-8 leading-relaxed text-slate-400">
                    游客模式下数据仅临时保存。登录账号后，您可以查看完整的训练历史和分析报告。
                </p>
                <Button 
                    onClick={handleLogin}
                    className="w-full h-12 rounded-xl text-white shadow-lg font-medium"
                    style={{ backgroundColor: '#8B5CF6', boxShadow: '0 4px 16px rgba(139,92,246,0.3)' }}
                >
                    立即登录 / 注册
                    <ArrowRight className="ml-2 w-4 h-4 opacity-80" />
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative" style={{ backgroundColor: DK.bgPage }}>
      
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 8% 40%, rgba(139,92,246,0.08) 0%, transparent 55%)' }} />

      {/* 【临时处理】使用短路逻辑兼容缺失的翻译字段 */}
      <Toast visible={showToast} message={t?.modals?.success || "操作成功"} onClose={() => setShowToast(false)} />
      <ConfirmDialog 
        open={!!deleteId}
        title={t?.modals?.deleteTitle || "确认删除"} 
        desc={t?.modals?.deleteDesc || "删除后将无法恢复，是否继续？"}
        cancelText={t?.common?.cancel || "取消"}
        confirmText={t?.modals?.delete || "删除"}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        isDestructive
      />

      {/* 修复 Tailwind 警告：pt-[80px] 改为 pt-20 */}
      <div className="flex flex-col h-full w-full pt-20 overflow-hidden relative z-10">
        
        <div className="shrink-0 px-6 md:px-8 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            
            <div className="flex flex-col items-start gap-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-left text-white">
                    {t?.history?.title || "历史记录"}
                </h1>
                <p className="text-sm opacity-90 max-w-lg text-left text-slate-400">
                    {t?.history?.subtitle || "查看你过去的分析报告"}
                </p>
            </div>
            
            <div className="p-1 rounded-lg flex gap-1 self-start md:self-auto" style={{ backgroundColor: DK.bgPanel, border: `1px solid ${DK.border}` }}>
                {['all', 'brief', 'deep'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                        style={filter === f
                          ? { backgroundColor: '#8B5CF6', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(139,92,246,0.35)' }
                          : { color: '#94a3b8' }
                        }
                        onMouseEnter={(e) => { if (filter !== f) e.currentTarget.style.backgroundColor = DK.hoverOverlay; }}
                        onMouseLeave={(e) => { if (filter !== f) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        {f === 'all' ? (t?.history?.filters?.all || '全部') : (f === 'brief' ? '简要版' : '深度版')}
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 pb-10 w-full">
            {loading ? (
                <ListSkeleton />
            ) : reports.length === 0 ? (
                <div className="h-full flex flex-col items-start justify-center">
                    <div className="w-full flex justify-center">
                         <EmptyState 
                            title={t?.modals?.emptyHistory || "暂无历史记录"} 
                            desc={t?.history?.emptyDesc || "您还没有生成过任何报告"} 
                        />
                    </div>
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="h-full flex flex-col items-start justify-center">
                    <div className="w-full flex justify-center">
                         <EmptyState 
                            title={filter === 'brief' ? '暂无简要版报告' : '暂无深度版报告'}
                            desc={filter === 'brief' ? '完成一次内视涂鸦后会自动生成简要版报告' : '完成一次内视快测或对话后会自动生成深度版报告'}
                        />
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: DK.bgPanel, border: `1px solid ${DK.border}` }}>
                    {filteredReports
                    .map((report: any, idx: number, arr: any[]) => (
                    <div
                        key={report.id}
                        onClick={() => handleReportClick(report.id)}
                        className="group relative flex items-center gap-4 p-5 transition-all cursor-pointer w-full"
                        style={{
                          backgroundColor: DK.bgPanel2,
                          borderBottom: idx < arr.length - 1 ? `1px solid ${DK.divider}` : 'none',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(234,240,255,0.04)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = DK.bgPanel2;
                        }}
                    >
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all"
                          style={{
                            backgroundColor: getCategory(report.type) === 'brief' ? 'rgba(139,92,246,0.12)' : 'rgba(255,193,90,0.12)',
                            border: `1px solid ${getCategory(report.type) === 'brief' ? DK.border : 'rgba(255,193,90,0.22)'}`,
                          }}
                        >
                            {getIcon(report.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-medium truncate transition-colors text-white">{report.title}</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full"
                                  style={getCategory(report.type) === 'brief'
                                    ? { backgroundColor: 'rgba(139,92,246,0.12)', color: 'rgba(167,139,250,0.95)', border: '1px solid rgba(139,92,246,0.22)' }
                                    : { backgroundColor: 'rgba(255,193,90,0.12)', color: '#FFC15A', border: '1px solid rgba(255,193,90,0.22)' }
                                  }
                                >
                                  {getCategoryLabel(report.type)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs flex items-center gap-1 text-slate-500">
                                  <Clock size={10} /> {report.date}
                                </span>
                                <span className="text-xs text-slate-600">·</span>
                                <p className="text-sm truncate text-slate-500">{report.preview}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 hover:bg-red-500/10 text-slate-500"
                                onClick={(e) => handleDelete(report.id, e)}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#F87171'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                            >
                                <Trash2 size={16} />
                            </Button>
                            <div className="w-8 h-8 flex items-center justify-center rounded-full transition-all text-slate-400"
                              style={{
                                backgroundColor: DK.bgPanel,
                                border: `1px solid ${DK.border}`,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#8B5CF6';
                                e.currentTarget.style.borderColor = '#8B5CF6';
                                e.currentTarget.style.color = '#FFFFFF';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = DK.bgPanel;
                                e.currentTarget.style.borderColor = DK.border;
                                e.currentTarget.style.color = '#94a3b8';
                              }}
                            >
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
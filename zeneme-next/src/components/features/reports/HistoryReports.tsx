import React, { useState, useEffect, useCallback } from 'react';
import { FileText, ChevronRight, Clock, Lock, ArrowRight, Download, RefreshCw, Palette, ArrowLeft, Sparkles, Brain, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { useAuthStore } from '../../../hooks/useAuthStore';
import { getUserReports, downloadPsychologyReport, getPsychologyReportStatus } from '../../../lib/api';
import { DK } from '../../../styles/darktheme';
import {
  Toast,
  ListSkeleton,
  EmptyState
} from '../../shared/GlobalFeedback';
/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ReportItem {
  id: number;
  type: string;
  date: string;
  title: string;
  preview: string;
  mind_indices?: Record<string, number>;
  has_file?: boolean;
  image_url?: string;
  full_analysis?: string;
}

export const HistoryReports: React.FC = () => {
  const { status, user } = useAuthStore();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [viewingSketch, setViewingSketch] = useState<ReportItem | null>(null);
  const [viewingReport, setViewingReport] = useState<ReportItem | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getUserReports(user.id);
      if (result.ok && result.reports) {
        setReports(result.reports);
      } else {
        setError(result.error || '加载失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (status === 'authenticated' && user?.id) {
      fetchReports();
    } else {
      setLoading(false);
    }
  }, [status, user?.id, fetchReports]);

  const handleDownload = async (reportId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(reportId);
    try {
      const result = await downloadPsychologyReport(reportId);
      if (!result.ok) {
        setToastMsg(result.error || '下载失败');
        setShowToast(true);
      }
    } catch {
      setToastMsg('下载失败，请重试');
      setShowToast(true);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleReportClick = async (report: ReportItem) => {
    if (report.type === 'sketch') {
      setViewingSketch(report);
    } else {
      setViewingReport(report);
      setReportLoading(true);
      setReportData(null);
      try {
        const result = await getPsychologyReportStatus(report.id);
        if (result.status === 'completed' && result.report_data) {
          setReportData(result.report_data);
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setToastMsg('加载报告失败');
        setShowToast(true);
      } finally {
        setReportLoading(false);
      }
    }
  };

  const handleLogin = () => {
    window.dispatchEvent(new CustomEvent('zeneme:navigate-auth'));
  };

  // Guest gate
  if (status === 'guest') {
    return (
      <div className="flex flex-col h-full w-full pt-20 overflow-hidden items-center justify-center px-6" style={{ backgroundColor: DK.bgPage }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 10% 50%, rgba(139,92,246,0.08) 0%, transparent 60%)' }} />
        <div className="relative backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl" style={{ backgroundColor: DK.bgPanel, border: `1px solid ${DK.border}` }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(139,92,246,0.12)', border: `1px solid ${DK.border}`, boxShadow: '0 0 20px rgba(139,92,246,0.15)' }}>
            <Lock className="w-8 h-8" style={{ color: '#8B5CF6' }} />
          </div>
          <h2 className="text-xl font-bold mb-2 text-white">登录以查看历史记录</h2>
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

  // Sketch detail view
  if (viewingSketch) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden relative" style={{ backgroundColor: DK.bgPage }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 8% 40%, rgba(139,92,246,0.08) 0%, transparent 55%)' }} />
        <div className="flex flex-col h-full w-full pt-20 overflow-y-auto relative z-10 px-6 md:px-8 pb-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewingSketch(null)}
            className="text-slate-400 hover:text-white self-start mb-4"
          >
            <ArrowLeft size={16} className="mr-1.5" /> 返回历史记录
          </Button>

          <h1 className="text-2xl font-bold text-white mb-1">内视涂鸦分析</h1>
          <p className="text-sm text-slate-500 mb-6 flex items-center gap-1"><Clock size={12} /> {viewingSketch.date}</p>

          {viewingSketch.image_url && (
            <div className="rounded-2xl overflow-hidden border mb-6" style={{ borderColor: DK.border, backgroundColor: '#0f172a' }}>
              <img
                src={`${API_BASE_URL}${viewingSketch.image_url}`}
                alt="内视涂鸦"
                className="w-full max-h-[50vh] object-contain"
              />
            </div>
          )}

          <Card className="p-6 bg-slate-900/60 border-white/10 backdrop-blur-md">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-violet-500/20 rounded-full text-violet-300 border border-violet-500/30 hidden sm:block">
                <Sparkles size={20} />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="font-semibold text-white">AI 分析结果</h3>
                <p className="text-slate-300 leading-relaxed text-sm md:text-base whitespace-pre-wrap">{viewingSketch.full_analysis || viewingSketch.preview}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Report detail view (内视快测)
  if (viewingReport) {
    const dims = [
      { key: 'emotional_regulation', label: '情绪调节能力指数', phase: '情绪觉察发展阶段', desc: '能够觉察到部分情绪变化，但调节能力仍不稳定。' },
      { key: 'cognitive_flexibility', label: '认知灵活度指数', phase: '灵活思维整合阶段', desc: '能主动切换视角分析问题，愿意修正原有看法。' },
      { key: 'relational_sensitivity', label: '关系敏感度指数', phase: '关系平衡调整阶段', desc: '具备较强的共情能力，能敏锐捕捉他人情绪与需求。' },
      { key: 'inner_conflict', label: '内在冲突度指数', phase: '冲突显化整合阶段', desc: '内在常存在"想要"与"应该"之间的拉扯。' },
      { key: 'growth_potential', label: '成长潜能指数', phase: '潜能绽放阶段', desc: '成长已成为内在驱动力，拥有强烈的自我探索与心理韧性。' },
    ];

    return (
      <div className="flex flex-col h-full w-full overflow-hidden relative" style={{ backgroundColor: DK.bgPage }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 8% 40%, rgba(139,92,246,0.08) 0%, transparent 55%)' }} />
        <div className="flex flex-col h-full w-full pt-20 overflow-y-auto relative z-10 px-6 md:px-8 pb-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setViewingReport(null); setReportData(null); }}
            className="text-slate-400 hover:text-white self-start mb-4"
          >
            <ArrowLeft size={16} className="mr-1.5" /> 返回历史记录
          </Button>

          {reportLoading ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
              <p className="text-slate-400">加载报告中...</p>
            </div>
          ) : reportData?.mind_indices ? (
            <div className="space-y-6 max-w-4xl mx-auto w-full">
              {/* Header */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-900/40 to-[#0E1630]/60 border border-violet-500/20">
                <h3 className="text-2xl font-bold text-white mb-2">心理洞察报告 #{viewingReport.id}</h3>
                <p className="text-slate-300 leading-relaxed text-sm mb-3">
                  以下是你的心理能力评估结果，展示了你在五个核心心理维度上的表现。
                </p>
                <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={10} /> {viewingReport.date}</span>
              </div>

              {/* Radar chart */}
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-6 text-center">五维心理能力雷达图</h2>
                <div className="w-full flex justify-center" style={{ minHeight: 300 }}>
                  <img
                    src={`${API_BASE_URL}/charts/report_${viewingReport.id}/radar_chart.png`}
                    alt="心理能力雷达图"
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxHeight: '400px' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              </div>

              {/* Five dimensions */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Brain size={18} className="text-violet-500" /> 五维解析
                </h3>
                <div className="space-y-4">
                  {dims.map((item) => (
                    <div key={item.key} className="p-5 rounded-xl bg-[#0E1630]/80 border border-white/5">
                      <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start">
                        <div className="flex-shrink-0 flex md:flex-col items-center gap-3 md:gap-1 md:w-32 md:border-r md:border-white/10 md:pr-4">
                          <div className="text-4xl font-bold text-violet-400">{reportData.mind_indices[item.key] || 0}</div>
                          <div className="text-xs text-slate-400 font-medium text-center">{item.label}</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-base font-semibold text-white mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-violet-500 block" />
                            {item.phase}
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Download button */}
              <div className="pt-4 pb-8 flex justify-center">
                <Button
                  size="lg"
                  onClick={async () => {
                    try { await downloadPsychologyReport(viewingReport.id); }
                    catch { setToastMsg('下载失败'); setShowToast(true); }
                  }}
                  className="h-14 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] px-8 flex items-center gap-2"
                >
                  <Download size={20} /> 下载完整报告 (DOCX)
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
              <EmptyState title="报告数据不可用" desc="无法加载此报告的详细数据" />
            </div>
          )}
        </div>

        <Toast visible={showToast} message={toastMsg} onClose={() => setShowToast(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative" style={{ backgroundColor: DK.bgPage }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 8% 40%, rgba(139,92,246,0.08) 0%, transparent 55%)' }} />

      <Toast visible={showToast} message={toastMsg} onClose={() => setShowToast(false)} />

      <div className="flex flex-col h-full w-full pt-20 overflow-hidden relative z-10">

        <div className="shrink-0 px-6 md:px-8 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col items-start gap-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-wide text-left text-white">历史记录</h1>
            <p className="text-sm opacity-90 max-w-lg text-left text-slate-400">查看你过去的分析报告</p>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchReports} className="text-slate-400 hover:text-white self-start md:self-auto">
            <RefreshCw size={14} className="mr-1.5" /> 刷新
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 pb-10 w-full">
          {loading ? (
            <ListSkeleton />
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center">
              <EmptyState title="加载失败" desc={error} />
              <Button variant="outline" onClick={fetchReports} className="mt-4">重试</Button>
            </div>
          ) : reports.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <EmptyState title="暂无历史记录" desc="您还没有生成过任何报告" />
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: DK.bgPanel, border: `1px solid ${DK.border}` }}>
              {reports.map((report, idx) => (
                <div
                  key={`${report.type}-${report.id}`}
                  onClick={() => handleReportClick(report)}
                  className="group relative flex items-center gap-4 p-5 transition-all cursor-pointer w-full hover:bg-white/[0.03]"
                  style={{
                    backgroundColor: DK.bgPanel2,
                    borderBottom: idx < reports.length - 1 ? `1px solid ${DK.divider}` : 'none',
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: report.type === 'sketch' ? 'rgba(99,102,241,0.12)' : 'rgba(139,92,246,0.12)', border: `1px solid ${DK.border}` }}
                  >
                    {report.type === 'sketch' ? (
                      <Palette style={{ color: 'rgba(129,140,248,0.80)' }} size={20} />
                    ) : (
                      <FileText style={{ color: 'rgba(167,139,250,0.80)' }} size={20} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="font-medium truncate text-white mb-1">{report.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs flex items-center gap-1 text-slate-500">
                        <Clock size={10} /> {report.date}
                      </span>
                      <span className="text-xs text-slate-600">·</span>
                      <p className="text-sm truncate text-slate-500">{report.preview}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {report.has_file && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-all text-slate-400 hover:text-violet-400 hover:bg-violet-500/10"
                        onClick={(e) => handleDownload(report.id, e)}
                        disabled={downloadingId === report.id}
                      >
                        <Download size={16} className={downloadingId === report.id ? 'animate-pulse' : ''} />
                      </Button>
                    )}
                    <div className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400"
                      style={{ backgroundColor: DK.bgPanel, border: `1px solid ${DK.border}` }}
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


import React, { useState, useEffect, useCallback } from 'react';
import { FileText, ChevronRight, Clock, Trash2, Lock, ArrowRight, Download, Eye, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/button';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { useAuthStore } from '../../../hooks/useAuthStore';
import { getUserReports, downloadPsychologyReport } from '../../../lib/api';
import { DK } from '../../../styles/darktheme';
import {
  ConfirmDialog,
  Toast,
  ListSkeleton,
  EmptyState
} from '../../shared/GlobalFeedback';
/* eslint-disable @typescript-eslint/no-explicit-any */

interface ReportItem {
  id: number;
  type: string;
  date: string;
  title: string;
  preview: string;
  mind_indices?: Record<string, number>;
  has_file?: boolean;
}

export const HistoryReports: React.FC = () => {
  const { setCurrentView } = useZenemeStore();
  const { status, user } = useAuthStore();

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

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

  const handleReportClick = (report: ReportItem) => {
    // Navigate to the InnerQuickTest result view by storing report info
    // For now, show a toast with scores
    const indices = report.mind_indices;
    if (indices) {
      const dims = [
        ['情绪调节', indices.emotional_regulation],
        ['认知灵活', indices.cognitive_flexibility],
        ['关系敏感', indices.relational_sensitivity],
        ['内在冲突', indices.inner_conflict],
        ['成长潜能', indices.growth_potential],
      ];
      const summary = dims.map(([k, v]) => `${k}: ${v ?? '-'}`).join(' | ');
      setToastMsg(summary);
      setShowToast(true);
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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden relative" style={{ backgroundColor: DK.bgPage }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 8% 40%, rgba(139,92,246,0.08) 0%, transparent 55%)' }} />

      <Toast visible={showToast} message={toastMsg} onClose={() => setShowToast(false)} />

      <div className="flex flex-col h-full w-full pt-20 overflow-hidden relative z-10">

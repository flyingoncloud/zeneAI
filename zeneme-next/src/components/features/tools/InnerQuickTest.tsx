import React, { useState, useEffect, useRef } from 'react';
import * as Icons from '../../ui/icons';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { ClipboardList, Loader2, MessageCircle } from 'lucide-react';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import {
  startQuestionnaire,
  saveQuestionnaireAnswer,
  sendChatMessage,
  getPsychologyReportStatus,
  downloadPsychologyReport,
  type QuestionnaireDetail,
  type QuestionOption,
  type StartQuestionnaireResponse
} from '../../../lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any */
type QuestionItem = QuestionnaireDetail['questions'][number];

type CategoryScoreObj = { sub_section?: string; category?: string; score?: number; count?: number };
import { toast } from 'sonner';

type IconLikeProps = {
  size?: number | string;
  className?: string;
  color?: string;
  strokeWidth?: number;
  [key: string]: unknown;
};

type IconLike = React.ComponentType<IconLikeProps>;

const SafeIcon = ({ icon: Icon, ...props }: { icon?: IconLike } & IconLikeProps) => {
  if (!Icon) {
    const size = props.size ?? 24;
    return (
      <span
        style={{
          width: typeof size === 'number' ? `${size}px` : size,
          height: typeof size === 'number' ? `${size}px` : size,
          display: 'inline-block',
          background: '#ccc',
          borderRadius: 4,
        }}
      />
    );
  }
  return <Icon {...props} />;
};

// Helper function to get or create user ID
function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return `guest_${Date.now()}`;

  const USER_ID_KEY = 'zeneme_user_id';
  const existing = window.localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;

  const newId = window.crypto?.randomUUID?.() ?? `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(USER_ID_KEY, newId);
  return newId;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const InnerQuickTest: React.FC = () => {
  const { t, conversationId, sessionId, setSessionId, setConversationId, setModuleStatus, setCurrentView, setPendingModuleCompletion, addMessage, setExitAction, clearExitAction } = useZenemeStore();
  const [view, setView] = useState<'test' | 'result'>('test');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NEW: Progress tracking state
  const [progressId, setProgressId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({});
  const [currentAnswer, setCurrentAnswer] = useState<number | undefined>(undefined); // For UI feedback only

  // F6 Ranking state: tracks which options are selected in which rank positions
  const [rankingSelections, setRankingSelections] = useState<Record<number, string[]>>({});

  // F7 Direction Dial state
  const [dialAngle, setDialAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);

  // Submission progress state
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'success'>('idle');

  // useEffect for setExitAction - from incoming
  useEffect(() => {
    setExitAction("the user has completed the recommended module, you can continue the conversation and continue to recommend the remaining modules. Remember not to directly recommend the remaining module, but to patiently continue the conversation and recommend the remaining modules whenever appropriate.", "quick_assessment");
    return () => {
      clearExitAction();
    };
  }, [setExitAction, clearExitAction]);

  // Report generation state
  const [reportId, setReportId] = useState<number | null>(null);
  const [reportStatus, setReportStatus] = useState<string>('');
  const [reportProgress, setReportProgress] = useState<number>(0);
  const [reportData, setReportData] = useState<any>(null);

  // Debug: Log conversationId
  useEffect(() => {
    console.log('[InnerQuickTest] conversationId:', conversationId);
    console.log('[InnerQuickTest] sessionId:', sessionId);
  }, [conversationId, sessionId]);

  // Poll for report status
  useEffect(() => {
    if (!reportId) {
      return;
    }

    // Immediately check status on mount or when reportId changes
    const checkStatus = async () => {
      try {
        const status = await getPsychologyReportStatus(reportId);
        setReportStatus(status.status);
        setReportProgress(status.progress || 0);

        if (status.status === 'failed' || status.status === 'not_found') {
          toast.error('报告生成失败，请重试或联系客服。');
          setTimeout(() => {
            resetTest();
          }, 2000);
          return;
        }

        if (status.status === 'completed') {
          if (status.report_data) {
            setReportData(status.report_data);
          }
          toast.success('报告生成完成！您可以下载查看。');
          return;
        }
      } catch (error) {
        console.error('Error checking initial report status:', error);
      }
    };

    checkStatus();

    // If already completed or failed, don't start polling
    if (reportStatus === 'completed' || reportStatus === 'failed') {
      return;
    }

    // Start polling for pending/processing reports
    const pollInterval = setInterval(async () => {
      try {
        const status = await getPsychologyReportStatus(reportId);

        setReportStatus(status.status);
        setReportProgress(status.progress || 0);

        if (status.status === 'completed') {
          // Store report data when completed
          if (status.report_data) {
            setReportData(status.report_data);
          }
          toast.success('报告生成完成！您可以下载查看。');
          clearInterval(pollInterval);
        } else if (status.status === 'failed' || status.status === 'not_found') {
          toast.error('报告生成失败，请重试或联系客服。');
          clearInterval(pollInterval);
          // Reset to main page after 2 seconds
          setTimeout(() => {
            resetTest();
          }, 2000);
        }
      } catch (error) {
        console.error('Error polling report status:', error);
        // If polling fails multiple times, also reset
        toast.error('无法获取报告状态，请重试。');
        clearInterval(pollInterval);
        setTimeout(() => {
          resetTest();
        }, 2000);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [reportId, reportStatus]);

  // Transition to success state when report is completed
  useEffect(() => {
    if (reportStatus === 'completed' && submissionState === 'submitting') {
      console.log('[Report Completed] Transitioning to success state');
      setSubmissionState('success');
    }
  }, [reportStatus, submissionState]);

  // F7 Direction Dial: Handle window-level pointer events for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      let deg = Math.atan2(dy, dx) * (180 / Math.PI);
      deg += 90; // Rotate so top is 0°
      if (deg < 0) deg += 360;
      setDialAngle(Math.round(deg));
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      // Note: We need to get the current angle from state at the time of pointer up
      // This will be handled in the component's render cycle
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]); // Only depend on isDragging, not dialAngle

  // Separate effect to handle answer submission when dragging stops
  useEffect(() => {
    if (!isDragging && dialAngle !== 0) {
      // Only submit if we have a non-zero angle and just stopped dragging
      const timer = setTimeout(() => {
        handleAnswer(Math.round(dialAngle));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDragging, dialAngle]);

  // Auto-create conversation if it doesn't exist (optional - questionnaire can work without it)
  useEffect(() => {
    const createConversationIfNeeded = async () => {
      // Skip conversation creation - questionnaire works independently
      // Conversation will be created later if needed for chat functionality
      console.log('[InnerQuickTest] Skipping conversation creation - questionnaire works independently');
      return;

      // DISABLED: Old logic that created conversation on mount
      // Only create if conversationId is missing (sessionId can exist from previous session)
      if (!conversationId) {
        try {
          // Generate or reuse session ID
          let currentSessionId = sessionId;
          if (!currentSessionId) {
            currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            setSessionId(currentSessionId);
          }

          console.log('[InnerQuickTest] Creating conversation with session:', currentSessionId);

          // Create a conversation via the chat API
          const response = await sendChatMessage({
            message: '开始心理评估',
            session_id: currentSessionId
          });

          if (response.conversation_id) {
            setConversationId(response.conversation_id);
            console.log('[InnerQuickTest] Auto-created conversation:', response.conversation_id);
          } else {
            console.warn('[InnerQuickTest] No conversation_id returned, continuing without it');
          }
        } catch (error) {
          console.warn('[InnerQuickTest] Failed to create conversation (continuing anyway):', error);
          // Don't block questionnaire - it can work without conversation
        }
      }
    };

    createConversationIfNeeded();
  }, [conversationId, sessionId, setSessionId, setConversationId]);

  // NEW: Start or resume questionnaire with progress tracking
  useEffect(() => {
    const startQuestionnaireWithProgress = async () => {
      // Don't wait for conversation - questionnaire can work independently
      // Just ensure we have a session ID
      if (!sessionId) {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        setSessionId(newSessionId);
        console.log('[InnerQuickTest] Created session ID for questionnaire:', newSessionId);
        return; // Wait for next render with sessionId
      }

      setLoading(true);
      try {
        const userId = getOrCreateUserId();
        const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

        if (!sessionId) {
          setSessionId(currentSessionId);
        }

        console.log('[InnerQuickTest] Starting questionnaire with progress tracking');
        console.log('[InnerQuickTest] User ID:', userId);
        console.log('[InnerQuickTest] Session ID:', currentSessionId);

        const result = await startQuestionnaire({
          user_id: userId,
          session_id: currentSessionId,
          ...(typeof conversationId === 'number' ? { conversation_id: conversationId } : {}),
          questionnaire_id: 'admin_created'
        });

        if (!result.ok || !result.progress || !result.questions) {
          throw new Error(result.error || '无法加载问卷');
        }

        console.log('[InnerQuickTest] Progress loaded:', result.progress);
        console.log('[InnerQuickTest] Progress status:', result.progress.status);
        console.log('[InnerQuickTest] Progress report_id:', result.progress.report_id);
        console.log('[InnerQuickTest] Questions loaded:', result.questions.length);
        console.log('[InnerQuickTest] First question:', result.questions[0]);

        setProgressId(result.progress.id);
        setQuestions(result.questions);
        setCurrentQIndex(result.progress.current_question_index);
        setCategoryScores(result.progress.category_scores || {});

        // If already completed, show result
        if (result.progress.status === 'completed' && result.progress.report_id) {
          console.log('[InnerQuickTest] Progress is completed, showing result view');
          setReportId(result.progress.report_id);
          setReportStatus('completed');
          setView('result');
          setSubmissionState('success');
        } else {
          console.log('[InnerQuickTest] Progress is in_progress, showing test view');
          setView('test');
          setSubmissionState('idle');
        }

        setError(null);
      } catch (err) {
        console.error('Error starting questionnaire:', err);
        setError(err instanceof Error ? err.message : '加载问卷失败');
        toast.error('加载问卷失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };

    startQuestionnaireWithProgress();
  }, [sessionId, setSessionId]); // Run when sessionId is ready (conversation is optional)

  const totalQuestions = questions.length;

  // NEW: Auto-save answer with progress tracking
  const handleAnswer = async (value: number, subCategory?: string) => {
    if (!progressId || !questions[currentQIndex]) return;

    const currentQuestion = questions[currentQIndex];

    // Update UI immediately for feedback
    setCurrentAnswer(value);

    try {
      const requestData = {
        progress_id: progressId,
        question_id: currentQuestion.id,
        answer_value: value,
        sub_category: subCategory  // NEW: Include sub_category if provided
      };

      console.log('[handleAnswer] Sending request:', requestData);

      // Save answer to backend
      const result = await saveQuestionnaireAnswer(requestData);

      console.log('[handleAnswer] Response:', result);

      if (!result.ok) {
        throw new Error(result.error || '保存答案失败');
      }

      // Update local state
      setCategoryScores(result.category_scores);

      // Check if completed
      if (result.is_completed && result.report_id) {
        console.log('[Questionnaire Completed]', { report_id: result.report_id });
        setReportId(result.report_id);
        setReportStatus('pending');
        setSubmissionState('submitting');
        setView('result');
        return;
      }

      // Auto-advance to next question if not last
      if (currentQIndex < totalQuestions - 1) {
        setTimeout(() => {
          setCurrentQIndex((prev) => prev + 1);
          setCurrentAnswer(undefined); // Clear for next question
        }, 200);
      }
    } catch (err) {
      console.error('Error saving answer:', err);
      toast.error('保存答案失败，请重试');
      setCurrentAnswer(undefined); // Clear on error
    }
  };

  const resetTest = async () => {
    try {
      // Delete progress from database before resetting
      const userId = getOrCreateUserId();
      console.log('[resetTest] Deleting progress for user:', userId);

      const response = await fetch(`${API_BASE_URL}/api/questionnaire/progress/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          questionnaire_id: 'admin_created'
        })
      });

      if (!response.ok) {
        console.warn('[resetTest] Failed to delete progress from server, continuing anyway');
      } else {
        const result = await response.json();
        console.log('[resetTest] Reset response:', result);
      }
    } catch (error) {
      console.warn('[resetTest] Error deleting progress:', error);
    }

    // Clear all local state completely
    console.log('[resetTest] Clearing all local state');
    setView('test');
    setCurrentQIndex(0);
    setProgressId(null);
    setQuestions([]);
    setCategoryScores({});
    setReportId(null);
    setReportStatus('');
    setReportData(null);
    setReportProgress(0);
    setSubmissionState('idle');
    setCurrentAnswer(undefined);
    setRankingSelections({});
    setError(null);
    setLoading(false);

    // Wait a moment to ensure state is cleared, then reload
    console.log('[resetTest] Reloading page in 100ms');
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Show loading state
  if (loading && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-transparent">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-white/10 bg-slate-900/50 backdrop-blur-xl">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-violet-400" />
          <p className="text-slate-400">加载问卷中...</p>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-transparent">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-white/10 bg-slate-900/50 backdrop-blur-xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-400 mb-4 border border-red-500/20">
            <ClipboardList size={40} strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-white">加载失败</h2>
          <p className="text-slate-400">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
          >
            重新加载
          </Button>
        </Card>
      </div>
    );
  }

  // Result View
  if (view === 'result') {
    // Show loading screen while submitting OR while report is generating
    if (submissionState === 'submitting' || (reportId && reportStatus === 'pending')) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-transparent">
          <Card className="max-w-md w-full p-12 text-center space-y-6 shadow-2xl border-white/10 bg-slate-900/50 backdrop-blur-xl">
            <div className="w-24 h-24 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-4 border-violet-500/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">✨</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white">生成中...</h2>
            <p className="text-slate-300">正在为你整理内视快测结果，请稍候</p>
            <p className="text-sm text-slate-400">预计 5-10 秒</p>
            {reportProgress > 0 && (
              <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${reportProgress}%` }}
                />
              </div>
            )}
          </Card>
        </div>
      );
    }

    // Show success screen when report is completed
    if (submissionState === 'success' || (reportId && reportStatus === 'completed')) {
      // If we have report data, show it
      if (reportData && reportData.mind_indices) {
        return (
          <div className="h-full overflow-y-auto bg-transparent p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Header */}
              <header className="text-center space-y-4 bg-gradient-to-br from-violet-900/40 to-purple-900/40 p-8 rounded-2xl backdrop-blur-md border border-white/10">
                <h1 className="text-3xl font-bold text-white">感谢你完成我们 ZeneWe「心理能」内视快测</h1>
                <p className="text-slate-300 max-w-2xl mx-auto">
                  以下是你的心理能力评估结果。这份报告基于你的回答，展示了你在五个核心心理维度上的表现。
                </p>
                <Button
                  onClick={async () => {
                    if (reportId) {
                      try {
                        await downloadPsychologyReport(reportId);
                      } catch (error) {
                        console.error('Download error:', error);
                        toast.error('下载失败，请重试');
                      }
                    }
                  }}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-8 py-3 text-lg"
                >
                  立即下载完整报告
                </Button>
              </header>

              {/* Radar Chart */}
              {reportId && (
                <Card className="p-6 bg-slate-900/40 border-white/5 backdrop-blur-md">
                  <h2 className="text-2xl font-bold text-white mb-6 text-center">五维心理能力雷达图</h2>
                  <div className="flex justify-center">
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}/charts/report_${reportId}/radar_chart.png`}
                      alt="心理能力雷达图"
                      className="max-w-full h-auto rounded-lg"
                      style={{ maxHeight: '500px' }}
                      onError={(e) => {
                        console.error('Failed to load radar chart');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </Card>
              )}

              {/* Dimension Scores */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-white text-center mb-6">五大心理维度详解</h2>

                {/* Emotional Regulation */}
                <Card className="p-6 bg-slate-900/40 border-l-4 border-l-rose-500 backdrop-blur-md">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-white">情绪调节能力</h3>
                    <span className="text-3xl font-bold text-rose-400">{reportData.mind_indices.emotional_regulation}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    情绪调节能力反映了你识别、理解和管理自己情绪的能力。较高的分数表明你能够有效地处理情绪波动，保持心理平衡。
                  </p>
                </Card>

                {/* Cognitive Flexibility */}
                <Card className="p-6 bg-slate-900/40 border-l-4 border-l-blue-500 backdrop-blur-md">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-white">认知重构能力</h3>
                    <span className="text-3xl font-bold text-blue-400">{reportData.mind_indices.cognitive_flexibility}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    认知重构能力体现了你从不同角度看待问题、调整思维模式的灵活性。这项能力帮助你更好地应对挑战和变化。
                  </p>
                </Card>

                {/* Relational Sensitivity */}
                <Card className="p-6 bg-slate-900/40 border-l-4 border-l-green-500 backdrop-blur-md">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-white">关系互动能力</h3>
                    <span className="text-3xl font-bold text-green-400">{reportData.mind_indices.relational_sensitivity}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    关系互动能力反映了你在人际关系中的敏感度和共情能力。较高的分数表明你能够理解他人的情感需求，建立健康的人际关系。
                  </p>
                </Card>

                {/* Inner Conflict */}
                <Card className="p-6 bg-slate-900/40 border-l-4 border-l-amber-500 backdrop-blur-md">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-white">内在对话能力</h3>
                    <span className="text-3xl font-bold text-amber-400">{reportData.mind_indices.inner_conflict}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    内在对话能力体现了你与自己内心对话的质量。这项能力帮助你更好地理解自己的想法和感受，减少内心冲突。
                  </p>
                </Card>

                {/* Growth Potential */}
                <Card className="p-6 bg-slate-900/40 border-l-4 border-l-purple-500 backdrop-blur-md">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-semibold text-white">成长潜力</h3>
                    <span className="text-3xl font-bold text-purple-400">{reportData.mind_indices.growth_potential}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    成长潜力反映了你的心理韧性和自我提升的能力。较高的分数表明你具有良好的适应能力和持续成长的动力。
                  </p>
                </Card>
              </div>

              {/* Download Button */}
              <Card className="p-6 bg-gradient-to-br from-violet-900/20 to-purple-900/20 border-white/5 backdrop-blur-md text-center">
                <h3 className="text-xl font-semibold text-white mb-4">获取完整专业报告</h3>
                <p className="text-slate-300 mb-6">
                  下载完整的 DOCX 报告，包含更详细的分析、专业建议和个性化成长方案。
                </p>
                <Button
                  onClick={async () => {
                    if (reportId) {
                      try {
                        await downloadPsychologyReport(reportId);
                      } catch (error) {
                        console.error('Download error:', error);
                        toast.error('下载失败，请重试');
                      }
                    }
                  }}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-8 py-4 text-lg"
                >
                  <span className="text-xl mr-2">📥</span>
                  下载完整报告 (DOCX)
                </Button>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={resetTest}
                  className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  <SafeIcon icon={Icons.RefreshCcw} className="mr-2 h-4 w-4" />
                  重新测试
                </Button>
                <Button
                  onClick={() => {
                    addMessage("the user has completed the recommended module, you can continue the conversation and continue to recommend the remaining modules. Remember not to directly recommend the remaining module, but to patiently continue the conversation and recommend the remaining modules whenever appropriate.", "system");
                    setPendingModuleCompletion('quick_assessment');
                    setCurrentView('chat');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  返回对话
                </Button>
              </div>
            </div>
          </div>
        );
      }

      // Show success screen without report data (waiting to fetch)
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-transparent">
          <Card className="max-w-md w-full p-12 text-center space-y-6 shadow-2xl border-white/10 bg-slate-900/50 backdrop-blur-xl">
            <div className="w-24 h-24 mx-auto relative">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 border-4 border-emerald-500/50"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white">生成成功</h2>
            <p className="text-slate-300">你的内视快测报告已准备好</p>
            <Button
              onClick={async () => {
                // Fetch report data
                if (reportId && reportStatus === 'completed') {
                  try {
                    const status = await getPsychologyReportStatus(reportId);
                    if (status.report_data) {
                      setReportData(status.report_data);
                    }
                  } catch (error) {
                    console.error('Error fetching report data:', error);
                    toast.error('获取报告数据失败');
                  }
                }
              }}
              className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-lg py-6"
            >
              查看报告
            </Button>
          </Card>
        </div>
      );
    }

    // Show results
    return (
      <div className="h-full overflow-y-auto bg-transparent p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl backdrop-blur-md border border-white/5">
            <h2 className="text-2xl font-bold text-white tracking-wide">评估结果</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetTest} className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white backdrop-blur-sm">
                <SafeIcon icon={Icons.RefreshCcw} className="mr-2 h-4 w-4" /> 重新测试
              </Button>
              <Button className="bg-violet-600 hover:bg-violet-500 text-white border-none shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <SafeIcon icon={Icons.Save} className="mr-2 h-4 w-4" /> 保存报告
              </Button>
              <Button
                onClick={() => {
                  // Questionnaires were already submitted in handleAnswer, just navigate back
                  addMessage("the user has completed the recommended module, you can continue the conversation and continue to recommend the remaining modules. Remember not to directly recommend the remaining module, but to patiently continue the conversation and recommend the remaining modules whenever appropriate.", "system");
                  setPendingModuleCompletion('quick_assessment');
                  setCurrentView('chat');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white border-none shadow-[0_0_15px_rgba(52,211,153,0.3)]"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> 返回对话
              </Button>
            </div>
          </header>

          {/* No old scoring results section - removed */}
        </div>
      </div>
    );
  }

  // Test View
  if (!questions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-transparent">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-white/10 bg-slate-900/50 backdrop-blur-xl">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-violet-400" />
          <p className="text-slate-400">加载问卷中...</p>
        </Card>
      </div>
    );
  }

  const progress = ((currentQIndex + 1) / totalQuestions) * 100;
  const currentQuestion = questions[currentQIndex];

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="w-full h-1 bg-white/5">
        <div
          className="h-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center p-4 overflow-y-auto">
        <div className="w-full max-w-5xl space-y-6 backdrop-blur-sm p-4 md:p-6 lg:p-8 rounded-3xl border border-white/5 bg-slate-900/20 shadow-2xl my-auto">
          <div className="space-y-2 text-center">
            <span className="text-violet-400 font-semibold tracking-widest text-xs uppercase">
              {t.test.question} {currentQIndex + 1} / {totalQuestions}
            </span>
            <h3 className="text-2xl md:text-3xl font-medium text-white leading-tight drop-shadow-lg">
              {currentQuestion?.text}
            </h3>
            {/* Subtitle if present */}
            {currentQuestion?.subtitle && (
              <p className="text-sm text-violet-300/70 mt-2">
                {currentQuestion.subtitle}
              </p>
            )}
          </div>

          {/* Display media if present (F3, F7, F8 templates) */}
        {currentQuestion?.mediaUrl && (
          <div className="w-full flex justify-center">
            <div className="w-full md:w-2/5 max-w-xl rounded-xl overflow-hidden border border-white/10 bg-black/30 p-2 mx-auto">
              <div className="w-full h-[240px] md:h-[360px] flex items-center justify-center">
              {currentQuestion.mediaType === 'video' ? (
                <video
                  src={currentQuestion.mediaUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={currentQuestion.mediaUrl}
                  alt="Question media"
                  className="w-full h-full object-contain"
                />
              )}
             </div>
            </div>
          </div>
          )}

          <div className="max-w-2xl mx-auto w-full">
            {/* Check template field for F1 Likert scale */}
            {currentQuestion.template === 'F1' ? (
              // F1: Likert scale with varying circle sizes (empty circles, no numbers)
              <div className="space-y-6">
                <div className="flex justify-center items-end gap-4">
                  {[1, 2, 3, 4, 5].map((value, idx) => {
                    // Varying sizes: Large-Medium-Small-Medium-Large (96px-80px-64px-80px-96px)
                    const sizes = [96, 80, 64, 80, 96];
                    const size = sizes[idx];

                    return (
                      <button
                        key={value}
                        onClick={() => handleAnswer(value)}
                        disabled={loading}
                        className={`
                          rounded-full border-2 flex items-center justify-center transition-all
                          ${
                            currentAnswer === value
                              ? 'bg-violet-600 border-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.5)]'
                              : 'border-white/30 hover:border-violet-400 bg-transparent hover:bg-white/5'
                          }
                          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        style={{ width: `${size}px`, height: `${size}px` }}
                      >
                        {/* Empty circle - no text */}
                      </button>
                    );
                  })}
                </div>

                {/* Labels below circles */}
                <div className="flex justify-between items-center">
                  <div className="text-slate-300 font-medium text-sm">
                    非常不同意
                  </div>
                  <div className="text-slate-300 font-medium text-sm">
                    非常同意
                  </div>
                </div>
              </div>
            ) : currentQuestion.template === 'F7' ? (
              // F7: Direction Dial 0-360 (Spatial Scene with Compass)
              <div className="w-full flex flex-col gap-8 items-center justify-center pt-2 pb-8">
                {/* Scene Area (Icons) - Top */}
                {(() => {
                  const defaultItems = [
                    { id: 'cat', type: 'cat', x: 50, y: 55 },
                    { id: 'house', type: 'house', x: 15, y: 50 },
                    { id: 'tree', type: 'tree', x: 85, y: 75 },
                    { id: 'car', type: 'car', x: 35, y: 20 },
                    { id: 'sign', type: 'sign', x: 65, y: 25 },
                    { id: 'traffic', type: 'traffic_light', x: 90, y: 45 },
                    { id: 'flower', type: 'flower', x: 20, y: 80 },
                  ];

                  const iconMap: Record<string, string> = {
                    house: '🏠',
                    cat: '🐱',
                    tree: '🌳',
                    car: '🚗',
                    sign: '🛑',
                    traffic_light: '🚦',
                    flower: '🌸',
                  };

                  return (
                    <div className="relative w-full h-[32rem] bg-slate-900/40 rounded-2xl border border-white/5 shadow-inner overflow-hidden">
                      {defaultItems.map((item) => {
                        const icon = iconMap[item.type] || '🏠';

                        return (
                          <div
                            key={item.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-all duration-300"
                            style={{
                              left: `${item.x}%`,
                              top: `${item.y}%`,
                              width: '64px',
                              height: '64px',
                            }}
                          >
                            <span className="text-5xl drop-shadow-md opacity-80">{icon}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Interaction Area (Compass) - Bottom */}
                <div className="flex flex-col items-center gap-6 w-full">
                  <div
                    ref={dialRef}
                    style={{
                      width: '280px',
                      height: '280px',
                      background: 'linear-gradient(to bottom, #475569, #334155)',
                      border: '4px solid #64748b',
                      borderRadius: '50%',
                      position: 'relative',
                      cursor: 'pointer',
                      touchAction: 'none',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                    onPointerDown={(e) => {
                      setIsDragging(true);
                      // Snap immediately on click
                      if (!dialRef.current) return;
                      const rect = dialRef.current.getBoundingClientRect();
                      const cx = rect.left + rect.width / 2;
                      const cy = rect.top + rect.height / 2;
                      const dx = e.clientX - cx;
                      const dy = e.clientY - cy;
                      let deg = Math.atan2(dy, dx) * (180 / Math.PI);
                      deg += 90; // Rotate so top is 0°
                      if (deg < 0) deg += 360;
                      setDialAngle(Math.round(deg));
                    }}
                  >
                    {/* Ticks */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                      <div
                        key={deg}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: '50%',
                          width: '3px',
                          height: '50%',
                          backgroundColor: '#cbd5e1',
                          transformOrigin: 'bottom',
                          transform: `translateX(-50%) rotate(${deg}deg)`
                        }}
                      >
                        <div style={{
                          width: '100%',
                          height: '12px',
                          backgroundColor: '#e2e8f0',
                          position: 'absolute',
                          top: 0
                        }} />
                      </div>
                    ))}

                    {/* North Label */}
                    <div style={{
                      position: 'absolute',
                      top: '16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#f1f5f9'
                    }}>N</div>

                    {/* The Arrow */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '3px',
                        height: '40%',
                        backgroundColor: '#a78bfa',
                        transformOrigin: 'bottom',
                        transform: `translate(-50%, -100%) rotate(${dialAngle}deg)`,
                        transition: 'transform 75ms'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '-15px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '30px',
                        height: '30px',
                        backgroundColor: '#a78bfa',
                        borderRadius: '50%',
                        boxShadow: '0 0 25px rgba(167, 139, 250, 1)'
                      }} />
                      {/* Arrow Head */}
                      <div style={{
                        position: 'absolute',
                        top: '-30px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '12px solid transparent',
                        borderRight: '12px solid transparent',
                        borderBottom: '18px solid #a78bfa'
                      }} />
                    </div>

                    {/* Center Cap */}
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '60px',
                      height: '60px',
                      backgroundColor: '#475569',
                      borderRadius: '50%',
                      border: '4px solid #64748b',
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{
                        fontSize: '16px',
                        color: '#f1f5f9',
                        fontFamily: 'monospace',
                        fontWeight: 'bold'
                      }}>{Math.round(dialAngle)}°</span>
                    </div>
                  </div>

                  {/* Controls - Only Reset Button */}
                  <button
                    onClick={() => {
                      setDialAngle(0);
                      handleAnswer(0);
                    }}
                    className="text-xs text-white/70 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    重置
                  </button>
                </div>
              </div>
            ) : currentQuestion?.options && currentQuestion.options.length > 0 ? (
                currentQuestion.text.includes('排序') || currentQuestion.text.includes('ranking') || currentQuestion.text.includes('依次') ? (
                  // F6: Ranking question
                  (() => {
                    const currentRanking = rankingSelections[currentQIndex] || [];
                    const maxRanks = 3; // Top 3 selections

                    const handleRankingClick = (optionLabel: string) => {
                      const newRanking = [...currentRanking];
                      const existingIndex = newRanking.indexOf(optionLabel);

                      if (existingIndex >= 0) {
                        // Remove if already selected
                        newRanking.splice(existingIndex, 1);
                      } else if (newRanking.length < maxRanks) {
                        // Add if under limit
                        newRanking.push(optionLabel);
                      }

                      setRankingSelections(prev => ({ ...prev, [currentQIndex]: newRanking }));

                      // If 3 items selected, calculate score and save answer
                      if (newRanking.length === maxRanks) {
                        // Score: 1st choice = 3 points, 2nd = 2 points, 3rd = 1 point
                        const score = newRanking.reduce((sum, label, idx) => {
                          return sum + (maxRanks - idx);
                        }, 0);
                        handleAnswer(score);
                      }
                    };

                    const handleDragStart = (e: React.DragEvent, optionLabel: string) => {
                      e.dataTransfer.setData('optionLabel', optionLabel);
                      e.dataTransfer.effectAllowed = 'move';
                    };

                    const handleDragOver = (e: React.DragEvent) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    };

                    const handleDrop = (e: React.DragEvent, targetRank: number) => {
                      e.preventDefault();
                      const optionLabel = e.dataTransfer.getData('optionLabel');

                      if (!optionLabel) return;

                      const newRanking = [...currentRanking];
                      const existingIndex = newRanking.indexOf(optionLabel);

                      // Remove from existing position if already ranked
                      if (existingIndex >= 0) {
                        newRanking.splice(existingIndex, 1);
                      }

                      // Insert at target position (targetRank is 1-based, array is 0-based)
                      newRanking.splice(targetRank - 1, 0, optionLabel);

                      // Keep only top 3
                      const finalRanking = newRanking.slice(0, maxRanks);

                      setRankingSelections(prev => ({ ...prev, [currentQIndex]: finalRanking }));

                      // If 3 items selected, calculate score and save answer
                      if (finalRanking.length === maxRanks) {
                        const score = finalRanking.reduce((sum, label, idx) => {
                          return sum + (maxRanks - idx);
                        }, 0);
                        handleAnswer(score);
                      }
                    };

                    return (
                      <div className="space-y-4">
                        <div className="text-sm text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-white/5">
                          规则：最喜欢=1，第二喜欢=2，第三喜欢=3。
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          {/* Left: Available options */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-slate-300 mb-3">可选列表</h4>
                            {currentQuestion.options.map((option: QuestionOption) => {
                              const isSelected = currentRanking.includes(option.label);
                              return (
                                <button
                                  key={option.label}
                                  draggable={!loading}
                                  onDragStart={(e) => handleDragStart(e, option.label)}
                                  onClick={() => handleRankingClick(option.label)}
                                  disabled={loading}
                                  className={`
                                    w-full p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3
                                    ${
                                      isSelected
                                        ? 'bg-violet-600/20 border-violet-500 opacity-50'
                                        : 'border-white/10 hover:border-violet-500 bg-slate-900/40 hover:bg-slate-900/60'
                                    }
                                    ${loading ? 'cursor-not-allowed' : 'cursor-move'}
                                  `}
                                >
                                  <span className="text-slate-500">⋮⋮</span>
                                  <span className="text-slate-300">{option.text}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Right: Ranking slots */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-slate-300 mb-3">你的排序</h4>
                            {[1, 2, 3].map((rank) => {
                              const selectedLabel = currentRanking[rank - 1];
                              const selectedOption = selectedLabel
                                ? currentQuestion.options?.find((opt: QuestionOption) => opt.label === selectedLabel)
                                : null;

                              return (
                                <div
                                  key={rank}
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, rank)}
                                  className="p-4 rounded-lg border-2 border-dashed border-white/10 bg-slate-900/20 min-h-[60px] flex items-center gap-3 transition-colors hover:border-violet-500/50 hover:bg-slate-900/40"
                                >
                                  <div className="w-10 h-10 rounded-full bg-violet-600/20 border-2 border-violet-500/50 flex items-center justify-center text-violet-300 font-bold flex-shrink-0">
                                    {rank}
                                  </div>
                                  {selectedOption ? (
                                    <span className="text-white font-medium">{selectedOption.text}</span>
                                  ) : (
                                    <span className="text-slate-500 text-sm italic">拖入或点击左侧选择</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) :
                // Check if all options have images (F4/F5: Image Cards/Grid templates)
                currentQuestion.options.every((opt: QuestionOption) => opt.imageUrl) ? (
                  // F4/F5: Image Cards/Grid - Display as responsive grid
                  // F4: 4 items = 2x2 grid (2 columns)
                  // F5: 5+ items = 2x3 or 3x3 grid (3 columns)
                  <div
                    className="w-full"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: currentQuestion.options.length <= 4 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                      gap: '1rem',
                      gridAutoRows: '1fr',
                      }}
                  >
                    {currentQuestion.options.map((option: QuestionOption) => (
                      <button
                        key={option.label}
                        onClick={() => handleAnswer(option.value ?? option.score, option.sub_category)}
                        disabled={loading}
                        className={`
                          w-full transition-all group text-center
                          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className="flex flex-col h-full gap-2">
                          {/* Image - smaller for F4 (4 items), square for F5 (5+ items) */}
                          <div className={`w-full rounded-lg overflow-hidden ${(currentQuestion.options?.length || 0) <= 4 ? 'aspect-[4/3]' : 'aspect-square'} ${
                            currentAnswer === option.value
                              ? 'ring-4 ring-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.5)]'
                              : 'ring-2 ring-white/10 group-hover:ring-violet-500/50'
                          } transition-all`}>
                            <img
                              src={option.imageUrl}
                              alt={option.text || option.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Label and text below image - single line format: "A. 平静" */}
                         <div
                            className={`transition-colors ${
                            currentAnswer === option.value ? 'text-white font-medium' : 'text-slate-300'
                            } h-[40px]`}  // ✅ 固定高度，避免撑高
                            >
                            <span className="text-sm leading-snug line-clamp-2">
                              {option.label}. {option.text}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  // Regular multiple choice - vertical list
                  <div className="space-y-3">
                    {currentQuestion.options.map((option: QuestionOption) => (
                      <button
                        key={option.label}
                        onClick={() => handleAnswer(option.value ?? option.score, option.sub_category)}
                        disabled={loading}
                        className={`
                          w-full p-4 rounded-xl border-2 text-left transition-all
                          ${
                            currentAnswer === option.value
                              ? 'bg-violet-600/20 border-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.3)]'
                              : 'border-white/10 hover:border-violet-500 bg-slate-900/40 hover:bg-slate-900/60'
                          }
                          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className="flex items-start gap-4">
                          <span className={`
                            flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-lg
                            ${
                              currentAnswer === option.value
                                ? 'bg-violet-600 border-violet-500 text-white'
                                : 'border-white/20 text-slate-400'
                            }
                          `}>
                            {option.label}
                          </span>
                          <span className={`
                            flex-1 text-base leading-relaxed
                            ${
                              currentAnswer === option.value
                                ? 'text-white font-medium'
                                : 'text-slate-300'
                            }
                          `}>
                            {option.text}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
            ) : (
              // Fallback to default 1-5 scale
              <div className="flex justify-between items-center gap-4">
                <div className="text-slate-500 font-medium text-sm text-left w-20">{t.test.options[0]}</div>
                <div className="flex gap-3 md:gap-6">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleAnswer(val)}
                      disabled={loading}
                      className={`
                        w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-all
                        ${
                          currentAnswer === val
                            ? 'bg-violet-600 border-violet-500 text-white scale-110 shadow-[0_0_25px_rgba(139,92,246,0.5)]'
                            : 'border-white/10 text-slate-500 hover:border-violet-500 hover:text-violet-400 bg-slate-900/40 hover:bg-slate-900/60'
                        }
                        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="text-slate-500 font-medium text-sm text-right w-20">{t.test.options[4]}</div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <button
              onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
              disabled={currentQIndex === 0}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all
                ${
                  currentQIndex === 0
                    ? 'opacity-30 cursor-not-allowed text-slate-600'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一题
            </button>

            <button
              onClick={() => {
                if (currentQIndex < totalQuestions - 1) {
                  setCurrentQIndex(currentQIndex + 1);
                }
                // On last question, do nothing - completion is handled by handleAnswer
              }}
              disabled={currentQIndex === totalQuestions - 1}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all
                ${
                  currentQIndex === totalQuestions - 1
                    ? 'opacity-30 cursor-not-allowed text-slate-600'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }
              `}
            >
              下一题
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

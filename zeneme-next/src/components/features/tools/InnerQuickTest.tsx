import React, { useState, useEffect, useRef } from 'react';
import * as Icons from '../../ui/icons';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { ClipboardList, Loader2, MessageCircle } from 'lucide-react';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { useAuthStore } from '../../../hooks/useAuthStore';
import { motion } from 'framer-motion';
import { CheckCircle2, Brain, Lightbulb, Download } from 'lucide-react';
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
import { DomainProgressBar } from './DomainProgressBar';

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

// Helper function to get user ID from auth store
function getUserIdFromAuth(): string {
  if (typeof window === 'undefined') return `guest_${Date.now()}`;

  try {
    // Read from sessionStorage where guest/auth data is stored
    const authData = window.sessionStorage.getItem('zeneme-next-auth-storage');
    if (authData) {
      const parsed = JSON.parse(authData);
      const userId = parsed.state?.user?.id;
      if (userId) {
        console.log('[InnerQuickTest] Using user_id from auth store:', userId);
        return userId;
      }
    }
  } catch (error) {
    console.error('[InnerQuickTest] Error reading auth state:', error);
  }

  // Fallback: generate temporary ID
  const fallbackId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  console.warn('[InnerQuickTest] No user in auth store, using fallback:', fallbackId);
  return fallbackId;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010';

export const InnerQuickTest: React.FC = () => {
  const { t, conversationId, sessionId, setSessionId, setConversationId, setModuleStatus, setCurrentView, setPendingModuleCompletion, addMessage, setExitAction, clearExitAction, viewingReportId, setViewingReportId } = useZenemeStore();

  // Persist debug flag from URL to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === 'true') {
      window.sessionStorage.setItem('debug', 'true');
    }
  }, []);

  // Reusable function to handle returning to conversation after completion
  const handleReturnToConversation = () => {
    const isActuallyCompleted = submissionState === 'success';
    if (isActuallyCompleted) {
      console.log('[InnerQuickTest] Return to conversation - questionnaire completed');
      setPendingModuleCompletion('quick_assessment');
    } else {
      console.log('[InnerQuickTest] Return to conversation - questionnaire NOT completed');
      // Trigger AI to acknowledge the user came back without completing
      setPendingModuleCompletion('quick_assessment_partial');
    }
    setCurrentView('chat');
  };
  const { user } = useAuthStore(); // Get user from auth store
  const [view, setView] = useState<'test' | 'result'>('test');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [highWaterMark, setHighWaterMark] = useState(0); // Tracks furthest question reached
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // NEW: Progress tracking state
  const [progressId, setProgressId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [categoryScores, setCategoryScores] = useState<Record<string, number>>({});
  const [currentAnswer, setCurrentAnswer] = useState<number | undefined>(undefined); // For UI feedback only

  // Domain progress tracking
  const [domainSummary, setDomainSummary] = useState<Record<string, { total: number; answered: number }>>({});

  // Track which question indices have been answered (for domain jumping)
  const [answeredIndices, setAnsweredIndices] = useState<Set<number>>(new Set());

  // Store answers per question index for showing selected state when navigating back
  const [answersMap, setAnswersMap] = useState<Record<number, number>>({});

  // F6 Ranking state: tracks which options are selected in which rank positions
  const [rankingSelections, setRankingSelections] = useState<Record<number, string[]>>({});

  // F7 Direction Dial state
  const [dialAngle, setDialAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);

  // Submission progress state
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'success'>('idle');

  // useEffect for setExitAction - only mark as completed if actually finished
  useEffect(() => {
    const isCompleted = submissionState === 'success';
    if (isCompleted) {
      setExitAction("the user has completed the recommended module, you can continue the conversation and continue to recommend the remaining modules. Remember not to directly recommend the remaining module, but to patiently continue the conversation and recommend the remaining modules whenever appropriate.", "quick_assessment");
    } else {
      setExitAction("用户从内视快测返回，但尚未完成全部题目。请自然地继续对话，询问用户在测试中的感受或发现，不要说用户完成了测试。", "quick_assessment_partial");
    }
    return () => {
      clearExitAction();
    };
  }, [setExitAction, clearExitAction, submissionState]);

  // Report generation state
  const [reportId, setReportId] = useState<number | null>(null);
  const [reportStatus, setReportStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | 'not_found' | ''>('');
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

  // History navigation: if viewingReportId is set, skip questionnaire and show that report
  useEffect(() => {
    if (viewingReportId == null) return;
    console.log('[InnerQuickTest] viewingReportId detected:', viewingReportId);
    const id = viewingReportId;
    setViewingReportId(null); // consume it so it doesn't re-trigger

    // Show loading state while we fetch the report
    setReportId(id);
    setReportStatus('pending');
    setSubmissionState('submitting');
    setView('result');

    (async () => {
      try {
        const status = await getPsychologyReportStatus(id);
        setReportStatus(status.status);
        setReportProgress(status.progress || 0);
        if (status.status === 'completed' && status.report_data) {
          setReportData(status.report_data);
          setSubmissionState('success');
        }
      } catch (err) {
        console.error('[InnerQuickTest] Error fetching viewed report:', err);
        setReportStatus('failed');
      }
    })();
  }, [viewingReportId, setViewingReportId]);

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
      const resetProgressOnly = async () => {
      const userId = getUserIdFromAuth();
      await fetch(`${API_BASE_URL}/api/questionnaire/progress/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, questionnaire_id: 'admin_created' }),
  });
  // 清本地状态，不 reload
  setProgressId(null);
  setQuestions([]);
  setCurrentQIndex(0);
  setCategoryScores({});
  setReportId(null);
  setReportStatus('');
  setReportData(null);
  setReportProgress(0);
  setSubmissionState('idle');
};

      if (!sessionId) {
        // Create session_id for both authenticated and guest users
        const userId = getUserIdFromAuth();
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        setSessionId(newSessionId);
        console.log('[InnerQuickTest] Created session_id for user:', userId, 'session:', newSessionId);
        return; // Wait for next render with sessionId
      }

      setLoading(true);
      try {
        const userId = getUserIdFromAuth();
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
        console.log('[InnerQuickTest] Last question:', result.questions[result.questions.length - 1]);

        setProgressId(result.progress.id);
        setQuestions(result.questions);
        if (result.domain_summary) setDomainSummary(result.domain_summary);

        const len = result.questions.length;
        const idx = result.progress.current_question_index ?? 0;

        // Check if already completed - show report, don't reset
        if (result.progress.status === 'completed' && result.progress.report_id) {
          console.log('[InnerQuickTest] Progress is completed, showing result view');
          setProgressId(result.progress.id);
          setQuestions(result.questions);
          if (result.domain_summary) setDomainSummary(result.domain_summary);
          setCurrentQIndex(idx);
          setCategoryScores(result.progress.category_scores || {});
          setReportId(result.progress.report_id);
          setHighWaterMark(idx);
          setReportStatus('completed');

          // Initialize answered indices from saved answers
          const savedAnswers = result.progress.answers || {};
          const answeredSet = new Set<number>();
          const restoredAnswers: Record<number, number> = {};
          result.questions.forEach((q: any, i: number) => {
            const key = String(q.question_number);
            if (key in savedAnswers) {
              answeredSet.add(i);
              restoredAnswers[i] = savedAnswers[key];
            }
          });
          setAnsweredIndices(answeredSet);
          setAnswersMap(restoredAnswers);
          setView('result');
          setSubmissionState('success');
          setError(null);
          setLoading(false);
          return;
        }

        // Check for stale in_progress (index beyond questions)
        if (result.progress.status === 'in_progress' && len > 0 && idx >= len) {
          console.warn('[InnerQuickTest] stale in_progress detected, resetting...', { idx, len });

          toast.warning('检测到问卷版本更新，正在为你重置进度…');

          // Reset progress and restart
          await resetProgressOnly();

          // Restart the questionnaire after reset
          console.log('[InnerQuickTest] Restarting questionnaire after reset');
          const retryResult = await startQuestionnaire({
            user_id: userId,
            session_id: currentSessionId,
            ...(typeof conversationId === 'number' ? { conversation_id: conversationId } : {}),
            questionnaire_id: 'admin_created'
          });

          if (!retryResult.ok || !retryResult.progress || !retryResult.questions) {
            throw new Error(retryResult.error || '重置后无法加载问卷');
          }

          // Use the fresh data
          setProgressId(retryResult.progress.id);
          setQuestions(retryResult.questions);
          if (retryResult.domain_summary) setDomainSummary(retryResult.domain_summary);
          setCurrentQIndex(0);
          setCategoryScores({});
          setView('test');
          setSubmissionState('idle');
          setError(null);
          setLoading(false);
          return;
        }

        // Normal in_progress - resume
        setCategoryScores(result.progress.category_scores || {});

        // Initialize answered indices from saved answers
        const savedAnswers = result.progress.answers || {};
        const answeredSet = new Set<number>();
        const restoredAnswers: Record<number, number> = {};
        result.questions.forEach((q: any, i: number) => {
          const key = String(q.question_number);
          if (key in savedAnswers) {
            answeredSet.add(i);
            restoredAnswers[i] = savedAnswers[key];
          }
        });
        setAnsweredIndices(answeredSet);
        setAnswersMap(restoredAnswers);

        // Find first unanswered question to resume from
        let resumeIdx = 0;
        for (let i = 0; i < result.questions.length; i++) {
          if (!answeredSet.has(i)) {
            resumeIdx = i;
            break;
          }
          // If all answered, stay at last
          if (i === result.questions.length - 1) resumeIdx = i;
        }
        setCurrentQIndex(resumeIdx);
        setHighWaterMark(answeredSet.size);
        setView('test');
        setSubmissionState('idle');

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

  // Restore selected answer when navigating to a previously answered question
  useEffect(() => {
    const saved = answersMap[currentQIndex];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentAnswer(saved !== undefined ? saved : undefined);
  }, [currentQIndex, answersMap]);

  const totalQuestions = questions.length;

  // NEW: Auto-save answer with progress tracking
  const handleAnswer = async (value: number, subCategory?: string) => {
    if (!progressId || !questions[currentQIndex]) return;

    const currentQuestion = questions[currentQIndex];

    // Update UI immediately for feedback
    setCurrentAnswer(value);
    setAnswersMap((prev) => ({ ...prev, [currentQIndex]: value }));

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

      // Update domain progress for the answered question
      const answeredDomain = (currentQuestion as any).domain;
      if (answeredDomain) {
        setDomainSummary((prev) => {
          const entry = prev[answeredDomain] || { total: 0, answered: 0 };
          return {
            ...prev,
            [answeredDomain]: { ...entry, answered: entry.answered + 1 },
          };
        });
      }

      // Track this question as answered
      setAnsweredIndices((prev) => new Set(prev).add(currentQIndex));
      setHighWaterMark((hw) => Math.max(hw, currentQIndex + 1));

      // Check if ALL questions are now answered
      const newAnsweredCount = answeredIndices.size + 1; // +1 for current
      if (newAnsweredCount >= totalQuestions && !result.is_completed) {
        console.log('[Questionnaire] All questions answered locally — triggering backend completion');
        // Call backend to force completion check
        try {
          const completeRes = await fetch(`${API_BASE_URL}/api/questionnaire/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ progress_id: progressId }),
          });
          const completeData = await completeRes.json();
          if (completeData.ok && completeData.report_id) {
            setReportId(completeData.report_id);
            setReportStatus('pending');
            setSubmissionState('submitting');
            setView('result');
            return;
          }
        } catch (err) {
          console.error('[Questionnaire] Backend completion call failed:', err);
        }
        // Fallback: show result view anyway
        setSubmissionState('submitting');
        setReportStatus('pending');
        setView('result');
        return;
      }

      // Check if completed (from backend response)
      if (result.is_completed && result.report_id) {
        console.log('[Questionnaire Completed]', { report_id: result.report_id });
        setReportId(result.report_id);
        setReportStatus('pending');
        setSubmissionState('submitting');
        setView('result');
        return;
      }

      // Auto-advance: find next unanswered question (not just currentQIndex + 1)
      // This handles domain jumping where the next sequential question may already be answered
      if (currentQIndex < totalQuestions - 1) {
        setTimeout(() => {
          setCurrentQIndex((prev) => {
            const next = prev + 1;
            setHighWaterMark((hw) => Math.max(hw, next));
            return next;
          });
          setCurrentAnswer(undefined);
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
      const userId = getUserIdFromAuth();
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

        <div className="h-full overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar relative z-10">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">

            {/* 顶部 Header：套用设计师的 Grid 和动画，保留你的文案 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-violet-900/40 to-[#0E1630]/60 border border-violet-500/20 relative overflow-hidden group">
                <div className="absolute inset-0 bg-violet-500/5 group-hover:bg-violet-500/10 transition-colors" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-wide">感谢你完成我们 ZeneWe「心理能」内视快测</h3>
                  <p className="text-slate-300 leading-relaxed font-light mb-6">
                    以下是你的心理能力评估结果。这份报告基于你的回答，展示了你在五个核心心理维度上的表现。
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                      <CheckCircle2 size={14} /> 已完成分析
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-2xl flex flex-col items-center justify-center text-center bg-slate-900/40 border border-white/10">
                <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4 border border-violet-500/20">
                  <Brain size={24} />
                </div>
                <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">能力摘要</h4>
                <div className="text-2xl font-bold text-white mb-2">五维已生成</div>
              </motion.div>
            </div>

            {/* 雷达图：套用设计师的容器，内部完全使用你的本地 <img> 逻辑 */}
            {reportId && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl bg-slate-900/40 border border-white/10">
                <h2 className="text-xl font-bold text-white mb-6 text-center">五维心理能力雷达图</h2>
                <div className="w-full relative flex justify-center items-center" style={{ minHeight: 350 }}>
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
              </motion.div>
            )}

            {/* 五大维度详解：使用你的真实数据，完全对齐设计师的文本与排版 */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Lightbulb size={18} className="text-violet-500" /> 五维解析
              </h3>
              <div className="space-y-4">
                {[
                  {
                    leftLabel: '情绪调节能力指数',
                    score: reportData.mind_indices?.emotional_regulation || 0,
                    phase: '情绪觉察发展阶段',
                    desc: '能够觉察到部分情绪变化，但调节能力仍不稳定。',
                  },
                  {
                    leftLabel: '认知灵活度指数',
                    score: reportData.mind_indices?.cognitive_flexibility || 0,
                    phase: '灵活思维整合阶段',
                    desc: '能主动切换视角分析问题，愿意修正原有看法。',
                  },
                  {
                    leftLabel: '关系敏感度指数',
                    score: reportData.mind_indices?.relational_sensitivity || 0,
                    phase: '关系平衡调整阶段',
                    desc: '具备较强的共情能力，能敏锐捕捉他人情绪与需求。',
                  },
                  {
                    leftLabel: '内在冲突度指数',
                    score: reportData.mind_indices?.inner_conflict || 0,
                    phase: '冲突显化整合阶段',
                    desc: '内在常存在“想要”与“应该”之间的拉扯。',
                  },
                  {
                    leftLabel: '成长潜能指数',
                    score: reportData.mind_indices?.growth_potential || 0,
                    phase: '潜能绽放阶段',
                    desc: '成长已成为内在驱动力，拥有强烈的自我探索与心理韧性。',
                  }
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="p-5 rounded-xl hover:border-violet-500/20 transition-all group bg-[#0E1630]/80 border border-white/5"
                  >
                    {/* 👇 退回设计师原本的 Flex 布局，去除所有多余的 w-full 👇 */}
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start">

                      {/* 左侧：使用设计师的原版 class，保证大屏竖排定宽，小屏横排 */}
                      <div className="flex-shrink-0 flex md:flex-col items-center gap-3 md:gap-1 md:w-32 md:border-r md:border-white/10 md:pr-4">
                        <div className="text-4xl font-bold text-violet-400">{item.score}</div>
                        <div className="text-xs text-slate-400 font-medium text-center">{item.leftLabel}</div>
                      </div>

                      {/* 右侧：纯粹的 flex-1，自动填满剩余空间 */}
                      <div className="flex-1">
                        <div className="text-base font-semibold text-white mb-2 tracking-wide flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 block" />
                          {item.phase}
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed font-light">{item.desc}</p>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 底部按钮区：你的下载逻辑 + 你的返回/重测逻辑，套用设计师的排版 */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="pt-4 pb-12 flex flex-col items-center gap-6">

              {/* 主下载按钮 - 你的逻辑 */}
              <Button
                size="lg"
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
                className="w-full md:w-[60%] h-14 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center gap-2"
              >
                <Download size={20} /> 下载完整报告 (DOCX)
              </Button>

              {/* 你的重测与返回对话按钮 - 你的逻辑，排版居中 */}
              <div className="flex flex-wrap gap-4 justify-center w-full">
                <Button
                  variant="outline"
                  onClick={resetTest}
                  className="bg-transparent border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  <SafeIcon icon={Icons.RefreshCcw} className="mr-2 h-4 w-4" />
                  重新测试
                </Button>
                <Button
                  onClick={handleReturnToConversation}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  返回对话
                </Button>
              </div>

            </motion.div>
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
                  console.log('[InnerQuickTest] Return to conversation from result view');
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

  // Jump to first unanswered question in a domain
  const handleDomainSelect = (domainCode: string) => {
    const hasBackendDomains = questions.some((q: any) => q.domain);

    if (hasBackendDomains) {
      // Find first unanswered question in this domain
      const targetIdx = questions.findIndex(
        (q: any, idx: number) => q.domain === domainCode && !answeredIndices.has(idx)
      );
      // If all answered, jump to first question in domain
      const fallbackIdx = questions.findIndex((q: any) => q.domain === domainCode);
      const jumpTo = targetIdx >= 0 ? targetIdx : (fallbackIdx >= 0 ? fallbackIdx : -1);

      if (jumpTo >= 0 && jumpTo !== currentQIndex) {
        setCurrentQIndex(jumpTo);
        setCurrentAnswer(undefined);
      }
    } else {
      // Fallback: use sequential ranges
      const WEIGHTS = [10, 46, 27, 0, 6];
      const CODES = ['2.1', '2.2', '2.3', '2.4', '2.5'];
      const totalW = WEIGHTS.reduce((a, b) => a + b, 0);
      let cursor = 0;
      for (let i = 0; i < CODES.length; i++) {
        const count = Math.round((WEIGHTS[i] / totalW) * totalQuestions);
        if (CODES[i] === domainCode) {
          // Find first unanswered within this range
          let jumpTo = -1;
          for (let j = cursor; j < cursor + count; j++) {
            if (!answeredIndices.has(j)) {
              jumpTo = j;
              break;
            }
          }
          // If all answered in this domain, jump to domain start
          if (jumpTo < 0) jumpTo = cursor;

          if (jumpTo !== currentQIndex) {
            setCurrentQIndex(jumpTo);
            setCurrentAnswer(undefined);
          }
          break;
        }
        cursor += count;
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent">

      {/* 修复点 1: 移除外层滚动容器的 justify-center，避免内容超长时顶部被吞掉无法滚动 */}
      <div className="flex-1 flex flex-col items-center p-2 md:p-8 overflow-y-auto gap-5 md:gap-6">

        {/* Domain progress — separate section above the card */}
        <DomainProgressBar
          totalQuestions={totalQuestions}
          currentIndex={currentQIndex}
          highWaterMark={highWaterMark}
          currentDomain={(currentQuestion as any)?.domain ?? null}
          domainSummary={domainSummary}
          answeredIndices={answeredIndices}
          onDomainSelect={handleDomainSelect}
        />

        {/* 卡片容器：利用 my-auto 替代 justify-center 实现安全居中 */}
        <div className="w-full max-w-3xl space-y-3 md:space-y-6 backdrop-blur-xl px-4 py-4 md:px-10 md:py-8 lg:p-10 rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl mt-[8vh] md:my-auto relative">

          {/* --- 头部区域：题目文本 --- */}
          <div className="space-y-3 text-left w-full">
            <h3 className="text-lg md:text-3xl font-semibold text-white leading-snug drop-shadow-lg">
              {typeof window !== 'undefined' && (
                window.sessionStorage.getItem('debug') === 'true' ||
                new URLSearchParams(window.location.search).get('debug') === 'true'
              ) && (
                <span className="text-xs md:text-sm font-normal text-slate-500 mr-1">{(currentQuestion as any)?.question_number || currentQuestion?.id}.</span>
              )}
              {currentQuestion?.text}
            </h3>
            {currentQuestion?.category && typeof window !== 'undefined' && (
              window.sessionStorage.getItem('debug') === 'true' ||
              new URLSearchParams(window.location.search).get('debug') === 'true'
            ) && (
              <span className="inline-block text-[10px] text-violet-300/60 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md mt-1">
                {currentQuestion.category}
              </span>
            )}

            {currentQuestion?.subtitle && (
              <p className="text-sm text-slate-300 mt-2">
                {currentQuestion.subtitle}
              </p>
            )}
          </div>

          {/* --- 媒体展示区域 --- */}
          {currentQuestion?.mediaUrl && currentQuestion.template !== 'F7' && (
            <div className="w-full flex justify-center pt-2">
              <div className="w-full md:w-[90%] max-w-xl rounded-2xl overflow-hidden border border-white/10 shadow-lg mx-auto h-[140px] md:h-[180px] relative flex-shrink-0 bg-slate-800/50">
                {currentQuestion.mediaType === 'video' ? (
                  <video
                    src={currentQuestion.mediaUrl}
                    controls
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={currentQuestion.mediaUrl}
                    alt="Question media"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                )}
              </div>
            </div>
          )}

          {/* --- 选项区域 --- */}
          <div className="max-w-2xl mx-auto w-full pt-4">
            {(currentQuestion.template === 'F9' || currentQuestion.templateSettings?.leftTrait) ? (
              // F9: MBTI Spectrum — left trait vs right trait, 5-point scale
              <div className="space-y-4 md:space-y-6 w-full">
                {/* Left trait — vs — Right trait */}
                <div className="flex items-center justify-between w-full px-1">
                  <span className="text-blue-400 font-medium text-sm md:text-base">{currentQuestion.templateSettings?.leftTrait || 'Left'}</span>
                  <span className="text-slate-500 text-xs">—— vs ——</span>
                  <span className="text-purple-400 font-medium text-sm md:text-base">{currentQuestion.templateSettings?.rightTrait || 'Right'}</span>
                </div>

                {/* 5 numbered boxes — V-shape: Bigger, Big, Normal, Big, Bigger */}
                <div className="flex justify-center items-end gap-2 md:gap-4 w-full">
                  {[1, 2, 3, 4, 5].map((value, idx) => {
                    const isSelected = currentAnswer === value;
                    const isLeft = value < 3;
                    const isRight = value > 3;
                    const borderColor = isSelected
                      ? (isLeft ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)]' : isRight ? 'border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : 'border-slate-400 shadow-[0_0_20px_rgba(148,163,184,0.3)]')
                      : (isLeft ? 'border-blue-500/30 hover:border-blue-400' : isRight ? 'border-purple-500/30 hover:border-purple-400' : 'border-white/20 hover:border-slate-400');
                    const bgColor = isSelected
                      ? (isLeft ? 'bg-blue-500/20' : isRight ? 'bg-purple-500/20' : 'bg-white/10')
                      : 'bg-transparent hover:bg-white/5';
                    const textColor = isLeft ? 'text-blue-400' : isRight ? 'text-purple-400' : 'text-slate-400';

                    // V-shape sizes: Bigger(1), Big(2), Normal(3), Big(4), Bigger(5)
                    const sizeClasses = [
                      "w-[64px] h-[64px] md:w-[96px] md:h-[96px]",
                      "w-[52px] h-[52px] md:w-[80px] md:h-[80px]",
                      "w-[44px] h-[44px] md:w-[64px] md:h-[64px]",
                      "w-[52px] h-[52px] md:w-[80px] md:h-[80px]",
                      "w-[64px] h-[64px] md:w-[96px] md:h-[96px]"
                    ];

                    return (
                      <div key={value} className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => handleAnswer(value)}
                          disabled={loading}
                          className={`
                            ${sizeClasses[idx]}
                            rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all
                            text-lg md:text-xl font-bold
                            ${borderColor} ${bgColor} ${textColor}
                            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {value}
                        </button>
                        <span className="text-slate-400 font-medium text-[10px] md:text-xs text-center whitespace-nowrap">
                          {['总是如此', '经常如此', '视情况而定', '经常如此', '总是如此'][idx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : currentQuestion.template === 'F1' ? (
              <div className="space-y-4 md:space-y-6 w-full flex flex-col items-center">
                <div className="flex justify-between items-end w-full">
                  {[1, 2, 3, 4, 5].map((value, idx) => {
                    const sizeClasses = [
                      "w-[56px] h-[56px] md:w-[96px] md:h-[96px]",
                      "w-[48px] h-[48px] md:w-[80px] md:h-[80px]",
                      "w-[40px] h-[40px] md:w-[64px] md:h-[64px]",
                      "w-[48px] h-[48px] md:w-[80px] md:h-[80px]",
                      "w-[56px] h-[56px] md:w-[96px] md:h-[96px]"
                    ];
                    const currentSizeClass = sizeClasses[idx];

                    return (
                      <button
                        key={value}
                        onClick={() => handleAnswer(value)}
                        disabled={loading}
                        className={`
                          rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                          ${currentSizeClass}
                          ${
                            currentAnswer === value
                              ? 'bg-violet-600 border-violet-500 shadow-[0_0_25px_rgba(139,92,246,0.5)]'
                              : 'border-white/30 hover:border-violet-400 bg-transparent hover:bg-white/5'
                          }
                          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between items-start w-full">
                  <div className="text-slate-300 font-medium text-[10px] md:text-sm whitespace-nowrap text-center" style={{ width: '56px' }}>
                    {(currentQuestion as any)?.templateSettings?.leftLabel || '非常不同意'}
                  </div>
                  <div className="text-slate-300 font-medium text-[10px] md:text-sm whitespace-nowrap text-center" style={{ width: '56px' }}>
                    {(currentQuestion as any)?.templateSettings?.rightLabel || '非常同意'}
                  </div>
                </div>
              </div>
            ) : currentQuestion.template === 'F7' ? (
              // F7: Direction Dial 0-360 (Spatial Scene with Compass)
              // 修复 2：使用 grid-cols-2 实现左右分栏布局
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center justify-center pt-4 pb-8">

                {/* --- 左侧：场景地图区域 --- */}
                {(() => {
                  const defaultItems = [
                    { id: 'car', type: 'car', x: 35, y: 25 },
                    { id: 'sign', type: 'sign', x: 65, y: 30 },
                    { id: 'house', type: 'house', x: 20, y: 60 },
                    { id: 'cat', type: 'cat', x: 50, y: 65 },
                    { id: 'traffic', type: 'traffic_light', x: 85, y: 55 },
                    { id: 'flower', type: 'flower', x: 30, y: 85 },
                    { id: 'tree', type: 'tree', x: 80, y: 80 },
                  ];

                  const iconMap: Record<string, string> = {
                    house: '🏠', cat: '🐱', tree: '🌳', car: '🚗',
                    sign: '🛑', traffic_light: '🚦', flower: '🌸',
                  };

                  return (
                    // 修复 3：不再用巨大的固定高度，改用 aspect-square 保持完美的正方形比例
                    <div className="relative w-full aspect-square max-w-[320px] mx-auto bg-slate-800/60 rounded-[2rem] border border-white/5 shadow-inner overflow-hidden flex-shrink-0">
                      {defaultItems.map((item) => {
                        const icon = iconMap[item.type] || '🏠';
                        return (
                          <div
                            key={item.id}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300"
                            style={{
                              left: `${item.x}%`,
                              top: `${item.y}%`,
                              width: '40px',
                              height: '40px',
                            }}
                          >
                            <span className="text-2xl drop-shadow-md opacity-80">{icon}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* --- 右侧：极简罗盘交互区域 --- */}
                <div className="flex flex-col items-center gap-6 w-full">
                  <div
                    ref={dialRef}
                    style={{
                      width: '260px',
                      height: '260px',
                      background: '#1A1C29', // 对齐设计师的深色雷达底色
                      border: '2px solid rgba(255,255,255,0.05)',
                      borderRadius: '50%',
                      position: 'relative',
                      cursor: 'pointer',
                      touchAction: 'none',
                      boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)'
                    }}
                    onPointerDown={(e) => {
                      setIsDragging(true);
                      if (!dialRef.current) return;
                      const rect = dialRef.current.getBoundingClientRect();
                      const cx = rect.left + rect.width / 2;
                      const cy = rect.top + rect.height / 2;
                      const dx = e.clientX - cx;
                      const cy_diff = e.clientY - cy;
                      let deg = Math.atan2(cy_diff, dx) * (180 / Math.PI);
                      deg += 90;
                      if (deg < 0) deg += 360;
                      setDialAngle(Math.round(deg));
                    }}
                  >
                    {/* 雷达刻度线 (米字形贯穿) */}
                    {[0, 45, 90, 135].map(deg => (
                      <div
                        key={deg}
                        style={{
                          position: 'absolute', top: 0, left: '50%',
                          width: '1px', height: '100%',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          transform: `translateX(-50%) rotate(${deg}deg)`
                        }}
                      />
                    ))}

                    {/* 雷达中间的辅助同心圆 */}
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      width: '80px', height: '80px',
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transform: 'translate(-50%, -50%)',
                      pointerEvents: 'none'
                    }} />

                    {/* 紫色极简指针 */}
                    <div
                      style={{
                        position: 'absolute', top: '50%', left: '50%',
                        width: '3px', height: '50%',
                        backgroundColor: '#a78bfa',
                        transformOrigin: 'bottom',
                        transform: `translate(-50%, -100%) rotate(${dialAngle}deg)`,
                        transition: 'transform 75ms'
                      }}
                    >
                      {/* 指针顶部水滴/圆点设计 */}
                      <div style={{
                        position: 'absolute', top: '-6px', left: '50%',
                        transform: 'translateX(-50%)',
                        width: '14px', height: '18px',
                        backgroundColor: '#a78bfa',
                        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', // 水滴形状
                        boxShadow: '0 0 15px rgba(167, 139, 250, 0.8)'
                      }} />
                    </div>

                    {/* 中心度数气泡 */}
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      width: '40px', height: '40px',
                      backgroundColor: '#1A1C29',
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.1)',
                      transform: 'translate(-50%, -50%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      pointerEvents: 'none'
                    }}>
                      <span style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: 'bold' }}>
                        {Math.round(dialAngle)}°
                      </span>
                    </div>
                  </div>

                  {/* 重置按钮 */}
                  <button
                    onClick={() => {
                      setDialAngle(0);
                      handleAnswer(0);
                    }}
                    className="text-sm text-slate-400 hover:text-white transition-all px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

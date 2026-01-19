import React, { useState, useEffect } from 'react';
import * as Icons from '../../ui/icons';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { ClipboardList, Loader2 } from 'lucide-react';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import {
  getAllQuestionnaires,
  getQuestionnaire,
  submitQuestionnaireResponse,
  sendChatMessage,
  type QuestionnaireDetail,
  type QuestionOption,
  type QuestionnaireSubmissionResult
} from '../../../lib/api';
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

export const InnerQuickTest: React.FC = () => {
  const { t, conversationId, sessionId, setSessionId, setConversationId } = useZenemeStore();
  const [view, setView] = useState<'test' | 'result'>('test');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<QuestionnaireDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scoringResults, setScoringResults] = useState<Array<{
    questionnaire_id: string;
    title: string;
    section: string;
    total_score: number;
    category_scores?: Record<string, number | { sub_section?: string; category?: string; score?: number; count?: number }>;
    interpretation?: string | { level?: string; description?: string; score_range?: number[] } | null;
  }>>([]);

  // Debug: Log conversationId
  useEffect(() => {
    console.log('[InnerQuickTest] conversationId:', conversationId);
    console.log('[InnerQuickTest] sessionId:', sessionId);
  }, [conversationId, sessionId]);

  // Auto-create conversation if it doesn't exist
  useEffect(() => {
    const createConversationIfNeeded = async () => {
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
            throw new Error('未能获取会话ID');
          }
        } catch (error) {
          console.error('[InnerQuickTest] Failed to create conversation:', error);
          setError('无法创建会话，请刷新页面重试');
          toast.error('无法创建会话，请刷新页面重试');
        }
      }
    };

    createConversationIfNeeded();
  }, [conversationId, sessionId, setSessionId, setConversationId]);

  // Fetch all questionnaires on component mount and combine them
  useEffect(() => {
    const fetchAndCombineQuestionnaires = async () => {
      setLoading(true);
      try {
        const result = await getAllQuestionnaires();
        if (!result.ok || !result.questionnaires || result.questionnaires.length === 0) {
          throw new Error('无法加载问卷列表');
        }

        // Fetch all questionnaires and combine their questions
        const allQuestions: any[] = [];
        const questionnaireMetadata: Array<{ id: string; start: number; end: number; section: string; title: string }> = [];

        for (const q of result.questionnaires) {
          const detailResult = await getQuestionnaire(q.id);
          if (detailResult.ok && detailResult.questionnaire) {
            const startIndex = allQuestions.length;
            allQuestions.push(...detailResult.questionnaire.questions);
            const endIndex = allQuestions.length - 1;
            questionnaireMetadata.push({
              id: q.id,
              start: startIndex,
              end: endIndex,
              section: q.section,
              title: q.title
            });
          }
        }

        // Create a combined questionnaire
        const combinedQuestionnaire: QuestionnaireDetail = {
          id: 'combined_all',
          section: '综合',
          title: '完整心理评估 (Complete Psychological Assessment)',
          total_questions: allQuestions.length,
          marking_criteria: {
            scale: "综合评估",
            total_score_range: [0, 0],
            interpretation: []
          },
          questions: allQuestions
        };

        // Store metadata for splitting answers later
        (combinedQuestionnaire as any).metadata = { questionnaireMetadata };

        setSelectedQuestionnaire(combinedQuestionnaire);
        setError(null);
      } catch (err) {
        console.error('Error loading questionnaires:', err);
        setError(err instanceof Error ? err.message : '加载问卷失败');
        toast.error('加载问卷失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };

    fetchAndCombineQuestionnaires();
  }, []);

  const totalQuestions = selectedQuestionnaire?.questions.length || 0;

  const handleAnswer = async (value: number) => {
    if (!selectedQuestionnaire) return;

    setAnswers((prev) => ({ ...prev, [currentQIndex]: value }));

    if (currentQIndex < totalQuestions - 1) {
      setTimeout(() => setCurrentQIndex((prev) => prev + 1), 200);
    } else {
      // Complete the test and submit to backend
      if (!conversationId) {
        console.error('[InnerQuickTest] No conversationId available for submission');
        toast.error('无法提交：未找到会话ID。请刷新页面重试。');

        // Try to create conversation one more time
        try {
          const currentSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
          if (!sessionId) {
            setSessionId(currentSessionId);
          }

          const response = await sendChatMessage({
            message: '开始心理评估',
            session_id: currentSessionId
          });

          if (response.conversation_id) {
            setConversationId(response.conversation_id);
            toast.success('会话已创建，请再次点击提交');
          }
        } catch (error) {
          console.error('[InnerQuickTest] Failed to create conversation on retry:', error);
        }
        return;
      }

      setLoading(true);
      setView('result'); // Show result view immediately to display loading state

      try {
        // Add the last answer
        const allAnswers = { ...answers, [currentQIndex]: value };

        // Get questionnaire metadata to split answers
        const metadata = (selectedQuestionnaire as any).metadata?.questionnaireMetadata || [];

        const results: Array<{
          questionnaire_id: string;
          title: string;
          section: string;
          total_score: number;
          category_scores?: Record<string, number | { sub_section?: string; category?: string; score?: number; count?: number }>;
          interpretation?: string | { level?: string; description?: string; score_range?: number[] } | null;
        }> = [];

        // Submit each questionnaire separately and collect results
        for (const qMeta of metadata) {
          const questionnaireAnswers: Record<string, number> = {};

          // Extract answers for this questionnaire
          for (let i = qMeta.start; i <= qMeta.end; i++) {
            if (allAnswers[i] !== undefined) {
              const questionId = selectedQuestionnaire.questions[i].id;
              questionnaireAnswers[questionId.toString()] = allAnswers[i];
            }
          }

          // Submit this questionnaire's responses
          console.log(`[Submitting Questionnaire ${qMeta.id}]`, {
            questionnaire_id: qMeta.id,
            conversation_id: conversationId,
            question_count: Object.keys(questionnaireAnswers).length,
            answers_sample: Object.keys(questionnaireAnswers).slice(0, 3)
          });

          const result = await submitQuestionnaireResponse(conversationId, {
            questionnaire_id: qMeta.id,
            answers: questionnaireAnswers,
            metadata: {
              total_questions: qMeta.end - qMeta.start + 1,
              completed_at: new Date().toISOString(),
              part_of_combined: true,
              section: qMeta.section,
              title: qMeta.title
            }
          });

          if (result.ok && result.scoring) {
            console.log(`[Questionnaire ${qMeta.id} Submitted Successfully]`, {
              questionnaire_id: qMeta.id,
              total_score: result.scoring.total_score,
              category_scores: result.scoring.category_scores
            });

            // Store the scoring result
            results.push({
              questionnaire_id: qMeta.id,
              title: qMeta.title,
              section: qMeta.section,
              total_score: result.scoring.total_score,
              category_scores: result.scoring.category_scores,
              interpretation: result.scoring.interpretation
            });
          } else {
            console.error(`[Questionnaire ${qMeta.id} Submission Failed]`, result);
            toast.error(`问卷 ${qMeta.section} 提交失败: ${result.error || '未知错误'}`);
          }
        }

        // Store all scoring results
        setScoringResults(results);

        if (results.length > 0) {
          toast.success(`成功提交 ${results.length} 个问卷并计算分数！`);
        } else {
          toast.error('所有问卷提交失败，请重试');
        }
      } catch (error) {
        console.error('Error submitting questionnaires:', error);
        toast.error('提交问卷时出错: ' + (error instanceof Error ? error.message : '未知错误'));
      } finally {
        setLoading(false);
      }
    }
  };

  const resetTest = () => {
    setView('test');
    setCurrentQIndex(0);
    setAnswers({});
    setScoringResults([]);
  };

  // Show loading state
  if (loading && !selectedQuestionnaire) {
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
  if (error && !selectedQuestionnaire) {
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
            </div>
          </header>

          {scoringResults.length > 0 ? (
            <div className="space-y-6">
              {/* Overall Summary */}
              <Card className="p-6 space-y-4 border-l-4 border-l-violet-500 bg-slate-900/40 border-t-white/5 border-r-white/5 border-b-white/5 backdrop-blur-md shadow-lg">
                <h3 className="font-semibold text-lg text-white tracking-wide">综合评估</h3>
                <p className="text-slate-300 leading-relaxed">
                  您已完成 {scoringResults.length} 个心理评估问卷，共 {totalQuestions} 道题目。
                  以下是您的详细评估结果：
                </p>
              </Card>

              {/* Individual Questionnaire Results */}
              {scoringResults.map((result) => (
                <Card key={result.questionnaire_id} className="p-6 space-y-4 bg-slate-900/40 border-white/5 backdrop-blur-md shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-white">{result.title}</h3>
                      <p className="text-sm text-slate-400">问卷 {result.section}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-violet-400">{result.total_score}</div>
                      <div className="text-xs text-slate-400">总分</div>
                    </div>
                  </div>

                  {/* Category Scores */}
                  {result.category_scores && Object.keys(result.category_scores).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-300">分类得分：</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(result.category_scores).map(([category, scoreData]) => {
                          // Handle both number and object formats
                          const scoreValue = typeof scoreData === 'number'
                            ? scoreData
                            : typeof scoreData === 'object' && scoreData !== null
                              ? (scoreData as any).score || 0
                              : 0;

                          return (
                            <div key={category} className="bg-slate-800/50 p-3 rounded-lg">
                              <div className="text-xs text-slate-400">{category}</div>
                              <div className="text-xl font-bold text-white">{scoreValue}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Interpretation */}
                  {result.interpretation && (
                    <div className="mt-4 p-4 bg-violet-500/10 rounded-lg border border-violet-500/20">
                      <h4 className="text-sm font-semibold text-violet-300 mb-2">评估解读：</h4>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {typeof result.interpretation === 'string'
                          ? result.interpretation
                          : typeof result.interpretation === 'object' && result.interpretation !== null
                            ? (result.interpretation as any).description || JSON.stringify(result.interpretation)
                            : '暂无解读'}
                      </p>
                    </div>
                  )}
                </Card>
              ))}

              {/* Next Steps */}
              <Card className="p-6 space-y-4 bg-gradient-to-br from-violet-900/20 to-purple-900/20 border-white/5 backdrop-blur-md shadow-lg">
                <h3 className="font-semibold text-lg text-white tracking-wide">下一步建议</h3>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-1">•</span>
                    <span>您可以保存此报告以便日后查看和对比</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-1">•</span>
                    <span>建议与心理咨询师分享您的评估结果，获得专业指导</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-400 mt-1">•</span>
                    <span>定期进行评估可以帮助您追踪心理健康状态的变化</span>
                  </li>
                </ul>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center space-y-4 bg-slate-900/40 border-white/5 backdrop-blur-md shadow-lg">
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-violet-400" />
              <p className="text-slate-400">正在生成评估报告...</p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Test View
  if (!selectedQuestionnaire) {
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
  const currentQuestion = selectedQuestionnaire.questions[currentQIndex];

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="w-full h-1 bg-white/5">
        <div
          className="h-full bg-violet-500 shadow-[0_0_10px_rgba(139,92,246,0.8)] transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-12 backdrop-blur-sm p-8 rounded-3xl border border-white/5 bg-slate-900/20 shadow-2xl">
          <div className="space-y-4 text-center">
            <span className="text-violet-400 font-semibold tracking-widest text-xs uppercase">
              {t.test.question} {currentQIndex + 1} / {totalQuestions}
            </span>
            <h3 className="text-3xl md:text-4xl font-medium text-white leading-tight drop-shadow-lg">
              {currentQuestion?.text}
            </h3>
          </div>

          <div className="space-y-6 max-w-2xl mx-auto w-full">
            {currentQuestion?.options && currentQuestion.options.length > 0 ? (
              // Check if this is a multiple-choice question (has text field) or Likert scale (no text field)
              currentQuestion.options[0]?.text ? (
                // Multiple choice with text descriptions (A, B, C format)
                <div className="space-y-4">
                  {currentQuestion.options.map((option: QuestionOption) => (
                    <button
                      key={option.label}
                      onClick={() => handleAnswer(option.score)}
                      disabled={loading}
                      className={`
                        w-full p-6 rounded-xl border-2 text-left transition-all
                        ${
                          answers[currentQIndex] === option.score
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
                            answers[currentQIndex] === option.score
                              ? 'bg-violet-600 border-violet-500 text-white'
                              : 'border-white/20 text-slate-400'
                          }
                        `}>
                          {option.label}
                        </span>
                        <span className={`
                          flex-1 text-base leading-relaxed
                          ${
                            answers[currentQIndex] === option.score
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
              ) : (
                // Likert scale with labels (1-5 format or 0-4 format)
                <div className="flex justify-between items-center gap-4">
                  <div className="text-slate-500 font-medium text-sm text-left w-24 flex-shrink-0">
                    {currentQuestion.options[0]?.label || ''}
                  </div>
                  <div className="flex gap-3 md:gap-6 flex-1 justify-center">
                    {currentQuestion.options.map((option: QuestionOption) => (
                      <button
                        key={option.value}
                        onClick={() => handleAnswer(option.value!)}
                        disabled={loading}
                        className={`
                          w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-all
                          ${
                            answers[currentQIndex] === option.value
                              ? 'bg-violet-600 border-violet-500 text-white scale-110 shadow-[0_0_25px_rgba(139,92,246,0.5)]'
                              : 'border-white/10 text-slate-500 hover:border-violet-500 hover:text-violet-400 bg-slate-900/40 hover:bg-slate-900/60'
                          }
                          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        title={option.label}
                      >
                        {option.value}
                      </button>
                    ))}
                  </div>
                  <div className="text-slate-500 font-medium text-sm text-right w-24 flex-shrink-0">
                    {currentQuestion.options[currentQuestion.options.length - 1]?.label || ''}
                  </div>
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
                          answers[currentQIndex] === val
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
        </div>
      </div>
    </div>
  );
};

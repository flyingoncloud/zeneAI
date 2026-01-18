import React, { useState, useMemo, useEffect } from 'react';
import * as Icons from '../../ui/icons';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { ClipboardList, Loader2, ChevronRight } from 'lucide-react';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import {
  getAllQuestionnaires,
  getQuestionnaire,
  submitQuestionnaireResponse,
  type QuestionnaireDetail,
  type Questionnaire
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
  const { t, conversationId } = useZenemeStore();
  const [view, setView] = useState<'selection' | 'test' | 'result'>('selection');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<QuestionnaireDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all questionnaires on component mount
  useEffect(() => {
    const fetchQuestionnaires = async () => {
      setLoading(true);
      try {
        const result = await getAllQuestionnaires();
        if (!result.ok || !result.questionnaires || result.questionnaires.length === 0) {
          throw new Error('无法加载问卷列表');
        }

        setQuestionnaires(result.questionnaires);
        setError(null);
      } catch (err) {
        console.error('Error loading questionnaires:', err);
        setError(err instanceof Error ? err.message : '加载问卷失败');
        toast.error('加载问卷失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionnaires();
  }, []);

  const totalQuestions = selectedQuestionnaire?.questions.length || 0;

  const handleSelectQuestionnaire = async (questionnaireId: string) => {
    setLoading(true);
    try {
      const result = await getQuestionnaire(questionnaireId);
      if (!result.ok || !result.questionnaire) {
        throw new Error('无法加载问卷详情');
      }

      setSelectedQuestionnaire(result.questionnaire);
      setView('test');
      setCurrentQIndex(0);
      setAnswers({});
      setError(null);
    } catch (err) {
      console.error('Error loading questionnaire:', err);
      setError(err instanceof Error ? err.message : '加载问卷失败');
      toast.error('加载问卷失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (value: number) => {
    if (!selectedQuestionnaire) return;

    setAnswers((prev) => ({ ...prev, [currentQIndex]: value }));

    if (currentQIndex < totalQuestions - 1) {
      setTimeout(() => setCurrentQIndex((prev) => prev + 1), 200);
    } else {
      // Complete the test and submit to backend
      if (conversationId) {
        setLoading(true);
        try {
          // Convert answers to the format expected by backend
          const formattedAnswers: Record<string, number> = {};
          Object.entries(answers).forEach(([index, value]) => {
            const questionId = selectedQuestionnaire.questions[parseInt(index)].id;
            formattedAnswers[questionId.toString()] = value;
          });
          // Add the last answer
          const lastQuestionId = selectedQuestionnaire.questions[currentQIndex].id;
          formattedAnswers[lastQuestionId.toString()] = value;

          const result = await submitQuestionnaireResponse(conversationId, {
            questionnaire_id: selectedQuestionnaire.id,
            answers: formattedAnswers,
            metadata: {
              total_questions: totalQuestions,
              completed_at: new Date().toISOString()
            }
          });

          if (result.ok) {
            console.log('[Questionnaire Submitted]', {
              questionnaire_id: selectedQuestionnaire.id,
              conversation_id: conversationId,
              module_completed: result.module_completed,
              timestamp: new Date().toISOString()
            });
            toast.success('问卷已成功提交！');
          } else {
            toast.error('保存测试结果失败，但您的测试已完成');
          }
        } catch (error) {
          console.error('Error submitting questionnaire:', error);
          toast.error('提交问卷时出错');
        } finally {
          setLoading(false);
        }
      }
      setView('result');
    }
  };

  const resetTest = () => {
    setView('selection');
    setCurrentQIndex(0);
    setAnswers({});
    setSelectedQuestionnaire(null);
  };

  // Mock data for the chart based on "results" using translated labels
  const data = useMemo(() => [
    { subject: t.test.labels.stability, A: 120, fullMark: 150 },
    { subject: t.test.labels.selfAwareness, A: 98, fullMark: 150 },
    { subject: t.test.labels.resilience, A: 86, fullMark: 150 },
    { subject: t.test.labels.optimism, A: 99, fullMark: 150 },
    { subject: t.test.labels.social, A: 85, fullMark: 150 },
    { subject: t.test.labels.focus, A: 65, fullMark: 150 },
  ], [t.test.labels]);

  // Show loading state
  if (loading && questionnaires.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-transparent">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-white/10 bg-slate-900/50 backdrop-blur-xl">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-violet-400" />
          <p className="text-slate-400">加载问卷列表中...</p>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error && questionnaires.length === 0) {
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

  // Questionnaire Selection View
  if (view === 'selection') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-transparent overflow-y-auto">
        <div className="max-w-4xl w-full space-y-6">
          <div className="text-center space-y-4 mb-8">
            <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto text-violet-400 mb-4 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
              <ClipboardList size={40} strokeWidth={2} />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-wide">{t.test.title}</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              请选择您想要完成的问卷
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {questionnaires.map((q) => (
              <Card
                key={q.id}
                className="p-6 space-y-4 bg-slate-900/40 border-white/5 backdrop-blur-md shadow-lg hover:bg-slate-900/60 hover:border-violet-500/30 transition-all cursor-pointer group"
                onClick={() => handleSelectQuestionnaire(q.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-violet-400 font-semibold mb-2">
                      {q.section}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                      {q.title}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                      <ClipboardList size={16} />
                      <span>{q.total_questions} 道题目</span>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-500 group-hover:text-violet-400 transition-colors" size={24} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Result View
  if (view === 'result') {
    return (
      <div className="h-full overflow-y-auto bg-transparent p-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl backdrop-blur-md border border-white/5">
            <h2 className="text-2xl font-bold text-white tracking-wide">{t.test.resultTitle}</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetTest} className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white backdrop-blur-sm">
                <SafeIcon icon={Icons.RefreshCcw} className="mr-2 h-4 w-4" /> {t.test.retake}
              </Button>
              <Button className="bg-violet-600 hover:bg-violet-500 text-white border-none shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                <SafeIcon icon={Icons.Save} className="mr-2 h-4 w-4" /> {t.test.saveReport}
              </Button>
            </div>
          </header>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 flex flex-col justify-center min-h-[400px] bg-slate-900/40 border-white/5 backdrop-blur-md shadow-lg">
              <div className="w-full h-[350px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                    <Radar
                      name="My Profile"
                      dataKey="A"
                      stroke="#8B5CF6"
                      strokeWidth={3}
                      fill="#8B5CF6"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-6 space-y-4 border-l-4 border-l-violet-500 bg-slate-900/40 border-t-white/5 border-r-white/5 border-b-white/5 backdrop-blur-md shadow-lg">
                <h3 className="font-semibold text-lg text-white tracking-wide">{t.test.summary}</h3>
                <p className="text-slate-300 leading-relaxed">
                  {t.test.summaryText}
                </p>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 p-4 rounded-xl shadow-lg border border-white/5 backdrop-blur-md">
                  <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{t.test.stressLevel}</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{t.test.low}</div>
                </div>
                <div className="bg-slate-900/40 p-4 rounded-xl shadow-lg border border-white/5 backdrop-blur-md">
                  <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{t.test.primaryEmotion}</span>
                  <div className="text-2xl font-bold text-violet-400 mt-1 drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">{t.test.peaceful}</div>
                </div>
              </div>
            </div>
          </div>
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

          <div className="flex justify-between items-center max-w-xl mx-auto w-full gap-4">
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
        </div>
      </div>
    </div>
  );
};

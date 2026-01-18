import React, { useState, useMemo } from 'react';
import * as Icons from '../../ui/icons';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { ClipboardList } from 'lucide-react';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { completeModuleWithRetry } from '../../../lib/api';
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

type Question = {
  id: number;
  text: string;
  type: 'scale' | 'choice';
  options?: string[];
};

export const InnerQuickTest: React.FC = () => {
  const { t, conversationId } = useZenemeStore();
  const [started, setStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [finished, setFinished] = useState(false);

  // Dynamic questions based on language
  const questions: Question[] = useMemo(() => {
    return t.test.questions.map((text, index) => ({
      id: index + 1,
      text,
      type: 'scale'
    }));
  }, [t.test.questions]);

  const totalQuestions = questions.length;

  const handleStart = () => setStarted(true);

  const handleAnswer = async (value: number) => {
    setAnswers((prev) => ({ ...prev, [currentQIndex]: value }));
    if (currentQIndex < totalQuestions - 1) {
      setTimeout(() => setCurrentQIndex((prev) => prev + 1), 200);
    } else {
      // Complete the test and call completion API
      if (conversationId) {
        const result = await completeModuleWithRetry(
          conversationId,
          'quick_assessment',
          { answers, total_questions: totalQuestions }
        );

        if (result.ok) {
          console.log('[Module Completed]', {
            module_id: 'quick_assessment',
            conversation_id: conversationId,
            timestamp: new Date().toISOString()
          });
        } else {
          toast.error('保存测试结果失败，但您的测试已完成');
        }
      }
      setFinished(true);
    }
  };

  const resetTest = () => {
    setStarted(false);
    setCurrentQIndex(0);
    setAnswers({});
    setFinished(false);
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

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-transparent">
        <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-white/10 bg-slate-900/50 backdrop-blur-xl">
          <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto text-violet-400 mb-4 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
            <ClipboardList size={40} strokeWidth={2} />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-wide">{t.test.title}</h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            {t.test.subtitle}
          </p>
          <div className="space-y-2 pt-4">
            <div className="flex items-center gap-2 text-slate-400 text-sm justify-center">
              <SafeIcon icon={Icons.Check} size={16} className="text-violet-400" /> {t.test.duration}
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-sm justify-center">
              <SafeIcon icon={Icons.Check} size={16} className="text-violet-400" /> {t.test.scientific}
            </div>
          </div>
          <Button onClick={handleStart} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-lg h-12 rounded-xl mt-4 border border-white/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all">
            {t.test.start}
          </Button>
        </Card>
      </div>
    );
  }

  if (finished) {
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

  // Quiz View
  const progress = ((currentQIndex + 1) / totalQuestions) * 100;
  // Rotate through simulated questions
  const currentQuestion = questions[currentQIndex % questions.length];

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
                  className={`
                    w-12 h-12 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center text-xl font-bold transition-all
                    ${
                      answers[currentQIndex] === val
                        ? 'bg-violet-600 border-violet-500 text-white scale-110 shadow-[0_0_25px_rgba(139,92,246,0.5)]'
                        : 'border-white/10 text-slate-500 hover:border-violet-500 hover:text-violet-400 bg-slate-900/40 hover:bg-slate-900/60'
                    }
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

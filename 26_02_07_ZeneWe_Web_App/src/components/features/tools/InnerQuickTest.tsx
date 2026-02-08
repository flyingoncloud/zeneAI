import React, { useState, useMemo, useEffect } from 'react';
import * as Icons from '../../ui/icons';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { 
  ClipboardList, 
  ArrowLeft, 
  Sparkles, 
  X, 
  Save, 
  RefreshCcw, 
  CheckCircle2, 
  Brain, 
  Lightbulb, 
  Download,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { Toast } from '../../shared/GlobalFeedback';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../ui/dialog';
import { guardGuestAction } from '../../../utils/authHelpers';

// Quiz Imports
import { MOCK_QUIZ_QUESTIONS } from './quiz/QuizData';
import { QuizShell } from './quiz/QuizShell';
import { 
  Format1Likert, 
  Format2ImageHeader, 
  Format3ImageGrid, 
  Format4ImageGrid,
  Format5Media,
  Format6Spatial
} from './quiz/QuestionFormats';
import { Format7Ranking } from './quiz/Format7Ranking';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const SafeIcon = ({ icon: Icon, ...props }: any) => {
  if (!Icon) return <span style={{ width: props.size || 24, height: props.size || 24, display: 'inline-block', background: '#ccc', borderRadius: 4 }} />;
  return <Icon {...props} />;
};

export const InnerQuickTest: React.FC = () => {
  const { t, isPro, openUpgradeModal, toggleSidebar, setCurrentView, addReport } = useZenemeStore();
  const [started, setStarted] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  // Store answers as: Record<questionId, value>
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [finished, setFinished] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'viewing'>('idle');
  const [showChart, setShowChart] = useState(false);

  // Generation Simulation Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (generationStatus === 'loading') {
      timer = setTimeout(() => {
        setGenerationStatus('success');
      }, 3000); 
    }
    return () => clearTimeout(timer);
  }, [generationStatus]);
  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  // Download State
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // Draft State
  const [draft, setDraft] = useState<{ step: number; answers: Record<number, any>; time: number } | null>(null);

  // Load Draft on Mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('zenewe_inner_test_draft');
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (typeof parsed.step === 'number' && parsed.answers) {
          setDraft(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load draft', e);
    }
  }, []);

  // Auto-save Effect
  useEffect(() => {
    if (started && !finished) {
      const draftData = {
        step: currentQIndex,
        answers,
        time: Date.now()
      };
      localStorage.setItem('zenewe_inner_test_draft', JSON.stringify(draftData));
    }
  }, [started, finished, currentQIndex, answers]);

  // Clear draft on finish
  useEffect(() => {
    if (finished) {
      localStorage.removeItem('zenewe_inner_test_draft');
      setDraft(null); 
      
      const timer = setTimeout(() => setShowChart(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowChart(false);
      setSaved(false); 
      setIsDownloading(false);
      setShowDownloadModal(false);
    }
  }, [finished]);

  // Use the new MOCK_QUIZ_QUESTIONS
  const questions = MOCK_QUIZ_QUESTIONS;
  const totalQuestions = questions.length; 
  const currentQuestion = questions[currentQIndex];

  const handleStart = () => {
    localStorage.removeItem('zenewe_inner_test_draft');
    setAnswers({});
    setCurrentQIndex(0);
    setStarted(true);
  };

  const handleResume = () => {
    if (draft) {
      setAnswers(draft.answers);
      setCurrentQIndex(draft.step);
      setStarted(true);
    }
  };

  const handleAnswerChange = (val: any) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
    // Note: Auto-advance could be format specific.
    // Format 1 (Likert) usually auto-advances. 
    // Format 4 & 5 usually require explicit "Next" button interaction unless specific UX requested.
    // The prompt says "Format 1 selected then auto next" in Intro section, but we implement generally.
    // Let's rely on the Next button for complex formats, and maybe auto-advance for Format 1.
    // However, the unified shell has a Next button.
    // To keep it consistent, we might not auto-advance immediately, OR we do it with a slight delay for Format 1/2/3/5 choice.
    // Format 4 (Compass) requires manual Next because it's continuous input.
  };

  const nextQuestion = () => {
    if (currentQIndex < totalQuestions - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      setFinished(true);
      setGenerationStatus('loading');
    }
  };

  const prevQuestion = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
    }
  };

  const resetTest = () => {
    setStarted(false);
    setCurrentQIndex(0);
    setAnswers({});
    setFinished(false);
  };

  const handleSave = () => {
    if (guardGuestAction()) return;
    if (saved) return;
    const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    addReport({
      id: `deep-${Date.now()}`,
      type: 'deep',
      date: dateStr,
      title: '内视觉察报告',
      preview: '基于内视快测五维分析：情绪调节、认知灵活度、关系敏感度、内在冲突度、成长潜能',
      isPro: isPro,
    });
    setSaved(true);
    setToastMsg('已保存到历史记录');
    setShowToast(true);
  };

  const canProceed = useMemo(() => {
    const val = answers[currentQuestion.id];
    if (val === undefined || val === null) return false;
    if (currentQuestion.format === 7) {
      return Array.isArray(val) && val.length === 3;
    }
    return true;
  }, [answers, currentQuestion]);

  // --- Render Question Content based on Format ---
  const renderQuestionContent = () => {
    const val = answers[currentQuestion.id];
    
    switch (currentQuestion.format) {
      case 1:
        return (
          <Format1Likert 
            question={currentQuestion} 
            value={val} 
            onChange={(v) => {
               handleAnswerChange(v);
               // Optional: Auto-advance for Format 1 after short delay
               // setTimeout(nextQuestion, 400); 
            }} 
          />
        );
      case 2:
        return (
          <Format2ImageHeader 
            question={currentQuestion} 
            value={val} 
            onChange={handleAnswerChange} 
          />
        );
      case 3:
        return (
          <Format3ImageGrid 
            question={currentQuestion} 
            value={val} 
            onChange={handleAnswerChange} 
          />
        );
      case 4:
        return (
          <Format4ImageGrid 
            question={currentQuestion} 
            value={val} 
            onChange={handleAnswerChange} 
          />
        );
      case 6:
        return (
          <Format6Spatial 
            question={currentQuestion} 
            value={val} 
            onChange={handleAnswerChange} 
          />
        );
      case 7:
        return (
          <Format7Ranking 
            question={currentQuestion} 
            value={val} 
            onChange={handleAnswerChange} 
          />
        );
      case 5:
        return (
          <Format5Media 
            question={currentQuestion} 
            value={val} 
            onChange={handleAnswerChange} 
          />
        );
      default:
        return <div>Unknown Format</div>;
    }
  };

  // --- Views ---

  // 1. Entry View
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-transparent relative">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar} 
          className="md:hidden fixed top-6 left-6 z-50 text-slate-400 hover:text-white hover:bg-slate-900/40 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/5 shadow-sm"
        >
          <SafeIcon icon={Icons.Menu} size={22} />
        </Button>

        <Card className="max-w-md w-full px-8 pt-8 pb-10 text-center space-y-6 shadow-2xl border-white/10 bg-slate-900/50 backdrop-blur-xl rounded-[32px]">
          <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto text-violet-400 mb-4 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.1)]">
            <ClipboardList size={40} strokeWidth={2} />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-wide">{t.test.title}</h2>
          <p className="text-[rgb(255,255,255)] text-lg leading-relaxed">
            {t.test.subtitle}
          </p>
          <div className="space-y-2 pt-4 bg-[rgba(255,255,255,0)]">
            <div className="flex items-center gap-2 text-slate-300 text-base justify-center bg-[rgba(255,255,255,0)]">
              <SafeIcon icon={Icons.Check} size={18} className="text-violet-400" /> 共{questions.length}题
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-base justify-center bg-[rgba(255,255,255,0)]">
              <SafeIcon icon={Icons.Check} size={18} className="text-violet-400" /> {t.test.scientific}
            </div>
          </div>
          
          <div className="flex flex-col gap-4 w-full">
            {draft && (
               <Button 
                 onClick={handleResume} 
                 className="w-full h-12 rounded-2xl border border-white/10 text-lg text-white bg-white/5 hover:bg-white/20 transition-all font-medium"
               >
                 继续上一次
               </Button>
            )}

            <Button onClick={handleStart} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-lg h-12 rounded-2xl border border-white/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all">
              {t.test.start}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 2. Result View
  if (finished) {
    // Handling Generation States
    if (generationStatus !== 'viewing') {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-transparent relative z-50">
           {/* Card Container */}
           <Card className="max-w-md w-full min-h-[380px] p-8 flex flex-col justify-center items-center text-center shadow-2xl border-white/10 bg-slate-900/80 backdrop-blur-xl rounded-[32px] relative overflow-hidden">
              
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-violet-500/20 rounded-full blur-[50px] pointer-events-none" />

              <AnimatePresence mode="wait">
                {generationStatus === 'loading' && (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
                      <div className="absolute inset-0 rounded-full border-t-2 border-violet-500 animate-spin" />
                      <Sparkles className="text-violet-400 animate-pulse" size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">生成中…</h2>
                    <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                      正在为你整理内视快测结果，请稍候<br/>
                      <span className="text-xs opacity-60">预计 5–10 秒</span>
                    </p>
                    <div className="flex flex-col gap-3 w-full">
                       {/* Hidden Mock Fail Trigger */}
                       <div 
                         className="w-full h-4 -mt-4 mb-2 cursor-pointer opacity-0 hover:opacity-100 text-[10px] text-center text-red-500 transition-opacity"
                         onClick={() => setGenerationStatus('error')}
                       >
                         [点击模拟生成失败]
                       </div>
                       

                    </div>
                  </motion.div>
                )}

                {generationStatus === 'error' && (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 text-red-500">
                      <AlertCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">生成失败</h2>
                    <p className="text-slate-400 text-sm mb-8">
                      网络波动或服务繁忙，请稍后再试<br/>
                      <span className="text-xs text-slate-600">Error code: RPT_001 (Saved: true)</span>
                    </p>
                    <div className="flex flex-col gap-3 w-full">
                       <Button 
                         onClick={() => setGenerationStatus('loading')}
                         className="w-full bg-white text-slate-900 hover:bg-slate-200"
                       >
                         重试生成
                       </Button>
                       <Button 
                         variant="ghost" 
                         onClick={() => setCurrentView('chat')} 
                         className="text-slate-400 hover:text-white"
                       >
                         返回首页
                       </Button>
                    </div>
                  </motion.div>
                )}

                {generationStatus === 'success' && (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                      <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">生成成功</h2>
                    <p className="text-slate-400 text-sm mb-8">
                      你的内视快测报告已准备好
                    </p>
                    <div className="flex flex-col gap-3 w-full">
                       <Button 
                         onClick={() => setGenerationStatus('viewing')}
                         className="w-full h-12 text-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25 border-0"
                       >
                         查看报告
                       </Button>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </Card>
        </div>
      );
    }

    // Reusing existing Result View logic (Data needs to be mock or calc)
    // For now, using static mock data from previous code for the result view
    const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const data = [
      { subject: '绪调节', A: 52, fullMark: 100 },
      { subject: '认知灵活度', A: 61, fullMark: 100 },
      { subject: '关系敏感度', A: 70, fullMark: 100 },
      { subject: '内在冲突度', A: 67, fullMark: 100 },
      { subject: '成长潜能', A: 78, fullMark: 100 },
    ];
    const analysisDetails = [
      { title: '情绪调节能力指数', score: 52, phase: '情绪觉察发展阶段', desc: '能够觉察到部分情绪变化，但节能力仍不稳定。' },
      { title: '认知灵活度指数', score: 61, phase: '灵活思维整合阶段', desc: '能主动切换视角分析问题，愿意修正原有看法。' },
      { title: '关系敏感度指数', score: 70, phase: '关系平衡调整阶段', desc: '具备较强的共情能力，能敏锐捕捉他人情绪与需求。' },
      { title: '内在冲突度指数', score: 67, phase: '冲突显化整合阶段', desc: '内在常存在“想要”与“应该”之间的拉扯。' },
      { title: '成长潜能指数', score: 78, phase: '潜能绽放阶段', desc: '成长已成为内在驱动力，拥有强烈的自我探索与心理韧性。' }
    ];

    const confirmDownload = () => {
        setIsDownloading(true);
        setTimeout(() => {
            setIsDownloading(false);
            setShowDownloadModal(false);
            setToastMsg('完整版报告下载成功');
            setShowToast(true);
        }, 2000);
    };

    const handleDownloadClick = () => {
      if (guardGuestAction()) return;
      setShowDownloadModal(true);
    };

    return (
      <div className="flex flex-col h-full bg-[#2C2C2C] text-slate-200 relative overflow-hidden">
        <Toast visible={showToast} message={toastMsg} onClose={() => setShowToast(false)} />
        
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#2C2C2C] backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setCurrentView('chat')} className="md:hidden -ml-2 text-slate-400 hover:text-white">
               <ArrowLeft size={24} />
            </Button>
            <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-white">内视觉察报告</h1>
                <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10">
                  深度版
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">生成于 {dateStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetTest} className="text-slate-400 hover:text-white hidden md:flex">
              <RefreshCcw size={16} className="mr-2" /> {t.test.retake}
            </Button>
            {!saved && (
              <Button variant="ghost" size="sm" onClick={handleSave} className="text-slate-400 hover:text-white hidden md:flex">
                <Save size={16} className="mr-2" /> {t.common.save}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={resetTest} className="rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
              <X size={20} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-violet-900/40 to-slate-900/40 border border-violet-500/20 relative overflow-hidden group">
               <div className="absolute inset-0 bg-violet-500/5 group-hover:bg-violet-500/10 transition-colors" />
               <div className="relative z-10">
                 <h3 className="text-2xl font-bold text-white mb-3 tracking-wide">感谢你完成这段 ZeneWe「心知维」内视快测。</h3>
                 <p className="text-slate-300 leading-relaxed font-light mb-6">你正在经历一个向内探索的重要阶段。此部分为深度完整版报告的摘要，透过五个维度给你一幅心灵概图。</p>
                 <div className="flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium"><CheckCircle2 size={14} /> 已完成分析</div>
                 </div>
               </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-2xl bg-[#262626] border border-white/5 flex flex-col items-center justify-center text-center">
               <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4 border border-violet-500/20"><Brain size={24} /></div>
               <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-1">心知维摘要</h4>
               <div className="text-2xl font-bold text-white mb-2">五维已生成</div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl bg-[#262626] border border-white/5">
             <div className="w-full relative" style={{ height: 350 }}>
               {showChart ? (
                 <ResponsiveContainer width="100%" height="100%" debounce={1}>
                   <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                     <PolarGrid stroke="rgba(255,255,255,0.08)" />
                     <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }} tickLine={false} />
                     <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                     <Radar name="My Profile" dataKey="A" stroke="#8B5CF6" strokeWidth={2} fill="#8B5CF6" fillOpacity={0.3} isAnimationActive={true} />
                   </RadarChart>
                 </ResponsiveContainer>
               ) : (
                  <div className="w-full h-full flex items-center justify-center"><div className="animate-pulse w-8 h-8 rounded-full bg-white/5" /></div>
               )}
             </div>
          </motion.div>

          <div>
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Lightbulb size={18} className="text-violet-500" /> 五维解析</h3>
             <div className="space-y-4">
               {analysisDetails.map((item, idx) => (
                 <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + (idx * 0.1) }} className="p-5 bg-[#262626] rounded-xl border border-white/5 hover:border-violet-500/20 transition-all group">
                    <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start">
                       <div className="flex-shrink-0 flex md:flex-col items-center gap-3 md:gap-1 md:w-32 md:border-r md:border-white/5 md:pr-4">
                          <div className="text-3xl font-bold text-violet-400">{item.score}</div>
                          <div className="text-xs text-slate-500 font-medium text-center">{item.title}</div>
                       </div>
                       <div className="flex-1">
                          <div className="text-sm font-semibold text-white mb-2 tracking-wide flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-violet-500 block" />{item.phase}
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed font-light">{item.desc}</p>
                       </div>
                    </div>
                 </motion.div>
               ))}
             </div>
          </div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="pt-4 pb-12 flex justify-center">
             <Button size="lg" onClick={handleDownloadClick} className="w-full md:w-[60%] h-14 text-base font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all flex items-center justify-center gap-2">
                <Download size={20} /> 下载完整版报告
             </Button>
          </motion.div>
        </div>

        <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
           <DialogContent className="bg-slate-900 border border-white/10 text-white sm:max-w-[425px] shadow-2xl backdrop-blur-xl">
              <DialogTitle className="text-xl font-bold">完整版报告</DialogTitle>
              <DialogDescription className="text-slate-400">将为你生成一份更完整的心知维报告。</DialogDescription>
              <div className="flex flex-col gap-3 mt-6">
                 <Button onClick={confirmDownload} disabled={isDownloading} className="w-full h-12 bg-violet-600 hover:bg-violet-500 text-white font-medium">
                    {isDownloading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />正在生成...</> : '开始生成并下载'}
                 </Button>
                 <Button variant="ghost" onClick={() => setShowDownloadModal(false)} className="w-full text-slate-400 hover:text-white">取消</Button>
              </div>
           </DialogContent>
        </Dialog>
      </div>
    );
  }

  // 3. Quiz View (Unified Shell)
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full z-20 pt-[max(12px,env(safe-area-inset-top))] px-4 pointer-events-none">
         <div className="pointer-events-auto md:hidden pt-2 pl-2">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-slate-400 hover:text-white hover:bg-slate-900/40 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/5 shadow-sm">
              <SafeIcon icon={Icons.Menu} size={22} />
            </Button>
         </div>
      </div>

      <QuizShell
        currentQuestionIndex={currentQIndex}
        totalQuestions={totalQuestions}
        question={currentQuestion}
        onNext={nextQuestion}
        onPrev={prevQuestion}
        onSkip={nextQuestion} // Simplistic skip
        canNext={canProceed} // Must answer to proceed
        isFirst={currentQIndex === 0}
        isLast={currentQIndex === totalQuestions - 1}
      >
        {renderQuestionContent()}
      </QuizShell>
      </div>
    </DndProvider>
  );
};
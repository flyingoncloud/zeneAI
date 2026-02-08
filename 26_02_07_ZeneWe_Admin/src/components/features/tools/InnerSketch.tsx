import React, { useRef, useState, useEffect } from 'react';
import * as Icons from '../../ui/icons';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { useZenemeStore } from '../../../hooks/useZenemeStore';
import { AnalysisProgress } from '../../AnalysisProgress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';
import { Check, Loader2, Undo2, Redo2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ScrollArea } from '../../ui/scroll-area';
import { guardGuestAction } from '../../../utils/authHelpers';

// Auth
import { useAuthStore } from '../../../hooks/useAuthStore';

const SafeIcon = ({ icon: Icon, ...props }: any) => {
  if (!Icon) return <span style={{ width: props.size || 24, height: props.size || 24, display: 'inline-block', background: '#ccc', borderRadius: 4 }} />;
  return <Icon {...props} />;
};

export const InnerSketch: React.FC = () => {
  const { t, setCurrentView, addMessage, setSketchReportImage } = useZenemeStore();
  
  // Auth Store
  const { status, incrementGuestAction } = useAuthStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#e2e8f0'); // Default to light gray for dark mode
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  
  // Undo History
  const [history, setHistory] = useState<ImageData[]>([]);

  // Button States
  const [isSaved, setIsSaved] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Report Generation States: 'idle' | 'generating' | 'success' | 'error'
  const [reportState, setReportState] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');

  const COLORS = [
    '#e2e8f0', // Slate
    '#8B5CF6', // Violet
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
  ];

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Save current state to history
    setHistory(prev => {
        const newHistory = [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)];
        if (newHistory.length > 30) newHistory.shift(); // Limit history size
        return newHistory;
    });
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    
    ctx.putImageData(previousState, 0, 0);
    setHistory(newHistory);
    
    if (newHistory.length === 0) {
        setHasDrawn(false);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    saveState(); // Save state before starting new stroke

    setIsDrawing(true);
    setHasDrawn(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { offsetX, offsetY } = getCoordinates(e, canvas);
    
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 20;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
    }
    
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        offsetX: e.nativeEvent.offsetX,
        offsetY: e.nativeEvent.offsetY
      };
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setResult(null);
    setHasDrawn(false);
    setIsSaved(false);
    setHistory([]);
  };

  const analyzeDrawing = () => {
    if (!hasDrawn) {
      toast.error('请先画点什么再分析');
      return;
    }
    setAnalyzing(true);
    setAnalysisStep(1);
    
    setTimeout(() => setAnalysisStep(2), 1000);
    setTimeout(() => setAnalysisStep(3), 2000);

    // Simulate AI analysis delay
    setTimeout(() => {
      setAnalyzing(false);
      setAnalysisStep(0);
      setResult(t.sketch.mockResult);
    }, 3000);
  };

  const handleSave = () => {
    // Blocking Check
    if (guardGuestAction()) return;

    if (isSaved) {
        toast.success('已保存');
        return;
    }
    setIsSaved(true);
    toast.success('已保存到本次记录');
  };

  const handleGenerateReport = () => {
    if (!result) {
      toast.error('请先完成分析再生成报告');
      return;
    }
    if (guardGuestAction()) return;

    setReportState('generating');

    // Capture canvas image
    const canvas = canvasRef.current;
    let dataUrl = '';
    if (canvas) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tCtx = tempCanvas.getContext('2d');
      if (tCtx) {
        tCtx.fillStyle = '#0f172a';
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tCtx.drawImage(canvas, 0, 0);
        dataUrl = tempCanvas.toDataURL('image/png');
      } else {
        dataUrl = canvas.toDataURL('image/png');
      }
    }

    // Simulate report generation (2.5s)
    setTimeout(() => {
      // Simulate 90% success, 10% error
      const success = Math.random() > 0.1;
      if (success) {
        setSketchReportImage(dataUrl);
        setReportState('success');
        toast.success('报告已生成');
      } else {
        setReportState('error');
        toast.error('生成失败，请重试');
      }
    }, 2500);
  };

  const handleViewReport = () => {
    setCurrentView('sketch-report');
  };

  const handleShare = () => {
    if (!hasDrawn) {
        toast.error('请先画点什么再发送');
        return;
    }

    setIsSending(true);
    
    const canvas = canvasRef.current;
    let dataUrl = '';
    
    if (canvas) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext('2d');
        if (tCtx) {
            tCtx.fillStyle = '#0f172a'; 
            tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            tCtx.drawImage(canvas, 0, 0);
            dataUrl = tempCanvas.toDataURL('image/png');
        } else {
            dataUrl = canvas.toDataURL('image/png');
        }
    }
    
    setTimeout(() => {
        setIsSending(false);
        addMessage(
            "我想分享这张涂鸦，请帮我分析它。", 
            'user', 
            {
                type: 'sketch',
                url: dataUrl,
                preview: dataUrl
            }
        );
        setCurrentView('chat');
    }, 800);
  };

  const getAnalysisDetail = (step: number) => {
    switch (step) {
      case 1: return t.sketch.steps.scanning;
      case 2: return t.sketch.steps.interpreting;
      case 3: return t.sketch.steps.generating;
      default: return "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      {/* 
         Structure:
         1. Main Scrollable Container (h-full, overflow-y-auto)
         2. Hide Scrollbars strictly
      */}
      <div className="flex flex-col h-full w-full pt-[72px] px-5 pb-5 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* Header Section (Title & Desc) */}
        <div className="flex flex-col gap-2 mb-4 shrink-0 max-w-full">
           <h2 className="text-2xl font-bold text-white tracking-wide text-[30px]">{t.sketch.title}</h2>
           <p className="text-slate-400 text-sm leading-relaxed max-w-md">
             {t.sketch.subtitle}
           </p>
        </div>

        {/* Toolbar Section (Above Canvas) */}
        <div className="flex items-center justify-between mb-3 shrink-0 min-h-[44px] max-w-full">
           {/* Left: Empty (Back button deleted) */}
           <div />

           {/* Right: Colors & Tools */}
           <div className="flex items-center gap-3">
             {/* Colors */}
             <div className="flex items-center gap-2 overflow-x-visible py-3 px-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      setTool('pen');
                    }}
                    className={`w-6 h-6 rounded-full transition-all duration-300 flex-shrink-0 border border-white/10 ${
                      color === c && tool === 'pen'
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent shadow-[0_0_8px_rgba(255,255,255,0.4)] opacity-100'
                        : 'opacity-70 hover:opacity-100 hover:ring-1 hover:ring-white/30'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
             </div>

             {/* Tools */}
             <div className="flex items-center gap-1 bg-slate-900/40 rounded-full p-1 border border-white/10 backdrop-blur-sm shrink-0">
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => setTool('pen')}
                 className={`w-8 h-8 rounded-full ${tool === 'pen' ? 'bg-white text-slate-900' : 'text-slate-400 hover:bg-white hover:text-slate-900'}`}
               >
                 <SafeIcon icon={Icons.PenTool} size={16} />
               </Button>
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => setTool('eraser')}
                 className={`w-8 h-8 rounded-full ${tool === 'eraser' ? 'bg-white text-slate-900' : 'text-slate-400 hover:bg-white hover:text-slate-900'}`}
               >
                 <SafeIcon icon={Icons.Eraser} size={16} />
               </Button>
               
               <div className="w-px h-4 bg-white/10 mx-0.5" />
               
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={undo} 
                 disabled={history.length === 0}
                 className="w-8 h-8 rounded-full text-slate-400 hover:bg-white hover:text-slate-900 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400"
               >
                 <Undo2 size={16} />
               </Button>

               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={clearCanvas} 
                 className="w-8 h-8 rounded-full text-slate-400 hover:bg-white hover:text-red-600"
               >
                 <SafeIcon icon={Icons.RotateCcw} size={16} />
               </Button>
             </div>
           </div>
        </div>

        {/* Canvas Area (Main) - Ensure min-height for small screens */}
        <div className="flex-1 relative min-h-[45vh] bg-slate-900 rounded-3xl border border-white/10 shadow-xl overflow-hidden touch-none shrink-0">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full cursor-crosshair"
          />
          
          {/* Analyze Button (Bottom Right) */}
          <div className="absolute bottom-4 right-4 z-10">
            {analyzing ? (
              <Card className="p-3 bg-slate-900/90 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                <AnalysisProgress 
                  label={t.sketch.analyzing} 
                  detail={getAnalysisDetail(analysisStep)}
                  totalSteps={3}
                  currentStep={analysisStep}
                  className="w-56"
                />
              </Card>
            ) : (
              <Button 
                onClick={analyzeDrawing} 
                disabled={!!result}
                className="h-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full px-5 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all border border-white/10 font-medium text-sm"
              >
                <SafeIcon icon={Icons.Sparkles} className="mr-2 h-3.5 w-3.5" /> {t.sketch.analyze}
              </Button>
            )}
          </div>
        </div>

        {/* Result Card (Slide up overlay) */}
        {result && (
           <div className="absolute bottom-5 left-5 right-5 z-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="p-5 bg-slate-900/95 border-white/10 shadow-[0_-8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl max-h-[40vh] overflow-y-auto">
              <div className="flex items-start gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex justify-between items-start">
                     <h3 className="font-semibold text-white tracking-wide">{t.sketch.resultTitle}</h3>
                     <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-2 text-slate-400" onClick={() => setResult(null)}>
                        <Icons.X size={16} />
                     </Button>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-sm">{result}</p>
                  
                  <div className="pt-2 flex flex-col gap-2">
                     {/* Status hint above buttons */}
                     {reportState === 'generating' && (
                       <div className="text-xs text-violet-300/80 text-right animate-pulse">
                         正在生成简要版报告，请稍候…
                       </div>
                     )}
                     {reportState === 'error' && (
                       <div className="text-xs text-red-400/80 text-right">
                         生成失败，请重试
                       </div>
                     )}
                     {reportState === 'success' && (
                       <div className="text-xs text-emerald-400/80 text-right">
                         报告已生成
                       </div>
                     )}

                     <div className="flex gap-3 items-center justify-end">
                        {/* Share button (secondary) */}
                        <Button 
                           size="sm" 
                           onClick={handleShare}
                           disabled={isSending}
                           className="h-9 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs border border-white/5"
                        >
                          {isSending ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : null}
                          {isSending ? '发送中...' : t.sketch.share}
                        </Button>

                        {/* Generate Report button (primary, state-driven) */}
                        <Button 
                           size="sm" 
                           onClick={reportState === 'success' ? handleViewReport : handleGenerateReport}
                           disabled={reportState === 'generating'}
                           className="h-9 px-5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs border border-white/10 shadow-[0_0_12px_rgba(139,92,246,0.25)] font-medium transition-all"
                        >
                          {reportState === 'generating' && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
                          {reportState === 'success' && <Check className="w-3.5 h-3.5 mr-1.5" />}
                          {reportState === 'idle' && '生成报告'}
                          {reportState === 'generating' && '生成中…'}
                          {reportState === 'success' && '查看报告'}
                          {reportState === 'error' && '重新生成'}
                        </Button>
                     </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
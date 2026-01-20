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
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadSketch } from '../../../lib/api';

type IconProps = {
  size?: number | string;
  className?: string;
  color?: string;
  strokeWidth?: number;
} & React.SVGProps<SVGSVGElement>;

type IconComponent = React.ComponentType<IconProps> | undefined;

const SafeIcon = ({ icon: Icon, ...props }: { icon: IconComponent } & IconProps) => {
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

const DEFAULT_COLOR = '#e2e8f0';

export const InnerSketch: React.FC = () => {
  const { t, setCurrentView, addMessage, conversationId, setModuleStatus, setPendingModuleCompletion } = useZenemeStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState(DEFAULT_COLOR); // Default to light gray for dark mode
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);

  // Button States
  const [isSaved, setIsSaved] = useState(false);
  const [isSending, setIsSending] = useState(false);

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
        // NOTE: use DEFAULT_COLOR here to avoid depending on state `color` (keeps logic: initial is the same)
        ctx.strokeStyle = DEFAULT_COLOR;
        ctx.lineWidth = 3;

        // IMPORTANT: We do NOT fillRect with a color here anymore if we want "destination-out" (eraser) to reveal transparency.
        // The background color comes from the parent DIV (bg-slate-900).
        // 'destination-out' will erase pixels to transparent, revealing the parent div's background again.

        // Clear rect to ensure transparency
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
      // "destination-out" removes existing pixels, making them transparent.
      // This effectively "erases" drawing to reveal what is behind the canvas (the CSS background).
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 20;
    } else {
      // "source-over" draws new pixels on top.
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
    if (isSaved) {
        toast.success('已保存');
        return;
    }
    setIsSaved(true);
    toast.success('已保存到本次记录');
  };

  const handleShare = async () => {
    if (!hasDrawn) {
        toast.error('请先画点什么再发送');
        return;
    }

    setIsSending(true);

    try {
        const canvas = canvasRef.current;
        if (!canvas) {
            toast.error('无法获取画布');
            setIsSending(false);
            return;
        }

        // Create a temporary canvas with solid background for export
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext('2d');

        if (!tCtx) {
            toast.error('无法创建导出画布');
            setIsSending(false);
            return;
        }

        // 1. Fill background (match app dark theme solid color)
        tCtx.fillStyle = '#0f172a';
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 2. Draw the drawing on top
        tCtx.drawImage(canvas, 0, 0);

        // Convert canvas to blob
        const blob: Blob | null = await new Promise((resolve) => {
            tempCanvas.toBlob(resolve, 'image/png', 0.95);
        });

        if (!blob) {
            toast.error('无法生成图片');
            setIsSending(false);
            return;
        }

        // Upload sketch to backend with AI analysis
        const result = await uploadSketch(blob, conversationId);

        if (result.ok) {
            console.log('[Sketch Uploaded & Module Completed]', {
                module_id: 'inner_doodling',
                conversation_id: conversationId,
                file_uri: result.file_uri,
                timestamp: new Date().toISOString()
            });

            if (result.module_status) {
              setModuleStatus(result.module_status);
            }
            // Set pending module completion to trigger continuation message
            setPendingModuleCompletion('inner_doodling');

            // Create data URL for local display
            const dataUrl = tempCanvas.toDataURL('image/png');

            // Add AI analysis as assistant message
            addMessage(
                result.analysis,
                'assistant',
                {
                    type: 'sketch_analysis',
                    url: result.file_uri,
                    preview: dataUrl
                }
            );

            toast.success('涂鸦已上传并分析完成');

            // Navigate to Chat View
            setCurrentView('chat');
        } else {
            toast.error('上传失败，请重试');
        }

    } catch (error) {
        console.error('Error uploading sketch:', error);
        toast.error('上传失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
        setIsSending(false);
    }
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
    <div className="flex flex-col h-full bg-transparent p-4 md:p-6 overflow-hidden">
      <div className="w-full h-full flex flex-col gap-6">
        <div className="flex justify-between items-center backdrop-blur-sm p-4 rounded-xl border border-white/5 bg-slate-900/30">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-wide">{t.sketch.title}</h2>
            <p className="text-gray-400 text-sm">{t.sketch.subtitle}</p>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-1.5 mr-2 bg-slate-900/60 border border-white/10 p-1.5 rounded-full backdrop-blur-md">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setTool('pen');
                  }}
                  className={`w-5 h-5 rounded-full transition-all duration-300 ${
                    color === c && tool === 'pen'
                      ? 'ring-2 ring-white scale-125 shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                      : 'hover:scale-110 opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>

            <Button
              variant={tool === 'pen' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setTool('pen')}
              className={tool === 'pen' ? 'bg-violet-600 hover:bg-violet-500 text-white border-none shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-slate-900/50 border-white/10 text-gray-400 hover:bg-slate-800 hover:text-white'}
            >
              <SafeIcon icon={Icons.PenTool} size={18} />
            </Button>
            <Button
              variant={tool === 'eraser' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setTool('eraser')}
              className={tool === 'eraser' ? 'bg-white text-black hover:bg-gray-200 border-none shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-slate-900/50 border-white/10 text-gray-400 hover:bg-slate-800 hover:text-white'}
            >
              <SafeIcon icon={Icons.Eraser} size={18} />
            </Button>
            <div className="w-px h-8 bg-white/10 mx-1" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={clearCanvas} className="bg-slate-900/50 border-white/10 text-gray-400 hover:bg-slate-800 hover:text-white transition-all">
                    <SafeIcon icon={Icons.RotateCcw} size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900/80 border-white/10 text-slate-200 backdrop-blur-md">
                  <p>{t.sketch.clear}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/*
            Container with SOLID BG color to visually act as the "Paper".
            The canvas inside is TRANSPARENT.

            CHANGED: bg-slate-900/40 -> bg-slate-900
            Added z-0 to clarify stacking, although it is default.
            This ensures the "Canvas BG" is opaque and blocks the app background.
        */}
        <div className="flex-1 relative bg-slate-900 rounded-3xl shadow-lg border border-white/10 overflow-hidden">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full cursor-crosshair touch-none"
          />

          <div className="absolute bottom-6 right-6 z-10">
            {analyzing ? (
              <Card className="p-3 bg-slate-900/80 backdrop-blur-xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                <AnalysisProgress
                  label={t.sketch.analyzing}
                  detail={getAnalysisDetail(analysisStep)}
                  totalSteps={3}
                  currentStep={analysisStep}
                  className="w-64"
                />
              </Card>
            ) : (
              <Button
                onClick={analyzeDrawing}
                disabled={!!result}
                className="h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full px-6 shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all border border-white/10 font-medium"
              >
                <SafeIcon icon={Icons.Sparkles} className="mr-2 h-4 w-4" /> {t.sketch.analyze}
              </Button>
            )}
          </div>
        </div>

        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 z-10">
            <Card className="p-6 bg-slate-900/60 border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-md">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-violet-500/20 rounded-full text-violet-300 border border-violet-500/30 hidden sm:block">
                  <SafeIcon icon={Icons.Sparkles} size={20} />
                </div>
                <div className="space-y-3 flex-1">
                  <h3 className="font-semibold text-white tracking-wide">{t.sketch.resultTitle}</h3>
                  <p className="text-slate-300 leading-relaxed text-sm md:text-base">{result}</p>

                  {/* Action Buttons Row */}
                  <div className="pt-2 flex gap-4 items-center">
                     {/* Save Button */}
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        className={`
                            pl-0 transition-all duration-200 h-10 px-4 rounded-lg
                            ${isSaved ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10' : 'text-slate-400 hover:text-violet-300 hover:bg-violet-500/10'}
                        `}
                     >
                       {isSaved ? (
                           <>
                             <Check className="w-4 h-4 mr-2" />
                             已保存
                           </>
                       ) : (
                           t.sketch.save
                       )}
                     </Button>

                     {/* Share/Send Button */}
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleShare}
                        disabled={isSending}
                        className="text-slate-400 hover:text-white hover:bg-violet-600/20 h-10 px-4 rounded-lg transition-all duration-200"
                     >
                       {isSending ? (
                           <>
                             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                             发送中...
                           </>
                       ) : (
                           t.sketch.share
                       )}
                     </Button>
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

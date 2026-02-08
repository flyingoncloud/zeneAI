import React, { useRef, useState, useEffect } from 'react';
import * as Icons from './ui/icons';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useZenemeStore } from '../hooks/useZenemeStore';
import { AnimatePresence, motion } from 'motion/react';
import { Mic, Lock, Pause, Plus, Image as ImageIcon, PenTool } from 'lucide-react';
import { Toast } from './shared/GlobalFeedback';
import { cn } from './ui/utils';

// Helper to safely render icons if they are undefined (environment issue)
const SafeIcon = ({ icon: Icon, ...props }: any) => {
  if (!Icon) return <span style={{ width: props.size || 24, height: props.size || 24, display: 'inline-block', background: '#ccc', borderRadius: 4 }} />;
  return <Icon {...props} />;
};

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onOpenDrawing?: () => void;
  onStopGenerating?: () => void;
  isGenerating?: boolean;
  className?: string;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onOpenDrawing,
  onStopGenerating,
  isGenerating = false,
  className = "",
  placeholder
}) => {
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const { t, danmakuPreviewText } = useZenemeStore();

  // Typewriter Effect for Danmaku Preview
  const [typedPlaceholder, setTypedPlaceholder] = useState('');
  
  useEffect(() => {
    if (!danmakuPreviewText) {
      setTypedPlaceholder('');
      return;
    }

    let currentIndex = 0;
    const text = danmakuPreviewText;
    setTypedPlaceholder(''); // Reset start
    
    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        setTypedPlaceholder(prev => text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 40); // 30-50ms speed

    return () => clearInterval(intervalId);
  }, [danmakuPreviewText]);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  
  // Permission States
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showPermissionDeniedToast, setShowPermissionDeniedToast] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });
  const [isStopping, setIsStopping] = useState(false);

  // Simulation Refs
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // ESC to stop generating
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGenerating && onStopGenerating) {
        onStopGenerating();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, onStopGenerating]);

  const startListeningSimulation = () => {
    setIsListening(true);
    setInput('');
    const phrases = ["我最近有点...", "我最近有点焦虑，睡不好", "我最近有点焦虑，睡不好，脑子停不下来"];
    let step = 0;
    const typeNext = () => {
      if (step < phrases.length) {
        setInput(phrases[step]);
        step++;
        typingTimerRef.current = setTimeout(typeNext, 600);
      } else {
        silenceTimerRef.current = setTimeout(() => {
          handleAutoSend();
        }, 2500);
      }
    };
    typingTimerRef.current = setTimeout(typeNext, 600);
  };

  const handleAutoSend = () => {
    setIsListening(false);
    onSendMessage("我最近有点焦虑，睡不好，脑子停不下来");
    setInput('');
    setToast({ visible: true, message: '已发送', type: 'success' });
  };

  const stopListening = () => {
    setIsListening(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const handleMicClick = () => {
    if (isGenerating) {
        onStopGenerating?.();
        return;
    }
    if (isListening) {
      stopListening();
      return;
    }
    if (hasPermission === true) {
      startListeningSimulation();
    } else if (hasPermission === false) {
      setShowPermissionDeniedToast(true);
      setTimeout(() => setShowPermissionDeniedToast(false), 3000);
    } else {
      setShowPermissionDialog(true);
    }
  };

  const handlePermissionGrant = () => {
    setHasPermission(true);
    setShowPermissionDialog(false);
    startListeningSimulation();
  };

  const handlePermissionDeny = () => {
    setHasPermission(false);
    setShowPermissionDialog(false);
    setShowPermissionDeniedToast(true);
    setTimeout(() => setShowPermissionDeniedToast(false), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating && onStopGenerating) {
        setIsStopping(true);
        onStopGenerating();
        setTimeout(() => setIsStopping(false), 300);
        return;
    }
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
    stopListening();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const hasText = input.trim().length > 0;

  return (
    <>
      <Toast 
        visible={toast.visible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />

      <AnimatePresence>
        {showPermissionDeniedToast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#1E1E1E] border border-white/10 text-slate-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]"
          >
            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
              <Lock className="w-4 h-4 text-red-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">未获得麦克风权限</p>
              <p className="text-xs text-slate-400">无法使用语音输入</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="sm:max-w-xs bg-[#1E1E1E] border border-white/10 text-slate-200 p-5 shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-white text-base font-medium flex items-center gap-2">
              <Mic className="w-4 h-4 text-violet-400" /> 允许使用麦克风？
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              为了进行语音输入，ZeneWe 需要使用你的麦克风。
            </p>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="flex-1 text-slate-400 hover:text-white hover:bg-white/5 h-8 text-xs"
                onClick={handlePermissionDeny}
              >
                暂不允许
              </Button>
              <Button 
                size="sm"
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white h-8 text-xs"
                onClick={handlePermissionGrant}
              >
                允许
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Input Container - The "Big Box" */}
      <form 
        onSubmit={handleSubmit} 
        className={cn(
          "relative flex items-center gap-3 p-2 pl-3 rounded-[32px] bg-slate-900/60 border border-white/10 shadow-lg backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:shadow-violet-900/10",
          className
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileUpload}
          disabled={isGenerating}
        />

        {/* Left: Plus Button with Popover */}
        <div className="relative z-10 flex-shrink-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isGenerating}
                className={cn(
                  "w-10 h-10 rounded-full transition-all duration-200",
                  "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white",
                  "focus:ring-0 focus:outline-none"
                )}
              >
                <Plus size={22} strokeWidth={2} />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="top" 
              align="start" 
              className="w-40 p-1.5 bg-slate-900/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-xl"
            >
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors w-full text-left"
                >
                  <ImageIcon size={16} className="text-violet-400" />
                  <span>上传图片</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenDrawing}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors w-full text-left"
                >
                  <PenTool size={16} className="text-violet-400" />
                  <span>内视涂鸦</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Middle: Input Field */}
        <div className="flex-1 relative h-full flex items-center">
            <input
              ref={textInputRef}
              type="text"
              value={input}
              disabled={isGenerating}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isGenerating 
                  ? "ZeneWe 正在回复…" 
                  : isListening 
                    ? "正在聆听..." 
                    : (danmakuPreviewText ? typedPlaceholder : (placeholder || "聊聊你的心情吧"))
              }
              className={cn(
                "w-full bg-transparent border-0 outline-none shadow-none focus:ring-0 px-2 py-3 text-[16px] placeholder:text-slate-500/80 text-slate-200",
                isGenerating && "placeholder:text-slate-600 cursor-not-allowed",
                isListening && "placeholder:text-violet-400/70 text-violet-200",
                danmakuPreviewText && "placeholder:text-slate-400"
              )}
            />
            
            {/* Listening Visualizer inside input area */}
            {isListening && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
                     <motion.div 
                       animate={{ height: [4, 12, 4] }}
                       transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                       className="w-1 bg-violet-500 rounded-full"
                     />
                     <motion.div 
                       animate={{ height: [4, 16, 4] }}
                       transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                       className="w-1 bg-violet-400 rounded-full"
                     />
                     <motion.div 
                       animate={{ height: [4, 10, 4] }}
                       transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                       className="w-1 bg-violet-500 rounded-full"
                     />
                </div>
            )}
        </div>

        {/* Right: Action Button (Mic/Send/Pause) */}
        <div className="flex-shrink-0 pr-1">
          <Button
            type={hasText || isGenerating ? "submit" : "button"}
            size="icon"
            onClick={(hasText || isGenerating) ? undefined : handleMicClick}
            disabled={isStopping}
            title={isGenerating ? "停止生成" : (hasText ? "发送消息" : "语音输入")}
            aria-label={isGenerating ? "停止生成" : (hasText ? "发送消息" : "语音输入")}
            className={cn(
              "w-11 h-11 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center relative",
              isGenerating
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10'
                  : hasText 
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] border border-violet-400/20' 
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/10',
               isStopping && "opacity-50 cursor-not-allowed"
            )}
          >
            <AnimatePresence mode="wait">
              {isGenerating ? (
                  <motion.div
                      key="pause"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="flex flex-col items-center justify-center"
                  >
                      <Pause size={18} className="fill-current" />
                  </motion.div>
              ) : hasText ? (
                  <motion.div
                      key="send"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                  >
                      <SafeIcon icon={Icons.Send} size={18} className="ml-0.5" />
                  </motion.div>
              ) : (
                  <motion.div
                      key="mic"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="relative"
                  >
                      {isListening && (
                          <motion.div 
                             animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                             transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                             className="absolute inset-0 -m-2 bg-violet-500 rounded-full blur-md opacity-50"
                          />
                      )}
                      <SafeIcon icon={Icons.Mic} size={isListening ? 20 : 18} className={isListening ? "text-violet-300 relative z-10" : ""} />
                  </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </form>
    </>
  );
};

import React, { useRef, useState, useEffect } from 'react';
import * as Icons from './ui/icons';
import { Button } from './ui/button';
import { Plus, Image as ImageIcon, PenTool } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useZenemeStore } from '../hooks/useZenemeStore';
import { AnimatePresence, motion } from 'motion/react';
import { Mic, Lock, Settings, Pause } from 'lucide-react';
import { Toast } from './shared/GlobalFeedback';

// Helper to safely render icons if they are undefined (environment issue)
type IconLikeProps = {
  size?: number | string;
  className?: string;
  color?: string;
  strokeWidth?: number;
  [key: string]: unknown;
};

type IconLike = React.ComponentType<IconLikeProps>;

const SafeIcon = ({ icon: Icon, ...props }: { icon?: IconLike } & IconLikeProps) => {
  if (!Icon)
    return (
      <span
        style={{
          width: props.size || 24,
          height: props.size || 24,
          display: 'inline-block',
          background: '#ccc',
          borderRadius: 4,
        }}
      />
    );
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
//替换成+扩展，内饰涂鸦，发送图片
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
  const { t } = useZenemeStore();

  // Plus menu state
const [isPlusOpen, setIsPlusOpen] = useState(false);
const plusWrapRef = useRef<HTMLDivElement | null>(null);

// Close plus menu on outside click / Esc
useEffect(() => {
  if (!isPlusOpen) return;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsPlusOpen(false);
  };

  const onMouseDown = (e: MouseEvent) => {
    const el = plusWrapRef.current;
    if (!el) return;
    if (!el.contains(e.target as Node)) setIsPlusOpen(false);
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('mousedown', onMouseDown);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('mousedown', onMouseDown);
  };
  }, [isPlusOpen]);

  // Voice States
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  // Permission States
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [showPermissionDeniedToast, setShowPermissionDeniedToast] = useState(false);
  const [showNoMicToast, setShowNoMicToast] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' | 'info' });

  const [plusOpen, setPlusOpen] = useState(false);
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

  const startListeningSimulation = () => {
    setIsListening(true);
    setVoiceText('');
    setInput('');

    // Simulate voice recognition
    const phrases = ["我最近有点...", "我最近有点焦虑，睡不好", "我最近有点焦虑，睡不好，脑子停不下来"];

    let step = 0;
    const typeNext = () => {
      if (step < phrases.length) {
        setInput(phrases[step]);
        step++;
        typingTimerRef.current = setTimeout(typeNext, 600);
      } else {
        // Finished "speaking", start silence timer
        silenceTimerRef.current = setTimeout(() => {
          handleAutoSend();
        }, 2500);
      }
    };

    // Start typing simulation after a short delay
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
        // Pause logic handled by main button when generating
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
        onStopGenerating();
        return;
    }
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
    stopListening(); // Ensure listening stops if manually sent
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      console.log('File selected:', file.name);

      // Show uploading toast
      setToast({ visible: true, message: '正在上传图片...', type: 'info' });

      // Upload file to backend
      const { uploadFile } = await import('../lib/api');
      const result = await uploadFile(file);

      if (result.ok && result.url) {
        // Convert relative URL to full URL for display
        const fullImageUrl = result.url.startsWith('http')
          ? result.url
          : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${result.url}`;

        console.log('Image uploaded successfully:', fullImageUrl);

        // Send the uploaded image URL to AI for analysis
        onSendMessage(`请分析这张图片中表达的情感和感受 [图片: ${fullImageUrl}]`);

        setToast({ visible: true, message: '图片上传成功！', type: 'success' });
      } else {
        console.error('File upload failed:', result);
        setToast({ visible: true, message: '图片上传失败，请重试', type: 'error' });
      }
    } catch (error) {
      console.error('File upload error:', error);
      setToast({ visible: true, message: '图片上传失败，请重试', type: 'error' });
    } finally {
      // Clear the file input
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Hide toast after 3 seconds
      setTimeout(() => setToast({ ...toast, visible: false }), 3000);
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

      {/* Permission Denied Toast / Mini Dialog */}
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

      {/* Permission Request Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="sm:max-w-xs bg-[#1E1E1E] border border-white/10 text-slate-200 p-5 shadow-2xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-white text-base font-medium flex items-center gap-2">
              <Mic className="w-4 h-4 text-violet-400" /> 允许使用麦克风？
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              为了进行语音输入，zeneme 需要使用你的麦克风。
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


      <form onSubmit={handleSubmit} className={`relative flex items-center gap-2 ${className}`}>
        {/* Left Actions */}
<div className="flex items-center gap-2 mr-2 z-10 relative">
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
    <Popover open={plusOpen} onOpenChange={setPlusOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={isGenerating}
          className={[
            "w-10 h-10 rounded-full transition-all duration-200",
            "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white",
            "focus:ring-0 focus:outline-none"
          ].join(" ")}
        >
          <Plus size={22} strokeWidth={2} />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={10}
        className="w-40 p-1.5 bg-slate-900/95 backdrop-blur-xl border-white/10 shadow-2xl rounded-xl"
      >
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => {
              setPlusOpen(false);
              fileInputRef.current?.click();
            }}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors w-full text-left"
          >
            <ImageIcon size={16} className="text-violet-400" />
            <span>上传图片</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPlusOpen(false);
              onOpenDrawing?.();
            }}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors w-full text-left"
          >
            <PenTool size={16} className="text-violet-400" />
            <span>内视涂鸦</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</div>



        {/* Input Field Area */}
        <div className="relative flex-1">
            <input
            ref={textInputRef}
            type="text"
            value={input}
            disabled={isGenerating}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isGenerating ? "ZeneMe 正在回复…" : (isListening ? "正在聆听..." : (placeholder || "聊聊你的心情吧"))}
            className={`w-full px-6 py-4 pr-4 bg-slate-900/50 border rounded-full focus:outline-none focus:ring-2 transition-all backdrop-blur-sm shadow-inner z-10
                ${isGenerating
                    ? 'border-white/5 bg-slate-800/20 text-slate-500 placeholder:text-slate-600 cursor-not-allowed'
                    : isListening
                        ? 'border-violet-500/50 ring-2 ring-violet-500/20 text-violet-200 placeholder:text-violet-400/70'
                        : 'border-white/10 focus:ring-violet-500/40 focus:border-violet-500 text-slate-200 placeholder:text-slate-500'}`}
            />

            {/* Listening Visualizer inside/near input */}
            {isListening && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1 pointer-events-none">
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

        {/* Right Main Button (Mic vs Send vs Pause) */}
        <Button
          type={hasText || isGenerating ? "submit" : "button"}
          size="icon"
          onClick={(hasText || isGenerating) ? undefined : handleMicClick}
          className={`w-12 h-12 rounded-full shadow-lg transition-all duration-300 z-20 flex items-center justify-center relative
            ${isGenerating
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10'
                : hasText
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.4)] border border-violet-400/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10'}`}
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
                    <Pause size={20} className="fill-current" />
                </motion.div>
            ) : hasText ? (
                <motion.div
                    key="send"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                >
                    <SafeIcon icon={Icons.Send} size={20} className="ml-0.5" />
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
                        <>
                         <motion.div
                            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="absolute inset-0 -m-2 bg-violet-500 rounded-full blur-md opacity-50"
                         />
                        </>
                    )}
                    <SafeIcon icon={Icons.Mic} size={isListening ? 22 : 20} className={isListening ? "text-violet-300 relative z-10" : ""} />
                </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </form>
    </>
  );
};

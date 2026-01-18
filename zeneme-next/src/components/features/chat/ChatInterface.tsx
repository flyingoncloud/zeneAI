import React, { useRef, useState, useEffect } from 'react';
import * as Icons from '../../ui/icons';
import { Message, useZenemeStore, type View, type ModuleStatus } from '../../../hooks/useZenemeStore';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import { AnalysisProgress } from '../../AnalysisProgress';
import { AnimatePresence, motion } from 'motion/react';
import { ReportPage } from './ReportPage';
import { ChatInput } from '../../ChatInput';
import { Heart, PenTool, ClipboardList, Maximize2 } from 'lucide-react';
import { Dialog, DialogContent } from '../../ui/dialog';
import { sendChatMessage, generateConversationReport, getReportStatus } from '../../../lib/api';
import { ModuleRecommendationCard } from './ModuleRecommendationCard';
import { toast } from 'sonner';

// Module ID to View mapping
const MODULE_VIEW_MAP: Record<string, View> = {
  'breathing_exercise': 'first-aid',
  'emotion_labeling': 'mood',
  'inner_doodling': 'sketch',
  'quick_assessment': 'test'
};

// Helper function to check if module is completed
function isModuleCompleted(moduleId: string, moduleStatus?: ModuleStatus): boolean {
  return !!(moduleStatus?.[moduleId]?.completed_at);
}

/**
 * Local icon typing helpers (avoid `any` without changing imports/logic)
 */
type IconLikeProps = {
  size?: number;
  className?: string;
  strokeWidth?: number;
  [key: string]: unknown;
};

type IconLike = React.ComponentType<IconLikeProps>;

// Helper to safely render icons
const SafeIcon = ({ icon: Icon, ...props }: { icon?: IconLike } & IconLikeProps) => {
  const size = typeof props.size === 'number' ? props.size : 24;
  if (!Icon)
    return (
      <span
        style={{
          width: size,
          height: size,
          display: 'inline-block',
          background: '#ccc',
          borderRadius: 4,
        }}
      />
    );
  return <Icon {...props} />;
};

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

// Separate component for AI Message to handle Typewriter effect
const AIMessageBubble = ({
  content,
  onComplete,
  isStopped,
  shouldAnimate = true,
}: {
  content: string;
  onComplete?: () => void;
  isStopped?: boolean;
  shouldAnimate?: boolean;
}) => {
  // Safety check for undefined content
  const safeContent = content || '';
  const [displayedContent, setDisplayedContent] = useState(shouldAnimate ? '' : content);
  const [isTyping, setIsTyping] = useState(shouldAnimate);

  // If shouldAnimate becomes false (e.g. became history), force complete
  useEffect(() => {
    if (!shouldAnimate) {
      // The lint rule flags the setState line itself, so we disable it on that line.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayedContent(safeContent);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTyping(false);
    }
  }, [shouldAnimate, content]);

  // If stopped, immediately show full content and stop typing animation
  useEffect(() => {
    if (isStopped) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayedContent(safeContent);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTyping(false);
      if (onComplete) onComplete();
    }
  }, [isStopped, content, onComplete]);

  // NOTE: This effect intentionally controls a typewriter animation via state updates.
  // We keep the behavior unchanged and silence exhaustive-deps for the `displayedContent` closure dependency.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // If NOT animating, or already complete/stopped, don't restart typing
    if (!shouldAnimate || !isTyping || isStopped) return;

    // Reset if content changes completely (new message)
    if (displayedContent === '' && safeContent !== '') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayedContent('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTyping(true);
    }

    const totalLength = safeContent.length;
    let currentLength = displayedContent.length;

    if (currentLength >= totalLength) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTyping(false);
      if (onComplete) onComplete();
      return;
    }

    const interval = setInterval(() => {
      currentLength += 1;

      if (currentLength >= totalLength) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDisplayedContent(safeContent);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsTyping(false);
        clearInterval(interval);
        if (onComplete) onComplete();
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDisplayedContent(safeContent.substring(0, currentLength));
      }
    }, 20);

    return () => clearInterval(interval);
  }, [content, isTyping, isStopped, onComplete, shouldAnimate]);

  return (
    <div className="w-full relative group min-h-[24px]">
      <div className="text-slate-300 text-[15px] leading-[1.7] whitespace-pre-wrap font-light tracking-wide break-words">
        {displayedContent}
        {isTyping && (
          <span className="animate-pulse inline-block w-1.5 h-4 ml-1 bg-violet-400 align-middle rounded-full align-text-bottom"></span>
        )}
      </div>
    </div>
  );
};

// Component for User Message with optional attachment (Sketch)
const UserMessageBubble = ({ message }: { message: Message }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col items-end gap-2 max-w-full">
        {message.attachment && message.attachment.type === 'sketch' && (
          <motion.div
            layoutId={`sketch-${message.id}`}
            onClick={() => setIsPreviewOpen(true)}
            className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={message.attachment.preview || message.attachment.url}
              alt="Sketch"
              className="w-48 h-32 object-cover bg-slate-900"
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-1">
              <Maximize2 size={14} className="text-white" />
            </div>
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white/80 font-medium">
              内视涂鸦
            </div>
          </motion.div>
        )}
        <div className="px-5 py-3 text-sm leading-relaxed shadow-sm backdrop-blur-md bg-violet-600/80 text-white rounded-2xl rounded-tr-none shadow-[0_0_20px_rgba(139,92,246,0.25)] border border-violet-400/20">
          {message.content}
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl bg-transparent border-none shadow-none p-0 flex justify-center items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.attachment?.preview || message.attachment?.url}
            alt="Sketch Preview"
            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl border border-white/10 bg-slate-900"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

// Quick Action Chip Component (Revised for Main Entrance Style)
type QuickActionChipProps = {
  icon: IconLike;
  label: string;
  onClick: () => void;
  delay: number;
};

const QuickActionChip = ({ icon: Icon, label, onClick, delay }: QuickActionChipProps) => {
  return (
    <motion.button
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay, duration: 0.5, type: 'spring', stiffness: 100 }}
      whileHover={{
        y: -3,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderColor: 'rgba(255, 255, 255, 0.35)',
        boxShadow: '0 12px 30px -8px rgba(139, 92, 246, 0.3)',
      }}
      // `brightness` is not a valid Motion property; use CSS filter instead (same visual effect)
      whileTap={{ scale: 0.96, y: 1, filter: 'brightness(0.9)' }}
      onClick={onClick}
      className="flex items-center gap-3.5 px-6 h-[50px] bg-white/5 border border-white/20 rounded-full transition-all duration-300 group cursor-pointer backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)] hover:shadow-violet-500/25"
    >
      <div className="w-5 h-5 flex items-center justify-center text-violet-200 group-hover:text-white transition-colors filter drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]">
        <SafeIcon icon={Icon} size={20} strokeWidth={2.5} />
      </div>
      <span className="text-[16px] text-white/95 font-semibold tracking-wide whitespace-nowrap group-hover:text-white drop-shadow-md">
        {label}
      </span>
    </motion.button>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage }) => {
  const [showReport, setShowReport] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // AI Response State
  const [isAiReplying, setIsAiReplying] = useState(false); // Controls Input Lock
  const [isAiResponseStopped, setIsAiResponseStopped] = useState(false);

  // We use a ref to track if we've already triggered a response for the latest user message
  const lastProcessedMessageIdRef = useRef<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, setCurrentView, addMessage, conversationId, language } = useZenemeStore();

  const lastMessage = messages[messages.length - 1];

  /**
   * ✅ FIX: make Stop work for BOTH phases:
   * 1) thinking phase (before AI message exists): cancel pending timeout + stop spinner
   * 2) typing phase (AI message exists): stop typewriter via isAiResponseStopped
   */
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stopRequestedRef = useRef<boolean>(false);

  // Effect to trigger AI response workflow
  // Only trigger if the last message is from user AND we haven't processed it yet
  useEffect(() => {
    // Cleanup helper for any pending timers
    const clearAiTimeout = () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };

    if (lastMessage?.role === 'user' && lastMessage.id !== lastProcessedMessageIdRef.current) {
      // Mark as processed immediately to prevent duplicate triggers
      lastProcessedMessageIdRef.current = lastMessage.id;

      // New user message => reset stop flag & stopped state
      stopRequestedRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAiResponseStopped(false);

      // Ensure no old timer is alive (safety)
      clearAiTimeout();

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsThinking(true);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAiReplying(true); // Lock input immediately when user sends

      // Call the real API instead of simulating
      aiTimeoutRef.current = setTimeout(async () => {
        // If user pressed Stop during thinking, do nothing (don't add AI message)
        if (stopRequestedRef.current) {
          return;
        }

        try {
          // Call the backend API
          const response = await sendChatMessage({
            message: lastMessage.content,
            images: lastMessage.attachment?.url ? [lastMessage.attachment.url] : undefined,
          });

          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsThinking(false);

          // Add the AI response to messages
          addMessage(response.reply, 'ai');
        } catch (error) {
          console.error('Error getting AI response:', error);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsThinking(false);

          // Fallback response on error
          const fallbackResponse =
            '抱歉，我现在遇到了一些技术问题。请稍后再试，或者继续告诉我你的感受，我会尽力帮助你。';
          addMessage(fallbackResponse, 'ai');
        }
      }, 1500); // 1.5s thinking time
    }

    return () => {
      // Always clear timer on unmount / re-run to avoid stray callbacks
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
  }, [lastMessage, messages.length, addMessage]); // Depend on lastMessage and length

  // When a new AI message appears (length increases and last is AI), ensure we track it as replying
  useEffect(() => {
    if (lastMessage?.role === 'ai') {
      // It's already added, so AIMessageBubble is rendering.
      // We keep isAiReplying = true until AIMessageBubble calls onComplete.
    }
  }, [lastMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isAiReplying, messages.length]); // Added messages.length to dependency to ensure scroll on new tokens if needed (though typically scroll is on new message)

  const handleAiReplyComplete = () => {
    setIsAiReplying(false);
  };

  const handleStopGenerating = () => {
    // Mark stop requested for BOTH phases
    stopRequestedRef.current = true;

    // If we are still in "thinking" (timer not fired), cancel it and stop spinner immediately
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }

    // Stop typewriter (if AI message already exists)
    setIsAiResponseStopped(true);

    // Unlock input and stop "正在回复..." text
    setIsAiReplying(false);
    setIsThinking(false);
  };

  const messageCount = messages.length;
  const isReadyForReport = messageCount >= 6;
  const [reportContent, setReportContent] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (!conversationId) {
      toast.error('无法生成报告：会话ID缺失');
      return;
    }

    setIsGeneratingReport(true);

    try {
      // Call the real API to generate report
      const result = await generateConversationReport(conversationId, language);

      if (result.ok && result.report) {
        // Store the report content
        setReportContent(result.report.content);
        setShowReport(true);
        toast.success(`报告生成成功！基于 ${result.report.module_count} 个模块的数据`);
      } else {
        // Show error message
        toast.error(result.message || '报告生成失败');
        console.error('Report generation failed:', result);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('生成报告时出现错误');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (action === 'first-aid') setCurrentView('first-aid');
    else if (action === 'sketch') setCurrentView('sketch');
    else if (action === 'test') setCurrentView('test' as unknown as Parameters<typeof setCurrentView>[0]);
  };

  // Handle module access from recommendation cards
  const handleModuleAccess = (moduleId: string) => {
    const targetView = MODULE_VIEW_MAP[moduleId];

    if (targetView) {
      setCurrentView(targetView);

      // Log analytics event in development
      if (process.env.NODE_ENV === 'development') {
        console.log('[Module Access]', {
          moduleId,
          targetView,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      console.warn('[Unknown Module ID]', moduleId);
    }
  };

  // Guard to ensure Thinking only shows if AI hasn't replied yet
  const showThinking = isThinking && lastMessage?.role !== 'ai';

  // Welcome View Logic
  const isWelcomeState = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-transparent relative text-slate-200">
      {/* 1. Header Analysis Progress - Only show if not welcome state */}
      {!isWelcomeState && (
        <div className="w-full bg-slate-900/40 border-b border-white/5 p-4 sticky top-0 z-20 flex items-center gap-4 backdrop-blur-xl">
          {!isReadyForReport ? (
            <AnalysisProgress
              label={t.chat.dataCollection}
              detail={`${Math.min(messageCount, 6)}/6 ${t.chat.messagesCount}`}
              totalSteps={6}
              currentStep={messageCount}
              className="w-48 md:w-64"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <span className="text-xs font-medium text-violet-300 bg-violet-500/20 px-2 py-1 rounded-full border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                {t.chat.dataReady}
              </span>
              <Button
                size="sm"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="bg-gradient-to-r from-violet-600/80 to-purple-600/80 hover:from-violet-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] backdrop-blur-sm border border-white/10 transition-all"
              >
                {isGeneratingReport ? (
                  <>
                    <Icons.Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.chat.analyzing}
                  </>
                ) : (
                  <>
                    <Icons.FileText className="w-4 h-4 mr-2" />
                    {t.chat.generateReport}
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {/* 2. Main Content Area */}
      {isWelcomeState ? (
        // --- WELCOME STATE LAYOUT (Gemini Style) ---
        <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-[720px] mx-auto -mt-8">
          {/* A. Main Title - Simplified to 2 lines */}
          <div className="relative w-full mb-8 z-10 text-center md:text-left flex flex-col items-center md:items-start pl-2">
            {/* Optional: Light backdrop for readability */}
            <div className="absolute inset-0 -mx-6 -my-6 bg-gradient-to-b from-slate-900/0 via-slate-900/10 to-slate-900/20 blur-2xl -z-10 rounded-full opacity-50 pointer-events-none" />

            <h1 className="text-left w-full">
              <span className="block text-[32px] md:text-[36px] leading-[1.3] font-light text-slate-300/90 tracking-wide mb-2">
                你好，我是 ZeneMe。
              </span>
              <span className="block text-[46px] md:text-[54px] leading-[1.15] font-light text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-violet-100 tracking-tight mt-1">
                你现在感觉如何？
              </span>
            </h1>
          </div>

          {/* B. Central Input Card - More Capsule-like */}
          <div className="w-full relative z-20">
            {/*
                 WRAPPER: Rounded-[38px] for extra capsule feel
               */}
            <div className="relative group rounded-[38px] shadow-lg border border-white/10 bg-slate-900/60 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:shadow-violet-900/10 px-6 py-5">
              {/* ChatInput Overrides */}
              <ChatInput
                onSendMessage={onSendMessage}
                onOpenDrawing={() => setCurrentView('sketch')}
                // Critical Overrides:
                // - Form rounded same as card
                // - Input padded to have breathing room (px-6)
                // - Placeholder color adjusted for readability
                className="w-full !bg-transparent !border-0 !shadow-none !p-0 [&_form]:!bg-transparent [&_form]:!border-0 [&_form]:!shadow-none [&_form]:!p-0 [&_input]:!bg-transparent [&_input]:!border-0 [&_input]:!shadow-none [&_input]:!px-6 [&_input]:!h-auto [&_input]:!text-[16px] [&_input]:!placeholder-slate-400/60 [&_button]:!h-[44px] [&_button]:!w-[44px] [&_button]:!rounded-full [&_button]:!bg-white/5 hover:[&_button]:!bg-white/10"
              />
            </div>
          </div>

          {/* C. Quick Action Chips - Aligned with Input Card */}
          <div className="flex flex-wrap gap-4 mt-10 w-full justify-center">
            <QuickActionChip icon={Heart} label="情绪急救" onClick={() => handleQuickAction('first-aid')} delay={0.1} />
            <QuickActionChip icon={PenTool} label="内视涂鸦" onClick={() => handleQuickAction('sketch')} delay={0.2} />
            <QuickActionChip
              icon={ClipboardList}
              label="内视快测"
              onClick={() => handleQuickAction('test')}
              delay={0.3}
            />
          </div>
        </div>
      ) : (
        // --- CHAT STATE LAYOUT ---
        <ScrollArea className="flex-1 p-4 md:p-8 relative" ref={scrollRef}>
          <div className="max-w-[680px] mx-auto space-y-8 pb-20 px-2 md:px-0">
            {messages.map((message, index) => (
              <div key={message.id} className="space-y-4">
                <div
                  className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full ${
                    message.role === 'user' ? 'justify-end' : 'justify-end'
                  }`}
                >
                  <div className={`flex flex-col w-full ${message.role === 'user' ? 'items-end' : 'items-start pl-8'}`}>
                    {message.role === 'user' ? (
                      <UserMessageBubble message={message} />
                    ) : (
                      <AIMessageBubble
                        content={message.content}
                        shouldAnimate={index === messages.length - 1} // Only animate if it's the latest message
                        // Only attach completion handler to the very last message if it's AI
                        onComplete={index === messages.length - 1 ? handleAiReplyComplete : undefined}
                        isStopped={index === messages.length - 1 ? isAiResponseStopped : false}
                      />
                    )}
                  </div>
                </div>

                {/* Module Recommendation Cards */}
                {message.role === 'ai' && message.recommended_modules && message.recommended_modules.length > 0 && (
                  <div className="pl-8 space-y-3">
                    {message.recommended_modules
                      .filter(module => !isModuleCompleted(module.module_id, message.module_status))
                      .map((module, idx) => (
                        <ModuleRecommendationCard
                          key={module.module_id}
                          module={module}
                          isCompleted={isModuleCompleted(module.module_id, message.module_status)}
                          onAccess={handleModuleAccess}
                          delay={idx * 0.1}
                        />
                      ))}
                  </div>
                )}
              </div>
            ))}

            {/* Thinking Indicator */}
            <AnimatePresence>
              {showThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-row w-full justify-start pl-8"
                >
                  <div className="flex flex-col items-start">
                    <div className="text-slate-400 flex items-center gap-1.5 h-[30px] px-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                        className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                        className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                        className="w-1.5 h-1.5 bg-violet-400 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}

      {/* 3. Bottom Chat Input - ONLY show if NOT welcome state (because welcome state has its own central input) */}
      {!isWelcomeState && (
        <div className="p-4 bg-slate-900/40 backdrop-blur-xl border-t border-white/5 absolute bottom-0 w-full z-10">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSendMessage={onSendMessage}
              onOpenDrawing={() => setCurrentView('sketch')}
              onStopGenerating={handleStopGenerating}
              isGenerating={isAiReplying || isThinking} // Lock input during Thinking OR Replying
              className="w-full"
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {showReport && (
          <ReportPage
            onClose={() => setShowReport(false)}
            reportContent={reportContent}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

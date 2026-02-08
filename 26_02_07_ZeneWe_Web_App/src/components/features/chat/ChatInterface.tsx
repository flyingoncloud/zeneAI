import React, { useRef, useState, useEffect } from 'react';
import * as Icons from '../../ui/icons';
import { Message, useZenemeStore } from '../../../hooks/useZenemeStore';
import { Button } from '../../ui/button';
import { ScrollArea } from '../../ui/scroll-area';
import { AnalysisProgress } from '../../AnalysisProgress';
import { AnimatePresence, motion } from 'motion/react';
import { ReportPage } from './ReportPage';
import { ChatInput } from '../../ChatInput';
import { Maximize2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../ui/dialog';
import { SplashDanmakuLayer } from './SplashDanmakuLayer';
import { guardGuestAction } from '../../../utils/authHelpers';

// --- Custom Fine-Line Icons ---
const IconFirstAid = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <path d="M12 7.5v4m0 0v4m0-4h4m-4 0H8" />
  </svg>
);

const IconSketch = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 10h-2a2 2 0 0 1-2-2V6l2.5-2.5L19 6l-2.5 2.5a2 2 0 0 1-1.5.5Z" />
    <path d="M3 20.5v-13A2.5 2.5 0 0 1 5.5 5H13" />
    <path d="M3 21h15a2 2 0 0 0 2-2v-6" />
    <path d="M7 11c1-1 3-1 4 0" strokeOpacity="0.7" />
    <path d="M7 15c2-2 5-1 6 1" />
  </svg>
);

const IconTest = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="18" x="5" y="3" rx="2.5" />
    <path d="M9 8h6" />
    <path d="M9 12h3" />
    <path d="M14 16l1 1 2.5-2.5" />
  </svg>
);

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

// Text Formatter Component for AI Messages
const FormattedMessage = ({ text, isTyping }: { text: string, isTyping: boolean }) => {
  const lines = text.split('\n');
  return (
    <div className="flex flex-col gap-1 w-full text-[15px] font-light tracking-wide text-white leading-[1.7]">
      {lines.map((line, i) => {
        const isLastLine = i === lines.length - 1;
        const listMatch = line.match(/^(\d+[\.\)]\s?|[\-\•]\s+)(.*)/);
        
        if (listMatch) {
           const [_, bullet, content] = listMatch;
           return (
             <div key={i} className="flex gap-3 items-start w-full text-left group/list">
                <span className="flex-shrink-0 min-w-[20px] text-white/70 font-medium select-none pt-[0.1em]">{bullet}</span>
                <div className="flex-1 leading-[1.7] break-words min-w-0">
                   {content}
                   {isLastLine && isTyping && (
                     <span className="animate-pulse inline-block w-1.5 h-4 ml-1 bg-white align-middle rounded-full align-text-bottom" />
                   )}
                </div>
             </div>
           );
        }
        
        if (!line.trim()) {
           if (isLastLine && isTyping) return null;
           return <div key={i} className="h-3" />;
        }
        
        return (
          <div key={i} className="leading-[1.7] break-words min-w-0 w-full text-left">
            {line}
            {isLastLine && isTyping && (
              <span className="animate-pulse inline-block w-1.5 h-4 ml-1 bg-white align-middle rounded-full align-text-bottom" />
            )}
          </div>
        );
      })}
    </div>
  );
};

// Separate component for AI Message to handle Typewriter effect
const AIMessageBubble = ({ content, status, onComplete, onStop, isStopped, shouldAnimate = true }: { content: string, status?: 'stopped', onComplete?: () => void, onStop?: (content: string) => void, isStopped?: boolean, shouldAnimate?: boolean }) => {
  const [displayedContent, setDisplayedContent] = useState(shouldAnimate ? '' : content);
  const [isTyping, setIsTyping] = useState(shouldAnimate);

  useEffect(() => {
    if (!shouldAnimate) {
        setDisplayedContent(content);
        setIsTyping(false);
    }
  }, [shouldAnimate, content]);

  useEffect(() => {
    if (isStopped) {
        setIsTyping(false);
        if (onStop) onStop(displayedContent);
        if (onComplete) onComplete();
    }
  }, [isStopped, onStop, onComplete, displayedContent]);

  useEffect(() => {
    if (!shouldAnimate || !isTyping || isStopped) return;
    if (displayedContent === '' && content !== '') {
        setDisplayedContent('');
        setIsTyping(true);
    }
    
    const totalLength = content.length;
    let currentLength = displayedContent.length; 
    
    if (currentLength >= totalLength) {
        setIsTyping(false);
        if (onComplete) onComplete();
        return;
    }

    const interval = setInterval(() => {
      currentLength += 1; 
      if (currentLength >= totalLength) {
        setDisplayedContent(content);
        setIsTyping(false);
        clearInterval(interval);
        if (onComplete) onComplete();
      } else {
        setDisplayedContent(content.substring(0, currentLength));
      }
    }, 20); 
    
    return () => clearInterval(interval);
  }, [content, isTyping, isStopped, onComplete, shouldAnimate]);

  return (
    <div className="w-full relative group min-h-[24px]">
       <FormattedMessage text={displayedContent} isTyping={isTyping} />
       {status === 'stopped' && (
         <div className="flex items-center gap-2 mt-2 select-none animate-in fade-in duration-300">
            <div className="w-[6px] h-[6px] rounded-full bg-[#FF3B30]" />
            <span className="text-[13px] text-white font-light leading-[18px] opacity-80">已停止生成</span>
         </div>
       )}
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
                    <DialogTitle className="sr-only">Sketch Preview</DialogTitle>
                    <DialogDescription className="sr-only">A larger preview of the user's sketch</DialogDescription>
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

// --- Quick Action Card (Vertical Layout) ---
const QuickActionCard = ({ icon: Icon, label, onClick, delay }: any) => {
  return (
    <motion.button
      initial="idle"
      whileHover="hover"
      whileTap="active"
      animate={{ opacity: 1, y: 0 }}
      variants={{
        idle: { scale: 1 },
        hover: { scale: 1.04, backgroundColor: "rgba(255, 255, 255, 0.1)", boxShadow: "0 12px 32px -8px rgba(139, 92, 246, 0.2)" },
        active: { scale: 0.98 }
      }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-3 py-5 px-3 min-w-[110px] max-w-[160px] h-[120px] bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md cursor-pointer group select-none transition-colors duration-300"
    >
      {/* Icon Container with Floating Animation */}
      <motion.div
        variants={{
          idle: { y: 0, opacity: 0.95, filter: "brightness(1.1)" },
          hover: { 
            y: -3, 
            opacity: 1, 
            filter: "brightness(1.3)",
            transition: { 
              y: { repeat: Infinity, repeatType: "reverse", duration: 0.8, ease: "easeInOut" } 
            }
          }
        }}
        className="text-violet-100 group-hover:text-white transition-colors"
      >
        <Icon className="w-10 h-10" />
      </motion.div>
      
      {/* Label */}
      <span className="text-[15px] font-medium text-slate-200 group-hover:text-white transition-colors tracking-wide">
        {label}
      </span>
    </motion.button>
  );
};

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage }) => {
  const [showReport, setShowReport] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [isAiResponseStopped, setIsAiResponseStopped] = useState(false);
  const lastProcessedMessageIdRef = useRef<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, setCurrentView, addMessage, updateMessage } = useZenemeStore(); 

  const lastMessage = messages[messages.length - 1];
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (lastMessage?.role === 'user' && lastMessage.id !== lastProcessedMessageIdRef.current) {
      lastProcessedMessageIdRef.current = lastMessage.id;
      setIsThinking(true);
      setIsAiReplying(true);
      setIsAiResponseStopped(false);
      timeoutId = setTimeout(() => {
          setIsThinking(false);
          const responseText = "我看到了你的内容，也能感觉到你现在有点被拉扯：一边想把事情理清楚，一边又很难停下来。\n\n我们先不急着找答案，先把当下这一刻稳住。\n你可以试着做两件小事：\n1）把注意力放到呼吸上，慢慢吸气 4 秒，停 2 秒，再呼气 6 秒，重复 3 次。\n2）用一个词给你此刻的感受命名（比如：紧绷、疲惫、烦躁、空、害怕）。\n\n如果你愿意，也可以告诉我：刚才那一刻最让你难受的点是什么？\n我会陪你一起把它拆小、说清楚。";
          addMessage(responseText, 'ai');
      }, 1500);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [lastMessage, messages.length, addMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking, isAiReplying, messages.length]);

  const handleAiReplyComplete = () => { setIsAiReplying(false); };
  const handleStopGenerating = () => { setIsAiResponseStopped(true); setIsAiReplying(false); };
  const handleAiReplyStopped = (finalContent: string, msg: Message) => {
      if (msg.status === 'stopped') return;
      updateMessage(msg.id, finalContent, 'stopped');
      setIsAiReplying(false);
  };

  const messageCount = messages.length;
  const isReadyForReport = messageCount >= 6;

  const handleGenerateReport = () => {
    if (guardGuestAction('report-detail')) return;
    setIsGeneratingReport(true);
    setTimeout(() => {
      setIsGeneratingReport(false);
      setShowReport(true);
    }, 2000);
  };

  const handleQuickAction = (action: string) => {
    if (action === 'first-aid') setCurrentView('first-aid');
    else if (action === 'sketch') setCurrentView('sketch');
    else if (action === 'test') {
        if (guardGuestAction('test')) return;
        setCurrentView('test' as any);
    }
  };

  const showThinking = isThinking && lastMessage?.role !== 'ai';
  const isWelcomeState = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-transparent relative text-slate-200">
      
      {isWelcomeState && <SplashDanmakuLayer />}
      
      {!isWelcomeState && (
        <div className="w-full bg-slate-900/40 border-b border-white/5 px-5 py-4 sticky top-0 z-20 flex justify-end items-center gap-4 backdrop-blur-xl">
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
             >
               <Button 
                 onClick={handleGenerateReport}
                 disabled={isGeneratingReport}
                 className="h-auto py-2 px-4 flex flex-row items-center gap-3 bg-gradient-to-r from-violet-600/90 to-purple-600/90 hover:from-violet-500 hover:to-purple-500 border border-white/10 shadow-[0_0_20px_rgba(139,92,246,0.3)] rounded-xl transition-all"
               >
                 <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-white/10 rounded-full">
                   {isGeneratingReport ? (
                     <Icons.Loader2 className="w-4 h-4 text-white animate-spin" />
                   ) : (
                     <Icons.FileText className="w-4 h-4 text-white" />
                   )}
                 </div>
                 <div className="flex flex-col items-start justify-center gap-0.5">
                   <span className="text-sm font-bold text-white leading-none tracking-wide">
                     {isGeneratingReport ? t.chat.analyzing : t.chat.generateReport}
                   </span>
                   <span className="text-[10px] font-medium text-violet-200/80 leading-none">
                     {isGeneratingReport ? "请稍候..." : t.chat.dataReady}
                   </span>
                 </div>
               </Button>
             </motion.div>
           )}
        </div>
      )}

      {isWelcomeState ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-[720px] mx-auto -mt-8">
            <div className="relative w-full mb-8 z-10 text-center md:text-left flex flex-col items-center md:items-start pl-2">
                <div className="absolute inset-0 -mx-6 -my-6 bg-gradient-to-b from-slate-900/0 via-slate-900/10 to-slate-900/20 blur-2xl -z-10 rounded-full opacity-50 pointer-events-none" />
                <h1 className="text-left w-full">
                  <span className="block text-[46px] md:text-[54px] leading-[1.15] font-light text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-violet-100 tracking-tight mt-1">
                    我的情绪咋了？
                  </span>
                </h1>
            </div>

            <div className="w-full relative z-20">
               <ChatInput 
                  onSendMessage={onSendMessage}
                  onOpenDrawing={() => setCurrentView('sketch')}
                  className="w-full"
               />
            </div>

            <div className="flex flex-row gap-4 mt-10 w-full justify-center max-w-[600px]">
                <QuickActionCard 
                  icon={IconFirstAid} 
                  label="情绪急救" 
                  onClick={() => handleQuickAction('first-aid')} 
                  delay={0.1}
                />
                <QuickActionCard 
                  icon={IconSketch} 
                  label="内视涂鸦" 
                  onClick={() => handleQuickAction('sketch')} 
                  delay={0.2}
                />
                <QuickActionCard 
                  icon={IconTest} 
                  label="内视快测" 
                  onClick={() => handleQuickAction('test')} 
                  delay={0.3}
                />
            </div>
        </div>
      ) : (
        <ScrollArea className="flex-1 relative" ref={scrollRef}>
          <div className="max-w-[680px] mx-auto space-y-8 pb-32 px-5 md:px-0 pt-[15px]">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`flex flex-col w-full ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {message.role === 'user' ? (
                     <UserMessageBubble message={message} />
                  ) : (
                     <AIMessageBubble 
                        content={message.content} 
                        status={message.status}
                        shouldAnimate={index === messages.length - 1} 
                        onComplete={index === messages.length - 1 ? handleAiReplyComplete : undefined}
                        onStop={(content) => index === messages.length - 1 && handleAiReplyStopped(content, message)}
                        isStopped={index === messages.length - 1 ? isAiResponseStopped : false}
                     />
                  )}
                </div>
              </div>
            ))}
            <AnimatePresence>
              {showThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-row w-full justify-start"
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

      {!isWelcomeState && (
        <div className="absolute bottom-0 w-full z-10 px-5 pb-6 pt-4 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent pointer-events-none">
          <div className="max-w-3xl mx-auto pointer-events-auto">
            <ChatInput 
              onSendMessage={onSendMessage}
              onOpenDrawing={() => setCurrentView('sketch')}
              onStopGenerating={handleStopGenerating}
              isGenerating={isAiReplying || isThinking} 
              className="w-full shadow-2xl bg-slate-900/80 hover:shadow-violet-900/20 border-white/10"
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {showReport && <ReportPage onClose={() => setShowReport(false)} />}
      </AnimatePresence>
    </div>
  );
};

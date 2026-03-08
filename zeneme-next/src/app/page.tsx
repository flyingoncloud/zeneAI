// src/app/page.tsx
"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ChatInterface } from "@/components/features/chat/ChatInterface";

import { EmotionalFirstAid } from "@/components/features/tools/EmotionalFirstAid";
import { InnerSketch } from "@/components/features/tools/InnerSketch";
import { InnerQuickTest } from "@/components/features/tools/InnerQuickTest";
import { MoodTracker } from "@/components/features/tools/MoodTracker";

import { useZenemeStore, type View } from "@/hooks/useZenemeStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { DEFAULT_VIEW, VIEW_QUERY_KEY, isRoutableView, viewToHref, type RoutableView } from "@/lib/routes";
import { sendChatMessage, sendModuleCompletionMessage, completeModuleWithRetry } from "@/lib/api";
import { filterFunctionCallText, validateModuleData } from "@/utils/contentFilter";
import { BreathingPage } from "@/components/features/tools/firstaid/BreathingPage";
import { EmotionPage } from "@/components/features/tools/firstaid/EmotionPage";
import { HistoryReports } from "@/components/features/reports/HistoryReports";
import { BreathingWelcome } from "@/components/features/tools/firstaid/BreathingWelcome";
import { WelcomePage, AuthPage, GuestGate } from "@/components/auth";
import { LOGIN_REQUIRED_EVENT } from "@/utils/authHelpers";
import { WechatBanner } from "@/components/shared/WechatBanner";


function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    currentView,
    setCurrentView,
    messages,
    addMessage,
    sessionId,
    conversationId,
    setSessionId,
    setConversationId,
    setModuleStatus,
    pendingModuleCompletion,
    userId,
    setUserId,
    setPendingModuleCompletion,
    loadUserConversations,
    resetConversationState
  } = useZenemeStore();

  const { status, user } = useAuthStore();

  const [isAuthPageOpen, setIsAuthPageOpen] = React.useState(false);
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = React.useState(false);
  const [postLoginTarget, setPostLoginTarget] = React.useState<string | null>(null);

 const urlViewRaw = searchParams.get(VIEW_QUERY_KEY);

  const prevViewRef = React.useRef<View>("chat");
  const urlView: RoutableView = isRoutableView(urlViewRaw) ? urlViewRaw : DEFAULT_VIEW;

  // Listen for auth navigation events
  React.useEffect(() => {
    const handleNavAuth = () => setIsAuthPageOpen(true);
    window.addEventListener('zeneme:navigate-auth', handleNavAuth);

    const handleLoginRequired = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.targetView) {
        setPostLoginTarget(detail.targetView);
      }
      setIsLoginRequiredOpen(true);
    };
    window.addEventListener(LOGIN_REQUIRED_EVENT, handleLoginRequired);

    return () => {
      window.removeEventListener('zeneme:navigate-auth', handleNavAuth);
      window.removeEventListener(LOGIN_REQUIRED_EVENT, handleLoginRequired);
    };
  }, []);

  // Close auth page when user logs in
  React.useEffect(() => {
    if (status === 'authenticated') {
      setIsAuthPageOpen(false);
      setIsLoginRequiredOpen(false);

      if (postLoginTarget) {
        if (['history', 'naming', 'test', 'mood', 'sketch', 'first-aid'].includes(postLoginTarget)) {
          setCurrentView(postLoginTarget as View);
        }
        setPostLoginTarget(null);
      }
    }
  }, [status, postLoginTarget, setCurrentView]);

  // Track previous user to detect user switches
  const prevUserIdRef = React.useRef<string | null>(null);

  // Load user conversations when authenticated, reset state on user switch
  React.useEffect(() => {
    if (status === 'authenticated' && user?.id) {
      const prevUserId = prevUserIdRef.current;
      prevUserIdRef.current = user.id;

      // If switching to a different user, clear all conversation state first
      if (prevUserId && prevUserId !== user.id) {
        console.log('[Page] User switched from', prevUserId, 'to', user.id, '— resetting conversation state');
        resetConversationState();
      }

      console.log('[Page] User authenticated, loading conversations for:', user.id);

      // Update ZenemeStore userId to match authenticated user
      setUserId(user.id);
      console.log('[Page] Updated ZenemeStore userId to:', user.id);

      loadUserConversations(user.id).catch(err => {
        console.error('[Page] Failed to load conversations:', err);
      });
    }

    // Also reset when going back to idle (logout)
    if (status === 'idle') {
      console.log('[Page] User logged out — resetting conversation state');
      prevUserIdRef.current = null;
      resetConversationState();
    }
  }, [status, user?.id, loadUserConversations, resetConversationState, setUserId]);

// 用 ref 读取最新 currentView，避免把 currentView 放进 URL->Store 的依赖里
const currentViewRef = React.useRef<View>(currentView);
React.useEffect(() => {
  currentViewRef.current = currentView;
}, [currentView]);

// 1) URL -> Store：只在 URL 真变了才同步到 store
React.useEffect(() => {
  // new-chat 是动作：如果当前正在 new-chat，不要用 URL 覆盖它
  if (currentViewRef.current === "new-chat") return;

  if (currentViewRef.current !== urlView) {
    setCurrentView(urlView);
  }
}, [urlView, setCurrentView]);

// 2) Store -> URL：只在 store 变了才写回 URL
React.useEffect(() => {
  const prevView = prevViewRef.current;
  prevViewRef.current = currentView;

  if (currentView === "new-chat") {
    if (prevView !== "new-chat") {
      router.replace("/", { scroll: false });
      setCurrentView("chat");
    }
    return;
  }

  const effectiveView = currentView as RoutableView;
  const nextHref = viewToHref(effectiveView);
  const currentHref = window.location.pathname + window.location.search;

  if (currentHref !== nextHref) {
    router.replace(nextHref, { scroll: false });
  }
}, [currentView, router, setCurrentView]);




  // Handle pending module completion when returning to chat
  React.useEffect(() => {
    const handlePendingCompletion = async () => {
      if (currentView === 'chat' && pendingModuleCompletion && sessionId) {
        const moduleId = pendingModuleCompletion;
        // Clear immediately to prevent duplicate calls
        setPendingModuleCompletion(null);

        try {
          // Ensure module is marked complete in DB before sending completion message
          // This is a backup in case upload-sketch didn't have conversationId
          if (conversationId) {
            try {
              await completeModuleWithRetry(conversationId, moduleId);
              console.log(`[PendingCompletion] Module ${moduleId} explicitly completed for conversation ${conversationId}`);
            } catch (err) {
              console.warn(`[PendingCompletion] completeModule backup failed:`, err);
            }
          }

          // Send to API for AI response (user message already added by the module component)
          const response = await sendModuleCompletionMessage(sessionId, moduleId);

          if (response && response.assistant_message?.content) {
            const filteredContent = filterFunctionCallText(response.assistant_message.content);
            const recommendedModules = response.recommended_modules || [];
            const validModules = recommendedModules.filter(validateModuleData);

            if (filteredContent) {
              addMessage(filteredContent, "ai", undefined, {
                recommended_modules: validModules,
              });
            }

            if (response.module_status) {
              setModuleStatus(response.module_status);
            }
          }
        } catch (error) {
          console.error('Error sending module completion message:', error);
        }
      }
    };

    handlePendingCompletion();
  }, [currentView, pendingModuleCompletion, sessionId, conversationId, setPendingModuleCompletion, addMessage, setModuleStatus]);

  const handleSendMessage = async (text: string, attachment?: {
    type: 'image' | 'voice' | 'sketch' | 'gallery';
    url?: string;
    preview?: string;
  }) => {
    addMessage(text, "user", attachment);

    try {
      // Prepare images array if attachment is an image
      const images = attachment?.type === 'image' && attachment.url ? [attachment.url] : undefined;

      const response = await sendChatMessage({
        message: text,
        session_id: sessionId,
        user_id: userId,
        images: images  // Include images in the request
      });

      if (!response || Object.keys(response).length === 0) {
        addMessage("抱歉，服务器返回了空响应，请稍后再试。", "ai");
        return;
      }

      if (!sessionId && response.session_id) {
        setSessionId(response.session_id);
      }
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      const aiContent = response.assistant_message?.content;
      const filteredContent = filterFunctionCallText(aiContent);

      if (filteredContent) {
        const recommendedModules = response.recommended_modules || [];
        const validModules = recommendedModules.filter(validateModuleData);

        addMessage(filteredContent, "ai", undefined, {
          recommended_modules: validModules,
        });
        if (response.module_status) {
          setModuleStatus(response.module_status);
        }
      } else {
        addMessage("抱歉，我没有收到完整的回复。", "ai");
      }

    } catch (error) {
      console.error('Error sending message:', error);
      addMessage("抱歉，我现在遇到了一些问题。请稍后再试。", "ai");
    }
  };

  // Handle custom event for sending messages with attachments
  React.useEffect(() => {
    const handleMessageWithAttachment = (event: Event) => {
      const customEvent = event as CustomEvent<{
        text: string;
        attachment: {
          type: 'image' | 'voice' | 'sketch' | 'gallery';
          url?: string;
          preview?: string;
        };
      }>;

      if (customEvent.detail) {
        handleSendMessage(customEvent.detail.text, customEvent.detail.attachment);
      }
    };

    window.addEventListener('sendMessageWithAttachment', handleMessageWithAttachment);
    return () => {
      window.removeEventListener('sendMessageWithAttachment', handleMessageWithAttachment);
    };
  }, [sessionId, userId]); // Dependencies for handleSendMessage

  const visibleMessages = messages.filter(msg => msg.role !== 'system');
  // 背景切换规则：
  // - 主页面空白（chat/new-chat 且没有任何对话消息） => Mian Page BG
  // - 一旦发过消息（visibleMessages >= 1） => Cutting BG 3
  const isChatOrNewChat = currentView === "chat" || currentView === "new-chat";
  const isHomeEmpty = isChatOrNewChat && visibleMessages.length === 0;

  const bgSrc = isHomeEmpty
    ? "/Mian%20Page%20BG.png"
    : "/Cutting%20BG%203.png";

  const renderContent = () => {
    switch (currentView) {
      case 'first-aid':
      case 'breathing':  // These are sub-views of EmotionalFirstA
         //return <EmotionalFirstAid />;
       return <BreathingWelcome onStart={() => setCurrentView("breathingtraining")}/>;
      case 'breathingtraining':  // These are sub-views of EmotionalFirstAid
        return <BreathingPage onComplete={() => setCurrentView("naming")} />;
      case 'naming':     // These are sub-views of EmotionalFirstAid
        return <EmotionalFirstAid />;
      case "sketch":
        return <InnerSketch />;

      case "test":
        return <InnerQuickTest />;

      case "mood":
        return <MoodTracker />;

      case "history":
        return <HistoryReports />;

      case "chat":
      case "new-chat":
      default:
        return <ChatInterface messages={visibleMessages} onSendMessage={handleSendMessage} />;
    }
  };

  // Auth Flow: Show Welcome/Auth pages if status is 'idle'
  if (status === 'idle') {
    return (
      <div className="flex h-screen w-full bg-transparent font-sans text-slate-200 overflow-hidden relative">
        {isAuthPageOpen ? (
          <AuthPage onBack={() => setIsAuthPageOpen(false)} />
        ) : (
          <WelcomePage onNavigateAuth={() => setIsAuthPageOpen(true)} />
        )}
      </div>
    );
  }

  // If auth page is open (from guest mode), show it as overlay
  if (isAuthPageOpen) {
    return (
      <div className="flex h-screen w-full bg-transparent font-sans text-slate-200 overflow-hidden relative">
        <AuthPage onBack={() => setIsAuthPageOpen(false)} />
      </div>
    );
  }

  // Main Application Layout
  return (
    <div className="flex h-screen w-full bg-transparent font-sans text-slate-200 overflow-hidden relative">
      {/* WeChat Browser Suggestion Banner */}
      <WechatBanner />

      {/* 背景图：public/3b6a5589c53301457230648f6d21f5eab8c4f69b.png */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={bgSrc}
          alt=""
          fill
          priority
          className="object-cover"
        />

      </div>

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        <TopBar />
        <main className="flex-1 relative overflow-hidden bg-transparent">{renderContent()}</main>
      </div>

      <GuestGate
        open={isLoginRequiredOpen}
        onOpenChange={setIsLoginRequiredOpen}
        onLogin={() => {
          setIsLoginRequiredOpen(false);
          setIsAuthPageOpen(true);
        }}
        onContinueGuest={() => setIsLoginRequiredOpen(false)}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full bg-black items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

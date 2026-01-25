// src/app/page.tsx
"use client";

import React from "react";
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
import { DEFAULT_VIEW, VIEW_QUERY_KEY, isRoutableView, viewToHref, type RoutableView } from "@/lib/routes";
import { sendChatMessage, sendModuleCompletionMessage } from "@/lib/api";
import { filterFunctionCallText, validateModuleData } from "@/utils/contentFilter";
import { BreathingPage } from "@/components/features/tools/firstaid/BreathingPage";
import { EmotionPage } from "@/components/features/tools/firstaid/EmotionPage";
import { HistoryReports } from "@/components/features/reports/HistoryReports";

export default function Home() {
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
    setPendingModuleCompletion
  } = useZenemeStore();

 const urlViewRaw = searchParams.get(VIEW_QUERY_KEY);

 const prevViewRef = React.useRef<View>("chat");
 const urlView: RoutableView = isRoutableView(urlViewRaw) ? urlViewRaw : DEFAULT_VIEW;

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
  }, [currentView, pendingModuleCompletion, sessionId, setPendingModuleCompletion, addMessage, setModuleStatus]);

  const handleSendMessage = async (text: string, attachment?: {
    type: 'image' | 'voice' | 'sketch' | 'gallery';
    url?: string;
    preview?: string;
  }) => {
    addMessage(text, "user", attachment);

    try {
      const response = await sendChatMessage({
        message: text,
        session_id: sessionId,
        user_id: userId,
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
      case 'breathing':  // These are sub-views of EmotionalFirstAid
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

  return (
    <div className="flex h-screen w-full bg-transparent font-sans text-slate-200 overflow-hidden relative">
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
    </div>
  );
}

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
import { sendChatMessage } from "@/lib/api";
import { filterFunctionCallText, validateModuleData } from "@/utils/contentFilter";

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
    setConversationId
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




  const handleSendMessage = async (text: string) => {
    addMessage(text, "user");

    try {
      // Call the real API
      const response = await sendChatMessage({
        message: text,
        session_id: sessionId
      });

      // Store session_id and conversation_id for subsequent messages
      if (!sessionId) {
        setSessionId(response.session_id);
      }
      setConversationId(response.conversation_id);

      // Extract AI content and filter out function call text
      const aiContent = response.assistant_message?.content;
      const filteredContent = filterFunctionCallText(aiContent);

      if (filteredContent) {
        // Extract and validate module recommendations
        const recommendedModules = response.recommended_modules || [];
        const validModules = recommendedModules.filter(validateModuleData);

        // Log module recommendations in development
        if (process.env.NODE_ENV === 'development' && validModules.length > 0) {
          console.log('[Module Recommendations]', {
            modules: validModules,
            session_id: response.session_id,
            conversation_id: response.conversation_id,
            timestamp: new Date().toISOString()
          });
        }

        // Add AI message with module recommendations
        addMessage(filteredContent, "ai", undefined, {
          recommended_modules: validModules,
          module_status: response.module_status || {}
        });
      } else {
        console.error('No content in AI response:', response);
        addMessage("抱歉，我没有收到完整的回复。", "ai");
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Fallback response on error
      addMessage("抱歉，我现在遇到了一些问题。请稍后再试。", "ai");
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case "first-aid":
        return <EmotionalFirstAid />;

      case "sketch":
        return <InnerSketch />;

      case "test":
        return <InnerQuickTest />;

      case "mood":
        return <MoodTracker />;

      case "history":
        // 你后面把 History 页面组件补上后，在这里替换即可
        return (
          <div className="h-full w-full flex items-center justify-center text-slate-300">
            历史记录页面开发中
          </div>
        );

      case "chat":
      case "new-chat":
      default:
        return <ChatInterface messages={messages} onSendMessage={handleSendMessage} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-transparent font-sans text-slate-200 overflow-hidden relative">
      {/* 背景图：public/3b6a5589c53301457230648f6d21f5eab8c4f69b.png */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/3b6a5589c53301457230648f6d21f5eab8c4f69b.png"
          alt=""
          fill
          priority
          className="object-cover"
        />
        {/* 叠加暗层，保持你现在的整体暗黑风格 */}
        <div className="absolute inset-0 bg-black/70" />
      </div>

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        <TopBar />
        <main className="flex-1 relative overflow-hidden bg-transparent">{renderContent()}</main>
      </div>
    </div>
  );
}

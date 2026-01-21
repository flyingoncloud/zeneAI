'use client';
import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { translations, Language } from '@/utils/translations';
/* eslint-disable @typescript-eslint/no-explicit-any */

export type View = 'chat' | 'sketch' | 'test' | 'mood' | 'first-aid' | 'history'| 'new-chat'|'breathing'|'naming';

type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
  isDraft: boolean;
  moduleStatus?: ModuleStatus;
};

export type RecommendedModule = {
  module_id: string;
  name: string;
  icon: string;
  description: string;
  reasoning?: string;
  priority?: number;
};

export type ModuleStatus = {
  [module_id: string]: {
    recommended_at?: string;
    completed_at?: string;
    completion_data?: any;
  };
};

export type Message = {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  attachment?: {
    type: 'image' | 'voice' | 'sketch' | 'gallery';
    url?: string; // We'll use this for the base64 data url or image path
    preview?: string;
  };
  // Module recommendation data
  recommended_modules?: RecommendedModule[];
};

export type MoodLog = {
  date: string; // YYYY-MM-DD
  mood: 'Happy' | 'Calm' | 'Anxious' | 'Sad' | 'Overwhelmed' | 'Neutral' | 'Angry' | 'Relieved' | 'Confused' | 'Tired' | 'Grateful';
  note?: string;
};

export type SavedReport = {
  id: string;
  type: 'chat' | 'sketch' | 'test';
  date: string;
  title: string;
  preview: string;
  isPro?: boolean;
};

export type UpgradeSource = 'report' | 'limit' | 'settings' | 'report_lock' | null;

interface ZenemeContextType {
  currentView: View;
  setCurrentView: (view: View) => void;
  credits: number;
  deductCredit: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;

  // Session Management
  sessions: ChatSession[];
  currentSessionId: string | null;
  createNewSession: () => void;
  selectSession: (id: string) => void;

  // Module Status
  moduleStatus?: ModuleStatus;
  setModuleStatus: (status: ModuleStatus) => void;

  // Pending module completion - triggers a continuation message when returning to chat
  pendingModuleCompletion: string | null;
  setPendingModuleCompletion: (moduleId: string | null) => void;

  // Exit action for TopBar
  exitMessage: string | null;
  exitModuleToComplete: string | null;
  setExitAction: (message: string, moduleName: string | null) => void;
  clearExitAction: () => void;

  // Conversation tracking for module completion
  sessionId: string | undefined;
  conversationId: number | undefined;
  setSessionId: (id: string | undefined) => void;
  setConversationId: (id: number | undefined) => void;

  messages: Message[]; // Derived from current session
  addMessage: (
    content: string,
    role: 'user' | 'ai' | 'system',
    attachment?: Message['attachment'],
    moduleData?: {
      recommended_modules?: RecommendedModule[];
      module_status?: ModuleStatus;
    }
  ) => void;

  moodLogs: MoodLog[];
  logMood: (log: MoodLog) => void;

  reports: SavedReport[];
  addReport: (report: SavedReport) => void;
  deleteReport: (id: string) => void;

  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];

  // Subscription State
  isPro: boolean;
  setProStatus: (isPro: boolean) => void;
  isUpgradeModalOpen: boolean;
  upgradeSource: UpgradeSource;
  openUpgradeModal: (source: UpgradeSource) => void;
  closeUpgradeModal: () => void;
  freeSessionsLeft: number; // For demo purposes, we track "5 sessions"
  decrementFreeSessions: () => void;
}

const ZenemeContext = createContext<ZenemeContextType | undefined>(undefined);

export const ZenemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<View>('chat');
  const [credits, setCredits] = useState(5);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('zh'); // Default to Chinese

  // Subscription State
  const [isPro, setIsPro] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeSource, setUpgradeSource] = useState<UpgradeSource>(null);
  const [freeSessionsLeft, setFreeSessionsLeft] = useState(5);

  const t = useMemo(() => translations[language], [language]);

  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Module Status
  const [moduleStatus, setModuleStatus] = useState<ModuleStatus | undefined>(undefined);

  // Pending module completion - triggers a continuation message when returning to chat
  const [pendingModuleCompletion, setPendingModuleCompletion] = useState<string | null>(null);

  // Exit Action Management for TopBar
  const [exitMessage, setExitMessage] = useState<string | null>(null);
  const [exitModuleToComplete, setExitModuleToComplete] = useState<string | null>(null);

  // Conversation tracking for module completion
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);

  // Initialize first session if none exists, or recover if currentSessionId is lost
  React.useEffect(() => {
    if (sessions.length === 0) {
      const initialId = Date.now().toString();
      const initialSession: ChatSession = {
        id: initialId,
        title: 'New Chat',
        messages: [],
        updatedAt: new Date(),
        isDraft: true,
      };
      setSessions([initialSession]);
      setCurrentSessionId(initialId);
      return;
    }

    if (!currentSessionId && sessions.length > 0) {
      setCurrentSessionId(sessions[0].id);
    }
  }, [sessions.length, currentSessionId]);

  const messages = useMemo(() => {
    return sessions.find(s => s.id === currentSessionId)?.messages || [];
  }, [sessions, currentSessionId]);

  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([
    { date: '2023-10-25', mood: 'Calm', note: 'Had a relaxing day reading.' },
    { date: '2023-10-26', mood: 'Happy', note: 'Great lunch with friends.' },
    { date: '2023-10-27', mood: 'Anxious', note: 'Deadline approaching.' },
  ]);

  const [reports, setReports] = useState<SavedReport[]>([
    { id: '1', type: 'sketch', date: '2023-10-24', title: '内在涂鸦分析', preview: '线条能量显示创造力高涨...' },
    { id: '2', type: 'test', date: '2023-10-22', title: '周度评估', preview: '稳定性得分提升了 15%...' },
  ]);

  const addReport = useCallback((report: SavedReport) => {
    setReports(prev => [report, ...prev]);
  }, []);

  const deleteReport = useCallback((id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  }, []);

  const createNewSession = useCallback(() => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'New Chat',
      messages: [], // Start empty as requested
      updatedAt: new Date(),
      isDraft: true,
    };
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newId);
    setCurrentView('chat');
  }, []);

  const selectSession = useCallback((id: string) => {
    setCurrentSessionId(id);
    setCurrentView('chat');
  }, []);

  const addMessage = useCallback((
    content: string,
    role: 'user' | 'ai',
    attachment?: Message['attachment'],
    moduleData?: {
      recommended_modules?: RecommendedModule[];
      module_status?: ModuleStatus;
    }
  ) => {
    setSessions(prev => {
      let targetSessionId = currentSessionId;
      if (!targetSessionId && prev.length > 0) {
        targetSessionId = prev[0].id;
      }

      if (!targetSessionId) {
        return prev;
      }

      return prev.map(session => {
        if (session.id !== targetSessionId) return session;

        const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newMessage: Message = {
          id: uniqueId,
          role,
          content,
          timestamp: new Date(),
          attachment,
          ...(moduleData && {
            recommended_modules: moduleData.recommended_modules,
          })
        };

        const newMessages = [...session.messages, newMessage];

        let newTitle = session.title;
        if (session.isDraft && role === 'user') {
          newTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '');
        }

        const newModuleStatus = {
          ...session.moduleStatus,
          ...moduleData?.module_status
        };

        if (moduleData?.module_status) {
          setModuleStatus(newModuleStatus);
        }

        return {
          ...session,
          messages: newMessages,
          updatedAt: new Date(),
          isDraft: false,
          title: newTitle,
          moduleStatus: newModuleStatus
        };
      });
    });
  }, [currentSessionId]);

  const deductCredit = useCallback(() => {
    setCredits((prev) => Math.max(0, prev - 1));
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const logMood = useCallback((log: MoodLog) => {
    setMoodLogs((prev) => [...prev.filter(l => l.date !== log.date), log]);
  }, []);

  // Upgrade Actions
  const openUpgradeModal = useCallback((source: UpgradeSource) => {
    setUpgradeSource(source);
    setIsUpgradeModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setIsUpgradeModalOpen(false);
    setUpgradeSource(null);
  }, []);

  const decrementFreeSessions = useCallback(() => {
    setFreeSessionsLeft(prev => Math.max(0, prev - 1));
  }, []);

  const setProStatus = useCallback((status: boolean) => {
    setIsPro(status);
  }, []);

  const setExitAction = useCallback((message: string, moduleName: string | null) => {
    setExitMessage(message);
    setExitModuleToComplete(moduleName);
  }, []);

  const clearExitAction = useCallback(() => {
    setExitMessage(null);
    setExitModuleToComplete(null);
  }, []);


  return (
    <ZenemeContext.Provider
      value={{
        currentView,
        setCurrentView,
        credits,
        deductCredit,
        isSidebarOpen,
        toggleSidebar,
        sessions,
        currentSessionId,
        createNewSession,
        selectSession,
        moduleStatus,
        setModuleStatus,
        pendingModuleCompletion,
        setPendingModuleCompletion,
        exitMessage,
        exitModuleToComplete,
        setExitAction,
        clearExitAction,
        sessionId,
        conversationId,
        setSessionId,
        setConversationId,
        messages,
        addMessage,
        moodLogs,
        logMood,
        reports,
        addReport,
        deleteReport,
        language,
        setLanguage,
        t,
        isPro,
        setProStatus,
        isUpgradeModalOpen,
        upgradeSource,
        openUpgradeModal,
        closeUpgradeModal,
        freeSessionsLeft,
        decrementFreeSessions
      }}
    >
      {children}
    </ZenemeContext.Provider>
  );
};

export const useZenemeStore = () => {
  const context = useContext(ZenemeContext);
  if (context === undefined) {
    throw new Error('useZenemeStore must be used within a ZenemeProvider');
  }
  return context;
};

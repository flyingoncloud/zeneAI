import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { translations, Language } from '../utils/translations';

export type View = 'chat' | 'sketch' | 'test' | 'mood' | 'first-aid' | 'history' | 'report-detail' | 'breathing' | 'naming' | 'sketch-report';

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
  isDraft: boolean;
};

export type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  status?: 'stopped';
  attachment?: {
    type: 'image' | 'voice' | 'sketch' | 'gallery';
    url?: string; // We'll use this for the base64 data url or image path
    preview?: string;
  };
};

export type MoodLog = {
  date: string; // YYYY-MM-DD
  mood: 'Happy' | 'Calm' | 'Anxious' | 'Sad' | 'Overwhelmed' | 'Neutral' | 'Angry' | 'Relieved' | 'Confused' | 'Tired' | 'Grateful';
  note?: string;
  intensity?: number; // 0-100
  timestamp?: number; // Date.now()
  source?: 'manual' | 'first-aid' | 'sketch' | 'test' | 'chat';
};

export type SavedReport = {
  id: string;
  type: 'chat' | 'sketch' | 'test' | 'brief' | 'deep';
  date: string;
  title: string;
  preview: string;
  isPro?: boolean;
  imageUrl?: string;
  fullContent?: string;
};

export type UpgradeSource = 'report' | 'limit' | 'settings' | null;

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
  
  messages: Message[]; // Derived from current session
  addMessage: (content: string, role: 'user' | 'ai', attachment?: Message['attachment']) => void;
  updateMessage: (id: string, content: string, status?: 'stopped') => void;
  
  moodLogs: MoodLog[];
  logMood: (log: MoodLog) => void;

  reports: SavedReport[];
  addReport: (report: SavedReport) => void;
  deleteReport: (id: string) => void;
  selectedReportId: string | null;
  setSelectedReportId: (id: string | null) => void;

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
  
  // Danmaku Interaction
  danmakuPreviewText: string | null;
  setDanmakuPreviewText: (text: string | null) => void;

  // Sketch Report
  sketchReportImage: string | null;
  setSketchReportImage: (url: string | null) => void;
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

  // Danmaku State
  const [danmakuPreviewText, setDanmakuPreviewText] = useState<string | null>(null);

  // Sketch Report State
  const [sketchReportImage, setSketchReportImage] = useState<string | null>(null);

  const t = useMemo(() => translations[language], [language]);

  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Initialize first session if none exists
  React.useEffect(() => {
    if (sessions.length === 0 && !currentSessionId) {
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
    }
  }, []); // Only run once on mount (or if sessions empty)

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
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

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

  const addMessage = useCallback((content: string, role: 'user' | 'ai', attachment?: Message['attachment']) => {
    if (!currentSessionId) return;

    setSessions(prev => prev.map(session => {
      if (session.id !== currentSessionId) return session;

      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newMessages = [
        ...session.messages,
        { id: uniqueId, role, content, timestamp: new Date(), attachment },
      ];

      let newTitle = session.title;
      // If first user message, set title
      if (session.isDraft && role === 'user') {
        newTitle = content.slice(0, 30) + (content.length > 30 ? '...' : '');
      }

      return {
        ...session,
        messages: newMessages,
        updatedAt: new Date(),
        isDraft: false, // No longer draft once message added
        title: newTitle
      };
    }));
  }, [currentSessionId]);

  const updateMessage = useCallback((id: string, content: string, status?: 'stopped') => {
    if (!currentSessionId) return;

    setSessions(prev => prev.map(session => {
      if (session.id !== currentSessionId) return session;

      const newMessages = session.messages.map(msg => {
        if (msg.id === id) {
          return { ...msg, content, status }; // Update content and optional status
        }
        return msg;
      });

      return { ...session, messages: newMessages, updatedAt: new Date() };
    }));
  }, [currentSessionId]);

  const deductCredit = useCallback(() => {
    setCredits((prev) => Math.max(0, prev - 1));
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const logMood = useCallback((log: MoodLog) => {
    // Append new log instead of overwriting, to support multiple logs per day
    setMoodLogs((prev) => [...prev, { ...log, timestamp: log.timestamp || Date.now() }]);
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
        messages,
        addMessage,
        updateMessage,
        moodLogs,
        logMood,
        reports,
        addReport,
        deleteReport,
        selectedReportId,
        setSelectedReportId,
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
        decrementFreeSessions,
        danmakuPreviewText,
        setDanmakuPreviewText,
        sketchReportImage,
        setSketchReportImage
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
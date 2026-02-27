'use client';
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useMemo } from 'react';
/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export type TemplateType = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7' | 'F8';
export type QuestionStatus = 'draft' | 'published';
export type AdminView = 'login' | 'questions' | 'editor' | 'templates' | 'media' | 'settings';
export type SortMode = 'id' | 'custom';

export const TEMPLATE_INFO: Record<TemplateType, { name: string; desc: string; fields: string; icon: string }> = {
  F1: { name: 'Likert 5', desc: '5 点量表；左右端点文案可编辑', fields: '题干、左端点文案、右端点文案', icon: '📊' },
  F2: { name: 'Single Choice (Text)', desc: '单选文本选项（2–8 个）', fields: '题干、2–8 个文本选项', icon: '🔘' },
  F3: { name: 'Single Choice + Stem Image', desc: '题干带图片 + 单选选项', fields: '题干、题干图片、2–8 个选项', icon: '🖼️' },
  F4: { name: 'Image Cards (A–D)', desc: '图片卡片单选（A–D，每项=图片+文案）', fields: '题干、4 张图片卡片（图+文案）', icon: '🃏' },
  F5: { name: 'Image Grid (2x3)', desc: '图片网格单选（最多 6 项）', fields: '题干、最多 6 项（图+标签）', icon: '⊞' },
  F6: { name: 'Ranking Top N', desc: '从列表中选 Top N 并排序（N 可编辑，默认 3）', fields: '题干、选项列表、TopN 值', icon: '🏆' },
  F7: { name: 'Direction Dial 0–360', desc: '方向罗盘选择角度；场景图标可配置', fields: '题干、场景物体、Reset 文案', icon: '🧭' },
  F8: { name: 'Video + Single Choice', desc: '视频播放器 + 单选选项（2–8 个）', fields: '题干、视频 URL、2–8 个选项', icon: '🎬' },
};

// Category options for scoring (matches report dimensions 1:1)
export const CATEGORY_OPTIONS = [
  { value: '情绪觉察', label: '情绪觉察 (Emotional Awareness)' },
  { value: '认知模式', label: '认知模式 (Cognitive Patterns)' },
  { value: '关系模式', label: '关系模式 (Relational Patterns)' },
  { value: '性格类型', label: '性格类型 (Personality Type)' },
  { value: '成长指数与变化潜能', label: '成长指数与变化潜能 (Growth Index & Change Potential)' },
];

export interface AdminOption {
  id: string;
  text: string;
  imageUrl?: string;
  value: number;
  label: string;
  sub_category?: string;  // NEW: Optional sub-category for cross-category scoring
}

export interface AdminQuestion {
  id: number;
  internalTitle: string;
  template: TemplateType;
  status: QuestionStatus;
  stem: string;
  subtitle?: string;
  category?: string;  // NEW: Category for scoring (e.g., "情绪识别能力")
  tags: string[];
  options: AdminOption[];
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  templateSettings: Record<string, any>;
  validation: { required: boolean; min?: number; max?: number };
  order: number;
  updatedAt: string;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'video';
  size: string;
  uploadedAt: string;
}

export interface PublishLog {
  id: string;
  action: string;
  questionId: number;
  user: string;
  timestamp: string;
}

const MAX_QUESTIONS = 80;

interface AdminContextType {
  // Auth
  isLoggedIn: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;

  // Navigation
  currentView: AdminView;
  setCurrentView: (v: AdminView) => void;

  // Questions
  questions: AdminQuestion[];
  addQuestion: (template: TemplateType) => AdminQuestion;
  updateQuestion: (id: number, updates: Partial<AdminQuestion>) => void;
  deleteQuestion: (id: number) => void;
  duplicateQuestion: (id: number) => AdminQuestion | null;
  getNextAvailableId: () => number;
  canAddQuestion: boolean;

  // Editor
  editingQuestionId: number | null;
  setEditingQuestionId: (id: number | null) => void;

  // Sort
  sortMode: SortMode;
  setSortMode: (m: SortMode) => void;
  reorderQuestion: (fromIdx: number, toIdx: number) => void;

  // Media
  mediaItems: MediaItem[];
  addMediaItem: (item: MediaItem) => void;
  removeMediaItem: (id: string) => void;
  reloadMediaItems: () => Promise<void>;

  // Questions reload
  reloadQuestions: () => Promise<void>;

  // Logs
  publishLogs: PublishLog[];

  // Template picker
  isTemplatePickerOpen: boolean;
  setTemplatePickerOpen: (v: boolean) => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<AdminView>('login');
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('id');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [publishLogs] = useState<PublishLog[]>([]);
  const [isTemplatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Load questions from backend when logged in or when navigating to questions view
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoadingQuestions(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/questions`);
        const data = await response.json();

        if (data.ok && data.questions) {
          setQuestions(data.questions);
        }
      } catch (error) {
        console.error('Failed to load questions:', error);
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    if (isLoggedIn && currentView === 'questions') {
      loadQuestions();
    }
  }, [isLoggedIn, currentView]);

  // Load media items from backend when logged in or when navigating to media view
  useEffect(() => {
    const loadMediaItems = async () => {
      try {
        console.log('[MediaLibrary] Loading media from:', `${API_BASE_URL}/api/admin/media`);
        console.log('[MediaLibrary] isLoggedIn:', isLoggedIn, 'currentView:', currentView);

        const response = await fetch(`${API_BASE_URL}/api/admin/media`);
        console.log('[MediaLibrary] Response status:', response.status);

        const data = await response.json();
        console.log('[MediaLibrary] Response data:', data);

        if (data.ok && data.items) {
          console.log('[MediaLibrary] Setting', data.items.length, 'media items');
          setMediaItems(data.items);
        } else {
          console.error('[MediaLibrary] Invalid response format:', data);
        }
      } catch (error) {
        console.error('[MediaLibrary] Failed to load media items:', error);
      }
    };

    console.log('[MediaLibrary] useEffect triggered - isLoggedIn:', isLoggedIn, 'currentView:', currentView);
    if (isLoggedIn && currentView === 'media') {
      console.log('[MediaLibrary] Conditions met, loading media...');
      loadMediaItems();
    } else {
      console.log('[MediaLibrary] Conditions not met, skipping load');
    }
  }, [isLoggedIn, currentView]);

  const login = useCallback((email: string, pass: string) => {
    if (email && pass) {
      setIsLoggedIn(true);
      setCurrentView('questions');
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentView('login');
  }, []);

  const getNextAvailableId = useCallback(() => {
    const usedIds = new Set(questions.map(q => q.id));
    for (let i = 1; i <= MAX_QUESTIONS; i++) {
      if (!usedIds.has(i)) return i;
    }
    return -1;
  }, [questions]);

  const canAddQuestion = questions.length < MAX_QUESTIONS;

  const addQuestion = useCallback((template: TemplateType) => {
    const nextId = getNextAvailableId();
    const now = new Date().toISOString().slice(0, 10);
    const defaultOptions: AdminOption[] = [];
    const defaultSettings: Record<string, any> = {};

    if (template === 'F1') {
      defaultSettings.leftLabel = '非常不同意';
      defaultSettings.rightLabel = '非常同意';
    } else if (['F2', 'F3', 'F8'].includes(template)) {
      defaultOptions.push(
        { id: 'A', text: '选项 A', value: 1, label: 'A' },
        { id: 'B', text: '选项 B', value: 2, label: 'B' },
      );
    } else if (template === 'F4') {
      defaultOptions.push(
        { id: 'A', text: '选项 A', imageUrl: '', value: 1, label: 'A' },
        { id: 'B', text: '选项 B', imageUrl: '', value: 2, label: 'B' },
        { id: 'C', text: '选项 C', imageUrl: '', value: 3, label: 'C' },
        { id: 'D', text: '选项 D', imageUrl: '', value: 4, label: 'D' },
      );
    } else if (template === 'F5') {
      defaultSettings.gridLayout = '2x3';
      for (let i = 0; i < 6; i++) {
        const l = String.fromCharCode(65 + i);
        defaultOptions.push({ id: l, text: `选项 ${l}`, imageUrl: '', value: i + 1, label: l });
      }
    } else if (template === 'F6') {
      defaultSettings.topN = 3;
      for (let i = 0; i < 5; i++) {
        defaultOptions.push({ id: `opt${i}`, text: `选项 ${i + 1}`, value: 0, label: String(i + 1) });
      }
    } else if (template === 'F7') {
      defaultSettings.centerObject = 'User';
      defaultSettings.targetObject = 'Target';
      defaultSettings.defaultAngle = 0;
      defaultSettings.resetLabel = '重置';
      defaultSettings.sceneItems = [];
    }

    const newQ: AdminQuestion = {
      id: nextId,
      internalTitle: `新题目 Q${nextId}`,
      template,
      status: 'draft',
      stem: '',
      tags: [],
      options: defaultOptions,
      templateSettings: defaultSettings,
      validation: { required: true },
      order: questions.length + 1,
      updatedAt: now,
      createdAt: now,
    };
    setQuestions(prev => [...prev, newQ]);
    return newQ;
  }, [getNextAvailableId, questions.length]);

  const updateQuestion = useCallback((id: number, updates: Partial<AdminQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString().slice(0, 10) } : q));
  }, []);

  const deleteQuestion = useCallback(async (id: number) => {
    try {
      // Call backend API to delete the question
      const response = await fetch(`${API_BASE_URL}/api/admin/questions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to delete question:', error);
        throw new Error(error.detail || 'Failed to delete question');
      }

      // Only update local state if backend deletion succeeded
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  }, []);

  const duplicateQuestion = useCallback((id: number) => {
    const source = questions.find(q => q.id === id);
    if (!source || questions.length >= MAX_QUESTIONS) return null;
    const nextId = getNextAvailableId();
    const now = new Date().toISOString().slice(0, 10);
    const dup: AdminQuestion = {
      ...JSON.parse(JSON.stringify(source)),
      id: nextId,
      internalTitle: `${source.internalTitle} (副本)`,
      status: 'draft' as QuestionStatus,
      order: questions.length + 1,
      updatedAt: now,
      createdAt: now,
    };
    setQuestions(prev => [...prev, dup]);
    return dup;
  }, [questions, getNextAvailableId]);

  const reorderQuestion = useCallback((fromIdx: number, toIdx: number) => {
    setQuestions(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr.map((q, i) => ({ ...q, order: i + 1 }));
    });
  }, []);

  const addMediaItem = useCallback((item: MediaItem) => {
    setMediaItems(prev => [item, ...prev]);
  }, []);

  const removeMediaItem = useCallback((id: string) => {
    setMediaItems(prev => prev.filter(m => m.id !== id));
  }, []);

  const reloadMediaItems = useCallback(async () => {
    try {
      console.log('[reloadMediaItems] Reloading media from:', `${API_BASE_URL}/api/admin/media`);

      const response = await fetch(`${API_BASE_URL}/api/admin/media`);
      console.log('[reloadMediaItems] Response status:', response.status);

      const data = await response.json();
      console.log('[reloadMediaItems] Response data:', data);

      if (data.ok && data.items) {
        console.log('[reloadMediaItems] Setting', data.items.length, 'media items');
        setMediaItems(data.items);
      } else {
        console.error('[reloadMediaItems] Invalid response format:', data);
      }
    } catch (error) {
      console.error('[reloadMediaItems] Failed to reload media items:', error);
    }
  }, []);

  const reloadQuestions = useCallback(async () => {
    try {
      console.log('[reloadQuestions] Reloading questions from:', `${API_BASE_URL}/api/admin/questions`);

      const response = await fetch(`${API_BASE_URL}/api/admin/questions`);
      console.log('[reloadQuestions] Response status:', response.status);

      const data = await response.json();
      console.log('[reloadQuestions] Response data:', data);

      if (data.ok && data.questions) {
        console.log('[reloadQuestions] Setting', data.questions.length, 'questions');
        setQuestions(data.questions);
      } else {
        console.error('[reloadQuestions] Invalid response format:', data);
      }
    } catch (error) {
      console.error('[reloadQuestions] Failed to reload questions:', error);
    }
  }, []);

  const value = useMemo(() => ({
    isLoggedIn, login, logout,
    currentView, setCurrentView,
    questions, addQuestion, updateQuestion, deleteQuestion, duplicateQuestion, getNextAvailableId, canAddQuestion,
    editingQuestionId, setEditingQuestionId,
    sortMode, setSortMode, reorderQuestion,
    mediaItems, addMediaItem, removeMediaItem, reloadMediaItems, reloadQuestions, publishLogs,
    isTemplatePickerOpen, setTemplatePickerOpen,
  }), [isLoggedIn, login, logout, currentView, questions, addQuestion, updateQuestion, deleteQuestion, duplicateQuestion, getNextAvailableId, canAddQuestion, editingQuestionId, sortMode, mediaItems, addMediaItem, removeMediaItem, reloadMediaItems, reloadQuestions, publishLogs, isTemplatePickerOpen, reorderQuestion]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdminStore = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdminStore must be used within AdminProvider');
  return ctx;
};

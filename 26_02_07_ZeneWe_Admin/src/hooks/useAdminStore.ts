import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

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

export interface AdminOption {
  id: string;
  text: string;
  imageUrl?: string;
  value: number;
  label: string;
}

export interface AdminQuestion {
  id: number;
  internalTitle: string;
  template: TemplateType;
  status: QuestionStatus;
  stem: string;
  subtitle?: string;
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

const DEFAULT_QUESTIONS: AdminQuestion[] = [
  {
    id: 1, internalTitle: '精力与热情量表', template: 'F1', status: 'published',
    stem: '我最近感到精力充沛，对生活充满热情。', tags: ['情绪', '能量'],
    options: [], mediaUrl: undefined, mediaType: undefined,
    templateSettings: { leftLabel: '非常不同意', rightLabel: '非常同意' },
    validation: { required: true }, order: 1,
    updatedAt: '2026-02-05', createdAt: '2026-01-15',
  },
  {
    id: 2, internalTitle: '风景直觉反应', template: 'F3', status: 'published',
    stem: '当你看到这幅景象时，你本能的感受是？', tags: ['直觉', '感知'],
    options: [
      { id: 'A', text: '宁静与广阔', value: 5, label: 'A' },
      { id: 'B', text: '孤独与渺小', value: 2, label: 'B' },
      { id: 'C', text: '想要去探索', value: 4, label: 'C' },
      { id: 'D', text: '感到压抑', value: 1, label: 'D' },
    ],
    mediaUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop',
    mediaType: 'image',
    templateSettings: {},
    validation: { required: true }, order: 2,
    updatedAt: '2026-02-04', createdAt: '2026-01-15',
  },
  {
    id: 3, internalTitle: '领导回复第一反应', template: 'F4', status: 'published',
    stem: '你向领导提交方案后，收到一句简短回复："我们需要讨论一下。"你的第一反应是：',
    tags: ['认知', '职场'],
    options: [
      { id: 'A', text: '只要被叫去讨论，说明我的方案就是不合格。', imageUrl: 'https://images.unsplash.com/photo-1739300293396-9ad79111c8e4?w=400', value: 5, label: 'A' },
      { id: 'B', text: '他们这次不满意，以后我提的方案可能都通不过。', imageUrl: 'https://images.unsplash.com/photo-1576763013267-01343ca79876?w=400', value: 1, label: 'B' },
      { id: 'C', text: '完了，这肯定意味着重大问题，项目可能要被叫停。', imageUrl: 'https://images.unsplash.com/photo-1758687127236-0da5ff52f4bc?w=400', value: 2, label: 'C' },
      { id: 'D', text: '我本来必须把所有问题预先考虑到，不能让领导再操心。', imageUrl: 'https://images.unsplash.com/photo-1685381949388-bb0402fbe133?w=400', value: 4, label: 'D' },
    ],
    templateSettings: {},
    validation: { required: true }, order: 3,
    updatedAt: '2026-02-03', createdAt: '2026-01-15',
  },
  {
    id: 4, internalTitle: '当下状态6图选择', template: 'F5', status: 'published',
    stem: '请从以下 6 张图中，选出最符合你当下状态的一张。', tags: ['情绪', '状态'],
    options: [
      { id: 'A', text: '平静', imageUrl: 'https://images.unsplash.com/photo-1763899910806-43a13994b44f?w=400', value: 5, label: 'A' },
      { id: 'B', text: '紧张', imageUrl: 'https://images.unsplash.com/photo-1678988498674-958509e12591?w=400', value: 1, label: 'B' },
      { id: 'C', text: '期待', imageUrl: 'https://images.unsplash.com/photo-1603110505034-7e7dd9458f27?w=400', value: 4, label: 'C' },
      { id: 'D', text: '疲惫', imageUrl: 'https://images.unsplash.com/photo-1497491908353-c2624b242ecf?w=400', value: 2, label: 'D' },
      { id: 'E', text: '混乱', imageUrl: 'https://images.unsplash.com/photo-1759269834861-db6fddb17db3?w=400', value: 2, label: 'E' },
      { id: 'F', text: '释然', imageUrl: 'https://images.unsplash.com/photo-1593015839760-756dcd728cba?w=400', value: 5, label: 'F' },
    ],
    templateSettings: { gridLayout: '2x3' },
    validation: { required: true }, order: 4,
    updatedAt: '2026-02-02', createdAt: '2026-01-15',
  },
  {
    id: 5, internalTitle: '动物排序Top3', template: 'F6', status: 'published',
    stem: '给你几种动物，请在以下动物中依次排序，选出你心中最喜欢的三种。',
    subtitle: '规则：最喜欢=1，第二喜欢=2，第三喜欢=3。',
    tags: ['排序', '偏好'],
    options: [
      { id: 'cat', text: '猫', value: 0, label: '1' },
      { id: 'dog', text: '狗', value: 0, label: '2' },
      { id: 'rabbit', text: '兔子', value: 0, label: '3' },
      { id: 'panda', text: '熊猫', value: 0, label: '4' },
      { id: 'fox', text: '狐狸', value: 0, label: '5' },
      { id: 'dolphin', text: '海豚', value: 0, label: '6' },
      { id: 'owl', text: '猫头鹰', value: 0, label: '7' },
    ],
    templateSettings: { topN: 3 },
    validation: { required: true, min: 3, max: 3 }, order: 5,
    updatedAt: '2026-02-01', createdAt: '2026-01-15',
  },
  {
    id: 6, internalTitle: '空间方向罗盘', template: 'F7', status: 'published',
    stem: '空间想象：若你站在树旁面向房子，猫在你的什么方向？',
    subtitle: '请拖动箭头指示方向（请以直觉作答，不要旋转设备）',
    tags: ['空间', '认知'],
    options: [],
    templateSettings: {
      centerObject: 'User', targetObject: 'Cat', defaultAngle: 0, resetLabel: '重置',
      sceneItems: [
        { id: 'tree', icon: 'TreeDeciduous', label: '树', x: 50, y: 50 },
        { id: 'house', icon: 'Home', label: '房子', x: 50, y: 10 },
        { id: 'cat', icon: 'Cat', label: '猫', x: 80, y: 50 },
      ],
    },
    validation: { required: true }, order: 6,
    updatedAt: '2026-01-30', createdAt: '2026-01-15',
  },
  {
    id: 7, internalTitle: '视频情绪判断', template: 'F8', status: 'published',
    stem: '观看这段视频片段，视频中主角的情绪主要是？', tags: ['视频', '共情'],
    options: [
      { id: 'A', text: '悲伤与失落', value: 1, label: 'A' },
      { id: 'B', text: '平静与接纳', value: 5, label: 'B' },
      { id: 'C', text: '焦虑与不安', value: 2, label: 'C' },
      { id: 'D', text: '愤怒与抗拒', value: 1, label: 'D' },
      { id: 'E', text: '喜悦与兴奋', value: 4, label: 'E' },
    ],
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-calm-sea-and-coast-at-sunset-1229-large.mp4',
    mediaType: 'video',
    templateSettings: {},
    validation: { required: true }, order: 7,
    updatedAt: '2026-01-29', createdAt: '2026-01-15',
  },
  {
    id: 8, internalTitle: '情绪感知量表', template: 'F1', status: 'published',
    stem: '我能清晰地感知到自己情绪的起伏变化。', tags: ['情绪', '觉察'],
    options: [],
    templateSettings: { leftLabel: '从不', rightLabel: '总是' },
    validation: { required: true }, order: 8,
    updatedAt: '2026-01-28', createdAt: '2026-01-15',
  },
];

const MOCK_MEDIA: MediaItem[] = [
  { id: 'm1', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400', name: 'mountain-landscape.jpg', type: 'image', size: '2.4 MB', uploadedAt: '2026-01-15' },
  { id: 'm2', url: 'https://images.unsplash.com/photo-1642970918110-d9054c899efb?w=400', name: 'calm-ocean.jpg', type: 'image', size: '1.8 MB', uploadedAt: '2026-01-16' },
  { id: 'm3', url: 'https://images.unsplash.com/photo-1717758220144-aae8c59dbd7d?w=400', name: 'abstract-art.jpg', type: 'image', size: '3.1 MB', uploadedAt: '2026-01-17' },
  { id: 'm4', url: 'https://images.unsplash.com/photo-1763899910806-43a13994b44f?w=400', name: 'calm-portrait.jpg', type: 'image', size: '1.2 MB', uploadedAt: '2026-01-18' },
  { id: 'm5', url: 'https://images.unsplash.com/photo-1678988498674-958509e12591?w=400', name: 'nervous-portrait.jpg', type: 'image', size: '1.5 MB', uploadedAt: '2026-01-19' },
  { id: 'm6', url: 'https://images.unsplash.com/photo-1603110505034-7e7dd9458f27?w=400', name: 'optimistic.jpg', type: 'image', size: '1.9 MB', uploadedAt: '2026-01-20' },
  { id: 'm7', url: 'https://assets.mixkit.co/videos/preview/mixkit-calm-sea-and-coast-at-sunset-1229-large.mp4', name: 'calm-sea-sunset.mp4', type: 'video', size: '12.5 MB', uploadedAt: '2026-01-21' },
  { id: 'm8', url: 'https://images.unsplash.com/photo-1497491908353-c2624b242ecf?w=400', name: 'tired-burnout.jpg', type: 'image', size: '2.0 MB', uploadedAt: '2026-01-22' },
];

const MOCK_LOGS: PublishLog[] = [
  { id: 'l1', action: 'Published', questionId: 1, user: 'Admin', timestamp: '2026-01-15 10:00' },
  { id: 'l2', action: 'Published', questionId: 2, user: 'Admin', timestamp: '2026-01-15 10:05' },
  { id: 'l3', action: 'Published', questionId: 3, user: 'Admin', timestamp: '2026-01-15 10:10' },
  { id: 'l4', action: 'Updated', questionId: 1, user: 'Admin', timestamp: '2026-02-05 14:30' },
  { id: 'l5', action: 'Published', questionId: 8, user: 'Admin', timestamp: '2026-01-28 09:00' },
];

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
  const [questions, setQuestions] = useState<AdminQuestion[]>(DEFAULT_QUESTIONS);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('id');
  const [mediaItems] = useState<MediaItem[]>(MOCK_MEDIA);
  const [publishLogs] = useState<PublishLog[]>(MOCK_LOGS);
  const [isTemplatePickerOpen, setTemplatePickerOpen] = useState(false);

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

  const deleteQuestion = useCallback((id: number) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
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

  const value = useMemo(() => ({
    isLoggedIn, login, logout,
    currentView, setCurrentView,
    questions, addQuestion, updateQuestion, deleteQuestion, duplicateQuestion, getNextAvailableId, canAddQuestion,
    editingQuestionId, setEditingQuestionId,
    sortMode, setSortMode, reorderQuestion,
    mediaItems, publishLogs,
    isTemplatePickerOpen, setTemplatePickerOpen,
  }), [isLoggedIn, login, logout, currentView, questions, addQuestion, updateQuestion, deleteQuestion, duplicateQuestion, getNextAvailableId, canAddQuestion, editingQuestionId, sortMode, mediaItems, publishLogs, isTemplatePickerOpen, reorderQuestion]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};

export const useAdminStore = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdminStore must be used within AdminProvider');
  return ctx;
};

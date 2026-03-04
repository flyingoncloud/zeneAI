/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAdminStore, TEMPLATE_INFO, CATEGORY_OPTIONS, TemplateType, AdminOption, MediaItem } from '@/hooks/useAdminStore';
import {
  ArrowLeft, Save, Send, Plus, Trash2, GripVertical, Image as ImageIcon,
  Video, AlertCircle, CheckCircle2, X, Eye, Loader2, FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryPicker } from './CategoryPicker';
import { getCategoryLabel } from '@/data/categoryHierarchy';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const QuestionEditor: React.FC = () => {
  const { editingQuestionId, questions, updateQuestion, setCurrentView, setEditingQuestionId, mediaItems, reloadMediaItems } = useAdminStore();

  const question = useMemo(() => questions.find(q => q.id === editingQuestionId), [questions, editingQuestionId]);

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'stem' | { type: 'option', index: number } | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categoryPickerTarget, setCategoryPickerTarget] = useState<'question' | { type: 'option', index: number } | null>(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [saving, setSaving] = useState(false);

  // Local editable state
  const [stem, setStem] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('');  // NEW: Category for scoring
  const [internalTitle, setInternalTitle] = useState('');
  const [tags, setTags] = useState('');
  const [options, setOptions] = useState<AdminOption[]>([]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [templateSettings, setTemplateSettings] = useState<Record<string, any>>({});
  const [validationRequired, setValidationRequired] = useState(true);
  const [validationMin, setValidationMin] = useState<string>('');
  const [validationMax, setValidationMax] = useState<string>('');

  // Init from question
  useEffect(() => {
    if (question) {
      setStem(question.stem);
      setSubtitle(question.subtitle || '');
      setCategory(question.category || '');  // NEW: Initialize category
      setInternalTitle(question.internalTitle);
      setTags(question.tags.join(', '));
      setOptions([...question.options]);
      setMediaUrl(question.mediaUrl || '');
      setMediaType(question.mediaType || 'image');
      setTemplateSettings({ ...question.templateSettings });
      setValidationRequired(question.validation.required);
      setValidationMin(question.validation.min?.toString() || '');
      setValidationMax(question.validation.max?.toString() || '');
    }
  }, [question]);

  // Load media items when media picker opens
  useEffect(() => {
    console.log('[QuestionEditor] useEffect - showMediaPicker:', showMediaPicker, 'mediaItems.length:', mediaItems.length);
    if (showMediaPicker && mediaItems.length === 0) {
      console.log('[QuestionEditor] Media picker opened, loading media items...');
      reloadMediaItems();
    }
  }, [showMediaPicker, mediaItems.length, reloadMediaItems]);

  if (!question) return null;

  console.log('[QuestionEditor] Render - showMediaPicker:', showMediaPicker, 'mediaPickerTarget:', mediaPickerTarget);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 2500);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const questionData = {
        questionNumber: question.id,
        internalTitle,
        template: question.template,
        stem,
        subtitle: subtitle || undefined,
        category: category || undefined,  // NEW: Include category
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        options,
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? mediaType : undefined,
        templateSettings,
        validation: {
          required: validationRequired,
          min: validationMin ? Number(validationMin) : undefined,
          max: validationMax ? Number(validationMax) : undefined
        },
      };

      // Try to update first, if fails then create
      const response = await fetch(`${API_BASE_URL}/api/admin/questions/${question.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) {
        // If update fails (404), try to create
        if (response.status === 404) {
          const createResponse = await fetch(`${API_BASE_URL}/api/admin/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(questionData),
          });

          if (!createResponse.ok) {
            throw new Error('Failed to create question');
          }
        } else {
          throw new Error('Failed to save question');
        }
      }

      // Update local state
      updateQuestion(question.id, {
        stem, subtitle: subtitle || undefined, category: category || undefined, internalTitle,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        options: [...options],
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? mediaType : undefined,
        templateSettings: { ...templateSettings },
        validation: { required: validationRequired, min: validationMin ? Number(validationMin) : undefined, max: validationMax ? Number(validationMax) : undefined },
        status: 'draft',
      });

      showToast('草稿已保存');
    } catch (error) {
      console.error('Save error:', error);
      showToast('保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      // First save the question
      await handleSaveDraft();

      // Then publish it
      const response = await fetch(`${API_BASE_URL}/api/admin/questions/${question.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to publish question');
      }

      // Update local state
      updateQuestion(question.id, {
        stem, subtitle: subtitle || undefined, category: category || undefined, internalTitle,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        options: [...options],
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? mediaType : undefined,
        templateSettings: { ...templateSettings },
        validation: { required: validationRequired, min: validationMin ? Number(validationMin) : undefined, max: validationMax ? Number(validationMax) : undefined },
        status: 'published',
      });

      setShowPublishModal(false);
      showToast('已发布');

      // Navigate back to questions list after successful publish
      setTimeout(() => {
        setEditingQuestionId(null);
        setCurrentView('questions');
      }, 500); // Small delay to show the toast message
    } catch (error) {
      console.error('Publish error:', error);
      showToast('发布失败', 'error');
    }
  };

  const handleBack = () => {
    setEditingQuestionId(null);
    setCurrentView('questions');
  };

  const openMediaPicker = (target: 'stem' | { type: 'option', index: number }) => {
    console.log('[QuestionEditor] openMediaPicker called with target:', target);
    setMediaPickerTarget(target);
    setShowMediaPicker(true);
    console.log('[QuestionEditor] showMediaPicker set to true');
  };

  const selectMedia = (item: MediaItem) => {
    // IMPORTANT: Save relative URLs to database (e.g., /uploads/filename.jpg)
    // Frontend will construct full URLs when displaying
    // This ensures URLs work across dev/staging/production environments
    const relativeUrl = item.url.startsWith('http')
      ? item.url.replace(/^https?:\/\/[^/]+/, '') // Strip domain if present
      : item.url; // Already relative

    if (mediaPickerTarget === 'stem') {
      setMediaUrl(relativeUrl);
      setMediaType(item.type);
    } else if (mediaPickerTarget && typeof mediaPickerTarget === 'object') {
      updateOption(mediaPickerTarget.index, 'imageUrl', relativeUrl);
    }
    setShowMediaPicker(false);
    setMediaPickerTarget(null);
    showToast('已选择媒体');
  };

  const openCategoryPicker = (target: 'question' | { type: 'option', index: number }) => {
    console.log('[QuestionEditor] openCategoryPicker called with target:', target);
    setCategoryPickerTarget(target);
    setShowCategoryPicker(true);
  };

  const selectCategory = (code: string) => {
    if (categoryPickerTarget === 'question') {
      setCategory(code);
      showToast(`已设置类别: ${getCategoryLabel(code)}`);
    } else if (categoryPickerTarget && typeof categoryPickerTarget === 'object') {
      updateOption(categoryPickerTarget.index, 'sub_category', code);
      showToast(`已设置子类别: ${getCategoryLabel(code)}`);
    }
    setShowCategoryPicker(false);
    setCategoryPickerTarget(null);
  };

  const addOption = () => {
    const nextLabel = String.fromCharCode(65 + options.length);
    setOptions([...options, { id: nextLabel, text: '', value: 1, label: nextLabel }]);
  };

  const removeOption = (idx: number) => {
    const newOpts = options.filter((_, i) => i !== idx);
    setOptions(newOpts.map((o, i) => ({ ...o, label: String.fromCharCode(65 + i) })));
  };

  const updateOption = (idx: number, field: keyof AdminOption, value: any) => {
    setOptions(options.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  };

  const templateInfo = TEMPLATE_INFO[question.template];
  const isLikert = question.template === 'F1';
  const hasOptions = ['F2', 'F3', 'F4', 'F5', 'F6', 'F8'].includes(question.template);
  const hasStemMedia = ['F3', 'F7', 'F8'].includes(question.template);  // F7 needs image for spatial scenario
  const hasOptionImages = ['F4', 'F5'].includes(question.template);
  const isSpatial = question.template === 'F7';
  const isRanking = question.template === 'F6';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-lg text-[#111827]">Q{question.id}</span>
            <span className="text-xs text-[#6B7280] bg-[#F3F5FA] border border-[#E6EAF2] px-2 py-0.5 rounded-md">{question.template} — {templateInfo.name}</span>
            {question.status === 'published' ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Published</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[11px] bg-slate-500/10 text-slate-400 border border-slate-500/20">Draft</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSaveDraft} disabled={saving} className="h-9 px-4 rounded-xl border border-white/[0.08] text-sm text-slate-300 hover:bg-white/5 flex items-center gap-2 disabled:opacity-40 transition-colors cursor-pointer">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 保存草稿
          </button>
          <button onClick={() => setShowPublishModal(true)} className="h-9 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm text-white flex items-center gap-2 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-600/20 cursor-pointer">
            <Send size={14} /> 发布
          </button>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-white/[0.04]">
          {/* Basic */}
          <section>
            <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1 h-3.5 bg-violet-500 rounded-full" /> Basic Info
            </h3>
            <div className="space-y-4 bg-white border border-[#E6EAF2] rounded-xl p-5 shadow-[0_1px_3px_rgba(17,24,39,0.06),0_1px_2px_rgba(17,24,39,0.04)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Question ID</label>
                  <input value={`Q${question.id}`} readOnly className="w-full h-9 px-3 bg-white/[0.02] border border-white/[0.04] rounded-lg text-sm text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Template</label>
                  <input value={`${question.template} — ${templateInfo.name}`} readOnly className="w-full h-9 px-3 bg-white/[0.02] border border-white/[0.04] rounded-lg text-sm text-slate-500 cursor-not-allowed" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1.5">Internal Title</label>
                <input value={internalTitle} onChange={e => setInternalTitle(e.target.value)} className="w-full h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]" />
              </div>
              <div>
                <label className="block text-xs text-[#6B7280] mb-1.5">Tags（逗号分隔）</label>
                <input value={tags} onChange={e => setTags(e.target.value)} placeholder="情绪, 认知, 觉察" className="w-full h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]" />
              </div>
            </div>
          </section>

          {/* Stem Content */}
          <section>
            <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1 h-3.5 bg-blue-500 rounded-full" /> Stem Content
            </h3>
            <div className="space-y-4 bg-white border border-[#E6EAF2] rounded-xl p-5 shadow-[0_1px_3px_rgba(17,24,39,0.06),0_1px_2px_rgba(17,24,39,0.04)]">
              <div>
                <label className="block text-xs text-[#6B7280] mb-1.5">题干文字</label>
                <textarea value={stem} onChange={e => setStem(e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] resize-none focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">副标题 / 说明（可选）</label>
                <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]" placeholder="例：请以直觉作答" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">评分类别（用于报告计分）</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openCategoryPicker('question')}
                    className="flex-1 h-auto min-h-[36px] px-3 py-2 bg-white border border-[#E6EAF2] rounded-lg text-sm text-white hover:border-violet-500/40 transition-colors text-left flex items-center justify-between gap-2"
                  >
                    <span className={`flex-1 ${category ? 'text-black' : 'text-slate-600'}`}>
                      {category ? getCategoryLabel(category) : '-- 选择类别 --'}
                    </span>
                    <FolderOpen size={14} className="text-slate-500 shrink-0" />
                  </button>
                  {category && (
                    <button
                      onClick={() => setCategory('')}
                      className="h-9 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs transition-colors cursor-pointer shrink-0"
                    >
                      清除
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-1">选择类别后，此题的答案将计入该类别的总分</p>
              </div>
              {hasStemMedia && (
                <div className="space-y-3">
                  <label className="block text-xs text-slate-500 mb-1.5">媒体 ({question.template === 'F8' ? '视频' : '图片'})</label>
                  <div className="flex flex-wrap items-center gap-2">
                    <select value={mediaType} onChange={e => setMediaType(e.target.value as 'image' | 'video')} className="h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9]">
                      <option value="image">图片</option>
                      <option value="video">视频</option>
                    </select>
                    <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="输入 URL 或从媒体库选择" className="flex-1 h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]" />
                    <button
                      onClick={() => openMediaPicker('stem')}
                      className="h-9 px-3 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <FolderOpen size={14} /> 媒体库
                    </button>
                  </div>
                  {mediaUrl && mediaType === 'image' && (
                    <div className="w-full h-48 rounded-lg overflow-hidden bg-black/30 border border-white/[0.04] flex items-center justify-center p-2">
                      <img src={mediaUrl.startsWith('http') ? mediaUrl : `${API_BASE_URL}${mediaUrl}`} alt="preview" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Template Settings */}
          <section>
            <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1 h-3.5 bg-indigo-500 rounded-full" /> Template Settings
            </h3>
            <div className="space-y-4 bg-white border border-[#E6EAF2] rounded-xl p-5 shadow-[0_1px_3px_rgba(17,24,39,0.06),0_1px_2px_rgba(17,24,39,0.04)]">
              {isLikert && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">左端点文案</label>
                    <input value={templateSettings.leftLabel || ''} onChange={e => setTemplateSettings({ ...templateSettings, leftLabel: e.target.value })} className="w-full h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">右端点文案</label>
                    <input value={templateSettings.rightLabel || ''} onChange={e => setTemplateSettings({ ...templateSettings, rightLabel: e.target.value })} className="w-full h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]" />
                  </div>
                </div>
              )}
              {isRanking && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Top N（需选择的数量）</label>
                  <input type="number" min={1} max={10} value={templateSettings.topN || 3} onChange={e => setTemplateSettings({ ...templateSettings, topN: Number(e.target.value) })} className="w-24 h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]" />
                </div>
              )}
              {isSpatial && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">中心物体</label>
                      <input value={templateSettings.centerObject || ''} onChange={e => setTemplateSettings({ ...templateSettings, centerObject: e.target.value })} className="w-full h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">目标物体</label>
                      <input value={templateSettings.targetObject || ''} onChange={e => setTemplateSettings({ ...templateSettings, targetObject: e.target.value })} className="w-full h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">默认角度 (0–360)</label>
                      <input type="number" min={0} max={360} value={templateSettings.defaultAngle || 0} onChange={e => setTemplateSettings({ ...templateSettings, defaultAngle: Number(e.target.value) })} className="w-full h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Reset 按钮文案</label>
                      <input value={templateSettings.resetLabel || '重置'} onChange={e => setTemplateSettings({ ...templateSettings, resetLabel: e.target.value })} className="w-full h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]" />
                    </div>
                  </div>
                </div>
              )}
              {question.template === 'F5' && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">网格布局</label>
                  <div className="flex gap-2">
                    {['2x3', '3x2'].map(l => (
                      <button
                        key={l}
                        onClick={() => setTemplateSettings({ ...templateSettings, gridLayout: l })}
                        className={`px-3 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${templateSettings.gridLayout === l ? 'bg-violet-500/15 border-violet-500/30 text-violet-300' : 'border-white/[0.06] text-slate-500 hover:text-slate-300'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!isLikert && !isSpatial && !isRanking && question.template !== 'F5' && (
                <p className="text-xs text-slate-600 italic">此模板无额外参数</p>
              )}
            </div>
          </section>

          {/* Options */}
          {hasOptions && (
            <section>
              <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <div className="w-1 h-3.5 bg-fuchsia-500 rounded-full" /> Options
                <span className="text-[10px] text-slate-600 ml-auto">{options.length} 项</span>
              </h3>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-start gap-2 bg-white border border-[#E6EAF2] rounded-xl p-3.5 group shadow-[0_1px_3px_rgba(17,24,39,0.06),0_1px_2px_rgba(17,24,39,0.04)]">
                    <div className="w-6 h-6 rounded-md bg-white/5 border border-white/[0.06] flex items-center justify-center text-[11px] text-slate-400 shrink-0 mt-0.5">
                      {opt.label}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        value={opt.text} onChange={e => updateOption(idx, 'text', e.target.value)}
                        placeholder="选项文本"
                        className="w-full h-8 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]"
                      />
                      {hasOptionImages && (
                        <div className="flex items-center gap-2">
                          <input
                            value={opt.imageUrl || ''} onChange={e => updateOption(idx, 'imageUrl', e.target.value)}
                            placeholder="图片 URL（可选）"
                            className="w-full h-8 px-3 bg-white border border-[#E6EAF2] rounded-lg text-xs text-[#4B5563] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]"
                          />
                          <button
                            onClick={() => openMediaPicker({ type: 'option', index: idx })}
                            className="h-8 px-2.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          >
                            <FolderOpen size={12} />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-600">得分:</label>
                        <input
                          type="number" min={0} max={10}
                          value={opt.value} onChange={e => updateOption(idx, 'value', Number(e.target.value))}
                          className="w-16 h-7 px-2 bg-white border border-[#E6EAF2] rounded-md text-xs text-[#111827] focus:outline-none focus:border-[#6D28D9] transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-slate-600">子类别（可选，覆盖题目类别）:</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openCategoryPicker({ type: 'option', index: idx })}
                            className="flex-1 h-7 px-2 bg-white border border-[#E6EAF2] rounded-md text-xs hover:border-violet-500/40 transition-colors text-left flex items-center justify-between"
                          >
                            <span className={opt.sub_category ? 'text-white' : 'text-slate-600'}>
                              {opt.sub_category ? getCategoryLabel(opt.sub_category) : '-- 使用题目类别 --'}
                            </span>
                            <FolderOpen size={10} className="text-slate-500" />
                          </button>
                          {opt.sub_category && (
                            <button
                              onClick={() => updateOption(idx, 'sub_category', undefined)}
                              className="h-7 px-2 rounded-md bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] transition-colors cursor-pointer"
                            >
                              清除
                            </button>
                          )}
                        </div>
                        {opt.sub_category && opt.sub_category !== category && (
                          <p className="text-[10px] text-amber-400/80 flex items-center gap-1">
                            <AlertCircle size={10} /> 此答案将计入不同类别
                          </p>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeOption(idx)} className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <button onClick={addOption} disabled={options.length >= 8} className="w-full h-9 rounded-xl border border-dashed border-white/[0.08] text-sm text-slate-500 hover:text-violet-400 hover:border-violet-500/30 flex items-center justify-center gap-2 disabled:opacity-30 transition-colors cursor-pointer">
                  <Plus size={14} /> 添加选项
                </button>
              </div>
            </section>
          )}

          {/* Validation */}
          <section>
            <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1 h-3.5 bg-emerald-500 rounded-full" /> Validation
            </h3>
            <div className="space-y-4 bg-white border border-[#E6EAF2] rounded-xl p-5 shadow-[0_1px_3px_rgba(17,24,39,0.06),0_1px_2px_rgba(17,24,39,0.04)]">
              <div className="flex items-center justify-between">
                <label className="text-sm text-[#374151]">必填</label>
                <button
                  onClick={() => setValidationRequired(!validationRequired)}
                  className={`w-10 h-[22px] rounded-full transition-all cursor-pointer relative ${validationRequired ? 'bg-violet-500' : 'bg-slate-700'}`}
                >
                  <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-all ${validationRequired ? 'left-[22px]' : 'left-[3px]'}`} />
                </button>
              </div>
              {isRanking && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">最少选择</label>
                    <input type="number" value={validationMin} onChange={e => setValidationMin(e.target.value)} placeholder="—" className="w-full h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">最多选择</label>
                    <input type="number" value={validationMax} onChange={e => setValidationMax(e.target.value)} placeholder="—" className="w-full h-9 px-3 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all placeholder:text-[#9CA3AF]" />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right: Preview */}
        <div className="w-[420px] shrink-0 overflow-y-auto bg-[#F7F8FC] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={14} className="text-slate-500" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Preview</span>
          </div>

          {/* Preview Card */}
          <div className="bg-gradient-to-br from-[#2D1B69] to-[#1B1145] border border-violet-500/20 rounded-2xl p-6 shadow-[0_8px_24px_rgba(17,24,39,0.12)] relative overflow-hidden">
            {/* Ambient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />

            {/* Question number */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-violet-300/60 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">Q{question.id}</span>
              <span className="text-xs text-violet-300/40">{question.template}</span>
            </div>

            {/* Stem */}
            <p className="text-white text-sm mb-1 relative z-10">{stem || '（题干文字）'}</p>
            {subtitle && <p className="text-xs text-violet-300/50 mb-4">{subtitle}</p>}

            {/* Stem Media */}
            {hasStemMedia && mediaUrl && (
              <div className="w-full flex justify-center rounded-lg overflow-hidden mb-3 border border-white/5 bg-black/30 p-1.5">
                {mediaType === 'video' ? (
                  <video src={mediaUrl.startsWith('http') ? mediaUrl : `${API_BASE_URL}${mediaUrl}`} className="h-auto object-contain" style={{ maxHeight: '64px' }} muted />
                ) : (
                  <img src={mediaUrl.startsWith('http') ? mediaUrl : `${API_BASE_URL}${mediaUrl}`} alt="stem" className="h-auto object-contain" style={{ maxHeight: '64px' }} />
                )}
              </div>
            )}

            {/* Likert Preview */}
            {isLikert && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-violet-300/50">{templateSettings.leftLabel || '左端点'}</span>
                  <span className="text-[10px] text-violet-300/50">{templateSettings.rightLabel || '右端点'}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} className={`flex-1 h-8 rounded-lg border border-violet-500/20 flex items-center justify-center text-xs text-violet-300/60 ${n === 3 ? 'bg-violet-500/20 border-violet-500/40' : 'bg-white/5'}`}>
                      {n}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Options Preview */}
            {hasOptions && !isRanking && (
              <div className="mt-4 space-y-2">
                {options.map((opt, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${idx === 0 ? 'border-violet-500/30 bg-violet-500/10' : 'border-white/5 bg-white/[0.03]'}`}>
                    {hasOptionImages && opt.imageUrl && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5">
                        <img src={opt.imageUrl.startsWith('http') ? opt.imageUrl : `${API_BASE_URL}${opt.imageUrl}`} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="w-5 h-5 rounded-full border border-violet-500/30 shrink-0 flex items-center justify-center">
                      {idx === 0 && <div className="w-2.5 h-2.5 rounded-full bg-violet-400" />}
                    </div>
                    <span className="text-xs text-slate-300">{opt.text || `选项 ${opt.label}`}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Ranking Preview */}
            {isRanking && (
              <div className="mt-4 space-y-1.5">
                {options.slice(0, 5).map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg border border-white/5 bg-white/[0.03]">
                    <div className="w-5 h-5 rounded-md bg-white/5 flex items-center justify-center text-[10px] text-slate-500 shrink-0">
                      {idx + 1}
                    </div>
                    <span className="text-xs text-slate-300">{opt.text || `选项 ${idx + 1}`}</span>
                  </div>
                ))}
                {options.length > 5 && <p className="text-[10px] text-slate-600 text-center">+{options.length - 5} more</p>}
              </div>
            )}

            {/* Spatial Preview */}
            {isSpatial && (
              <div className="mt-4 relative w-full aspect-square bg-[#0F0A20] rounded-xl border border-violet-500/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-violet-400/50" />
                <div className="absolute w-full h-full flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full border border-dashed border-violet-500/20" />
                  <div className="absolute w-32 h-32 rounded-full border border-dashed border-violet-500/10" />
                </div>
                <p className="absolute bottom-3 text-[10px] text-violet-300/40">拖动箭头指示方向</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Confirm Modal */}
      <AnimatePresence>
        {showPublishModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPublishModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1A1B23] border border-white/[0.08] rounded-2xl p-6 w-full max-w-[400px] shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 mx-auto">
                <Send size={22} className="text-violet-400" />
              </div>
              <h3 className="text-lg text-white text-center mb-2">发布 Q{question.id}？</h3>
              <p className="text-sm text-slate-400 text-center mb-6">发布后题目将对用户可见。确认所有字段无误后继续。</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowPublishModal(false)} className="flex-1 h-10 rounded-xl border border-white/[0.08] text-sm text-slate-300 hover:bg-white/5 transition-colors cursor-pointer">取消</button>
                <button onClick={handlePublish} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm text-white hover:from-violet-500 hover:to-indigo-500 transition-all cursor-pointer">确认发布</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Picker Modal - Rendered via Portal */}
      {typeof window !== 'undefined' && showMediaPicker && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            pointerEvents: 'auto'
          }}
          onClick={() => {
            console.log('[QuestionEditor] Backdrop clicked, closing modal');
            setShowMediaPicker(false);
          }}
        >
          <div
            className="bg-[#1A1B23] rounded-2xl w-full max-w-[700px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            style={{ pointerEvents: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04] shrink-0">
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-violet-400" />
                <h3 className="text-sm text-white">选择媒体</h3>
              </div>
              <button
                onClick={() => setShowMediaPicker(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto flex-1">
              {mediaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                    <ImageIcon size={28} className="text-violet-400/40" />
                  </div>
                  <p className="text-slate-400 text-sm mb-2">媒体库为空</p>
                  <p className="text-slate-600 text-xs mb-4">请先在媒体库页面上传文件</p>
                  <button
                    onClick={() => {
                      setShowMediaPicker(false);
                      setCurrentView('media');
                    }}
                    className="h-9 px-4 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-400 text-sm flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FolderOpen size={14} /> 前往媒体库
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {mediaItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => selectMedia(item)}
                      className="group bg-[#13141A] border border-white/[0.06] rounded-xl overflow-hidden hover:border-violet-500/40 transition-all cursor-pointer"
                    >
                      <div className="w-full aspect-square bg-black/30 relative overflow-hidden flex items-center justify-center p-2">
                        {item.type === 'image' ? (
                          <img
                            src={`${API_BASE_URL}${item.url}`}
                            alt={item.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-500/10 to-rose-600/5">
                            <Video size={24} className="text-rose-400/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-violet-500/0 group-hover:bg-violet-500/10 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <CheckCircle2 size={28} className="text-violet-400" />
                          </div>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs text-slate-300 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{item.size}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1A1B23] border border-white/[0.08] rounded-xl px-5 py-3 shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 size={16} className={toastType === 'success' ? 'text-emerald-400' : 'text-red-400'} />
            <span className="text-sm text-white">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Picker Modal */}
      <CategoryPicker
        isOpen={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        onSelect={selectCategory}
        selectedCategory={
          categoryPickerTarget === 'question'
            ? category
            : categoryPickerTarget && typeof categoryPickerTarget === 'object'
            ? options[categoryPickerTarget.index]?.sub_category
            : undefined
        }
        title={
          categoryPickerTarget === 'question'
            ? '选择题目类别'
            : '选择答案子类别'
        }
      />
    </div>
  );
};
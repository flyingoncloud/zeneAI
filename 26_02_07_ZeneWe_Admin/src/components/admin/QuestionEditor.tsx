import React, { useState, useMemo, useEffect } from 'react';
import { useAdminStore, TEMPLATE_INFO, TemplateType, AdminOption } from '../../hooks/useAdminStore';
import {
  ArrowLeft, Save, Send, Plus, Trash2, GripVertical, Image as ImageIcon,
  Video, AlertCircle, CheckCircle2, X, Eye, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const QuestionEditor: React.FC = () => {
  const { editingQuestionId, questions, updateQuestion, setCurrentView, setEditingQuestionId } = useAdminStore();

  const question = useMemo(() => questions.find(q => q.id === editingQuestionId), [questions, editingQuestionId]);

  const [showPublishModal, setShowPublishModal] = useState(false);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [saving, setSaving] = useState(false);

  // Local editable state
  const [stem, setStem] = useState('');
  const [subtitle, setSubtitle] = useState('');
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

  if (!question) return null;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 2500);
  };

  const handleSaveDraft = () => {
    setSaving(true);
    setTimeout(() => {
      updateQuestion(question.id, {
        stem, subtitle: subtitle || undefined, internalTitle,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        options: [...options],
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? mediaType : undefined,
        templateSettings: { ...templateSettings },
        validation: { required: validationRequired, min: validationMin ? Number(validationMin) : undefined, max: validationMax ? Number(validationMax) : undefined },
        status: 'draft',
      });
      setSaving(false);
      showToast('草稿已保存');
    }, 500);
  };

  const handlePublish = () => {
    updateQuestion(question.id, {
      stem, subtitle: subtitle || undefined, internalTitle,
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
  };

  const handleBack = () => {
    setEditingQuestionId(null);
    setCurrentView('questions');
  };

  const addOption = () => {
    const nextLabel = String.fromCharCode(65 + options.length);
    setOptions([...options, { id: nextLabel, text: '', value: 0, label: nextLabel }]);
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
  const hasStemMedia = ['F3', 'F8'].includes(question.template);
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
            <span className="text-lg text-white">Q{question.id}</span>
            <span className="text-xs text-slate-500 bg-white/5 border border-white/[0.06] px-2 py-0.5 rounded-md">{question.template} — {templateInfo.name}</span>
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
            <div className="space-y-4 bg-[#13141A] border border-white/[0.06] rounded-xl p-5">
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
                <label className="block text-xs text-slate-500 mb-1.5">Internal Title</label>
                <input value={internalTitle} onChange={e => setInternalTitle(e.target.value)} className="w-full h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Tags（逗号分隔）</label>
                <input value={tags} onChange={e => setTags(e.target.value)} placeholder="情绪, 认知, 觉察" className="w-full h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors placeholder:text-slate-600" />
              </div>
            </div>
          </section>

          {/* Stem Content */}
          <section>
            <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <div className="w-1 h-3.5 bg-blue-500 rounded-full" /> Stem Content
            </h3>
            <div className="space-y-4 bg-[#13141A] border border-white/[0.06] rounded-xl p-5">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">题干文字</label>
                <textarea value={stem} onChange={e => setStem(e.target.value)} rows={3} className="w-full px-3 py-2.5 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white resize-none focus:outline-none focus:border-violet-500/40 transition-colors" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">副标题 / 说明（可选）</label>
                <input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors placeholder:text-slate-600" placeholder="例：请以直觉作答" />
              </div>
              {hasStemMedia && (
                <div className="space-y-3">
                  <label className="block text-xs text-slate-500 mb-1.5">媒体 ({question.template === 'F8' ? '视频' : '图片'})</label>
                  <div className="flex items-center gap-2">
                    <select value={mediaType} onChange={e => setMediaType(e.target.value as 'image' | 'video')} className="h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none">
                      <option value="image">图片</option>
                      <option value="video">视频</option>
                    </select>
                    <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="输入 URL 或从媒体库选择" className="flex-1 h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 placeholder:text-slate-600 transition-colors" />
                  </div>
                  {mediaUrl && mediaType === 'image' && (
                    <div className="w-full h-32 rounded-lg overflow-hidden bg-black/30 border border-white/[0.04]">
                      <img src={mediaUrl} alt="preview" className="w-full h-full object-cover" />
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
            <div className="space-y-4 bg-[#13141A] border border-white/[0.06] rounded-xl p-5">
              {isLikert && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">左端点文案</label>
                    <input value={templateSettings.leftLabel || ''} onChange={e => setTemplateSettings({ ...templateSettings, leftLabel: e.target.value })} className="w-full h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">右端点文案</label>
                    <input value={templateSettings.rightLabel || ''} onChange={e => setTemplateSettings({ ...templateSettings, rightLabel: e.target.value })} className="w-full h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors" />
                  </div>
                </div>
              )}
              {isRanking && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Top N（需选择的数量）</label>
                  <input type="number" min={1} max={10} value={templateSettings.topN || 3} onChange={e => setTemplateSettings({ ...templateSettings, topN: Number(e.target.value) })} className="w-24 h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors" />
                </div>
              )}
              {isSpatial && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">中心物体</label>
                      <input value={templateSettings.centerObject || ''} onChange={e => setTemplateSettings({ ...templateSettings, centerObject: e.target.value })} className="w-full h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">目标物体</label>
                      <input value={templateSettings.targetObject || ''} onChange={e => setTemplateSettings({ ...templateSettings, targetObject: e.target.value })} className="w-full h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">默认角度 (0–360)</label>
                      <input type="number" min={0} max={360} value={templateSettings.defaultAngle || 0} onChange={e => setTemplateSettings({ ...templateSettings, defaultAngle: Number(e.target.value) })} className="w-full h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1.5">Reset 按钮文案</label>
                      <input value={templateSettings.resetLabel || '重置'} onChange={e => setTemplateSettings({ ...templateSettings, resetLabel: e.target.value })} className="w-full h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors" />
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
                  <div key={idx} className="flex items-start gap-2 bg-[#13141A] border border-white/[0.06] rounded-xl p-3.5 group">
                    <div className="w-6 h-6 rounded-md bg-white/5 border border-white/[0.06] flex items-center justify-center text-[11px] text-slate-400 shrink-0 mt-0.5">
                      {opt.label}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        value={opt.text} onChange={e => updateOption(idx, 'text', e.target.value)}
                        placeholder="选项文本"
                        className="w-full h-8 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors placeholder:text-slate-600"
                      />
                      {hasOptionImages && (
                        <input
                          value={opt.imageUrl || ''} onChange={e => updateOption(idx, 'imageUrl', e.target.value)}
                          placeholder="图片 URL（可选）"
                          className="w-full h-8 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-xs text-slate-400 focus:outline-none focus:border-violet-500/40 transition-colors placeholder:text-slate-600"
                        />
                      )}
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-slate-600">得分:</label>
                        <input
                          type="number" min={0} max={10}
                          value={opt.value} onChange={e => updateOption(idx, 'value', Number(e.target.value))}
                          className="w-16 h-7 px-2 bg-[#0F1115] border border-white/[0.06] rounded-md text-xs text-white focus:outline-none focus:border-violet-500/40 transition-colors"
                        />
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
            <div className="space-y-4 bg-[#13141A] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300">必填</label>
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
                    <input type="number" value={validationMin} onChange={e => setValidationMin(e.target.value)} placeholder="—" className="w-full h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors placeholder:text-slate-600" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1.5">最多选择</label>
                    <input type="number" value={validationMax} onChange={e => setValidationMax(e.target.value)} placeholder="—" className="w-full h-9 px-3 bg-[#0F1115] border border-white/[0.06] rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/40 transition-colors placeholder:text-slate-600" />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right: Preview */}
        <div className="w-[420px] shrink-0 overflow-y-auto bg-[#0A0B10] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={14} className="text-slate-500" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">Preview</span>
          </div>

          {/* Preview Card */}
          <div className="bg-gradient-to-br from-[#2D1B69]/80 to-[#1B1145]/80 border border-violet-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            {/* Ambient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-[60px] pointer-events-none" />

            {/* Question number */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-violet-300/60 bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-500/20">Q{question.id}</span>
              <span className="text-xs text-violet-300/40">{question.template}</span>
            </div>

            {/* Stem Media */}
            {hasStemMedia && mediaUrl && (
              <div className="w-full h-36 rounded-xl overflow-hidden mb-4 border border-white/5">
                {mediaType === 'video' ? (
                  <video src={mediaUrl} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={mediaUrl} alt="stem" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            {/* Stem */}
            <p className="text-white text-sm mb-1 relative z-10">{stem || '（题干文字）'}</p>
            {subtitle && <p className="text-xs text-violet-300/50 mb-4">{subtitle}</p>}

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
                        <img src={opt.imageUrl} alt="" className="w-full h-full object-cover" />
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
    </div>
  );
};
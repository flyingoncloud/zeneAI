# 题目类别树形结构构建指南

## 概述

本指南说明如何为题目类别（category）构建树形选择器，让用户在创建/编辑题目时可以从层级结构中选择类别。

## 现有实现参考

系统已经有一个完整的树形选择器实现，用于心理评估类别选择：

- **数据结构**: `zeneme-next/src/data/categoryHierarchy.ts`
- **UI 组件**: `zeneme-next/src/components/admin/CategoryPicker.tsx`

## 方案 1: 使用现有的 CategoryPicker（推荐）

### 优点
- ✅ 已经实现完整的树形 UI
- ✅ 支持搜索、展开/收起
- ✅ 有完整的层级结构数据

### 实现步骤

#### 1. 在 QuestionEditor 中集成

```typescript
// zeneme-next/src/components/admin/QuestionEditor.tsx

import { CategoryPicker } from './CategoryPicker';
import { getCategoryLabel } from '@/data/categoryHierarchy';

export function QuestionEditor() {
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  return (
    <div>
      {/* Category Selection Button */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          题目类别 (Category)
        </label>
        <button
          onClick={() => setIsCategoryPickerOpen(true)}
          className="w-full px-4 py-2.5 bg-[#0F1115] border border-white/10 rounded-lg text-left text-sm text-white hover:border-violet-500/50 transition-colors"
        >
          {selectedCategory ? getCategoryLabel(selectedCategory) : '选择类别...'}
        </button>
      </div>

      {/* Category Picker Modal */}
      <CategoryPicker
        isOpen={isCategoryPickerOpen}
        onClose={() => setIsCategoryPickerOpen(false)}
        onSelect={(code) => {
          setSelectedCategory(code);
          // 保存到题目数据
          updateQuestion({ category: code });
        }}
        selectedCategory={selectedCategory}
        title="选择题目类别"
      />
    </div>
  );
}
```

#### 2. 类别数据映射

现有的 `CATEGORY_HIERARCHY` 包含以下主要类别：

```typescript
{
  "2.1": "情绪觉察 (Emotional Awareness)",
  "2.2": "认知模式 (Cognitive Patterns)",
    "2.2.1": "自我内在系统分析",
    "2.2.2": "自动思维模式",
      "2.2.2.1": "过度概括",
      "2.2.2.2": "非黑即白",
      // ... 更多子类别
  "2.3": "关系模式 (Relational Patterns)",
    "2.3.1": "依恋结构",
      "2.3.1.1": "安全型",
      "2.3.1.2": "焦虑型",
      // ... 更多子类别
  "2.4": "性格类型 (Personality Type)",
  "2.5": "成长指数与变化潜能 (Growth Index)"
}
```

这些类别可以直接用于题目分类。

---

## 方案 2: 创建简化的类别列表（如果不需要层级）

如果题目类别不需要复杂的层级结构，可以使用简化的下拉列表。

### 1. 定义简单的类别列表

```typescript
// zeneme-next/src/data/questionCategories.ts

export const QUESTION_CATEGORIES = [
  { value: '情绪识别能力', label: '情绪识别能力 (Emotion Recognition)' },
  { value: '认知重构能力', label: '认知重构能力 (Cognitive Restructuring)' },
  { value: '内在对话能力', label: '内在对话能力 (Internal Dialogue)' },
  { value: '关系互动能力', label: '关系互动能力 (Relational Interaction)' },
  { value: '情绪调节能力', label: '情绪调节能力 (Emotion Regulation)' },
];
```

### 2. 使用简单的下拉选择

```typescript
// zeneme-next/src/components/admin/QuestionEditor.tsx

import { QUESTION_CATEGORIES } from '@/data/questionCategories';

export function QuestionEditor() {
  const [category, setCategory] = useState('');

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        题目类别 (Category)
      </label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full px-4 py-2.5 bg-[#0F1115] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500/50"
      >
        <option value="">选择类别...</option>
        {QUESTION_CATEGORIES.map(cat => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

---

## 方案 3: 创建自定义的题目类别树（如果需要不同的层级）

如果需要为题目创建独立的类别树结构，可以参考现有实现创建新的。

### 1. 定义题目类别层级结构

```typescript
// zeneme-next/src/data/questionCategoryHierarchy.ts

export interface QuestionCategoryNode {
  code: string;
  name: string;
  nameEn: string;
  description?: string;
  children?: Record<string, QuestionCategoryNode>;
}

export const QUESTION_CATEGORY_HIERARCHY: Record<string, QuestionCategoryNode> = {
  "emotion": {
    code: "emotion",
    name: "情绪能力",
    nameEn: "Emotional Abilities",
    children: {
      "emotion.recognition": {
        code: "emotion.recognition",
        name: "情绪识别能力",
        nameEn: "Emotion Recognition"
      },
      "emotion.regulation": {
        code: "emotion.regulation",
        name: "情绪调节能力",
        nameEn: "Emotion Regulation"
      }
    }
  },
  "cognitive": {
    code: "cognitive",
    name: "认知能力",
    nameEn: "Cognitive Abilities",
    children: {
      "cognitive.restructuring": {
        code: "cognitive.restructuring",
        name: "认知重构能力",
        nameEn: "Cognitive Restructuring"
      },
      "cognitive.dialogue": {
        code: "cognitive.dialogue",
        name: "内在对话能力",
        nameEn: "Internal Dialogue"
      }
    }
  },
  "relational": {
    code: "relational",
    name: "关系能力",
    nameEn: "Relational Abilities",
    children: {
      "relational.interaction": {
        code: "relational.interaction",
        name: "关系互动能力",
        nameEn: "Relational Interaction"
      }
    }
  }
};

// Helper functions (same as categoryHierarchy.ts)
export function getQuestionCategoryNode(code: string): QuestionCategoryNode | null {
  // Implementation similar to getCategoryNode()
  // ...
}

export function getQuestionCategoryLabel(code: string): string {
  const node = getQuestionCategoryNode(code);
  return node ? `${node.name} (${node.nameEn})` : code;
}
```

### 2. 创建专用的 QuestionCategoryPicker 组件

```typescript
// zeneme-next/src/components/admin/QuestionCategoryPicker.tsx

import React, { useState } from 'react';
import { QUESTION_CATEGORY_HIERARCHY, type QuestionCategoryNode } from '@/data/questionCategoryHierarchy';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface QuestionCategoryPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (code: string) => void;
  selectedCategory?: string;
}

export function QuestionCategoryPicker({
  isOpen,
  onClose,
  onSelect,
  selectedCategory
}: QuestionCategoryPickerProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (code: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const renderNode = (node: QuestionCategoryNode, level: number = 0) => {
    const hasChildren = node.children && Object.keys(node.children).length > 0;
    const isExpanded = expandedNodes.has(node.code);
    const isSelected = node.code === selectedCategory;

    return (
      <div key={node.code}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.code);
            }
            onSelect(node.code);
            if (!hasChildren) {
              onClose();
            }
          }}
          className={`
            w-full text-left px-4 py-2.5 rounded-lg transition-all flex items-center gap-2
            ${isSelected
              ? 'bg-violet-500/20 border-2 border-violet-500/50'
              : 'border-2 border-transparent hover:bg-white/5 hover:border-white/10'
            }
          `}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          {hasChildren && (
            <span className="text-slate-500 shrink-0">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          )}

          {isSelected && <span className="text-violet-400 text-sm shrink-0">●</span>}

          <div className="flex-1 min-w-0">
            <div className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-slate-200'}`}>
              {node.name}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {node.nameEn}
            </div>
          </div>
        </button>

        {hasChildren && isExpanded && (
          <div>
            {Object.values(node.children!).map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#1A1B23] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">选择题目类别</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="space-y-1">
            {Object.values(QUESTION_CATEGORY_HIERARCHY).map(node => renderNode(node, 0))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 推荐方案总结

### 如果题目类别与心理评估类别一致
→ **使用方案 1**：直接使用现有的 `CategoryPicker` 和 `CATEGORY_HIERARCHY`

### 如果题目类别是简单的平面列表
→ **使用方案 2**：创建简单的下拉选择器

### 如果题目类别需要独立的层级结构
→ **使用方案 3**：创建新的 `QuestionCategoryPicker` 和 `QUESTION_CATEGORY_HIERARCHY`

---

## 数据库存储

无论使用哪种方案，类别都存储在 `admin_questions.category` 字段中：

```sql
-- 存储类别代码
UPDATE admin_questions
SET category = '2.2.1'  -- 或 'emotion.recognition' 或 '情绪识别能力'
WHERE id = 1;
```

---

## 完整示例：在 QuestionEditor 中使用

```typescript
// zeneme-next/src/components/admin/QuestionEditor.tsx

import { useState } from 'react';
import { CategoryPicker } from './CategoryPicker';
import { getCategoryLabel } from '@/data/categoryHierarchy';

export function QuestionEditor() {
  const [question, setQuestion] = useState({
    id: 1,
    internal_title: '',
    template: 'F1',
    stem: '',
    category: '',  // 题目类别
    // ... 其他字段
  });

  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  const handleCategorySelect = (code: string) => {
    setQuestion(prev => ({ ...prev, category: code }));
    setIsCategoryPickerOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* 其他字段 */}

      {/* 题目类别选择 */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          题目类别 (Category)
          <span className="text-slate-500 text-xs ml-2">用于分数计算和报告生成</span>
        </label>
        <button
          onClick={() => setIsCategoryPickerOpen(true)}
          className="w-full px-4 py-2.5 bg-[#0F1115] border border-white/10 rounded-lg text-left text-sm text-white hover:border-violet-500/50 transition-colors flex items-center justify-between"
        >
          <span>
            {question.category ? getCategoryLabel(question.category) : '选择类别...'}
          </span>
          <span className="text-slate-500">▼</span>
        </button>

        {question.category && (
          <button
            onClick={() => setQuestion(prev => ({ ...prev, category: '' }))}
            className="mt-2 text-xs text-red-400 hover:text-red-300"
          >
            清除类别
          </button>
        )}
      </div>

      {/* Category Picker Modal */}
      <CategoryPicker
        isOpen={isCategoryPickerOpen}
        onClose={() => setIsCategoryPickerOpen(false)}
        onSelect={handleCategorySelect}
        selectedCategory={question.category}
        title="选择题目类别"
      />

      {/* 保存按钮 */}
      <button
        onClick={async () => {
          // 保存题目到数据库
          await fetch('/api/admin/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(question)
          });
        }}
        className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
      >
        保存题目
      </button>
    </div>
  );
}
```

---

## 总结

1. **最简单**: 使用现有的 `CategoryPicker` 组件（方案 1）
2. **最快速**: 使用简单下拉列表（方案 2）
3. **最灵活**: 创建自定义树形结构（方案 3）

推荐从方案 1 开始，如果现有的类别层级不符合需求，再考虑方案 3。

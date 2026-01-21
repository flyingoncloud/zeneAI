# 情绪急救 "返回对话" 按钮修复

## 问题描述
用户报告在 **情绪命名** (EmotionPage) 和 **呼吸训练** (BreathingPage) 页面中，"返回对话" 按钮无法正常工作。

## 根本原因
"返回对话" 按钮位于 `TopBar` 组件中，而不是在各个页面内部。问题的根本原因是：

1. **EmotionalFirstAid** 组件使用了全屏背景层：
   ```tsx
   <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 opacity-100" />
   ```

2. **BreathingPage** 和 **EmotionPage** 使用了 `fixed inset-0 z-50`，这会覆盖整个视口，包括 TopBar 区域

3. 这些全屏层阻挡了 TopBar 的点击事件，导致 "返回对话" 按钮无法被点击

## 解决方案

### 1. EmotionalFirstAid.tsx
为背景层添加 `-z-10` 类，确保它们在内容层之下：
```tsx
<div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 opacity-100 -z-10" />
<div className="absolute inset-0 bg-[url('...')] opacity-20 mix-blend-soft-light pointer-events-none -z-10" />
```

### 2. BreathingPage.tsx
将 `fixed inset-0 z-50` 改为 `absolute inset-0`：
```tsx
// 修改前
<div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-transparent z-50">

// 修改后
<div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-transparent">
```

### 3. EmotionPage.tsx
同样将 `fixed inset-0 z-50` 改为 `absolute inset-0`：
```tsx
// 修改前
<div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-transparent z-50">

// 修改后
<div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-transparent">
```

## 技术说明

### 布局结构
```
page.tsx
├── TopBar (z-10, 独立的 flex 容器)
└── main (flex-1, overflow-hidden)
    └── EmotionalFirstAid (relative, w-full h-full)
        ├── 背景层 (absolute inset-0, -z-10)
        └── 内容层 (relative z-10)
            ├── BreathingPage (absolute inset-0)
            └── EmotionPage (absolute inset-0)
```

### 关键变更
1. **使用 `absolute` 而非 `fixed`**：`fixed` 相对于视口定位，会覆盖整个屏幕；`absolute` 相对于最近的定位祖先元素，不会覆盖 TopBar
2. **移除高 z-index**：不需要 `z-50`，因为组件已经在正确的层级结构中
3. **背景层使用 `-z-10`**：确保背景在内容之下，不会阻挡交互

## 测试步骤
1. 进入 **情绪急救** 模块
2. 在 **呼吸训练** 页面，点击顶部的 "返回对话" 按钮 → 应该能返回聊天界面
3. 进入 **情绪命名** 页面，点击顶部的 "返回对话" 按钮 → 应该能返回聊天界面
4. 确认背景动画和视觉效果没有受到影响

## 相关文件
- `zeneme-next/src/components/features/tools/EmotionalFirstAid.tsx`
- `zeneme-next/src/components/features/tools/firstaid/BreathingPage.tsx`
- `zeneme-next/src/components/features/tools/firstaid/EmotionPage.tsx`
- `zeneme-next/src/components/layout/TopBar.tsx`
- `zeneme-next/src/app/page.tsx`

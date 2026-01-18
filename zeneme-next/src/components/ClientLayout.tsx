// src/components/ClientLayout.tsx
'use client';

import React from 'react';
import { ZenemeProvider } from '@/hooks/useZenemeStore';
import { UpgradeModals } from '@/components/modals/UpgradeModals';
// 修改这里：直接从 sonner 导入 Toaster
import { Toaster } from 'sonner';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ZenemeProvider>
      {children}
      <UpgradeModals />
      {/* 使用 Toaster 组件 */}
      <Toaster position="top-center" theme="dark" />
    </ZenemeProvider>
  );
}
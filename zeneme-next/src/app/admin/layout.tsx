// src/app/admin/layout.tsx
import React from 'react';

export default function AdminSubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 我们放弃使用 Tailwind 的自定义类名，直接使用 style 属性强制渲染
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 9999,
      backgroundColor: '#F7F8FC',
      color: '#111827',
      width: '100%',
      height: '100%',
      overflow: 'scroll',
      WebkitOverflowScrolling: 'touch',
    }}>
      {children}
    </div>
  );
}
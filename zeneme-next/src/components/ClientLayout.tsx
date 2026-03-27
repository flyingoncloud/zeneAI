// src/components/ClientLayout.tsx
'use client';

import React from 'react';
import { ZenemeProvider } from '@/hooks/useZenemeStore';
import { UpgradeModals } from '@/components/modals/UpgradeModals';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ZenemeProvider>
        {children}
        <UpgradeModals />
        <Toaster position="top-center" theme="dark" />
      </ZenemeProvider>
    </GoogleOAuthProvider>
  );
}
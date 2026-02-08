'use client';
import React from 'react';
import { AdminProvider, useAdminStore } from '@/hooks/useAdminStore';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminLogin } from '@/components/admin/AdminLogin';

function AdminContent() {
  const { isLoggedIn } = useAdminStore();

  return isLoggedIn ? <AdminLayout /> : <AdminLogin />;
}

export default function AdminPage() {
  return (
    <AdminProvider>
      <AdminContent />
    </AdminProvider>
  );
}

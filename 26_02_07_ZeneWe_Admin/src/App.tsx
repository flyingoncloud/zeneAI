import React from 'react';
import { AdminProvider, useAdminStore } from './hooks/useAdminStore';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';

const AdminApp: React.FC = () => {
  const { isLoggedIn } = useAdminStore();

  if (!isLoggedIn) {
    return <AdminLogin />;
  }

  return <AdminLayout />;
};

const App: React.FC = () => {
  return (
    <AdminProvider>
      <AdminApp />
    </AdminProvider>
  );
};

export default App;

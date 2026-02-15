import React from 'react';
import { useAdminStore, AdminView } from '@/hooks/useAdminStore';
import {
  ClipboardList, Layers, Image as ImageIcon, Settings,
  LogOut, ChevronLeft, Bell, Search
} from 'lucide-react';
import { QuestionsList } from './QuestionsList';
import { QuestionEditor } from './QuestionEditor';
import { TemplateLibrary } from './TemplateLibrary';
import { MediaLibrary } from './MediaLibrary';
import { AdminSettings } from './AdminSettings';
import { TemplatePicker } from './TemplatePicker';

const NAV_ITEMS: { id: AdminView; label: string; icon: React.ElementType }[] = [
  { id: 'questions', label: '题库管理', icon: ClipboardList },
  { id: 'templates', label: '模板库', icon: Layers },
  { id: 'media', label: '媒体库', icon: ImageIcon },
  { id: 'settings', label: '设置', icon: Settings },
];

export const AdminLayout: React.FC = () => {
  const { currentView, setCurrentView, logout, questions } = useAdminStore();

  const renderPage = () => {
    switch (currentView) {
      case 'questions': return <QuestionsList />;
      case 'editor': return <QuestionEditor />;
      case 'templates': return <TemplateLibrary />;
      case 'media': return <MediaLibrary />;
      case 'settings': return <AdminSettings />;
      default: return <QuestionsList />;
    }
  };

  const getPageTitle = () => {
    switch (currentView) {
      case 'questions': return '题库管理';
      case 'editor': return '编辑题目';
      case 'templates': return '模板库';
      case 'media': return '媒体库';
      case 'settings': return '设置';
      default: return '题库管理';
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F7F8FC] text-[#111827] overflow-hidden">
      {/* Sidebar */}
      <div className="w-[240px] bg-[#12131A] border-r border-white/[0.04] flex flex-col shrink-0">
        {/* Brand */}
        <div className="px-5 py-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 shrink-0">
            <span className="text-white text-sm">Z</span>
          </div>
          <div>
            <p className="text-sm text-[#111827] tracking-wide">ZeneWe</p>
            <p className="text-[10px] text-slate-500">内视快测 Admin</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 space-y-1 mt-2">
          {NAV_ITEMS.map(item => {
            const isActive = currentView === item.id || (item.id === 'questions' && currentView === 'editor');
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full h-10 px-3 rounded-xl flex items-center gap-3 text-sm transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-[rgba(109,40,217,0.08)] text-[#111827] border border-[rgba(109,40,217,0.18)] shadow-[0_1px_3px_rgba(109,40,217,0.06)]'
                    : 'text-[#4B5563] hover:text-[#111827] hover:bg-[#F3F5FA] border border-transparent'
                }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-violet-400 rounded-r-full" />}
                <item.icon size={17} className={isActive ? 'text-violet-400' : ''} />
                <span>{item.label}</span>
                {item.id === 'questions' && (
                  <span className="ml-auto text-[10px] text-slate-600 bg-white/5 px-1.5 py-0.5 rounded-md">{questions.length}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-3 pb-4 space-y-1">
          <div className="h-px bg-white/[0.04] mx-2 mb-2" />
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-white/[0.06] flex items-center justify-center text-xs text-[#6D28D9] shrink-0">A</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-black truncate">Admin</p>
              <p className="text-[10px] text-slate-600 truncate">admin@zeneme.com</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full h-9 px-3 rounded-xl flex items-center gap-3 text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer border border-transparent"
          >
            <LogOut size={16} /> 退出登录
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-14 shrink-0 border-b border-white/[0.04] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {currentView === 'editor' && (
              <button onClick={() => setCurrentView('questions')} className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer">
                <ChevronLeft size={18} />
              </button>
            )}
            <span className="text-sm text-slate-400">{getPageTitle()}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                placeholder="全局搜索…"
                className="w-48 h-8 pl-8 pr-3 bg-white/[0.03] border border-white/[0.04] rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/30 transition-colors"
              />
            </div>
            <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors cursor-pointer relative">
              <Bell size={16} />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400" />
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          {renderPage()}
        </div>
      </div>

      {/* Template Picker Modal */}
      <TemplatePicker />
    </div>
  );
};

import React, { useState } from 'react';
import { useAdminStore } from '@/hooks/useAdminStore';
import { Users, Shield, Clock, FileText, ChevronRight, Mail, Edit3, Trash2 } from 'lucide-react';

const MOCK_USERS = [
  { id: '1', name: 'Admin', email: 'admin@zeneme.com', role: 'Super Admin', avatar: 'A', lastActive: '2026-02-06 09:30' },
  { id: '2', name: 'Editor', email: 'editor@zeneme.com', role: 'Editor', avatar: 'E', lastActive: '2026-02-05 16:00' },
  { id: '3', name: 'Viewer', email: 'viewer@zeneme.com', role: 'Viewer', avatar: 'V', lastActive: '2026-02-04 11:20' },
];

const ROLES = [
  { name: 'Super Admin', desc: '完全权限：题库 CRUD、发布、用户管理、设置', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  { name: 'Editor', desc: '编辑权限：题库 CRUD、保存草稿（无法发布）', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { name: 'Viewer', desc: '只读权限：查看题库和报告', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
];

export const AdminSettings: React.FC = () => {
  const { publishLogs } = useAdminStore();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'logs'>('users');

  const tabs = [
    { id: 'users' as const, label: '用户管理', icon: Users },
    { id: 'roles' as const, label: '角色权限', icon: Shield },
    { id: 'logs' as const, label: '发布日志', icon: Clock },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-xl text-white mb-1">设置</h1>
        <p className="text-xs text-slate-500">用户管理、角色权限与发布日志</p>
      </div>

      {/* Tabs */}
      <div className="shrink-0 px-6">
        <div className="flex items-center gap-1 bg-[#13141A] p-1 rounded-xl border border-white/[0.04] w-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-8 px-4 rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer ${activeTab === tab.id ? 'bg-violet-500/15 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">{MOCK_USERS.length} 用户</span>
              <button className="h-8 px-3 rounded-lg bg-white/5 border border-white/[0.06] text-xs text-slate-300 hover:bg-white/10 flex items-center gap-1.5 transition-colors cursor-pointer">
                <Mail size={12} /> 邀请用户
              </button>
            </div>
            {MOCK_USERS.map(user => (
              <div key={user.id} className="flex items-center gap-4 p-4 bg-[#13141A] border border-white/[0.06] rounded-xl group hover:border-white/[0.1] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/10 border border-white/[0.06] flex items-center justify-center text-sm text-white shrink-0">
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm text-white">{user.name}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] border ${user.role === 'Super Admin' ? 'text-violet-400 bg-violet-500/10 border-violet-500/20' : user.role === 'Editor' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-slate-400 bg-slate-500/10 border-slate-500/20'}`}>
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{user.email}</p>
                </div>
                <span className="text-[11px] text-slate-600">{user.lastActive}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-500 hover:text-violet-400 cursor-pointer"><Edit3 size={13} /></button>
                  <button className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-slate-500 hover:text-red-400 cursor-pointer"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-3">
            {ROLES.map(role => (
              <div key={role.name} className={`p-5 bg-[#13141A] border border-white/[0.06] rounded-xl`}>
                <div className="flex items-center gap-3 mb-2">
                  <Shield size={16} className="text-violet-400/60" />
                  <span className={`px-2 py-0.5 rounded-md text-xs border ${role.color}`}>{role.name}</span>
                </div>
                <p className="text-xs text-slate-400 ml-7">{role.desc}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-1">
            <div className="grid grid-cols-[80px_1fr_100px_140px] gap-3 px-4 py-2 text-[11px] text-slate-500 uppercase tracking-wider border-b border-white/[0.04]">
              <div>题号</div>
              <div>操作</div>
              <div>用户</div>
              <div>时间</div>
            </div>
            {publishLogs.map(log => (
              <div key={log.id} className="grid grid-cols-[80px_1fr_100px_140px] gap-3 px-4 py-3 items-center hover:bg-white/[0.02] rounded-lg transition-colors">
                <span className="text-sm text-white">Q{log.questionId}</span>
                <span className={`text-xs ${log.action === 'Published' ? 'text-emerald-400' : 'text-blue-400'}`}>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 ${log.action === 'Published' ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                  {log.action}
                </span>
                <span className="text-xs text-slate-400">{log.user}</span>
                <span className="text-xs text-slate-500">{log.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

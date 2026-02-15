import React, { useState } from 'react';
import { useAdminStore } from '@/hooks/useAdminStore';
import { Users, Shield, Clock, Mail, Edit3, Trash2 } from 'lucide-react';

const MOCK_USERS = [
  { id: '1', name: 'Admin', email: 'admin@zeneme.com', role: 'Super Admin', avatar: 'A', lastActive: '2026-02-06 09:30' },
  { id: '2', name: 'Editor', email: 'editor@zeneme.com', role: 'Editor', avatar: 'E', lastActive: '2026-02-05 16:00' },
  { id: '3', name: 'Viewer', email: 'viewer@zeneme.com', role: 'Viewer', avatar: 'V', lastActive: '2026-02-04 11:20' },
];

const ROLES = [
  { name: 'Super Admin', desc: '完全权限：题库 CRUD、发布、用户管理、设置', color: 'text-violet-700 bg-violet-50 border-violet-200' },
  { name: 'Editor', desc: '编辑权限：题库 CRUD、保存草稿（无法发布）', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { name: 'Viewer', desc: '只读权限：查看题库和报告', color: 'text-gray-600 bg-gray-50 border-gray-200' },
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
    <div className="h-full flex flex-col overflow-hidden bg-[#F7F8FC]">
      {/* 头部：文字颜色加深 */}
      <div className="shrink-0 px-6 pt-6 pb-4">
        <h1 className="text-xl text-[#111827] font-semibold mb-1">设置</h1>
        <p className="text-xs text-[#64748B]">用户管理、角色权限与发布日志</p>
      </div>

      {/* Tabs：切换为浅色背景容器 */}
      <div className="shrink-0 px-6">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E6EAF2] w-fit shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`h-8 px-4 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === tab.id 
                ? 'bg-violet-600 text-white shadow-md shadow-violet-200' 
                : 'text-[#64748B] hover:text-[#111827] hover:bg-gray-50'
              }`}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-medium text-[#64748B]">{MOCK_USERS.length} 用户</span>
              <button className="h-8 px-3 rounded-lg bg-white border border-[#E6EAF2] text-xs font-semibold text-[#111827] hover:bg-gray-50 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer">
                <Mail size={12} /> 邀请用户
              </button>
            </div>
            {MOCK_USERS.map(user => (
              <div key={user.id} className="flex items-center gap-4 p-4 bg-white border border-[#E6EAF2] rounded-xl group hover:border-violet-300 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-sm font-bold text-violet-600 shrink-0">
                  {user.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-[#111827]">{user.name}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      user.role === 'Super Admin' ? 'text-violet-700 bg-violet-50 border-violet-200' 
                      : user.role === 'Editor' ? 'text-blue-700 bg-blue-50 border-blue-200' 
                      : 'text-gray-600 bg-gray-50 border-gray-200'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B]">{user.email}</p>
                </div>
                <span className="text-[11px] font-medium text-[#94A3B8]">{user.lastActive}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-8 h-8 rounded-lg hover:bg-violet-50 flex items-center justify-center text-[#64748B] hover:text-violet-600 transition-colors cursor-pointer"><Edit3 size={13} /></button>
                  <button className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-[#64748B] hover:text-red-600 transition-colors cursor-pointer"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'roles' && (
          <div className="space-y-3">
            {ROLES.map(role => (
              <div key={role.name} className="p-5 bg-white border border-[#E6EAF2] rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <Shield size={16} className="text-violet-600" />
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${role.color}`}>{role.name}</span>
                </div>
                <p className="text-xs text-[#64748B] ml-7 font-medium leading-relaxed">{role.desc}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white border border-[#E6EAF2] rounded-xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-[80px_1fr_100px_140px] gap-3 px-5 py-3 text-[11px] font-bold text-[#64748B] uppercase tracking-wider border-b border-[#E6EAF2] bg-gray-50">
              <div>题号</div>
              <div>操作</div>
              <div>用户</div>
              <div>时间</div>
            </div>
            <div className="divide-y divide-[#E6EAF2]">
              {publishLogs.map(log => (
                <div key={log.id} className="grid grid-cols-[80px_1fr_100px_140px] gap-3 px-5 py-3.5 items-center hover:bg-[#F9FBFF] transition-colors cursor-pointer">
                  <span className="text-sm font-bold text-[#111827]">Q{log.questionId}</span>
                  <span className={`text-xs font-bold flex items-center ${log.action === 'Published' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${log.action === 'Published' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                    {log.action}
                  </span>
                  <span className="text-xs font-medium text-[#4B5563]">{log.user}</span>
                  <span className="text-xs font-medium text-[#94A3B8]">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
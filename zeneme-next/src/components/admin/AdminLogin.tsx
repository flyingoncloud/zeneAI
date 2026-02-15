import React, { useState } from 'react';
import { useAdminStore } from '@/hooks/useAdminStore';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { login } = useAdminStore();
  const [email, setEmail] = useState('admin@zeneme.com');
  const [password, setPassword] = useState('admin123');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const ok = login(email, password);
      if (!ok) setError('邮箱或密码错误');
      setLoading(false);
    }, 600);
  };

  return (
    // 1. 将背景改为浅灰色 [#F7F8FC] 以匹配设计师原稿
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F8FC] relative overflow-hidden">
      {/* 调整氛围光亮度，使其在浅色背景下自然 */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-[420px] mx-4">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <span className="text-white text-lg font-bold">Z</span>
            </div>
            {/* 2. 将品牌文字改为深色 [#111827] */}
            <span className="text-xl text-[#111827] font-semibold tracking-wide">ZeneWe</span>
          </div>
          <h1 className="text-2xl text-[#111827] font-bold mb-1">内视快测 Admin</h1>
          <p className="text-[#64748B] text-sm">题库管理后台</p>
        </div>

        {/* Card - 改为纯白背景并添加细微边框 */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#E2E8F0] rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs text-[#64748B] font-semibold mb-2 uppercase tracking-wider">邮箱</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  // 3. 将输入框文字改为深色，背景改为极浅灰
                  className="w-full h-11 pl-10 pr-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#111827] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all"
                  placeholder="admin@zeneme.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-[#64748B] font-semibold mb-2 uppercase tracking-wider">密码</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#111827] text-sm placeholder:text-[#94A3B8] focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569] transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>登录 <ArrowRight size={16} /></>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-[#94A3B8] mt-6 font-medium">Demo: 任意邮箱 + 密码即可登录</p>
        </form>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { useAdminStore } from '../../hooks/useAdminStore';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const { login } = useAdminStore();
  const [email, setEmail] = useState('admin@zenewe.ai');
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F7F8FC] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[rgba(109,40,217,0.06)] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-[rgba(99,102,241,0.05)] rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-[420px] mx-4">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6D28D9] to-indigo-600 flex items-center justify-center shadow-lg shadow-[rgba(109,40,217,0.2)]">
              <span className="text-white text-lg">Z</span>
            </div>
            <span className="text-xl text-[#111827] tracking-wide">ZeneWe</span>
          </div>
          <h1 className="text-2xl text-[#111827] mb-1">内视快测 Admin</h1>
          <p className="text-[#6B7280] text-sm">题库管理后台</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#E6EAF2] rounded-2xl p-8 shadow-[0_8px_24px_rgba(17,24,39,0.08),0_1px_2px_rgba(17,24,39,0.06)]">
          <div className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs text-[#6B7280] mb-2 uppercase tracking-wider">邮箱</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-[#F3F5FA] border border-[#E6EAF2] rounded-xl text-[#111827] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all"
                  placeholder="admin@zenewe.ai"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-[#6B7280] mb-2 uppercase tracking-wider">密码</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 bg-[#F3F5FA] border border-[#E6EAF2] rounded-xl text-[#111827] text-sm placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#6D28D9] focus:shadow-[0_0_0_3px_rgba(109,40,217,0.25)] transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#4B5563] transition-colors cursor-pointer">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-[#EF4444] text-xs">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#6D28D9] to-indigo-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:from-[#5B21B6] hover:to-indigo-700 disabled:opacity-0 transition-all shadow-lg shadow-[rgba(109,40,217,0.15)] cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>登录 <ArrowRight size={16} /></>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-[#9CA3AF] mt-5">Demo: 任意邮箱 + 密码即可登录</p>
        </form>
      </div>
    </div>
  );
};

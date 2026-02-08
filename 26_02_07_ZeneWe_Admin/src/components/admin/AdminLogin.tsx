import React, { useState } from 'react';
import { useAdminStore } from '../../hooks/useAdminStore';
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0F1115] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-[420px] mx-4">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-white text-lg">Z</span>
            </div>
            <span className="text-xl text-white tracking-wide">ZeneWe</span>
          </div>
          <h1 className="text-2xl text-white mb-1">内视快测 Admin</h1>
          <p className="text-slate-500 text-sm">题库管理后台</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="bg-[#1A1B23] border border-white/[0.06] rounded-2xl p-8 shadow-2xl">
          <div className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">邮箱</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-[#13141A] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  placeholder="admin@zeneme.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">密码</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-10 bg-[#13141A] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit" disabled={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-violet-600/20 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>登录 <ArrowRight size={16} /></>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-slate-600 mt-5">Demo: 任意邮箱 + 密码即可登录</p>
        </form>
      </div>
    </div>
  );
};

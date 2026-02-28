import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useZenemeStore } from '@/hooks/useZenemeStore';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  sendPhoneVerificationCode,
  loginWithPhone,
  registerWithPhone,
  loginWithPhonePassword,
  registerWithEmail,
  sendEmailVerificationCode,
  loginWithEmail,
  loginWithSocial,
} from '@/lib/api';

interface AuthPageProps {
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const { login } = useAuthStore();
  const { setSessionId } = useZenemeStore();

  const [view, setView] = useState<'login' | 'register'>('login');
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [isLoading, setIsLoading] = useState(false);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(p => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (method === 'phone') {
      if (!phone) {
        toast.error('请输入手机号');
        return;
      }

      try {
        setIsLoading(true);
        const result = await sendPhoneVerificationCode({
          phone,
          country_code: '+61'
        });

        if (result.success) {
          setCountdown(result.expires_in);
          setCodeSent(true);
          toast.success('验证码已发送');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '发送验证码失败');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Email verification
      if (!email) {
        toast.error('请输入邮箱地址');
        return;
      }

      try {
        setIsLoading(true);
        const result = await sendEmailVerificationCode({ email });

        if (result.success) {
          setCountdown(60); // 60 seconds
          setCodeSent(true);
          toast.success('验证码已发送到您的邮箱');
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '发送验证码失败');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (method === 'phone') {
        // Phone login/register
        if (!phone) {
          toast.error('请输入手机号');
          return;
        }

        if (view === 'register') {
          // Phone Registration: requires code, password, and optional username
          if (!code) {
            toast.error('请输入验证码');
            return;
          }
          if (!password || password.length < 6) {
            toast.error('密码至少需要6位');
            return;
          }

          const result = await registerWithPhone({
            phone,
            country_code: '+61',
            code,
            password,
            username: username || undefined
          });

          if (result.success && result.user) {
            login(result.user);
            // Create a global session_id for this user's entire journey
            const globalSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            setSessionId(globalSessionId);
            console.log('[AuthPage] Created global session_id for user:', globalSessionId);
            toast.success('注册成功！');
          }
        } else {
          // Phone Login: use password (no code needed)
          if (!password) {
            toast.error('请输入密码');
            return;
          }

          const result = await loginWithPhonePassword({
            phone,
            country_code: '+61',
            password
          });

          if (result.success && result.user) {
            login(result.user);
            // Create a global session_id for this user's entire journey
            const globalSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            setSessionId(globalSessionId);
            console.log('[AuthPage] Created global session_id for user:', globalSessionId);
            toast.success('登录成功！');
          }
        }
      } else {
        // Email login/register
        if (!email || !password) {
          toast.error('请输入邮箱和密码');
          return;
        }

        if (view === 'register') {
          // Registration requires username and verification code
          if (!username) {
            toast.error('请输入用户名');
            return;
          }
          if (!emailCode) {
            toast.error('请输入验证码');
            return;
          }

          const result = await registerWithEmail({ email, password, username, code: emailCode });

          if (result.success && result.user) {
            login(result.user);
            // Create a global session_id for this user's entire journey
            const globalSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            setSessionId(globalSessionId);
            console.log('[AuthPage] Created global session_id for user:', globalSessionId);
            toast.success('注册成功！');
          }
        } else {
          // Login doesn't need username or code
          const result = await loginWithEmail({ email, password });

          if (result.success && result.user) {
            login(result.user);
            // Create a global session_id for this user's entire journey
            const globalSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            setSessionId(globalSessionId);
            console.log('[AuthPage] Created global session_id for user:', globalSessionId);
            toast.success('登录成功！');
          }
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'wechat') => {
    try {
      setIsLoading(true);

      // For demo purposes, generate a mock token
      // In production, this would come from OAuth flow
      const mockToken = `${provider}_token_${Date.now()}`;

      const result = await loginWithSocial({
        provider,
        token: mockToken,
        user_info: {
          name: `${provider === 'google' ? 'Google' : '微信'} User`,
          email: `${provider}user@example.com`
        }
      });

      if (result.success && result.user) {
        login(result.user);
        toast.success('登录成功！');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative z-20 px-6 bg-gradient-to-b from-purple-700 via-purple-600 to-pink-500">

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-2">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full text-white hover:text-white hover:bg-white/10">
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold text-white">ZeneWe</h1>
          <div className="w-10" />
        </div>

        {/* Main Card */}
        <div className="bg-purple-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden relative">

          <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-wide">
            {view === 'login' ? '登录 ZeneWe' : '创建账号'}
          </h2>

          {/* Social Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              variant="outline"
              onClick={() => handleSocialLogin('wechat')}
              className="w-full h-11 rounded-xl border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              微信一键登录
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSocialLogin('google')}
              className="w-full h-11 rounded-xl border-white/20 bg-white/10 hover:bg-white/20 text-white transition-all"
            >
              Continue with Google
            </Button>
          </div>

          <div className="relative flex items-center py-4 mb-4">
            <div className="flex-grow border-t border-white/20"></div>
            <span className="flex-shrink-0 mx-4 text-white/60 text-xs uppercase">OR</span>
            <div className="flex-grow border-t border-white/20"></div>
          </div>

          {/* Method Tabs */}
          <div className="flex p-1 bg-purple-900/30 rounded-xl mb-6 border border-white/10">
            <button
              onClick={() => setMethod('phone')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${method === 'phone' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              {view === 'login' ? '手机登录' : '手机注册'}
            </button>
            <button
              onClick={() => setMethod('email')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${method === 'email' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
            >
              {view === 'login' ? '邮箱登录' : '邮箱注册'}
            </button>
          </div>

          {/* Forms */}
          <div className="space-y-4">
            {method === 'phone' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 pl-1">手机号</label>
                  <div className="flex gap-2">
                    <div className="w-20 h-11 flex items-center justify-center rounded-xl bg-purple-900/30 border border-white/20 text-white text-sm">
                      +61
                    </div>
                    <input
                      type="tel"
                      className="flex-1 h-11 rounded-xl bg-purple-900/30 border border-white/20 px-4 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder:text-white/40"
                      placeholder="输入手机号"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                {view === 'register' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/80 pl-1">用户名</label>
                      <input
                        type="text"
                        className="w-full h-11 rounded-xl bg-purple-900/30 border border-white/20 px-4 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder:text-white/40"
                        placeholder="请输入用户名"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-white/80 pl-1">验证码</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 h-11 rounded-xl bg-purple-900/30 border border-white/20 px-4 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder:text-white/40"
                          placeholder="6位数字"
                          value={code}
                          onChange={e => setCode(e.target.value)}
                        />
                        <Button
                          onClick={handleSendCode}
                          disabled={countdown > 0}
                          className="w-28 h-11 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white text-xs"
                        >
                          {countdown > 0 ? `${countdown}s` : (codeSent ? '重新发送' : '获取验证码')}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-white/80 pl-1">设置密码</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="w-full h-11 rounded-xl bg-purple-900/30 border border-white/20 px-4 pr-12 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder:text-white/40"
                          placeholder="请设置登录密码（至少6位）"
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {view === 'login' && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-white/80 pl-1">密码</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="w-full h-11 rounded-xl bg-purple-900/30 border border-white/20 px-4 pr-12 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder:text-white/40"
                        placeholder="请输入密码"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 pl-1">邮箱地址</label>
                  <input
                    type="email"
                    className="w-full h-11 rounded-xl bg-purple-900/30 border border-white/20 px-4 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder:text-white/40"
                    placeholder="name@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>

                {view === 'register' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs text-white/80 pl-1">用户名</label>
                      <input
                        type="text"
                        className="w-full h-11 rounded-xl bg-purple-900/30 border border-white/20 px-4 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder:text-white/40"
                        placeholder="请输入用户名"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-white/80 pl-1">邮箱验证码</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 h-11 rounded-xl bg-purple-900/30 border border-white/20 px-4 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder:text-white/40"
                          placeholder="请输入验证码"
                          value={emailCode}
                          onChange={e => setEmailCode(e.target.value)}
                          maxLength={6}
                        />
                        <Button
                          onClick={handleSendCode}
                          disabled={countdown > 0 || !email}
                          className="w-28 h-11 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white text-xs"
                        >
                          {countdown > 0 ? `${countdown}s` : (codeSent ? '重新发送' : '获取验证码')}
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 pl-1">密码</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full h-11 rounded-xl bg-purple-900/30 border border-white/20 px-4 pr-12 text-white text-sm focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/40 transition-all placeholder:text-white/40"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete={view === 'register' ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full h-12 mt-4 text-base rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] border border-white/10 transition-all"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {view === 'login' ? '登录' : '注册并开始'}
            </Button>
          </div>
        </div>

        {/* Footer Toggle */}
        <div className="mt-6 text-center relative z-20">
          <p className="text-sm font-medium text-white drop-shadow-sm">
            {view === 'login' ? '还没有账号? ' : '已有账号? '}
            <button
              onClick={() => setView(view === 'login' ? 'register' : 'login')}
              className="ml-1 text-white font-semibold underline decoration-2 underline-offset-4 hover:text-white/80 transition-colors"
            >
              {view === 'login' ? '去注册' : '去登录'}
            </button>
          </p>
        </div>

      </motion.div>
    </div>
  );
};

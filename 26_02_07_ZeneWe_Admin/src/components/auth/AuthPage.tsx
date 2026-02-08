import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import Logo from '../../imports/Logo';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useZenemeStore } from '../../hooks/useZenemeStore';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';

// Standard Brand Icons
const GoogleIcon = (props: any) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.12c-.22-.66-.35-1.36-.35-2.12s.13-1.46.35-2.12V7.04H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.96l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.04l3.66 2.84c.87-2.6 3.3-4.5 6.16-4.5z" fill="#EA4335" />
  </svg>
);

const WeChatLogo = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" {...props}>
    <path fill="#07C160" d="M8.7 17.6c-4.1 0-7.5-3-7.5-6.8s3.4-6.8 7.5-6.8c4.1 0 7.5 3 7.5 6.8s-3.4 6.8-7.5 6.8zm-2.5-7.8c-.5 0-1 .5-1 1s.5 1 1 1 1-.5 1-1-.5-1-1-1zm5 0c-.5 0-1 .5-1 1s.5 1 1 1 1-.5 1-1-.5-1-1-1z"/>
    <path fill="#07C160" d="M16.9 11.7c-3.6 0-6.5 2.6-6.5 5.9s2.9 5.9 6.5 5.9c.4 0 .7 0 1.1-.1l2.2 1.2v-2.1c1.5-1 2.5-2.5 2.5-4.1 0-3.3-2.6-5.9-5.8-5.9zm0 2.3c.5 0 .8.4.8.8s-.4.8-.8.8-.8-.4-.8-.8.4-.8.8-.8zm4 0c.5 0 .8.4.8.8s-.4.8-.8.8-.8-.4-.8-.8.4-.8.8-.8z"/>
  </svg>
);

const AppleLogo = (props: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.1 1.01 1.45 2.21 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.16-1.69 1.64-3.33 1.66-3.42-.04-.01-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.62-2.32-4.39-2.38-2-.15-3.68 1.09-4.61 1.09zM15.53 3.83c.84-1.01 1.4-2.43 1.25-3.83-1.21.05-2.66.8-3.53 1.82-.78.9-1.45 2.34-1.27 3.71 1.34.1 2.72-.69 3.56-1.7z"/>
  </svg>
);

// Helper for Social Buttons
const SocialButton = ({ icon: Icon, label, onClick }: any) => (
  <Button
    variant="outline"
    onClick={onClick}
    className="w-full h-11 relative flex items-center justify-center gap-3 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 transition-all font-medium"
  >
    <div className="absolute left-4 flex items-center justify-center w-5 h-5">
       <Icon className="w-full h-full" />
    </div>
    <span>{label}</span>
  </Button>
);

// Mock Terms Content since it wasn't in the store
const TERMS_CONTENT = {
  title: '用户协议',
  subtitle: 'ZeneWe 服务使用条款',
  sections: [
    {
      title: '1. 服务说明',
      content: '欢迎使用 ZeneWe。本协议是您与 ZeneWe 之间关于您使用本服务所订立的协议。使用本服务即表示您同意受本协议约束。'
    },
    {
      title: '2. 账户安全',
      content: '您需对您的账户安全负责。请妥善保管您的登录凭证，不要将账户提供给他人使用。如发现账户异常，请立即通知我们。'
    },
    {
      title: '3. 用户行为规范',
      content: '在使用 ZeneWe 时，您不得利用本服务从事违法违规行为，不得侵犯他人合法权益，不得发送垃圾信息或恶意内容。'
    },
    {
      title: '4. 知识产权',
      content: 'ZeneWe 的所有内容（包括但不限于文字、图片、音频、视频、软件等）均受知识产权法保护。未经授权，不得擅自使用。'
    },
    {
      title: '5. 免责声明',
      content: 'ZeneWe 提供的情绪支持和建议仅供参考，不构成专业医疗建议。如有严重心理困扰或危机情况，请寻求专业医生或机构的帮助。'
    },
    {
        title: '6. 协议修改',
        content: '我们需要时可能会修改本协议。修订后的条款一经公布即生效。继续使用服务即表示您接受修订后的协议。'
    }
  ]
};

// Generic Modal Component for Policy/Terms
const PolicyModal: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  sections: { title: string; content: string }[];
}> = ({ open, onOpenChange, title, subtitle, sections }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#1a1d2e] border-white/10 text-slate-200 shadow-2xl p-0 gap-0 overflow-hidden rounded-xl">
        <div className="p-6 pb-4 bg-[#1a1d2e] border-b border-white/5 relative z-10">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium tracking-tight text-white">{title}</DialogTitle>
            <DialogDescription className="text-slate-400 text-sm mt-1">{subtitle}</DialogDescription>
          </DialogHeader>
        </div>
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#161825] p-6 space-y-8 animate-in fade-in-50 duration-300">
          {sections.map((section, index) => (
            <div key={index} className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                {section.title}
              </h3>
              <div className="text-sm leading-relaxed text-slate-400 space-y-2">
                <p className="whitespace-pre-wrap">{section.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-6 pt-4 bg-[#1a1d2e] border-t border-white/5 flex justify-end gap-3 z-10">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-slate-200 hover:bg-white/5 min-w-[80px]">关闭</Button>
          <Button onClick={() => onOpenChange(false)} className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[100px]">我已阅读</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface AuthPageProps {
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onBack }) => {
  const { login } = useAuthStore();
  const { t } = useZenemeStore(); // For Privacy Content
  
  const [view, setView] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [isLoading, setIsLoading] = useState(false);

  // Login/Register Form States
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [shakeAgreement, setShakeAgreement] = useState(false);

  // Forgot Password States
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCountdown, setResetCountdown] = useState(0);

  // Policy Modals
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  // Timer for login/register code
  const [countdown, setCountdown] = useState(0);

  // Timer logic
  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(p => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    let timer: any;
    if (resetCountdown > 0) {
      timer = setInterval(() => setResetCountdown(p => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resetCountdown]);

  const handleSendCode = () => {
    if (!phone) return toast.error('请输入手机号');
    toast.success('验证码已发送: 123456');
    setCountdown(60);
  };

  const handleSendResetCode = () => {
    if (!resetEmail) return toast.error('请输入邮箱地址');
    if (!resetEmail.includes('@')) return toast.error('邮箱格式不正确');
    toast.success('验证码已发送: 123456');
    setResetCountdown(60);
  };

  const handleSubmit = async () => {
    // Check Agreement for Register
    if (view === 'register' && !agreed) {
        setShakeAgreement(true);
        setTimeout(() => setShakeAgreement(false), 500);
        return toast.error('请先同意隐私政策和用户协议');
    }

    setIsLoading(true);
    // Mock API Call
    setTimeout(() => {
      setIsLoading(false);
      // Determine User Data based on input
      const userData = {
        id: 'user-' + Date.now(),
        name: method === 'email' ? email.split('@')[0] : `User ${phone.slice(-4)}`,
        email: method === 'email' ? email : undefined,
        phone: method === 'phone' ? phone : undefined,
        avatar: 'https://github.com/shadcn.png',
        isPro: false
      };
      
      login(userData);
      toast.success(view === 'login' ? '欢迎回来' : '注册成功');
    }, 1500);
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !resetCode || !newPassword || !confirmPassword) {
        return toast.error('请填写所有字段');
    }
    if (newPassword !== confirmPassword) {
        return toast.error('两次输入的密码不一致');
    }
    
    setIsLoading(true);
    setTimeout(() => {
        setIsLoading(false);
        toast.success('密码已更新');
        setView('login');
        // Reset fields
        setResetEmail('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
    }, 1500);
  };

  const handleSocialLogin = (provider: string) => {
    // Agreement check for social login? Usually implied or specific flow. 
    // Assuming implied or separate step for simplicity in this mock.
    toast.loading(`正在连接 ${provider}...`);
    setTimeout(() => {
        toast.dismiss();
        login({
            id: 'social-user',
            name: `${provider} User`,
            avatar: 'https://github.com/shadcn.png',
            isPro: false
        });
        toast.success('登录成功');
    }, 1000);
  };

  // Render Forgot Password View
  if (view === 'forgot-password') {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full relative z-20 px-6">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-20"
            >
                {/* Header with Back to Login (keeping tab state conceptually, but here we just go back to login) */}
                <div className="flex items-center mb-8 px-2">
                    <Button variant="ghost" size="icon" onClick={() => setView('login')} className="rounded-full text-slate-400 hover:text-white mr-4">
                        <ArrowLeft size={24} />
                    </Button>
                    <div className="h-6 w-24">
                        <Logo />
                    </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden relative">
                    <h2 className="text-2xl font-bold text-white mb-2 text-center tracking-wide">找回密码</h2>
                    <p className="text-slate-400 text-sm text-center mb-6">请输入您的邮箱以重置密码</p>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 pl-1">邮箱地址</label>
                            <input 
                                type="email" 
                                className="w-full h-11 rounded-xl bg-slate-950/30 border border-white/10 px-4 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-slate-600"
                                placeholder="name@example.com"
                                value={resetEmail}
                                onChange={e => setResetEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 pl-1">验证码</label>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    className="flex-1 h-11 rounded-xl bg-slate-950/30 border border-white/10 px-4 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-slate-600"
                                    placeholder="6位数字"
                                    value={resetCode}
                                    onChange={e => setResetCode(e.target.value)}
                                />
                                <Button 
                                    onClick={handleSendResetCode}
                                    disabled={resetCountdown > 0 || !resetEmail}
                                    className="w-28 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-normal"
                                >
                                    {resetCountdown > 0 ? `${resetCountdown}s` : '发送验证码'}
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 pl-1">新密码</label>
                            <input 
                                type="password" 
                                className="w-full h-11 rounded-xl bg-slate-950/30 border border-white/10 px-4 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-slate-600"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs text-slate-400 pl-1">确认新密码</label>
                            <input 
                                type="password" 
                                className="w-full h-11 rounded-xl bg-slate-950/30 border border-white/10 px-4 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-slate-600"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        <Button 
                            onClick={handleResetPassword}
                            disabled={isLoading}
                            className="w-full h-12 mt-4 text-base rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)] border border-white/10 transition-all"
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            重置密码
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
  }

  // Render Login/Register View
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full relative z-20 px-6">
      
      {/* Bottom Gradient Overlay for Footer Readability */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none z-10" />

      {/* Modals */}
      <PolicyModal 
        open={showPrivacy} 
        onOpenChange={setShowPrivacy}
        title={t.privacy.title}
        subtitle={t.privacy.subtitle}
        sections={t.privacy.sections}
      />
      <PolicyModal 
        open={showTerms} 
        onOpenChange={setShowTerms}
        title={TERMS_CONTENT.title}
        subtitle={TERMS_CONTENT.subtitle}
        sections={TERMS_CONTENT.sections}
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8 px-2">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full text-slate-400 hover:text-white">
                <ArrowLeft size={24} />
            </Button>
            <div className="h-6 w-24">
                <Logo />
            </div>
            <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden relative">
           
           <h2 className="text-2xl font-bold text-white mb-6 text-center tracking-wide">
             {view === 'login' ? '登录 ZeneWe' : '创建账号'}
           </h2>

           {/* Socials */}
           <div className="space-y-3 mb-6">
              <SocialButton icon={WeChatLogo} label="微信一键登录" onClick={() => handleSocialLogin('WeChat')} />
              <SocialButton icon={GoogleIcon} label="Continue with Google" onClick={() => handleSocialLogin('Google')} />
              <SocialButton icon={AppleLogo} label="Continue with Apple" onClick={() => handleSocialLogin('Apple')} />
           </div>

           <div className="relative flex items-center py-4 mb-4">
             <div className="flex-grow border-t border-white/10"></div>
             <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase">OR</span>
             <div className="flex-grow border-t border-white/10"></div>
           </div>

           {/* Method Tabs */}
           <div className="flex p-1 bg-slate-900/50 rounded-xl mb-6 border border-white/5">
              <button 
                onClick={() => setMethod('phone')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${method === 'phone' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                手机登录
              </button>
              <button 
                onClick={() => setMethod('email')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${method === 'email' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                邮箱登录
              </button>
           </div>

           {/* Forms */}
           <div className="space-y-4">
              {method === 'phone' ? (
                  <>
                    <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 pl-1">手机号</label>
                        <div className="flex gap-2">
                             <div className="w-20 h-11 flex items-center justify-center rounded-xl bg-slate-950/30 border border-white/10 text-slate-300 text-sm">
                                +61
                             </div>
                             <input 
                                type="tel" 
                                className="flex-1 h-11 rounded-xl bg-slate-950/30 border border-white/10 px-4 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-slate-600"
                                placeholder="输入手机号"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                             />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 pl-1">验证码</label>
                        <div className="flex gap-2">
                             <input 
                                type="text" 
                                className="flex-1 h-11 rounded-xl bg-slate-950/30 border border-white/10 px-4 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-slate-600"
                                placeholder="6位数字"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                             />
                             <Button 
                                onClick={handleSendCode}
                                disabled={countdown > 0}
                                className="w-28 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-normal"
                             >
                                {countdown > 0 ? `${countdown}s` : '获取验证码'}
                             </Button>
                        </div>
                    </div>
                  </>
              ) : (
                  <>
                    <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 pl-1">邮箱地址</label>
                        <input 
                            type="email" 
                            className="w-full h-11 rounded-xl bg-slate-950/30 border border-white/10 px-4 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-slate-600"
                            placeholder="name@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs text-slate-400 pl-1">密码</label>
                        <input 
                            type="password" 
                            className="w-full h-11 rounded-xl bg-slate-950/30 border border-white/10 px-4 text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-slate-600"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                         {view === 'login' && (
                            <div className="flex justify-end">
                                <button 
                                    onClick={() => setView('forgot-password')}
                                    className="text-xs text-violet-400 hover:text-violet-300"
                                >
                                    忘记密码?
                                </button>
                            </div>
                         )}
                    </div>
                  </>
              )}

              {/* Terms Checkbox for Register */}
              {view === 'register' && (
                 <motion.div 
                    animate={shakeAgreement ? { x: [-5, 5, -5, 5, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    onClick={() => setAgreed(!agreed)}
                    className="flex items-start gap-3 pt-2 cursor-pointer group"
                 >
                    <div 
                        className={`flex-shrink-0 w-4 h-4 mt-[1px] rounded border flex items-center justify-center transition-colors ${agreed ? 'bg-violet-600 border-violet-600' : 'bg-white/5 border-white/20 group-hover:border-violet-500'}`}
                    >
                        {agreed && <Check size={10} className="text-white" />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight select-none pt-[2px]">
                        我已阅读并同意 <span onClick={(e) => { e.stopPropagation(); setShowPrivacy(true); }} className="text-slate-300 cursor-pointer hover:underline hover:text-white transition-colors">隐私政策</span> 和 <span onClick={(e) => { e.stopPropagation(); setShowTerms(true); }} className="text-slate-300 cursor-pointer hover:underline hover:text-white transition-colors">用户协议</span>
                    </p>
                 </motion.div>
              )}

              <Button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full h-12 mt-4 text-base rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)] border border-white/10 transition-all"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {view === 'login' ? '登录' : '注册并开始'}
              </Button>
           </div>
        </div>

        {/* Footer Toggle - High Contrast & Readability Enhanced */}
        <div className="mt-6 text-center relative z-20">
            <p className="text-sm font-medium text-slate-100 drop-shadow-sm">
                {view === 'login' ? '还没有账号? ' : '已有账号? '}
                <button 
                    onClick={() => {
                        setView(view === 'login' ? 'register' : 'login');
                        setAgreed(false); // Reset agreement
                    }}
                    className="ml-1 text-white font-semibold underline decoration-violet-500 decoration-2 underline-offset-4 hover:text-violet-200 transition-colors"
                >
                    {view === 'login' ? '去注册' : '去登录'}
                </button>
            </p>
        </div>

      </motion.div>
    </div>
  );
};

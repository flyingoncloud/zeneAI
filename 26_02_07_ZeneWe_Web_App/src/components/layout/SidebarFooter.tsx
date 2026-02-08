import React, { useState } from 'react';
import guestAvatar from 'figma:asset/daa065107ab85c7d8a27afa6b3530439ae206470.png';
import { 
  MoreHorizontal, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Book,
  Shield,
  Crown,
  LogIn,
  User
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useZenemeStore } from '../../hooks/useZenemeStore';
import { useAuthStore } from '../../hooks/useAuthStore';
import { SettingsModal } from '../modals/SettingsModal';
import { HelpModal } from '../modals/HelpModal';
import { UserGuideModal } from '../modals/UserGuideModal';
import { PrivacyModal } from '../modals/PrivacyModal';

interface SidebarFooterProps {
  isSidebarOpen: boolean;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ isSidebarOpen }) => {
  const { t, openUpgradeModal } = useZenemeStore();
  const { status, user, logout } = useAuthStore();
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleUpgrade = () => {
    setIsPopoverOpen(false);
    openUpgradeModal('settings');
  };

  const handleLogin = () => {
    // Global Event trigger to open Auth Page
    window.dispatchEvent(new CustomEvent('zeneme:navigate-auth'));
  };

  const isGuest = status === 'guest';
  
  // Safe user data
  const userData = user || {
    name: 'ZeneWe User',
    email: 'user@zenewe.app',
    avatar: '',
    isPro: false
  };

  return (
    <div className={`border-t border-white/5 bg-black/20 ${isSidebarOpen ? 'p-4 space-y-3' : 'p-4 flex justify-center'}`}>
      
      {/* Account Area with Popover & Tooltip */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <div 
                className={`
                  group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 outline-none
                  hover:bg-white/5 
                  ${isSidebarOpen ? 'w-full' : 'justify-center w-auto'}
                  ${isPopoverOpen ? 'bg-white/5' : ''}
                `}
              >
                <div className="relative flex-shrink-0">
                  <Avatar className={`h-9 w-9 shrink-0 ${isGuest ? '' : 'border border-white/10'} ${!isGuest && userData.isPro ? 'ring-2 ring-violet-500/50' : ''}`}>
                    <AvatarImage 
                      src={isGuest ? guestAvatar : userData.avatar} 
                      alt={userData.name} 
                    />
                    <AvatarFallback className="bg-slate-800 text-slate-200">
                      {isGuest ? <User size={16} /> : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {!isGuest && userData.isPro && (
                    <div className="absolute -bottom-1 -right-1 bg-violet-600 rounded-full p-0.5 border border-slate-900">
                      <Crown size={8} className="text-white fill-white" />
                    </div>
                  )}
                </div>
                
                {isSidebarOpen && (
                  <div className="flex-1 overflow-hidden text-left flex flex-col justify-center items-start gap-1">
                    <p className="text-sm font-semibold text-slate-200 leading-normal truncate w-full -translate-y-0.5">
                      {isGuest ? '游客模式' : userData.name}
                    </p>
                    <div className="flex items-center">
                       {isGuest ? (
                         <span className="text-[10px] font-normal text-slate-500/80 leading-none">
                            浏览中 (数据未保存)
                         </span>
                       ) : userData.isPro ? (
                         <span className="text-[10px] font-bold text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                           {t.common.proMember}
                         </span>
                       ) : (
                         <span className="text-xs font-normal text-slate-500/80 leading-none">
                           {t.common.freeAccount}
                         </span>
                       )}
                    </div>
                  </div>
                )}
                
                {isSidebarOpen && (
                  <MoreHorizontal size={16} className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
                )}
              </div>
            </PopoverTrigger>
          </TooltipTrigger>
          
          {/* Tooltip Content - Only shown when collapsed */}
          {!isSidebarOpen && (
            <TooltipContent 
              side="right" 
              sideOffset={20} 
              showArrow={false}
              className="bg-slate-900/85 backdrop-blur-sm border border-white/10 text-slate-100 px-2.5 py-1.5 rounded-lg text-xs font-normal shadow-sm animate-in fade-in slide-in-from-left-2 duration-200"
            >
              <div className="flex flex-col items-start gap-0.5 leading-tight">
                <span className="font-medium text-slate-100">{isGuest ? '游客模式' : userData.name}</span>
                <span className="text-slate-400 text-[10px] uppercase tracking-wide">
                  {isGuest ? '未登录' : (userData.isPro ? t.common.proMember : t.common.freeAccount)}
                </span>
              </div>
            </TooltipContent>
          )}
        </Tooltip>

        {/* Pull-up Panel Content */}
        <PopoverContent 
          side="top" 
          align={isSidebarOpen ? "start" : "center"} 
          className="w-72 p-0 bg-slate-900/95 backdrop-blur-xl border-white/10 text-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          sideOffset={16}
        >
          {isGuest ? (
             /* Guest Menu */
             <div className="p-2 space-y-1">
                <div className="p-4 bg-gradient-to-b from-violet-500/10 to-transparent rounded-lg mb-2">
                   <p className="text-sm text-slate-200 font-medium mb-1">登录以保存进度</p>
                   <p className="text-xs text-slate-400 mb-3 leading-relaxed">游客模式下数据仅临时保存，无法跨设备同步。</p>
                   <Button onClick={handleLogin} size="sm" className="w-full bg-violet-600 hover:bg-violet-500 text-white">
                      <LogIn size={14} className="mr-2" />
                      登录 / 注册
                   </Button>
                </div>
                <Separator className="bg-white/5 my-1" />
                <Button 
                   variant="ghost" 
                   className="w-full justify-start h-9 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                   onClick={logout} // Actually just resets to idle
                 >
                   <LogOut size={16} className="mr-2" />
                   退出游客模式
                 </Button>
             </div>
          ) : (
             /* Authenticated Menu */
             <>
               <div className="p-4 bg-gradient-to-b from-violet-500/5 to-transparent">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.common.subscription}</span>
                    {userData.isPro ? (
                      <Badge variant="outline" className="bg-violet-500/10 text-violet-300 border-violet-500/30 text-[10px]">PRO</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700 text-[10px]">{t.common.free}</Badge>
                    )}
                  </div>
                  {userData.isPro ? (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-300">{t.common.proPlanActive}</p>
                      <Button variant="outline" size="sm" className="w-full h-8 text-xs border-white/10 hover:bg-white/5 hover:text-white">
                        {t.common.manageSubscription}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-300">{t.common.upgradeUnlock}</p>
                      <Button onClick={handleUpgrade} size="sm" className="w-full h-8 text-xs bg-violet-600 hover:bg-violet-500 text-white border-0">
                        {t.common.upgradePro}
                      </Button>
                    </div>
                  )}
               </div>

               <Separator className="bg-white/5" />

               <div className="p-1">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start h-9 px-3 text-slate-300 hover:text-white hover:bg-white/5"
                    onClick={() => {
                      setIsPopoverOpen(false);
                      setIsSettingsOpen(true);
                    }}
                  >
                    <Settings size={16} className="mr-2 text-slate-400" />
                    {t.common.accountSettings}
                  </Button>
               </div>

               <Separator className="bg-white/5" />

               <div className="p-1">
                  <Button 
                      variant="ghost" 
                      className="w-full justify-start h-9 px-3 text-slate-300 hover:text-white hover:bg-white/5"
                      onClick={() => {
                        setIsPopoverOpen(false);
                        setIsUserGuideOpen(true);
                      }}
                  >
                    <Book size={16} className="mr-2 text-slate-400" />
                    {t.common.userGuide}
                  </Button>
                  <Button 
                      variant="ghost" 
                      className="w-full justify-start h-9 px-3 text-slate-300 hover:text-white hover:bg-white/5"
                      onClick={() => {
                        setIsPopoverOpen(false);
                        setIsPrivacyOpen(true);
                      }}
                  >
                    <Shield size={16} className="mr-2 text-slate-400" />
                    {t.common.privacyPolicy}
                  </Button>
                  <Button 
                      variant="ghost" 
                      className="w-full justify-start h-9 px-3 text-slate-300 hover:text-white hover:bg-white/5"
                      onClick={() => {
                        setIsPopoverOpen(false);
                        setIsHelpOpen(true);
                      }}
                  >
                    <HelpCircle size={16} className="mr-2 text-slate-400" />
                    {t.common.helpSupport}
                  </Button>
               </div>

               <Separator className="bg-white/5" />

               <div className="p-1 pb-2">
                  <Button variant="ghost" onClick={logout} className="w-full justify-start h-9 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <LogOut size={16} className="mr-2" />
                    {t.common.logout}
                  </Button>
               </div>
             </>
          )}
        </PopoverContent>
      </Popover>

      {/* Settings Dialog */}
      <SettingsModal 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
        initialUser={userData} 
      />
      
      {/* Help Modal */}
      <HelpModal 
        open={isHelpOpen} 
        onOpenChange={setIsHelpOpen} 
      />

      {/* User Guide Modal */}
      <UserGuideModal
        open={isUserGuideOpen}
        onOpenChange={setIsUserGuideOpen}
      />

      {/* Privacy Modal */}
      <PrivacyModal
        open={isPrivacyOpen}
        onOpenChange={setIsPrivacyOpen}
      />
    </div>
  );
};

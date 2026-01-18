import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Book,
  Shield,
  Crown
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useZenemeStore } from '../../hooks/useZenemeStore';
import { SettingsModal } from '../modals/SettingsModal';
import { HelpModal } from '../modals/HelpModal';
import { UserGuideModal } from '../modals/UserGuideModal';
import { PrivacyModal } from '../modals/PrivacyModal';

interface SidebarFooterProps {
  isSidebarOpen: boolean;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ isSidebarOpen }) => {
  const { t, openUpgradeModal } = useZenemeStore();
  // Mock User State
  const [user, setUser] = useState({
    name: 'Zeneme User',
    email: 'user@zeneme.app',
    avatar: 'https://github.com/shadcn.png',
    isPro: false // Default to Free as per requirement
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleUpgrade = () => {
    setIsPopoverOpen(false);
    openUpgradeModal('settings');
  };

  return (
    <div className="p-4 border-t border-white/5 space-y-3 bg-black/20">
      
      {/* Account Area with Popover */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <div 
            className={`
              group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all duration-200 outline-none
              hover:bg-white/5 
              ${isSidebarOpen ? '' : 'justify-center'}
              ${isPopoverOpen ? 'bg-white/5' : ''}
            `}
          >
            <div className="relative">
              <Avatar className={`h-9 w-9 border border-white/10 shrink-0 ${user.isPro ? 'ring-2 ring-violet-500/50' : ''}`}>
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-slate-800 text-slate-200">U</AvatarFallback>
              </Avatar>
              {user.isPro && (
                <div className="absolute -bottom-1 -right-1 bg-violet-600 rounded-full p-0.5 border border-slate-900">
                  <Crown size={8} className="text-white fill-white" />
                </div>
              )}
            </div>
            
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden text-left">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-200 leading-tight truncate">{user.name}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                   {user.isPro ? (
                     <span className="text-[10px] font-bold text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
                       {t.common.proMember}
                     </span>
                   ) : (
                     <span className="text-[10px] font-medium text-slate-400 bg-slate-800/50 px-1.5 py-0.5 rounded-sm uppercase tracking-wide">
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

        {/* Pull-up Panel Content */}
        <PopoverContent 
          side="top" 
          align={isSidebarOpen ? "start" : "center"} 
          className="w-72 p-0 bg-slate-900/95 backdrop-blur-xl border-white/10 text-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
          sideOffset={16}
        >
          {/* Section 1: Subscription */}
          <div className="p-4 bg-gradient-to-b from-violet-500/5 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.common.subscription}</span>
              {user.isPro ? (
                 <Badge variant="outline" className="bg-violet-500/10 text-violet-300 border-violet-500/30 text-[10px]">PRO</Badge>
              ) : (
                 <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700 text-[10px]">{t.common.free}</Badge>
              )}
            </div>
            {user.isPro ? (
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

          {/* Section 2: Account Settings */}
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

          {/* Section 3: Help */}
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

          {/* Section 4: Logout */}
          <div className="p-1 pb-2">
             <Button variant="ghost" className="w-full justify-start h-9 px-3 text-red-400 hover:text-red-300 hover:bg-red-500/10">
               <LogOut size={16} className="mr-2" />
               {t.common.logout}
             </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Settings Dialog */}
      <SettingsModal 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
        initialUser={user} 
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

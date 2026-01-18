import React, { useState } from 'react';
import * as Icons from '../ui/icons';
import { Button } from '../ui/button';
import { useZenemeStore, View } from '../../hooks/useZenemeStore';
import { ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { SidebarFooter } from './SidebarFooter';
import Logo from '../../imports/Logo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

type SafeIconComponent = React.ComponentType<
  React.SVGProps<SVGSVGElement> & { size?: number | string; className?: string }
>;

type SafeIconProps = {
  icon?: SafeIconComponent;
  size?: number | string;
  className?: string;
};

const SafeIcon: React.FC<SafeIconProps> = ({ icon: Icon, size = 24, className }) => {
  if (!Icon) {
    const px = typeof size === "number" ? size : 24;
    return (
      <span
        style={{
          width: px,
          height: px,
          display: "inline-block",
          background: "#ccc",
          borderRadius: 4,
        }}
      />
    );
  }
  return <Icon size={size} className={className} />;
};

export const Sidebar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    isSidebarOpen, 
    toggleSidebar, 
    t,
    sessions,
    currentSessionId,
    createNewSession,
    selectSession
  } = useZenemeStore();

  const [isRecentChatsExpanded, setIsRecentChatsExpanded] = useState(false);

  const CORE_ITEMS = [
    { id: 'first-aid', label: t.menu.firstAid, icon: Icons.Heart },
    { id: 'sketch', label: t.menu.sketch, icon: Icons.PenTool },
    { id: 'test', label: t.menu.test, icon: ClipboardList },
  ] as const;

  const FIXED_ITEMS = [
    { id: 'new-chat', label: t.menu.chat, icon: Icons.MessageSquarePlus },
    { id: 'history', label: t.menu.history, icon: Icons.Clock },
    { id: 'mood', label: t.menu.mood, icon: Icons.Calendar },
  ] as const;

  const handleMenuClick = (id: string) => {
    if (id === 'new-chat') {
      createNewSession();
    } else {
      setCurrentView(id as View);
    }
  };

  // Filter and sort sessions for Recent Chats
  const recentSessions = React.useMemo(() => {
    return sessions
      .filter(s => !s.isDraft)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [sessions]);

  const displayedSessions = isRecentChatsExpanded ? recentSessions : recentSessions.slice(0, 3);
  const showExpandToggle = recentSessions.length > 0;

  return (
    <div 
      className={`${isSidebarOpen ? 'w-[280px]' : 'w-[72px]'} bg-slate-900/60 backdrop-blur-xl border-r border-white/5 flex flex-col h-full z-20 relative transition-all duration-250 ease-out`}
    >
      {/* 1. Brand Area (Header) */}
      <div className={`flex items-center flex-shrink-0 ${isSidebarOpen ? 'px-6 py-6 justify-between' : 'justify-center py-6 flex-col gap-6'}`}>
        {isSidebarOpen ? (
          <>
            <div className="w-[170px] h-8 relative">
              <Logo />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar} 
              className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full w-8 h-8"
            >
              <SafeIcon icon={Icons.ChevronLeft} size={20} />
            </Button>
          </>
        ) : (
          <div className="w-8 h-8 relative overflow-hidden">
             <Logo />
          </div>
        )}
      </div>

      {isSidebarOpen ? (
        // --- EXPANDED STATE ---
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* 2. Core Features (Fixed) */}
          <div className="px-3 space-y-1.5 flex-shrink-0">
            {CORE_ITEMS.map((item) => {
              const isActive = item.id === currentView;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start h-11 px-4 transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)] border border-white/10' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                  }`}
                  onClick={() => handleMenuClick(item.id)}
                >
                   {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-400 rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.6)]" />}
                   
                   <SafeIcon 
                     icon={item.icon} 
                     size={18} 
                     className={`mr-3 transition-colors ${isActive ? "text-violet-300 drop-shadow-[0_0_5px_rgba(139,92,246,0.6)]" : "group-hover:text-violet-200"}`} 
                   />
                   <span className={`font-medium tracking-wide ${isActive ? "text-violet-50" : ""}`}>{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* 3. Divider */}
          <div className="px-3 py-4 flex-shrink-0">
            <div className="h-px bg-white/5 w-full" />
          </div>

          {/* 4. Recent Chats Header (Fixed) */}
          <div className="px-7 flex items-center justify-between mb-2 flex-shrink-0 h-6">
            <h3 className="text-xs font-semibold text-slate-500/80 uppercase tracking-wider">{t.common.recentChats}</h3>
            {showExpandToggle && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-slate-500 hover:text-white hover:bg-white/10 rounded-full"
                onClick={() => setIsRecentChatsExpanded(!isRecentChatsExpanded)}
              >
                {isRecentChatsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </Button>
            )}
          </div>

          {/* 5. Recent Chats List (Scrollable Area) */}
          <div className={`flex-1 min-h-0 px-3 ${isRecentChatsExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}>
            <div className="space-y-1 pb-2">
              {recentSessions.length === 0 && (
                 <div className="px-4 text-xs text-slate-600 italic mt-1">{t.common.empty}</div>
              )}
              {displayedSessions.map((session) => {
                const isActive = session.id === currentSessionId && currentView === 'chat';
                const lastMessage = session.messages.length > 0 ? session.messages[session.messages.length - 1].content : '';
                
                return (
                  <Button
                    key={session.id}
                    variant="ghost"
                    onClick={() => selectSession(session.id)}
                    className={`w-full justify-start text-left h-auto py-3 px-4 mb-1 border transition-all rounded-xl group ${
                      isActive 
                        ? 'bg-violet-500/10 text-white border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent'
                    }`}
                  >
                    <div className="w-full overflow-hidden">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`font-medium truncate text-sm ${isActive ? 'text-violet-200' : 'text-slate-300 group-hover:text-white'}`}>
                          {session.title || t.menu.chat}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 truncate opacity-70 group-hover:text-slate-400 transition-colors">
                        {lastMessage || t.common.empty}
                      </div>
                    </div>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-400 rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* 6. Fixed Features (Bottom Fixed) */}
          <div className="px-3 pt-4 pb-2 flex-shrink-0 space-y-1.5 border-t border-white/5">
            {FIXED_ITEMS.map((item) => {
               const isActive = item.id === currentView;
               return (
                 <Button
                   key={item.id}
                   variant="ghost"
                   className={`w-full justify-start h-11 px-4 transition-all duration-200 group relative ${
                     isActive 
                       ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)] border border-white/10' 
                       : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                   }`}
                   onClick={() => handleMenuClick(item.id)}
                 >
                    {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-400 rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.6)]" />}
                    
                    <SafeIcon 
                      icon={item.icon} 
                      size={18} 
                      className={`mr-3 transition-colors ${isActive ? "text-violet-300 drop-shadow-[0_0_5px_rgba(139,92,246,0.6)]" : "group-hover:text-violet-200"}`} 
                    />
                    <span className={`font-medium tracking-wide ${isActive ? "text-violet-50" : ""}`}>{item.label}</span>
                 </Button>
               );
            })}
          </div>
        </div>
      ) : (
        // --- COLLAPSED STATE (Only Hamburger + Heart) ---
        <div className="flex-1 overflow-hidden">
          <div className="flex flex-col items-center gap-6 mt-4 animate-in fade-in duration-300">
            <TooltipProvider delayDuration={200}>
              
              {/* 1. Hamburger Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleSidebar} 
                    className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
                  >
                    <SafeIcon icon={Icons.Menu} size={22} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  sideOffset={8} 
                  showArrow={false}
                  className="bg-slate-900/85 backdrop-blur-sm border border-white/10 text-slate-100 px-2.5 py-1.5 rounded-lg text-xs font-normal shadow-sm animate-in fade-in slide-in-from-left-2 duration-200"
                >
                  <p>打开边栏</p>
                </TooltipContent>
              </Tooltip>

              {/* 2. Emotional First Aid (Heart) */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleMenuClick('first-aid')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentView === 'first-aid' 
                         ? 'bg-white/10 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.4)] border border-violet-500/30 scale-110' 
                         : 'text-slate-400 hover:text-white hover:bg-white/10 hover:scale-105'
                    }`}
                  >
                     <SafeIcon icon={Icons.Heart} size={22} className={currentView === 'first-aid' ? "fill-violet-500/20" : ""} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  sideOffset={8} 
                  showArrow={false}
                  className="bg-slate-900/85 backdrop-blur-sm border border-white/10 text-slate-100 px-2.5 py-1.5 rounded-lg text-xs font-normal shadow-sm animate-in fade-in slide-in-from-left-2 duration-200"
                >
                  <p>情绪急救</p>
                </TooltipContent>
              </Tooltip>

            </TooltipProvider>
          </div>
        </div>
      )}
      
      {/* Footer Area - Only visible when expanded */}
      {isSidebarOpen && <SidebarFooter isSidebarOpen={true} />}
    </div>
  );
};

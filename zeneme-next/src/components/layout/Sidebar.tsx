import React, { useMemo, useState } from 'react';
import * as Icons from '../ui/icons';
import { Button } from '../ui/button';
import { useZenemeStore, View } from '../../hooks/useZenemeStore';
import { ClipboardList, ChevronDown } from 'lucide-react';
import { SidebarFooter } from './SidebarFooter';
import Logo from '../../imports/Logo';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '../ui/sheet';
import { useIsMobile } from '../ui/use-mobile';
import { cn } from '../ui/utils';
import { motion, AnimatePresence } from 'motion/react';
import Image from "next/image";

/** -----------------------------
 * Types (fix `hasChildren` / `children` union issues)
 * ----------------------------- */
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

type MenuId = View | "new-chat";

type ChildItem = {
  id: View; // breathing / naming etc.
  label: string;
};

type MenuItem =
  | {
      id: MenuId;
      label: string;
      icon: SafeIconComponent;
      hasChildren: true;
      children: ChildItem[];
    }
  | {
      id: MenuId;
      label: string;
      icon: SafeIconComponent;
      hasChildren?: false;
      children?: never;
    };

const hasChildren = (item: MenuItem): item is Extract<MenuItem, { hasChildren: true }> =>
  item.hasChildren === true;

interface SidebarContentProps {
  isCollapsed: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ isCollapsed, onClose, isMobile }) => {
  const {
    currentView,
    setCurrentView,
    toggleSidebar,
    t,
    sessions,
    currentSessionId,
    createNewSession,
    selectSession
  } = useZenemeStore();

  // ✅ avoid `setState` inside effect: derive "should be expanded" from currentView
  const isSubView = currentView === "breathing" || currentView === "naming";
  const [isFirstAidExpanded, setIsFirstAidExpanded] = useState<boolean>(isSubView);
  const firstAidExpanded = isSubView || isFirstAidExpanded;

  // A. Core Features (Fixed Top)
  const CORE_ITEMS: MenuItem[] = [
    {
      id: 'first-aid',
      label: t.menu.firstAid,
      icon: Icons.Heart as unknown as SafeIconComponent,
      hasChildren: true,
      children: [
        { id: 'breathing', label: '呼吸训练' },
        { id: 'naming', label: '情绪命名' },
      ],
    },
    { id: 'sketch', label: t.menu.sketch, icon: Icons.PenTool as unknown as SafeIconComponent },
    { id: 'test', label: t.menu.test, icon: ClipboardList as unknown as SafeIconComponent },
  ];

  // C. Shortcuts (Fixed below Recent Chats)
  const SHORTCUT_ITEMS: MenuItem[] = [
    { id: 'new-chat', label: t.menu.chat, icon: Icons.MessageSquarePlus as unknown as SafeIconComponent },
    { id: 'history', label: t.menu.history, icon: Icons.Clock as unknown as SafeIconComponent },
    { id: 'mood', label: t.menu.mood, icon: Icons.Calendar as unknown as SafeIconComponent },
  ];

  const handleMenuClick = (item: MenuItem) => {
    if (hasChildren(item)) {
      // Toggle expansion only; do not navigate
      setIsFirstAidExpanded(prev => !prev);
      return;
    }

    if (item.id === 'new-chat') {
      createNewSession();
    } else {
      setCurrentView(item.id as View);
    }

    // Close sidebar on mobile after selection
    if (isMobile && onClose) onClose();
  };

  // Filter and sort sessions for Recent Chats
  const recentSessions = useMemo(() => {
    return sessions
      .filter(s => !s.isDraft)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [sessions]);

  const displayedSessions = recentSessions;

  /** -----------------------------
   * Expanded Sidebar
   * ----------------------------- */
  if (!isCollapsed) {
    return (
      <div className="flex flex-col h-full w-full">
        {/* 1. Brand Area (Fixed Header) */}
        <div className="flex flex-col flex-shrink-0 px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="w-[170px] h-8 relative">
              <Logo />
            </div>

            {/* Only show collapse button on Desktop */}
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full w-8 h-8"
              >
                <SafeIcon icon={Icons.ChevronLeft as unknown as SafeIconComponent} size={20} />
              </Button>
            )}
          </div>

          {/* ✅ Slogan Image: use Next <Image/>; your file is /public/slogan 2.png */}
          <div className="mt-2">
            <Image
              src="/slogan%202.png"
              alt="遇见更好的自己"
              width={130}
              height={25}
              className="h-[25px] w-auto opacity-80 select-none pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)] object-contain object-left max-w-full"
            />
          </div>
        </div>

        {/* --- EXPANDED BODY --- */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* A. Core Features (Fixed Top) */}
          <div className="flex-shrink-0">
            <div className="px-3 space-y-1.5">
              {CORE_ITEMS.map((item) => {
                const isDirectActive = item.id === currentView;
                const isChildActive = hasChildren(item) && isSubView;
                const isActive = isDirectActive || isChildActive;

                return (
                  <div key={item.id} className="flex flex-col">
                    <Button
                      variant="ghost"
                      className={`w-full justify-between h-11 px-4 transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)] border border-white/10 hover:bg-white/[0.12] hover:shadow-[0_0_12px_rgba(139,92,246,0.1)]'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                      }`}
                      onClick={() => handleMenuClick(item)}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-400 rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                      )}

                      <div className="flex items-center">
                        <SafeIcon
                          icon={item.icon}
                          size={18}
                          className={`mr-3 transition-colors ${
                            isActive
                              ? "text-violet-300 drop-shadow-[0_0_5px_rgba(139,92,246,0.6)]"
                              : "group-hover:text-violet-200"
                          }`}
                        />
                        <span className={`font-medium tracking-wide ${isActive ? "text-violet-50" : ""}`}>
                          {item.label}
                        </span>
                      </div>

                      {hasChildren(item) && (
                        <div className={`transition-transform duration-200 ${firstAidExpanded ? 'rotate-180' : ''}`}>
                          <ChevronDown size={14} className={isActive ? "text-violet-300" : "text-slate-500"} />
                        </div>
                      )}
                    </Button>

                    {/* Sub-menu */}
                    {hasChildren(item) && (
                      <AnimatePresence>
                        {firstAidExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-1 space-y-1 pl-4">
                              {item.children.map((child) => {
                                const isChildItemActive = child.id === currentView;
                                return (
                                  <Button
                                    key={child.id}
                                    variant="ghost"
                                    onClick={() => {
                                      setCurrentView(child.id as View);
                                      if (isMobile && onClose) onClose();
                                    }}
                                    className={`w-full justify-start h-9 pl-12 pr-4 text-sm font-normal transition-colors ${
                                      isChildItemActive
                                        ? 'text-violet-200 bg-white/5'
                                        : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                                    }`}
                                  >
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full mr-3 ${
                                        isChildItemActive
                                          ? 'bg-violet-400 shadow-[0_0_5px_rgba(139,92,246,0.8)]'
                                          : 'bg-transparent'
                                      }`}
                                    />
                                    {child.label}
                                  </Button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Visual Separation */}
            <div className="px-3 py-6">
              <div className="h-px bg-white/5 w-full" />
            </div>
          </div>

          {/* B. Recent Chats Header */}
          <div className={cn("px-7 flex items-center justify-between mb-3 h-5 flex-shrink-0", !isMobile && "mt-10")}>
            <h3 className="text-xs font-semibold text-slate-500/80 uppercase tracking-wider">
              {t.common.recentChats}
            </h3>
          </div>

          {/* B. Recent Chats List */}
          <div className="px-3 space-y-1 max-h-[192px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
            {recentSessions.length === 0 && (
              <div className="px-4 text-xs text-slate-600 italic mt-1">{t.common.empty}</div>
            )}

            {displayedSessions.map((session) => {
              const isActive = session.id === currentSessionId && currentView === 'chat';
              const lastMessage =
                session.messages.length > 0 ? session.messages[session.messages.length - 1].content : '';

              return (
                <Button
                  key={session.id}
                  variant="ghost"
                  onClick={() => {
                    selectSession(session.id);
                    if (isMobile && onClose) onClose();
                  }}
                  className={`w-full justify-start text-left h-auto py-3 px-4 mb-1 border transition-all rounded-xl group ${
                    isActive
                      ? 'bg-violet-500/10 text-white border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)] hover:bg-violet-500/15 hover:shadow-[0_0_12px_rgba(139,92,246,0.08)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border-transparent'
                  }`}
                >
                  <div className="w-full overflow-hidden">
                    <div className="flex justify-between items-center mb-0.5">
                      <span
                        className={`font-medium truncate text-sm ${
                          isActive ? 'text-violet-200 group-hover:text-violet-100' : 'text-slate-300 group-hover:text-white'
                        }`}
                      >
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

          {/* C. Shortcuts */}
          <div className="flex-shrink-0">
            <div className="px-3 py-6">
              <div className="h-px bg-white/5 w-full" />
            </div>

            <div className="px-3 space-y-1.5 pb-2">
              {SHORTCUT_ITEMS.map((item) => {
                const isActive = item.id === currentView;

                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full justify-start h-11 px-4 transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(139,92,246,0.15)] border border-white/10 hover:bg-white/[0.12] hover:shadow-[0_0_12px_rgba(139,92,246,0.1)]'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
                    }`}
                    onClick={() => handleMenuClick(item)}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-400 rounded-r-full shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                    )}

                    <SafeIcon
                      icon={item.icon}
                      size={18}
                      className={`mr-3 transition-colors ${
                        isActive ? "text-violet-300 drop-shadow-[0_0_5px_rgba(139,92,246,0.6)]" : "group-hover:text-violet-200"
                      }`}
                    />
                    <span className={`font-medium tracking-wide ${isActive ? "text-violet-50" : ""}`}>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex-1" />
        </div>

        {/* Footer Area - Always visible */}
        <SidebarFooter isSidebarOpen={true} />
      </div>
    );
  }

  /** -----------------------------
   * Collapsed Sidebar (Desktop)
   * ----------------------------- */
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex items-center justify-center py-6 flex-col gap-6 flex-shrink-0">
        <div className="w-8 h-8 relative overflow-hidden">
          <Logo />
        </div>
      </div>

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
                  <SafeIcon icon={Icons.Menu as unknown as SafeIconComponent} size={22} />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={20}
                showArrow={false}
                className="bg-slate-900/85 backdrop-blur-sm border border-white/10 text-slate-100 px-2.5 py-1.5 rounded-lg text-xs font-normal shadow-sm animate-in fade-in slide-in-from-left-2 duration-200"
              >
                <p>打开边栏</p>
              </TooltipContent>
            </Tooltip>

            {/* 2. Emotional First Aid (Heart) with Popover/HoverCard */}
            {(() => {
              const item = CORE_ITEMS.find(i => i.id === "first-aid") as Extract<MenuItem, { hasChildren: true }>;
              const isActive = currentView === 'first-aid' || isSubView;

              return (
                <HoverCard openDelay={0} closeDelay={200}>
                  <HoverCardTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsFirstAidExpanded(prev => !prev)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? 'bg-white/10 text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.4)] border border-violet-500/30 scale-110'
                          : 'text-slate-400 hover:text-white hover:bg-white/10 hover:scale-105'
                      }`}
                    >
                      <SafeIcon
                        icon={Icons.Heart as unknown as SafeIconComponent}
                        size={22}
                        className={isActive ? "fill-violet-500/20" : ""}
                      />
                    </Button>
                  </HoverCardTrigger>

                  <HoverCardContent
                    side="right"
                    align="start"
                    sideOffset={20}
                    className="w-48 bg-slate-900/90 backdrop-blur-md border border-white/10 p-2 shadow-xl rounded-xl animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="px-2 py-1.5 mb-1">
                      <h4 className="text-sm font-semibold text-white">情绪急救</h4>
                    </div>

                    <div className="flex flex-col space-y-1">
                      {item.children.map((child) => (
                        <Button
                          key={child.id}
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentView(child.id as View)}
                          className="w-full justify-start text-slate-300 hover:text-white hover:bg-white/10 h-8 text-xs font-normal"
                        >
                          {child.label}
                        </Button>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              );
            })()}
          </TooltipProvider>
        </div>
      </div>

      {/* Footer Area */}
      <SidebarFooter isSidebarOpen={false} />
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const { isSidebarOpen, toggleSidebar, currentView } = useZenemeStore();
  const isMobile = useIsMobile();

  // Mobile Implementation (Drawer)
  if (isMobile) {
    return (
      <>
        {!isSidebarOpen && !['test', 'report-detail'].includes(currentView) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="fixed top-6 left-6 z-50 text-slate-400 hover:text-white hover:bg-slate-900/40 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/5 shadow-sm"
          >
            <SafeIcon icon={Icons.Menu as unknown as SafeIconComponent} size={22} />
          </Button>
        )}

        <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
          <SheetContent
            side="left"
            className="p-0 border-r border-white/10 bg-slate-900/95 backdrop-blur-xl w-[85%] max-w-[360px] text-slate-200 shadow-2xl"
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Navigation menu</SheetDescription>
            <SidebarContent isCollapsed={false} onClose={() => toggleSidebar()} isMobile={true} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop Implementation (Sidebar)
  return (
    <div
      className={`${isSidebarOpen ? 'w-[280px]' : 'w-[72px]'} bg-slate-900/60 backdrop-blur-xl border-r border-white/5 flex flex-col h-full z-20 relative transition-all duration-250 ease-out`}
    >
      <SidebarContent isCollapsed={!isSidebarOpen} />
    </div>
  );
};

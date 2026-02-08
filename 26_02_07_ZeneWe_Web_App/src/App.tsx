import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { ChatInterface } from './components/features/chat/ChatInterface';
import { InnerSketch } from './components/features/tools/InnerSketch';
import { InnerQuickTest } from './components/features/tools/InnerQuickTest';
import { MoodTracker } from './components/features/tools/MoodTracker';
import { EmotionalFirstAid } from './components/features/tools/EmotionalFirstAid';
import { HistoryReports } from './components/features/reports/HistoryReports';
import { ReportDetail } from './components/features/reports/ReportDetail';
import { SketchBriefReport } from './components/features/reports/SketchBriefReport';
import { StarryLandscapeBackground } from './components/layout/StarryLandscapeBackground';
import { useZenemeStore, ZenemeProvider } from './hooks/useZenemeStore';
import { UpgradeModals } from './components/modals/UpgradeModals';
import { SplashDanmakuLayer } from './components/features/chat/SplashDanmakuLayer';

// Auth Components
import { useAuthStore } from './hooks/useAuthStore';
import { WelcomePage } from './components/auth/WelcomePage';
import { AuthPage } from './components/auth/AuthPage';
import { LoginRequiredModal } from './components/modals/LoginRequiredModal';
import { LOGIN_REQUIRED_EVENT } from './utils/authHelpers';

const AppContent: React.FC = () => {
  const { currentView, setCurrentView, messages, addMessage, reports, selectedReportId } = useZenemeStore();
  const { status } = useAuthStore();
  
  // Local state to toggle Auth Page (Login/Register) visibility
  const [isAuthPageOpen, setIsAuthPageOpen] = useState(false);
  
  // Login Required Modal State
  const [isLoginRequiredOpen, setIsLoginRequiredOpen] = useState(false);
  const [postLoginTarget, setPostLoginTarget] = useState<string | null>(null);

  // Listen for global navigation events (from GuestGate or Sidebar)
  useEffect(() => {
    const handleNavAuth = () => setIsAuthPageOpen(true);
    window.addEventListener('zeneme:navigate-auth', handleNavAuth);
    
    // Listen for Login Required Event
    const handleLoginRequired = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail?.targetView) {
            setPostLoginTarget(detail.targetView);
        }
        setIsLoginRequiredOpen(true);
    };
    window.addEventListener(LOGIN_REQUIRED_EVENT, handleLoginRequired);

    return () => {
        window.removeEventListener('zeneme:navigate-auth', handleNavAuth);
        window.removeEventListener(LOGIN_REQUIRED_EVENT, handleLoginRequired);
    };
  }, []);

  // Close Auth Page when user successfully logs in
  useEffect(() => {
    if (status === 'authenticated') {
      setIsAuthPageOpen(false);
      setIsLoginRequiredOpen(false);
      
      // Navigate to target if exists
      if (postLoginTarget) {
          // If it's a View, set it. If it's something else (like 'report'), handle it?
          // For simplicity, we assume targetView is a valid View or we handle specific cases
          // The prompt says "prioritize returning to the target entry".
          // If the target matches a View, we switch.
          // Note: Some actions like 'generate-report' aren't Views. 
          // We'll handle Views for now. 
          if (['history', 'naming', 'report-detail', 'test', 'mood'].includes(postLoginTarget)) {
             setCurrentView(postLoginTarget as any);
          }
          setPostLoginTarget(null);
      }
    }
  }, [status, postLoginTarget, setCurrentView]);

  const handleSendMessage = async (text: string) => {
    addMessage(text, 'user');
    // AI response is handled by ChatInterface to manage thinking states
  };

  const renderContent = () => {
    switch (currentView) {
      case 'chat':
        return <ChatInterface messages={messages} onSendMessage={handleSendMessage} />;
      case 'history':
        return <HistoryReports />;
      case 'report-detail':
        const report = reports.find(r => r.id === selectedReportId);
        if (!report) return <HistoryReports />;
        return (
          <ReportDetail 
             onBack={() => setCurrentView('history')} 
             date={report.date}
             mode="history"
          />
        );
      case 'sketch':
        return <InnerSketch />;
      case 'sketch-report':
        return <SketchBriefReport />;
      case 'test':
        return <InnerQuickTest />;
      case 'mood':
        return <MoodTracker />;
      case 'first-aid':
      case 'breathing':
      case 'naming':
        return <EmotionalFirstAid />;
      default:
        return <ChatInterface messages={messages} onSendMessage={handleSendMessage} />;
    }
  };

  // 1. If Status is IDLE (First time, not guest, not logged in), show Welcome or Auth
  // 2. If Guest, show App, but can toggle Auth
  // 3. If Authenticated, show App

  // Base Wrapper with Background
  const BaseWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="flex h-screen w-full bg-transparent font-sans text-slate-200 overflow-hidden relative">
      <StarryLandscapeBackground />
      {children}
    </div>
  );

  // Scenario A: First Time User (Idle)
  if (status === 'idle') {
    return (
      <BaseWrapper>
        {isAuthPageOpen ? (
          <AuthPage onBack={() => setIsAuthPageOpen(false)} />
        ) : (
          <WelcomePage onNavigateAuth={() => setIsAuthPageOpen(true)} />
        )}
      </BaseWrapper>
    );
  }

  // Scenario B: Guest or Authenticated -> Show Main App
  // But if isAuthPageOpen is true (triggered from Guest mode), show AuthPage overlay
  if (isAuthPageOpen) {
    return (
      <BaseWrapper>
        <AuthPage onBack={() => setIsAuthPageOpen(false)} />
      </BaseWrapper>
    );
  }

  // Main Application Layout
  return (
    <div className="flex h-screen w-full bg-transparent font-sans text-slate-200 overflow-hidden relative">
      <StarryLandscapeBackground />
      
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 z-10 relative">
        <TopBar />
        <main className="flex-1 relative overflow-hidden bg-transparent">
          <div className="h-full w-full animate-in fade-in duration-300">
            {renderContent()}
          </div>
        </main>
      </div>
      <UpgradeModals />
      
      <LoginRequiredModal 
        open={isLoginRequiredOpen}
        onOpenChange={setIsLoginRequiredOpen}
        onLogin={() => {
            setIsLoginRequiredOpen(false);
            setIsAuthPageOpen(true);
        }}
        onContinueGuest={() => setIsLoginRequiredOpen(false)}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ZenemeProvider>
      <AppContent />
    </ZenemeProvider>
  );
};

export default App;
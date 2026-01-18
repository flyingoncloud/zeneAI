import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Crown, Shield, LogOut, AlertTriangle, User, CreditCard } from 'lucide-react';
import { useZenemeStore } from '../../hooks/useZenemeStore';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUser?: {
    name: string;
    email: string;
    isPro: boolean;
  };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  open, 
  onOpenChange,
  initialUser = { name: 'Zeneme User', email: 'user@zeneme.app', isPro: false }
}) => {
  const { 
    t, 
    isPro, 
    setProStatus, 
    openUpgradeModal, 
    freeSessionsLeft 
  } = useZenemeStore();
  
  const [activeTab, setActiveTab] = useState('account');
  const [formData, setFormData] = useState(initialUser);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Subscription Management States
  const [showManageSub, setShowManageSub] = useState(false);
  const [showCancelSubConfirm, setShowCancelSubConfirm] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const handleSave = () => {
    // Mock save
    onOpenChange(false);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    onOpenChange(false);
    console.log('Logged out');
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    onOpenChange(false);
    console.log('Account deleted');
  };

  const handleCancelSubscription = () => {
    setShowCancelSubConfirm(false);
    // Simulate API call
    setTimeout(() => {
      setCancelSuccessMsg(t.upgrade.cancelSuccess);
      // In a real app, we might set an "expiryDate" state, but keeps "isPro" true until then
    }, 500);
  };

  const handleUpgradeClick = () => {
    // We intentionally DO NOT close the SettingsModal (remove onOpenChange(false))
    // This allows the Upgrade Modal to open "over" the Settings Modal as requested.
    // The UpgradeModal has a higher z-index to ensure visibility.
    openUpgradeModal('settings');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px] bg-[#1a1d2e] border-white/10 text-slate-200 shadow-2xl p-0 gap-0 overflow-hidden rounded-xl">
          
          {/* Fixed Header */}
          <div className="p-6 pb-4 bg-[#1a1d2e] border-b border-white/5 relative z-10">
            <DialogHeader>
              <DialogTitle className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
                {t.settings.title}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm mt-1">
                {t.settings.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full grid grid-cols-2 bg-slate-950/50 p-1 h-11 rounded-lg">
                  <TabsTrigger 
                    value="account" 
                    className="text-xs font-medium data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 transition-all"
                  >
                    <User size={14} className="mr-2 opacity-70" />
                    {t.common.accountAndPlan}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="security" 
                    className="text-xs font-medium data-[state=active]:bg-slate-800 data-[state=active]:text-slate-100 transition-all"
                  >
                    <Shield size={14} className="mr-2 opacity-70" />
                    {t.common.security}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div className="max-h-[55vh] overflow-y-auto custom-scrollbar bg-[#161825]">
            {activeTab === 'account' && (
              <div className="p-6 space-y-6 animate-in fade-in-50 duration-300">
                
                {/* Profile Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{t.common.username}</Label>
                    <Input 
                      id="username" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="bg-black/20 border-white/10 text-slate-200 focus:border-indigo-500/50 h-10" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{t.common.email}</Label>
                    <div className="relative">
                       <Input 
                        id="email" 
                        value={formData.email} 
                        readOnly
                        className="bg-black/20 border-white/10 text-slate-500 cursor-not-allowed h-10" 
                      />
                      <Badge variant="outline" className="absolute right-2 top-2.5 text-[10px] py-0 h-5 border-white/10 text-emerald-500/80 bg-emerald-500/10">{t.common.verified}</Badge>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Plan Section */}
                <div className="space-y-3">
                   <Label className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{t.common.subscription}</Label>
                   
                   {!showManageSub ? (
                     <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-900/50 to-slate-900/30 border border-white/5">
                        <div className="flex items-center gap-4">
                           <div className={`p-2.5 rounded-full ${isPro ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30' : 'bg-slate-800 text-slate-400'}`}>
                              <Crown size={18} />
                           </div>
                           <div>
                              <p className="text-sm font-medium text-slate-200 flex items-center gap-2">
                                {isPro ? t.upgrade.proPlan : t.upgrade.freePlan}
                                {isPro && <Badge className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 text-[10px] h-5 px-1.5 border-0">{t.common.active}</Badge>}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {isPro 
                                  ? `${t.common.nextBilling}: 2026/02/12` 
                                  : `${t.upgrade.remaining} ${freeSessionsLeft} ${t.upgrade.times} / ${t.upgrade.used} ${5-freeSessionsLeft} ${t.upgrade.times}`
                                }
                              </p>
                           </div>
                        </div>
                        {isPro ? (
                           <Button size="sm" variant="outline" onClick={() => setShowManageSub(true)} className="h-8 text-xs border-white/10 hover:bg-white/5">
                             {t.common.manageSubscription}
                           </Button>
                        ) : (
                           <Button size="sm" onClick={handleUpgradeClick} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white border-0 shadow-lg shadow-indigo-900/20">
                             {t.common.upgrade}
                           </Button>
                        )}
                     </div>
                   ) : (
                     // Manage Subscription View
                     <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5 space-y-4 animate-in slide-in-from-right-4 duration-200">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <h4 className="text-sm font-semibold text-white">{t.upgrade.manageTitle}</h4>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowManageSub(false)}>
                            <span className="sr-only">Close</span>
                            &times;
                          </Button>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                             <span className="text-slate-400">{t.upgrade.planLabel}</span>
                             <span className="text-white">{t.upgrade.proPlan}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-slate-400">{t.upgrade.priceLabel}</span>
                             <span className="text-white">{t.upgrade.price}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-slate-400">{t.upgrade.renewLabel}</span>
                             <span className="text-emerald-400">{t.upgrade.autoRenew.split('，')[0]}</span>
                          </div>
                        </div>

                        {cancelSuccessMsg ? (
                           <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-200">
                             {cancelSuccessMsg}
                           </div>
                        ) : (
                           <Button 
                             variant="outline" 
                             onClick={() => setShowCancelSubConfirm(true)}
                             className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 h-8 text-xs"
                           >
                             {t.upgrade.cancelAutoRenew}
                           </Button>
                        )}
                     </div>
                   )}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              // ... Existing Security Tab Code ...
              <div className="p-6 space-y-6 animate-in fade-in-50 duration-300">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-pwd" className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{t.common.currentPassword}</Label>
                    <Input id="current-pwd" type="password" placeholder="••••••••••••" className="bg-black/20 border-white/10 text-slate-200 focus:border-indigo-500/50 h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-pwd" className="text-slate-400 text-xs uppercase tracking-wider font-semibold">{t.common.newPassword}</Label>
                    <Input id="new-pwd" type="password" placeholder="Min. 8 characters" className="bg-black/20 border-white/10 text-slate-200 focus:border-indigo-500/50 h-10" />
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-200">{t.common.twoFactor}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{t.common.twoFactorDesc}</p>
                      <Button variant="link" className="h-auto p-0 text-xs text-indigo-400 hover:text-indigo-300 mt-2">{t.common.enableTwoFactor} &rarr;</Button>
                    </div>
                  </div>
                </div>
                <Separator className="bg-white/5" />
                <div className="space-y-3 pt-2">
                  <Label className="text-red-400/80 text-xs uppercase tracking-wider font-semibold flex items-center gap-2"><AlertTriangle size={12} /> {t.common.dangerZone}</Label>
                  <div className="grid grid-cols-2 gap-3">
                     <Button variant="outline" onClick={() => setShowLogoutConfirm(true)} className="border-white/5 bg-white/[0.02] text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 h-10 text-xs transition-all"><LogOut size={14} className="mr-2" />{t.common.logout}</Button>
                     <Button variant="outline" onClick={() => setShowDeleteConfirm(true)} className="border-white/5 bg-white/[0.02] text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 h-10 text-xs transition-all">{t.common.deleteAccount}</Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="p-6 pt-4 bg-[#1a1d2e] border-t border-white/5 flex justify-end gap-3 z-10">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-slate-200 hover:bg-white/5">{t.common.cancel}</Button>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[120px] shadow-lg shadow-indigo-900/20">{t.common.save}</Button>
          </div>

        </DialogContent>
      </Dialog>

      {/* Logout Confirmation */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.modals.logoutTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">{t.modals.logoutDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-indigo-600 hover:bg-indigo-500 text-white">{t.common.logout}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">{t.modals.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">{t.modals.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-500 text-white border-none">{t.common.deleteAccount}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Subscription Confirmation */}
      <AlertDialog open={showCancelSubConfirm} onOpenChange={setShowCancelSubConfirm}>
        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>{t.upgrade.confirmCancelTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">{t.upgrade.confirmCancelDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white">{t.upgrade.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSubscription} className="bg-red-600 hover:bg-red-500 text-white border-none">{t.upgrade.confirmCancelTitle}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

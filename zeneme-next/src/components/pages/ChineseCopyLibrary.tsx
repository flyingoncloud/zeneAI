import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { useZenemeStore } from '../../hooks/useZenemeStore';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export const ChineseCopyLibrary: React.FC = () => {
  const { t } = useZenemeStore();

  return (
    <div className="p-8 space-y-12 bg-[#050505] min-h-screen text-slate-200 overflow-y-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">中文文案库 (Chinese Copy Library)</h1>
        <p className="text-slate-400">全局标准化文案与组件示例，确保“纯中文”体验。</p>
      </div>

      {/* 1. 通用按钮 */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-violet-300 border-b border-white/10 pb-2">1. 通用按钮 (Common Buttons)</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button>{t.common.confirm}</Button>
          <Button variant="secondary">{t.common.save}</Button>
          <Button variant="outline">{t.common.cancel}</Button>
          <Button variant="ghost">{t.common.back}</Button>
          <Button variant="destructive">{t.common.deleteAccount}</Button>
          <Button disabled>{t.common.loading}</Button>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
           <Button variant="outline" size="sm">{t.common.close}</Button>
           <Button variant="outline" size="sm">{t.common.continue}</Button>
           <Button variant="outline" size="sm">{t.common.finish}</Button>
           <Button variant="outline" size="sm">{t.modals.later}</Button>
        </div>
      </section>

      {/* 2. 通用状态 */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-violet-300 border-b border-white/10 pb-2">2. 通用状态 (Common Status)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-slate-900/50 border-white/10 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-sm">{t.common.completed}</span>
          </Card>
          <Card className="p-4 bg-slate-900/50 border-white/10 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
             <span className="text-sm">{t.common.generating}</span>
          </Card>
          <Card className="p-4 bg-slate-900/50 border-white/10 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-red-500" />
             <span className="text-sm">{t.common.error}</span>
          </Card>
          <Card className="p-4 bg-slate-900/50 border-white/10 flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-slate-500" />
             <span className="text-sm">{t.common.empty}</span>
          </Card>
        </div>
      </section>

      {/* 3. 标签与徽章 */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-violet-300 border-b border-white/10 pb-2">3. 标签与徽章 (Badges)</h2>
        <div className="flex gap-4">
          <Badge className="bg-indigo-500/20 text-indigo-300">{t.common.proMember}</Badge>
          <Badge variant="outline" className="text-slate-400">{t.common.freeAccount}</Badge>
          <Badge className="bg-emerald-500/20 text-emerald-300">{t.common.verified}</Badge>
          <Badge variant="destructive">{t.common.dangerZone}</Badge>
        </div>
      </section>

      {/* 4. 通用表单 */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-violet-300 border-b border-white/10 pb-2">4. 通用表单 (Forms)</h2>
        <div className="max-w-md space-y-4">
           <Input placeholder={t.chat.placeholder} />
           <Input placeholder={t.common.username} />
           <Input type="password" placeholder={t.common.password} />
           <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
              <AlertTriangle size={16} />
              {t.common.failed}
           </div>
        </div>
      </section>

      {/* 5. 弹窗模板预览 */}
      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-violet-300 border-b border-white/10 pb-2">5. 弹窗文案 (Modals Copy)</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 bg-slate-900 border-white/10">
            <h3 className="font-bold text-white mb-2">{t.modals.logoutTitle}</h3>
            <p className="text-slate-400 text-sm mb-4">{t.modals.logoutDesc}</p>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost">{t.common.cancel}</Button>
              <Button size="sm" className="bg-indigo-600">{t.common.logout}</Button>
            </div>
          </Card>

          <Card className="p-6 bg-slate-900 border-white/10">
            <h3 className="font-bold text-red-400 mb-2">{t.modals.deleteTitle}</h3>
            <p className="text-slate-400 text-sm mb-4">{t.modals.deleteDesc}</p>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost">{t.common.cancel}</Button>
              <Button size="sm" variant="destructive">{t.common.deleteAccount}</Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

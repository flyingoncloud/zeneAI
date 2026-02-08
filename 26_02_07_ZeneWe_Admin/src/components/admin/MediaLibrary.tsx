import React, { useState } from 'react';
import { useAdminStore, MediaItem } from '../../hooks/useAdminStore';
import { Search, Upload, Image as ImageIcon, Video, Trash2, ExternalLink, X, Grid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const MediaLibrary: React.FC = () => {
  const { mediaItems } = useAdminStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [showUploadToast, setShowUploadToast] = useState(false);

  const filtered = mediaItems.filter(m => {
    if (filter !== 'all' && m.type !== filter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleUpload = () => {
    setShowUploadToast(true);
    setTimeout(() => setShowUploadToast(false), 2500);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl text-white">媒体库</h1>
            <p className="text-xs text-slate-500 mt-1">管理题目使用的图片和视频资源</p>
          </div>
          <button onClick={handleUpload} className="h-9 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm flex items-center gap-2 hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-600/20 cursor-pointer">
            <Upload size={16} /> 上传文件
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[320px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索文件名…"
              className="w-full h-9 pl-9 pr-4 bg-[#13141A] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/40 transition-colors"
            />
          </div>

          <div className="flex items-center bg-[#13141A] border border-white/[0.06] rounded-lg overflow-hidden">
            {(['all', 'image', 'video'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-9 px-3 text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${filter === f ? 'bg-violet-500/15 text-violet-300' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {f === 'all' ? '全部' : f === 'image' ? <><ImageIcon size={12} /> 图片</> : <><Video size={12} /> 视频</>}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-[#13141A] border border-white/[0.06] rounded-lg overflow-hidden ml-auto">
            <button onClick={() => setViewMode('grid')} className={`h-9 px-2.5 transition-colors cursor-pointer ${viewMode === 'grid' ? 'text-violet-300 bg-violet-500/15' : 'text-slate-500 hover:text-slate-300'}`}>
              <Grid size={14} />
            </button>
            <button onClick={() => setViewMode('list')} className={`h-9 px-2.5 transition-colors cursor-pointer ${viewMode === 'list' ? 'text-violet-300 bg-violet-500/15' : 'text-slate-500 hover:text-slate-300'}`}>
              <List size={14} />
            </button>
          </div>

          <span className="text-sm text-slate-500">{filtered.length} 项</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-4 gap-4">
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => setPreviewItem(item)}
                className="group bg-[#13141A] border border-white/[0.06] rounded-xl overflow-hidden hover:border-violet-500/30 transition-all cursor-pointer"
              >
                <div className="aspect-video bg-black/30 relative overflow-hidden">
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-500/10 to-rose-600/5">
                      <Video size={28} className="text-rose-400/40" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-[10px] text-white backdrop-blur-sm">{item.type === 'image' ? 'IMG' : 'VID'}</span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-slate-300 truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-600 mt-1">{item.size} · {item.uploadedAt}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => setPreviewItem(item)}
                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/30 shrink-0 border border-white/[0.04]">
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Video size={18} className="text-rose-400/40" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200 truncate">{item.name}</p>
                  <p className="text-[11px] text-slate-500">{item.size} · {item.uploadedAt}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] border ${item.type === 'image' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' : 'text-rose-400 bg-rose-500/10 border-rose-500/20'}`}>
                  {item.type === 'image' ? 'Image' : 'Video'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setPreviewItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1A1B23] border border-white/[0.08] rounded-2xl w-full max-w-[600px] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
                <p className="text-sm text-white truncate">{previewItem.name}</p>
                <button onClick={() => setPreviewItem(null)} className="w-7 h-7 rounded-lg hover:bg-white/5 flex items-center justify-center text-slate-400 cursor-pointer"><X size={16} /></button>
              </div>
              <div className="aspect-video bg-black">
                {previewItem.type === 'image' ? (
                  <img src={previewItem.url} alt="" className="w-full h-full object-contain" />
                ) : (
                  <video src={previewItem.url} controls className="w-full h-full" />
                )}
              </div>
              <div className="px-5 py-3 flex items-center justify-between text-xs text-slate-500">
                <span>{previewItem.size} · {previewItem.uploadedAt}</span>
                <a href={previewItem.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-violet-400 hover:text-violet-300">
                  Open <ExternalLink size={11} />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Toast */}
      <AnimatePresence>
        {showUploadToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1A1B23] border border-white/[0.08] rounded-xl px-5 py-3 shadow-2xl"
          >
            <span className="text-sm text-white">上传功能（Demo 模式）</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import { useAdminStore, MediaItem } from '@/hooks/useAdminStore';
import { Search, Upload, Image as ImageIcon, Video, Trash2, ExternalLink, X, Grid, List, Loader2, CheckCircle2, AlertCircle, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const MediaLibrary: React.FC = () => {
  const { mediaItems, addMediaItem, removeMediaItem, reloadMediaItems } = useAdminStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = mediaItems.filter(m => {
    if (filter !== 'all' && m.type !== filter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    const validTypes = [...validImageTypes, ...validVideoTypes];

    if (!validTypes.includes(file.type)) {
      showToast('不支持的文件类型。请上传图片（JPG, PNG, WebP, GIF）或视频（MP4, WebM, OGG）', 'error');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast('文件太大。最大支持 10MB', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload to backend
      const response = await fetch(`${API_BASE_URL}/api/zene/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || '上传失败');
      }

      // Check if it's a duplicate
      if (data.duplicate) {
        showToast('文件已存在，已使用现有文件', 'success');
        // Reload media items to show the existing file
        await reloadMediaItems();
      } else {
        showToast('上传成功！', 'success');

        // Determine media type
        const mediaType: 'image' | 'video' = validImageTypes.includes(file.type) ? 'image' : 'video';

        // Format file size
        const formatSize = (bytes: number) => {
          if (bytes < 1024) return `${bytes} B`;
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
          return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        };

        // Add to media items
        const newMediaItem: MediaItem = {
          id: data.url, // Use URL as ID
          url: data.url,
          name: file.name,
          type: mediaType,
          size: formatSize(file.size),
          uploadedAt: new Date().toISOString().slice(0, 10),
        };

        addMediaItem(newMediaItem);
      }

      setUploadProgress(100);

    } catch (error) {
      console.error('Upload error:', error);
      showToast(error instanceof Error ? error.message : '上传失败', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`确认删除 ${item.name}？`)) return;

    try {
      // Call backend delete endpoint
      const response = await fetch(`${API_BASE_URL}/api/admin/media${item.url}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      // Remove from local state
      removeMediaItem(item.id);
      showToast('已删除', 'success');

      if (previewItem?.id === item.id) {
        setPreviewItem(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      showToast('删除失败', 'error');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast('URL 已复制到剪贴板', 'success');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#F7F8FC]">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl text-[#111827] font-bold">媒体库</h1>
            <p className="text-xs text-[#6B7280] mt-1">管理题目使用的图片和视频资源</p>
          </div>
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium flex items-center gap-2 hover:shadow-lg hover:shadow-violet-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> 上传中...
              </>
            ) : (
              <>
                <Upload size={16} /> 上传文件
              </>
            )}
          </button>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="mb-4 bg-white border border-[#E6EAF2] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#6B7280]">上传进度</span>
              <span className="text-xs text-violet-600 font-bold">{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#F3F5FA] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-[320px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索文件名…"
              className="w-full h-9 pl-9 pr-4 bg-white border border-[#E6EAF2] rounded-lg text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-violet-500/40 transition-colors shadow-sm"
            />
          </div>

          <div className="flex items-center bg-white border border-[#E6EAF2] rounded-lg overflow-hidden shadow-sm">
            {(['all', 'image', 'video'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-9 px-3 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${filter === f ? 'bg-violet-50 text-violet-600' : 'text-[#6B7280] hover:bg-gray-50'}`}
              >
                {f === 'all' ? '全部' : f === 'image' ? <><ImageIcon size={12} /> 图片</> : <><Video size={12} /> 视频</>}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-white border border-[#E6EAF2] rounded-lg overflow-hidden ml-auto shadow-sm">
            <button onClick={() => setViewMode('grid')} className={`h-9 px-2.5 transition-colors cursor-pointer ${viewMode === 'grid' ? 'text-violet-600 bg-violet-50' : 'text-[#6B7280] hover:bg-gray-50'}`}>
              <Grid size={14} />
            </button>
            <button onClick={() => setViewMode('list')} className={`h-9 px-2.5 transition-colors cursor-pointer ${viewMode === 'list' ? 'text-violet-600 bg-violet-50' : 'text-[#6B7280] hover:bg-gray-50'}`}>
              <List size={14} />
            </button>
          </div>

          <span className="text-sm text-[#6B7280] font-medium">{filtered.length} 项</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white rounded-2xl border border-dashed border-[#E6EAF2]">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <ImageIcon size={28} className="text-violet-200" />
            </div>
            <p className="text-[#111827] font-semibold text-sm mb-1">暂无媒体文件</p>
            <p className="text-[#9CA3AF] text-xs font-medium">点击上传文件按钮添加图片或视频</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-4 gap-4">
            {filtered.map(item => (
              <div
                key={item.id}
                className="group bg-white border border-[#E6EAF2] rounded-xl overflow-hidden hover:border-violet-500/30 hover:shadow-lg transition-all"
              >
                <div
                  className="aspect-video bg-[#F9FAFB] relative overflow-hidden cursor-pointer"
                  onClick={() => setPreviewItem(item)}
                >
                  {item.type === 'image' ? (
                    <img src={`${API_BASE_URL}${item.url}`} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-50 to-rose-100/50">
                      <Video size={28} className="text-rose-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="px-1.5 py-0.5 rounded-md bg-white/90 text-[10px] text-[#111827] font-bold shadow-sm border border-[#E6EAF2]">{item.type === 'image' ? 'IMG' : 'VID'}</span>
                  </div>
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      className="w-7 h-7 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-[#374151] font-semibold truncate">{item.name}</p>
                  <p className="text-[10px] text-[#9CA3AF] font-medium mt-1">{item.size} · {item.uploadedAt}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#E6EAF2] rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-[#E6EAF2]">
              {filtered.map(item => (
                <div
                  key={item.id}
                  className="group flex items-center gap-4 p-3 hover:bg-[#F9FBFF] transition-colors"
                >
                  <div
                    className="w-12 h-12 rounded-lg overflow-hidden bg-[#F9FAFB] shrink-0 border border-[#E6EAF2] cursor-pointer"
                    onClick={() => setPreviewItem(item)}
                  >
                    {item.type === 'image' ? (
                      <img src={`${API_BASE_URL}${item.url}`} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-rose-50"><Video size={18} className="text-rose-300" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#374151] font-semibold truncate">{item.name}</p>
                    <p className="text-[11px] text-[#9CA3AF] font-medium">{item.size} · {item.uploadedAt}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.type === 'image' ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-rose-600 bg-rose-50 border-rose-100'}`}>
                    {item.type === 'image' ? 'Image' : 'Video'}
                  </span>
                  <button
                    onClick={() => handleDelete(item)}
                    className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-[#111827]/40 backdrop-blur-sm"
            onClick={() => setPreviewItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#E6EAF2] rounded-2xl w-full max-w-[700px] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#F1F3F7]">
                <p className="text-sm text-[#111827] font-bold truncate">{previewItem.name}</p>
                <button onClick={() => setPreviewItem(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-[#6B7280] cursor-pointer transition-colors"><X size={18} /></button>
              </div>
              <div className="aspect-video bg-[#F9FAFB] flex items-center justify-center">
                {previewItem.type === 'image' ? (
                  <img src={`${API_BASE_URL}${previewItem.url}`} alt="" className="max-w-full max-h-full object-contain shadow-sm" />
                ) : (
                  <video src={`${API_BASE_URL}${previewItem.url}`} controls className="w-full h-full" />
                )}
              </div>
              <div className="px-6 py-4 flex items-center justify-between border-t border-[#F1F3F7] bg-[#F9FAFB]/50">
                <span className="text-xs text-[#9CA3AF] font-medium">{previewItem.size} · {previewItem.uploadedAt}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyUrl(previewItem.url)}
                    className="h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-violet-200"
                  >
                    <Copy size={14} /> 复制 URL
                  </button>
                  <button
                    onClick={() => handleDelete(previewItem)}
                    className="h-9 px-4 rounded-xl bg-white border border-red-100 text-red-500 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Trash2 size={14} /> 删除
                  </button>
                  <a
                    href={previewItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-4 rounded-xl bg-white border border-[#E6EAF2] text-[#4B5563] text-xs font-bold flex items-center gap-1.5 hover:bg-gray-50 transition-all"
                  >
                    <ExternalLink size={14} /> 查看详情
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-[#111827] text-white rounded-xl px-5 py-3 shadow-2xl flex items-center gap-3"
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-400" />
            ) : (
              <AlertCircle size={18} className="text-red-400" />
            )}
            <span className="text-sm font-bold">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
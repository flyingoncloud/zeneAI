'use client';

import { useRef, useState, useEffect } from 'react';
import { ApiService } from '@/lib/api';
import SketchPad from '@/components/SketchPad';
import RiskModal from '@/components/RiskModal';

type DetectedItem = { type: 'part' | 'self'; label: string };
type Msg =
    | { role: 'user' | 'ai'; type: 'text'; content: string }
    | { role: 'user' | 'ai'; type: 'image'; url: string; content?: string };

export default function ChatBox({
    onDetect,
}: {
    onDetect?: (items: DetectedItem[]) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [messages, setMessages] = useState<Msg[]>([
        { role: 'ai', type: 'text', content: '你好，我是 ZENE AI。输入、上传/拍照/图库或点 🎤 试试～' },
    ]);
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState<'idle' | 'doing'>('idle');
    const [sessionId, setSessionId] = useState<string>('');
    const [showRiskModal, setShowRiskModal] = useState(false);
    const [riskData, setRiskData] = useState<any>(null);

    // Persist messages to localStorage
    useEffect(() => {
        try {
            const simplified = messages.map(m => ({
                role: m.role,
                type: m.type,
                content: m.content,
                url: (m as any).url,
                ts: Date.now(),
            }));
            localStorage.setItem('zene_transcript', JSON.stringify(simplified));
        } catch { }
    }, [messages]);

    // Voice recording
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [recState, setRecState] = useState<'idle' | 'recording' | 'processing'>('idle');

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
            recorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await handleAudioUpload(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setRecState('recording');
        } catch (error) {
            console.error('Recording failed:', error);
        }
    }

    function stopRecording() {
        if (mediaRecorderRef.current && recState === 'recording') {
            mediaRecorderRef.current.stop();
            setRecState('processing');
        }
    }

    async function handleAudioUpload(audioBlob: Blob) {
        try {
            const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
            const result = await ApiService.transcribeAudio(audioFile);
            
            if (result.text) {
                await sendMessage(result.text);
            }
        } catch (error) {
            console.error('Transcription failed:', error);
        } finally {
            setRecState('idle');
        }
    }

    async function sendMessage(text: string, images: string[] = []) {
        if (!text.trim() && images.length === 0) return;

        setSending(true);
        
        // Add user message
        const userMsg: Msg = images.length > 0 
            ? { role: 'user', type: 'image', url: images[0], content: text }
            : { role: 'user', type: 'text', content: text };
        
        setMessages(prev => [...prev, userMsg]);

        try {
            // Check for risk
            const riskResult = await ApiService.checkRisk({ text });
            if (riskResult.triggered) {
                setRiskData(riskResult);
                setShowRiskModal(true);
            }

            // Send to AI
            const response = await ApiService.zeneChat(text, images, sessionId);
            
            if (response.sessionId) {
                setSessionId(response.sessionId);
            }

            // Add AI response
            setMessages(prev => [...prev, {
                role: 'ai',
                type: 'text',
                content: response.reply
            }]);

            // Notify parent of detected items
            if (response.partsDetected && onDetect) {
                onDetect(response.partsDetected);
            }

        } catch (error) {
            console.error('Send message failed:', error);
            setMessages(prev => [...prev, {
                role: 'ai',
                type: 'text',
                content: '抱歉，发生了错误。请稍后再试。'
            }]);
        } finally {
            setSending(false);
        }
    }

    async function handleFileUpload(file: File) {
        if (!file) return;

        setUploading('doing');
        try {
            const result = await ApiService.uploadFile(file);
            if (result.ok) {
                await sendMessage('', [result.url]);
            }
        } catch (error) {
            console.error('File upload failed:', error);
        } finally {
            setUploading('idle');
        }
    }

    async function handleGallerySelect() {
        try {
            const result = await ApiService.getGallery();
            if (result.ok && result.items.length > 0) {
                // For demo, select first image
                await sendMessage('', [result.items[0].url]);
            }
        } catch (error) {
            console.error('Gallery fetch failed:', error);
        }
    }

    return (
        <div className="flex h-full flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.role === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-800'
                        }`}>
                            {msg.type === 'image' ? (
                                <div>
                                    <img src={msg.url} alt="Uploaded" className="rounded mb-2 max-w-full" />
                                    {msg.content && <p>{msg.content}</p>}
                                </div>
                            ) : (
                                <p>{msg.content}</p>
                            )}
                        </div>
                    </div>
                ))}
                {sending && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                            <p>思考中...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="border-t p-4">
                <div className="flex space-x-2 mb-2">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="px-3 py-1 bg-gray-200 rounded cursor-pointer">
                        📁 上传
                    </label>
                    <button onClick={handleGallerySelect} className="px-3 py-1 bg-gray-200 rounded">
                        🖼️ 图库
                    </button>
                    <button
                        onClick={recState === 'idle' ? startRecording : stopRecording}
                        className={`px-3 py-1 rounded ${
                            recState === 'recording' ? 'bg-red-500 text-white' : 'bg-gray-200'
                        }`}
                    >
                        🎤 {recState === 'recording' ? '停止' : '录音'}
                    </button>
                </div>
                
                <div className="flex space-x-2">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="输入消息..."
                        className="flex-1 border rounded-lg px-3 py-2"
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !sending) {
                                sendMessage(inputRef.current?.value || '');
                                if (inputRef.current) inputRef.current.value = '';
                            }
                        }}
                    />
                    <button
                        onClick={() => {
                            sendMessage(inputRef.current?.value || '');
                            if (inputRef.current) inputRef.current.value = '';
                        }}
                        disabled={sending}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                    >
                        发送
                    </button>
                </div>
            </div>

            {/* Risk Modal */}
            {showRiskModal && riskData && (
                <RiskModal
                    isOpen={showRiskModal}
                    onClose={() => setShowRiskModal(false)}
                    riskData={riskData}
                />
            )}
        </div>
    );
}
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream);
            mediaRecorderRef.current = mr;
            chunksRef.current = [];
            mr.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
            mr.onstop = async () => {
                setRecState('processing');
                try {
                    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                    const fd = new FormData();
                    fd.append('audio', blob, 'recording.webm');
                    const res = await fetch('/api/transcribe', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (inputRef.current) {
                        inputRef.current.value = data?.text ?? '';
                        inputRef.current.focus();
                    }
                } catch {
                    alert('语音转写失败（占位接口）。');
                } finally {
                    setRecState('idle');
                    stream.getTracks().forEach((t) => t.stop());
                }
            };
            mr.start();
            setRecState('recording');
        } catch {
            alert('无法访问麦克风，请在浏览器授权（建议用 Chrome；localhost 也可用）');
        }
    }
    function stopRecording() {
        mediaRecorderRef.current?.stop();
    }

    // 文件上传 
    async function handleUpload(file: File | null | undefined) {
        if (!file) return;
        setUploading('doing');
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            const data = await res.json();
            if (!data?.ok) return alert(data?.error ?? '上传失败');

            // 先把图片插到右侧对话
            setMessages(prev => [...prev, { role: 'user', type: 'image', url: data.url }]);
            checkImageSummary(`image:${data.url}`);

            // 再把图片事件上报给 /api/chat，触发 AI 回复 & 左侧记录
            await callChat({ images: [data.url] });

        } catch {
            alert('上传失败，请重试');
        } finally {
            setUploading('idle');
        }
    }


    // 拍照上传（黑屏修复：双重约束 + autoplay/playsInline/muted + 等待 metadata） 
    const [camOpen, setCamOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const camStreamRef = useRef<MediaStream | null>(null);

    async function openCamera() {
        try {
            let stream: MediaStream | null = null;
            // 1) 优先后置
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { exact: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
            } catch {
                // 2) 失败则回退任意可用摄像头（桌面通常只有前置）
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
            }
            camStreamRef.current = stream!;
            const v = videoRef.current!;
            v.srcObject = stream!;
            v.muted = true;        // iOS/Safari 需要静音才允许自动播放
            v.playsInline = true;  // iOS 内联播放
            // 有的浏览器需要显式 play()
            await v.play().catch(() => { });
            await new Promise<void>((resolve) => {
                if (v.readyState >= 2) resolve();
                else v.onloadedmetadata = () => resolve();
            });
            setCamOpen(true);
        } catch {
            alert('无法打开摄像头：请在浏览器右上角允许摄像头，或到系统隐私设置中给浏览器授权。移动端需 HTTPS（本地 localhost 也可用）。');
        }
    }
    function closeCamera() {
        camStreamRef.current?.getTracks().forEach((t) => t.stop());
        camStreamRef.current = null;
        setCamOpen(false);
    }
    async function takePhoto() {
        const v = videoRef.current;
        if (!v) return;
        // 防止视频尺寸为 0 导致黑图
        if (v.videoWidth === 0 || v.videoHeight === 0) {
            await new Promise((r) => setTimeout(r, 120));
        }
        const canvas = document.createElement('canvas');
        canvas.width = v.videoWidth || 1280;
        canvas.height = v.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.92));
        if (!blob) return;
        await handleUpload(new File([blob], 'camera.jpg', { type: 'image/jpeg' }));
        closeCamera();
    }

    // 画图板 
    const [sketchOpen, setSketchOpen] = useState(false);
    async function uploadBlobAsFile(blob: Blob, name = 'sketch.png') {
        const fd = new FormData();
        fd.append('file', new File([blob], name, { type: 'image/png' }));
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!data?.ok) {
            alert(data?.error ?? '上传失败');
            return;
        }

        // 插入对话
        setMessages(prev => [...prev, { role: 'user', type: 'image', url: data.url }]);
        checkImageSummary(`sketch:${data.url}`);

        // 上报给 /api/chat
        await callChat({ images: [data.url] });
    }

    // 图库（选择题） 
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [gallery, setGallery] = useState<{ id: string; url: string }[]>([]);
    const [loadingGallery, setLoadingGallery] = useState(false);

    async function openGallery() {
        setGalleryOpen(true);
        if (gallery.length) return;
        setLoadingGallery(true);
        try {
            const res = await fetch('/api/gallery');
            const data = await res.json();
            setGallery(data?.items ?? []);
        } catch {
            alert('加载图库失败');
        } finally {
            setLoadingGallery(false);
        }
    }
    function chooseFromGallery(url: string) {
        // 右侧插入图片气泡
        setMessages(prev => [...prev, { role: 'user', type: 'image', url }]);
        setGalleryOpen(false);

        checkImageSummary(`gallery:${url}`);

        // 上报给 /api/chat
        callChat({ images: [url] });
    }

    // callChat
    // 统一把文本/图片上报到 /api/chat，并把 AI 回复+左侧记录更新掉
    async function callChat(payload: { message?: string; images?: string[] }) {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();

        // 右侧追加 AI 回复气泡
        setMessages(prev => [
            ...prev,
            { role: 'ai', type: 'text', content: data.reply ?? '(无回复)' },
        ]);

        // 左侧实时记录
        if (Array.isArray(data.partsDetected) && data.partsDetected.length) {
            onDetect?.(data.partsDetected as { type: 'part' | 'self'; label: string }[]);
        }
    }

    // 文本发送 
    async function send() {
        const text = inputRef.current?.value ?? '';
        if (!text.trim()) return;

        setMessages((prev) => [...prev, { role: 'user', type: 'text', content: text }]);
        setTimeout(() => checkText(text, 'chat'), 0);
        if (inputRef.current) inputRef.current.value = '';
        setSending(true);
        try {
            await callChat({ message: text });
        } finally {
            setSending(false);
        }
    }

    // 工具条
    function ToolsBar() {
        return (
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-700">
                <label className="cursor-pointer rounded-md border px-2 py-1">
                    上传图片
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
                    />
                </label>
                <button className="rounded-md border px-2 py-1" onClick={openCamera}>
                    拍照上传
                </button>
                <button className="rounded-md border px-2 py-1" onClick={() => setSketchOpen(true)}>
                    画板
                </button>
                <button className="rounded-md border px-2 py-1" onClick={openGallery}>
                    图库
                </button>
                {uploading === 'doing' && <span className="text-zinc-400">上传中…</span>}
            </div>
        );
    }

    return (
        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
            {/* 聊天区 */}
            <div className="h-72 overflow-y-auto rounded-lg bg-zinc-50 p-3">
                {messages.map((m, i) => {
                    const isUser = m.role === 'user';
                    return (
                        <div key={i} className={`mb-2 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[70%] overflow-hidden rounded-2xl px-3 py-2 text-sm ${isUser ? 'bg-zinc-900 text-white' : 'bg-white border'
                                    }`}
                            >
                                {m.type === 'text' ? (
                                    m.content
                                ) : (
                                    <img
                                        src={m.url}
                                        alt="uploaded"
                                        className="rounded-lg border bg-white"
                                        style={{ maxWidth: 260, maxHeight: 260 }}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 工具条 */}
            <ToolsBar />

            {/* 输入行 */}
            <div className="flex items-center gap-2">
                <button
                    onClick={recState === 'recording' ? stopRecording : startRecording}
                    className={`rounded-xl border px-3 py-2 text-sm ${recState === 'recording' ? 'bg-red-600 text-white border-red-600' : ''
                        }`}
                    title="语音输入"
                >
                    {recState === 'recording' ? '停止🎤' : '🎤 语音'}
                </button>

                <input
                    ref={inputRef}
                    placeholder={recState === 'processing' ? '转写中…' : '输入消息…'}
                    disabled={recState === 'processing'}
                    className="flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-300"
                />
                <button
                    className="rounded-xl bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
                    onClick={send}
                    disabled={sending}
                >
                    {sending ? '发送中…' : '发送'}
                </button>
            </div>

            {/* 拍照弹层 */}
            {camOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="w-[90vw] max-w-md rounded-2xl bg-white p-4 space-y-3">
                        <video
                            ref={videoRef}
                            className="w-full rounded-lg bg-black"
                            muted
                            playsInline
                            autoPlay
                        />
                        <div className="flex justify-between">
                            <button className="rounded-xl border px-4 py-2" onClick={closeCamera}>
                                取消
                            </button>
                            <button className="rounded-xl bg-zinc-900 px-4 py-2 text-white" onClick={takePhoto}>
                                拍照
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 画板弹层 */}
            <SketchPad
                open={sketchOpen}
                onClose={() => setSketchOpen(false)}
                onExport={uploadBlobAsFile}
            />

            {/* 图库弹层 */}
            {galleryOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="w-[92vw] max-w-4xl rounded-2xl bg-white p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">选择一张题图</h3>
                            <button className="rounded-xl border px-3 py-1" onClick={() => setGalleryOpen(false)}>
                                关闭
                            </button>
                        </div>
                        {loadingGallery ? (
                            <div className="p-8 text-center text-zinc-500">加载中…</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                                {gallery.map((g) => (
                                    <button
                                        key={g.id}
                                        className="overflow-hidden rounded-lg border hover:shadow"
                                        onClick={() => chooseFromGallery(g.url)}
                                        title="点击选择"
                                    >
                                        <img src={g.url} className="h-40 w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <RiskModal
                open={modal.open}
                data={modal.data}
                onClose={() => setModal({ open: false })}
                onAction={(a) => {
                    setModal({ open: false });
                    if (a === 'report') {
                        location.assign('/report');
                    } else if (a === 'exercise') {
                        // TODO: 打开你的调节练习面板（如 setGuidanceOpen(true)）
                    }
                    // 'continue' 什么也不做
                }}
            />
        </div>

    );
}



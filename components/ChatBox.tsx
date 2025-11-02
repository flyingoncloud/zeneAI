'use client';

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ApiService } from '@/lib/api';

type DetectedItem = { type: 'part' | 'self'; label: string };
type Msg = {
    role: 'user' | 'ai';
    type: 'text' | 'image';
    content: string;
    url?: string;
};

const ChatBox = forwardRef<any, {
    onDetect?: (items: DetectedItem[]) => void;
    onGalleryOpen?: () => void;
    onCanvasOpen?: () => void;
}>(({ onDetect, onGalleryOpen, onCanvasOpen }, ref) => {
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [messages, setMessages] = useState<Msg[]>([]);
    const [sending, setSending] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');

    // Stream text effect
    const streamText = (text: string, callback: (chunk: string) => void) => {
        setStreaming(true);
        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) {
                callback(text.slice(0, index + 1));
                index++;
            } else {
                clearInterval(interval);
                setStreaming(false);
            }
        }, 30); // 30ms per character
    };

    // Fetch greeting message on component mount
    useEffect(() => {
        const fetchGreeting = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/zene/greeting`);
                const data = await response.json();
                if (data.ok) {
                    setMessages([{ role: 'ai', type: 'text', content: data.message }]);
                } else {
                    setMessages([{ role: 'ai', type: 'text', content: '你好，我是 ZENE AI。请输入您的消息开始对话。' }]);
                }
            } catch (error) {
                setMessages([{ role: 'ai', type: 'text', content: '你好，我是 ZENE AI。请输入您的消息开始对话。' }]);
            }
        };
        
        fetchGreeting();
    }, []);

    // Test backend connection on component mount
    useEffect(() => {
        const testConnection = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/zene/gallery');
                if (response.ok) {
                    console.log('✅ Backend connection successful');
                } else {
                    console.warn('⚠️ Backend responded with error:', response.status);
                }
            } catch (error) {
                console.error('❌ Backend connection failed:', error);
                setMessages(prev => [...prev, {
                    role: 'ai',
                    type: 'text',
                    content: '⚠️ 无法连接到后端服务。请确保后端运行在 http://localhost:8080'
                }]);
            }
        };
        
        testConnection();
    }, []);

    // Persist messages to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('zene_transcript', JSON.stringify(messages));
        } catch (error) {
            console.error('Failed to save transcript:', error);
        }
    }, [messages]);

    async function sendMessage(text: string, images: string[] = []) {
        if (!text.trim() && images.length === 0) return;

        setSending(true);
        
        // Add user message
        const userMsg: Msg = {
            role: 'user',
            type: images.length > 0 ? 'image' : 'text',
            content: text,
            url: images[0]
        };
        
        console.log('Adding user message:', userMsg); // Debug log
        
        setMessages(prev => [...prev, userMsg]);

        try {
            // First try the zene chat API for IFS therapy
            let response;
            try {
                response = await ApiService.zeneChat(text, images, sessionId);
                
                if (response.sessionId) {
                    setSessionId(response.sessionId);
                }

                // Add AI response with streaming effect
                const aiMsg: Msg = {
                    role: 'ai',
                    type: 'text',
                    content: ''
                };
                
                setMessages(prev => [...prev, aiMsg]);
                
                // Stream the response
                const responseText = response.reply || '抱歉，我现在无法回应。请稍后再试。';
                streamText(responseText, (chunk) => {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = {
                            ...aiMsg,
                            content: chunk
                        };
                        return newMessages;
                    });
                });

                // Notify parent of detected items
                if (response.partsDetected && onDetect) {
                    onDetect(response.partsDetected);
                }
            } catch (zeneError) {
                console.log('Zene API failed, trying regular chat API:', zeneError);
                
                // Fallback to regular chat API that uses OpenAI
                response = await ApiService.sendMessage(text);
                
                const fallbackMsg: Msg = {
                    role: 'ai',
                    type: 'text',
                    content: ''
                };
                
                setMessages(prev => [...prev, fallbackMsg]);
                
                const fallbackText = response.response || response.message || '抱歉，我现在无法回应。请稍后再试。';
                streamText(fallbackText, (chunk) => {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = {
                            ...fallbackMsg,
                            content: chunk
                        };
                        return newMessages;
                    });
                });
            }

        } catch (error) {
            console.error('All APIs failed:', error);
            const errorMsg: Msg = {
                role: 'ai',
                type: 'text',
                content: ''
            };
            
            setMessages(prev => [...prev, errorMsg]);
            
            const errorText = `连接后端失败。请确保后端服务运行在 http://localhost:8080。错误: ${error}`;
            streamText(errorText, (chunk) => {
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                        ...errorMsg,
                        content: chunk
                    };
                    return newMessages;
                });
            });
        } finally {
            setSending(false);
        }
    }

    async function handleGalleryImage(imageUrl: string) {
        console.log('handleGalleryImage called with:', imageUrl);
        await sendMessage('请分析这张图片中表达的情感和感受', [imageUrl]);
    }

    // Expose handleGalleryImage to parent via ref
    useImperativeHandle(ref, () => ({
        handleGalleryImage
    }));

    async function handleFileUpload(file: File) {
        if (!file) return;

        try {
            // Upload file to backend
            const result = await ApiService.uploadFile(file);
            if (result.ok) {
                // Convert relative URL to full URL for display
                const fullImageUrl = result.url.startsWith('http') 
                    ? result.url 
                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}${result.url}`;
                
                console.log('Image URL:', fullImageUrl); // Debug log
                
                // Send the uploaded image URL to AI for analysis
                await sendMessage('请分析这张图片中表达的情感和感受', [fullImageUrl]);
            } else {
                console.error('File upload failed:', result);
                setMessages(prev => [...prev, {
                    role: 'ai',
                    type: 'text',
                    content: '图片上传失败，请重试。'
                }]);
            }
        } catch (error) {
            console.error('File upload failed:', error);
            setMessages(prev => [...prev, {
                role: 'ai',
                type: 'text',
                content: '图片上传失败，请重试。'
            }]);
        }
    }

    return (
        <div className="h-full w-full flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-2xl px-4 py-2 rounded-lg ${
                            msg.role === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 text-gray-800'
                        }`}>
                            {msg.type === 'image' && msg.url ? (
                                <div>
                                    <img 
                                        src={msg.url} 
                                        alt="Uploaded" 
                                        className="rounded mb-2 max-w-xs max-h-64 object-cover" 
                                        onError={(e) => {
                                            console.error('Image failed to load:', msg.url);
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    {msg.content && <p>{msg.content}</p>}
                                </div>
                            ) : (
                                <p>{msg.content}</p>
                            )}
                        </div>
                    </div>
                ))}
                {(sending || streaming) && (
                    <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                            <p>思考中...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
                <div className="w-full px-2">
                    {/* Upload, Gallery, and Canvas buttons */}
                    <div className="mb-3 flex gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                            📎 Upload photos
                        </label>
                        <button
                            onClick={onGalleryOpen}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                        >
                            🖼️ Image Gallery
                        </button>
                        <button
                            onClick={onCanvasOpen}
                            className="inline-flex items-center px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                        >
                            🎨 Canvas
                        </button>
                    </div>
                    
                    {/* Input container */}
                    <div className="relative flex items-end bg-white border border-gray-300 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <textarea
                            ref={inputRef}
                            placeholder="输入消息..."
                            rows={1}
                            className="flex-1 resize-none border-0 bg-transparent px-4 py-3 text-base placeholder-gray-500 focus:outline-none focus:ring-0 max-h-32 overflow-y-auto"
                            style={{ minHeight: '44px' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !sending && !streaming) {
                                    e.preventDefault();
                                    sendMessage(inputRef.current?.value || '');
                                    if (inputRef.current) {
                                        inputRef.current.value = '';
                                        inputRef.current.style.height = 'auto';
                                    }
                                }
                            }}
                        />
                        <button
                            onClick={() => {
                                if (!sending && !streaming) {
                                    sendMessage(inputRef.current?.value || '');
                                    if (inputRef.current) {
                                        inputRef.current.value = '';
                                        inputRef.current.style.height = 'auto';
                                    }
                                }
                            }}
                            disabled={sending || streaming}
                            className="m-1.5 p-1.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white rounded-lg transition-colors flex-shrink-0"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-2 text-center">按 Enter 发送，Shift+Enter 换行</p>
                </div>
            </div>
        </div>
    );
});

ChatBox.displayName = 'ChatBox';

export default ChatBox;

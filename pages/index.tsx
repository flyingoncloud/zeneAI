import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Send, Bot, User, LogOut } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [useStreaming, setUseStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    
    console.log('Token from localStorage:', token ? 'exists' : 'missing');
    console.log('Username from localStorage:', storedUsername);
    
    if (!token || !storedUsername) {
      console.log('No token or username, redirecting to login');
      router.push('/login');
      return;
    }
    
    setUsername(storedUsername);
    
    // Test backend connectivity
    fetch('http://localhost:8080/api/debug')
      .then(response => response.json())
      .then(data => console.log('Backend connectivity test:', data))
      .catch(error => console.error('Backend connectivity failed:', error));
    
    loadMessages(token);
  }, []);

  const loadMessages = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8080/api/messages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMessages(data.map((msg: any) => ({ role: msg.role, content: msg.content })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    router.push('/login');
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    console.log('Sending message:', input);
    
    const messageText = input;
    setInput('');
    setLoading(true);

    if (useStreaming) {
      // Streaming mode - use fetch with stream instead of EventSource for auth headers
      try {
        fetch('http://localhost:8080/api/chat/stream?message=' + encodeURIComponent(messageText), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
          }
        }).then(response => {
          if (!response.ok) {
            throw new Error('Stream request failed');
          }
          
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No reader available');
          }
          
          let streamedContent = '';
          const assistantMessage: Message = { role: 'assistant', content: '' };
          setMessages(prev => [...prev, assistantMessage]);
          
          const readStream = () => {
            reader.read().then(({ done, value }) => {
              if (done) {
                setLoading(false);
                return;
              }
              
              const chunk = new TextDecoder().decode(value);
              // Parse Server-Sent Events format and remove 'data:' prefix
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data:')) {
                  const content = line.substring(5); // Remove 'data:' prefix
                  if (content.trim()) {
                    streamedContent += content;
                  }
                }
              }
              
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'assistant', content: streamedContent };
                return newMessages;
              });
              
              readStream();
            }).catch(error => {
              console.error('Stream reading error:', error);
              setLoading(false);
            });
          };
          
          readStream();
        }).catch(error => {
          console.error('Streaming error:', error);
          setMessages(prev => [...prev, { role: 'assistant', content: 'Error with streaming: ' + error.message }]);
          setLoading(false);
        });
      } catch (error) {
        console.error('Streaming setup error:', error);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Error setting up stream' }]);
        setLoading(false);
      }
    } else {
      // Regular mode
      try {
        console.log('Making API call to backend...');
        const response = await fetch('http://localhost:8080/api/chat', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ message: messageText })
        });
        
        console.log('Backend response status:', response.status);
        const data = await response.json();
        console.log('Backend response data:', data);
        
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } catch (error) {
        console.error('Error calling backend:', error);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">ZeneAI</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Welcome, {username}</span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
              className="rounded"
            />
            Streaming
          </label>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg">How can I help you today?</p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-2xl px-4 py-3 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-black text-white' 
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              
              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Send a message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

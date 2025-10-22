const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiService {
  private static async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  }

  // Auth APIs
  static async login(username: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  static async register(username: string, password: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // Chat APIs
  static async sendMessage(message: string) {
    return this.request('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Zene IFS APIs
  static async zeneChat(message: string, images: string[] = [], sessionId?: string) {
    return this.request('/api/zene/chat', {
      method: 'POST',
      body: JSON.stringify({ message, images, sessionId }),
    });
  }

  static async transcribeAudio(audioFile: File) {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    return fetch(`${API_URL}/api/zene/transcribe`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  }

  static async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    return fetch(`${API_URL}/api/zene/upload`, {
      method: 'POST',
      body: formData,
    }).then(res => res.json());
  }

  static async getSuggestions(transcript: string[], self: string[], parts: string[]) {
    return this.request('/api/zene/suggest', {
      method: 'POST',
      body: JSON.stringify({ transcript, self, parts }),
    });
  }

  static async getGallery() {
    return this.request('/api/zene/gallery');
  }

  static async checkRisk(content: string) {
    return this.request('/api/zene/risk', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }
}

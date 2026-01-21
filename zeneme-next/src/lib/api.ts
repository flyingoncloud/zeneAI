/**
 * API Client for ZeneAI Backend
 *
 * This module handles all API calls to the ai-chat-api Python FastAPI server.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ChatRequest {
  message: string;
  session_id?: string;
  images?: string[];
  user_id?: string | null;
}

export interface Message {
  id: number;
  role: string;
  content: string;
  created_at: string;
  extra_data?: any;
}

export interface ModuleRecommendation {
  module_id: string;
  name: string;
  icon: string;
  description: string;
  reasoning?: string;
  priority?: number;
}

export interface ChatResponse {
  session_id: string;
  conversation_id: number;
  user_message: Message;
  assistant_message: Message;
  recommended_modules?: ModuleRecommendation[];
  reply?: string;
  module_status?: Record<string, any>;
}

export interface UploadResponse {
  ok: boolean;
  url?: string;
  mime?: string;
  size?: number;
  error?: string;
}

export interface TranscribeResponse {
  text?: string;
  error?: string;
}

export interface RiskCheckRequest {
  text: string;
  imageSummary?: string;
}

export interface RiskCheckResponse {
  triggered: boolean;
  level?: 'strong' | 'weak';
  signals?: string[];
  cooldownSec?: number;
}

export interface AnalyzeImageRequest {
  imageUrl: string;
}

export interface AnalyzeImageResponse {
  ok: boolean;
  analysis?: string;
  error?: string;
}

/**
 * Send a chat message to the backend
 * Generates or retrieves a user ID and includes it in the request
 */
const USER_ID_STORAGE_KEY = 'zeneme_user_id';

function getOrCreateUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  const existing = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (existing) return existing;

  const newId =
    window.crypto?.randomUUID?.() ??
    `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  window.localStorage.setItem(USER_ID_STORAGE_KEY, newId);
  return newId;
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    console.log('[API] Sending chat message to:', `${API_BASE_URL}/chat/`);
    const defaultUserId = getOrCreateUserId();
    const response = await fetch(`${API_BASE_URL}/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
      // 如果页面没传 user_id，就用本地默认虚拟用户
      user_id: request.user_id ?? defaultUserId ?? null,
    });

    console.log('[API] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('[API] Response data keys:', Object.keys(data));
    return data;
  } catch (error) {
    console.error('[API] Error sending chat message:', error);
    throw error;
  }
}

/**
 * Upload a file (image) to the backend
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/zene/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Transcribe audio to text
 */
export async function transcribeAudio(audioFile: File): Promise<TranscribeResponse> {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch(`${API_BASE_URL}/api/zene/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
}

/**
 * Check for risk signals in text/image
 */
export async function checkRisk(request: RiskCheckRequest): Promise<RiskCheckResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/zene/risk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking risk:', error);
    throw error;
  }
}

/**
 * Analyze an image with AI
 */
export async function analyzeImage(request: AnalyzeImageRequest): Promise<AnalyzeImageResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/zene/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
}

/**
 * Upload sketch image and get AI analysis
 * Automatically completes the inner_doodling module if conversation_id is provided
 */
export interface UploadSketchResponse {
  ok: boolean;
  analysis: string;
  file_uri: string;
  message: string;
  module_status?: Record<string, any>;
}

export async function uploadSketch(
  blob: Blob,
  conversationId?: number,
  prompt: string = "请分析这张内视涂鸦，描述你看到的内容、情绪和可能的心理意义。"
): Promise<UploadSketchResponse> {
  try {
    const formData = new FormData();
    formData.append('file', blob, 'sketch.png');
    formData.append('prompt', prompt);
    if (conversationId) {
      formData.append('conversation_id', conversationId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/upload-sketch/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error uploading sketch:', error);
    throw error;
  }
}

/**
 * Analyze sketch image from base64 data without saving
 * Used for the "开始分析" (Analyze) button to provide immediate analysis
 */
export interface AnalyzeSketchResponse {
  ok: boolean;
  analysis: string;
}

export async function analyzeSketch(
  imageData: string,
  prompt: string = "请分析这张内视涂鸦，描述你看到的内容、情绪和可能的心理意义。"
): Promise<AnalyzeSketchResponse> {
  try {
    const formData = new FormData();
    formData.append('image_data', imageData);
    formData.append('prompt', prompt);

    const response = await fetch(`${API_BASE_URL}/analyze-sketch/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing sketch:', error);
    throw error;
  }
}

/**
 * Get gallery images
 */
export async function getGallery(): Promise<{ ok: boolean; items: Array<{ id: string; url: string }> }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/zene/gallery`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting gallery:', error);
    throw error;
  }
}

/**
 * Get greeting message
 */
export async function getGreeting(): Promise<{ ok: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/zene/greeting`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting greeting:', error);
    throw error;
  }
}

/**
 * Get suggestions based on conversation
 */
export async function getSuggestions(request: {
  transcript: string[];
  self: string[];
  parts: string[];
}): Promise<{ ok: boolean; suggestions: string[] }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/zene/suggest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting suggestions:', error);
    throw error;
  }
}

/**
 * Complete a module in a conversation
 */
export async function completeModule(
  conversationId: number,
  moduleId: string,
  completionData?: Record<string, any>
): Promise<{ ok: boolean; module_status?: Record<string, any>; error?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/conversations/${conversationId}/modules/${moduleId}/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ completion_data: completionData || {} }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { ok: true, module_status: data.module_status };
  } catch (error) {
    console.error('Error completing module:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Complete a module with retry logic
 */
export async function completeModuleWithRetry(
  conversationId: number,
  moduleId: string,
  completionData?: Record<string, any>
): Promise<{ ok: boolean; module_status?: Record<string, any>; error?: string }> {
  // First attempt
  const result = await completeModule(conversationId, moduleId, completionData);

  if (result.ok) {
    return result;
  }

  // Retry once on failure
  console.log('Retrying module completion...');
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  return await completeModule(conversationId, moduleId, completionData);
}


/**
 * Generate psychology report for a conversation
 */
export async function generateConversationReport(
  conversationId: number,
  language: string = 'zh'
): Promise<{
  ok: boolean;
  report?: {
    content: string;
    format: string;
    generated_at: string;
    completed_modules: string[];
    module_count: number;
    message_count: number;
  };
  error?: string;
  message?: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/conversations/${conversationId}/generate-report?language=${language}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating report:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: '生成报告时出现错误'
    };
  }
}

/**
 * Check if conversation is ready for report generation
 */
export async function getReportStatus(
  conversationId: number
): Promise<{
  ready: boolean;
  completed_modules: string[];
  required_modules: number;
  message_count: number;
  last_report?: any;
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/conversations/${conversationId}/report-status`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting report status:', error);
    return {
      ready: false,
      completed_modules: [],
      required_modules: 2,
      message_count: 0
    };
  }
}

// ============================================================================
// Questionnaire API Methods
// ============================================================================

export interface Questionnaire {
  id: string;
  section: string;
  title: string;
  total_questions: number;
  marking_criteria: {
    scale: string;
    total_score_range: number[];
    interpretation: Array<{
      range: number[];
      level: string;
      description: string;
    }>;
  };
}

export interface QuestionOption {
  label: string;
  value?: number;
  text?: string;
  score: number;
}

export interface QuestionnaireDetail extends Questionnaire {
  questions: Array<{
    id: number;
    text: string;
    category?: string | null;
    sub_section?: string | null;
    dimension?: string | null;
    options?: QuestionOption[];
  }>;
}

export interface QuestionnaireResponse {
  questionnaire_id: string;
  answers: Record<string, number>;
  metadata?: Record<string, any>;
}

export interface QuestionnaireSubmissionResult {
  ok: boolean;
  message?: string;
  module_completed?: string;
  scoring?: {
    total_score: number;
    category_scores?: Record<string, number>;
    interpretation?: string;
  };
  module_status?: Record<string, any>;
  report_id?: number;        // NEW
  report_status?: string;    // NEW
  error?: string;
}

/**
 * Get all available questionnaires
 */
export async function getAllQuestionnaires(): Promise<{
  ok: boolean;
  questionnaires?: Questionnaire[];
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/questionnaires`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      ok: true,
      questionnaires: data.questionnaires
    };
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get a specific questionnaire by ID
 */
export async function getQuestionnaire(questionnaireId: string): Promise<{
  ok: boolean;
  questionnaire?: QuestionnaireDetail;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/questionnaires/${questionnaireId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      ok: true,
      questionnaire: data
    };
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Submit questionnaire responses
 */
export async function submitQuestionnaireResponse(
  conversationId: number,
  response: QuestionnaireResponse
): Promise<QuestionnaireSubmissionResult> {
  try {
    const apiResponse = await fetch(
      `${API_BASE_URL}/conversations/${conversationId}/questionnaires/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(response),
      }
    );

    if (!apiResponse.ok) {
      throw new Error(`HTTP error! status: ${apiResponse.status}`);
    }

    const data = await apiResponse.json();
    return {
      ok: true,
      message: data.message,
      module_completed: data.module_completed,
      scoring: data.scoring,
      module_status: data.module_status
    };
  } catch (error) {
    console.error('Error submitting questionnaire response:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Module name mapping for display
const MODULE_NAMES: Record<string, string> = {
  'emotional_first_aid': '情绪急救',
  'inner_doodling': '内视涂鸦',
  'quick_assessment': '内视快测'
};

/**
 * Send a module completion message to continue the conversation
 * This triggers the AI to acknowledge completion and recommend remaining modules
 */
export async function sendModuleCompletionMessage(
  sessionId: string,
  moduleId: string
): Promise<ChatResponse> {
  const moduleName = MODULE_NAMES[moduleId] || moduleId;
  const completionMessage = `我做完${moduleName}了。`;

  return sendChatMessage({
    message: completionMessage,
    session_id: sessionId
  });
}

/**
 * Get questionnaire responses for a conversation
 */
export async function getQuestionnaireResponses(conversationId: number): Promise<{
  ok: boolean;
  responses?: Record<string, any>;
  error?: string;
}> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/conversations/${conversationId}/questionnaires`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      ok: true,
      responses: data.responses
    };
  } catch (error) {
    console.error('Error fetching questionnaire responses:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// Psychology Report API Methods
// ============================================================================

export interface PsychologyReportStatus {
  ok: boolean;
  report_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  current_step?: string;
  estimated_time_remaining?: number;
  report_data?: any;
  error?: string;
}

/**
 * Get psychology report status
 */
export async function getPsychologyReportStatus(reportId: number): Promise<PsychologyReportStatus> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/psychology/report/${reportId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching psychology report status:', error);
    return {
      ok: false,
      report_id: reportId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Download psychology report as DOCX file
 */
export async function downloadPsychologyReport(reportId: number): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/psychology/report/${reportId}/download`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    // Get filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `ZeneMe心理报告_${reportId}.docx`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '');
      }
    }

    // Create blob and download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { ok: true };
  } catch (error) {
    console.error('Error downloading psychology report:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}


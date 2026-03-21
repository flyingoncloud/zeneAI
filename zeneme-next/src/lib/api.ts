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
  inline_question?: {
    id: number;
    text: string;
    domain: string;
    subcategory?: string;
    options: Array<{ value: number; text: string }>;
  };
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
 * Uses guest ID from auth store for guest users, or authenticated user ID
 */
export function getUserIdFromAuth(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    // Get auth state from sessionStorage (where guest data is stored)
    const authData = window.sessionStorage.getItem('zeneme-next-auth-storage');
    if (authData) {
      const parsed = JSON.parse(authData);
      const state = parsed.state;

      // If user is logged in (guest or authenticated), use their ID
      if (state?.user?.id) {
        return state.user.id;
      }
    }
  } catch (error) {
    console.error('[API] Error reading auth state:', error);
  }

  return undefined;
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  try {
    console.log('[API] Sending chat message to:', `${API_BASE_URL}/chat/`);
    const userId = getUserIdFromAuth();

    // Use user ID from auth store (guest or authenticated)
    const requestWithUserId = {
      ...request,
      user_id: request.user_id ?? userId ?? null,
    };

    console.log('[API] Using user_id:', requestWithUserId.user_id);

    const response = await fetch(`${API_BASE_URL}/chat/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestWithUserId),
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
  sketch_id?: number;
  image_url?: string;
}

export async function analyzeSketch(
  imageData: string,
  prompt: string = "请分析这张内视涂鸦，描述你看到的内容、情绪和可能的心理意义。",
  userId?: string
): Promise<AnalyzeSketchResponse> {
  try {
    const formData = new FormData();
    formData.append('image_data', imageData);
    formData.append('prompt', prompt);
    if (userId) {
      formData.append('user_id', userId);
    }

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
  imageUrl?: string;
  sub_category?: string;  // NEW: Optional sub-category for cross-category scoring
}

export interface QuestionnaireDetail extends Questionnaire {
  questions: Array<{
    id: number;
    text: string;
    subtitle?: string | null;  // NEW: Optional subtitle/instruction text
    template?: string | null;  // Template type (F1, F2, etc.)
    category?: string | null;
    sub_section?: string | null;
    dimension?: string | null;
    questionnaire_id?: string | null;
    domain?: string | null;
    options?: QuestionOption[];
    mediaUrl?: string | null;
    mediaType?: 'image' | 'video' | null;
    templateSettings?: Record<string, any> | null;
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
  const completionMessage = `我刚刚完成了${moduleName}，请继续我们的对话。`;

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
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found';
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
    let filename = `ZeneWe心理报告_${reportId}.docx`;

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


// ============================================================================
// Questionnaire Progress Tracking API Methods
// ============================================================================

export interface StartQuestionnaireRequest {
  user_id: string;
  session_id: string;
  conversation_id?: number | null;  // Optional - can be null for standalone questionnaires
  questionnaire_id?: string;
}

export interface StartQuestionnaireResponse {
  ok: boolean;
  progress?: {
    id: number;
    user_id: string;
    session_id: string;
    conversation_id: number;
    questionnaire_id: string;
    current_question_index: number;
    total_questions: number;
    answers: Record<string, number>;
    category_scores: Record<string, number>;
    status: string;
    started_at: string;
    last_updated_at: string;
    completed_at?: string;
    report_id?: number;
  };
  questions?: QuestionnaireDetail['questions'];
  domain_summary?: Record<string, { total: number; answered: number }>;
  message?: string;
  error?: string;
}

export interface SaveAnswerRequest {
  progress_id: number;
  question_id: number;
  answer_value: number;
}

export interface SaveAnswerResponse {
  ok: boolean;
  current_question_index: number;
  category_scores: Record<string, number>;
  is_completed: boolean;
  report_id?: number;
  error?: string;
}

export interface GetProgressResponse {
  ok: boolean;
  progress?: StartQuestionnaireResponse['progress'];
  message?: string;
  error?: string;
}

/**
 * Start or resume questionnaire with progress tracking
 */
export async function startQuestionnaire(
  request: StartQuestionnaireRequest
): Promise<StartQuestionnaireResponse> {
  try {
    // Use user ID from auth store if not provided
    const userId = request.user_id || getUserIdFromAuth();
    const requestWithUserId = {
      ...request,
      user_id: userId || request.user_id
    };

    console.log('[API] Starting questionnaire with user_id:', requestWithUserId.user_id);

    const response = await fetch(`${API_BASE_URL}/api/questionnaire/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(requestWithUserId),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`HTTP error! status: ${response.status}; body: ${errText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error starting questionnaire:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Save answer and update progress
 */
export async function saveQuestionnaireAnswer(
  request: SaveAnswerRequest
): Promise<SaveAnswerResponse> {
  try {
    console.log('[API] saveQuestionnaireAnswer request:', request);

    const response = await fetch(`${API_BASE_URL}/api/questionnaire/answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error saving answer:', error);
    return {
      ok: false,
      current_question_index: 0,
      category_scores: {},
      is_completed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get current progress for user
 */
export async function getQuestionnaireProgress(
  userId: string,
  questionnaireId: string = 'admin_created'
): Promise<GetProgressResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/questionnaire/progress/${userId}?questionnaire_id=${questionnaireId}`,
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
    console.error('Error getting progress:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ============================================================================
// Authentication API Methods
// ============================================================================

export interface PhoneVerificationRequest {
  phone: string;
  country_code?: string;
}

export interface PhoneVerificationResponse {
  success: boolean;
  message: string;
  expires_in: number;
}

export interface PhoneLoginRequest {
  phone: string;
  country_code?: string;
  code: string;
  username?: string;  // Optional - only needed for first-time registration
}

export interface PhoneRegisterRequest {
  phone: string;
  country_code?: string;
  code: string;
  password: string;
  username?: string;
}

export interface PhonePasswordLoginRequest {
  phone: string;
  country_code?: string;
  password: string;
}

export interface EmailRegisterRequest {
  email: string;
  password: string;
  code: string;  // 6-digit verification code
  username?: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface SocialLoginRequest {
  provider: 'google' | 'wechat';
  token: string;
  user_info?: Record<string, any>;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    provider?: string;
  };
  token?: string;
}

/**
 * Send verification code to phone number
 */
export async function sendPhoneVerificationCode(
  request: PhoneVerificationRequest
): Promise<PhoneVerificationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/phone/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending verification code:', error);
    throw error;
  }
}

/**
 * Send verification code to email
 */
export async function sendEmailVerificationCode(request: { email: string }): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/email/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending email verification code:', error);
    throw error;
  }
}

/**
 * Register with phone number, verification code, and password
 */
export async function registerWithPhone(
  request: PhoneRegisterRequest
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/phone/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error registering with phone:', error);
    throw error;
  }
}

/**
 * Login with phone number and password (no verification code needed)
 */
export async function loginWithPhonePassword(
  request: PhonePasswordLoginRequest
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/phone/login-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging in with phone password:', error);
    throw error;
  }
}

/**
 * Login with phone number and verification code (for password reset or legacy)
 */
export async function loginWithPhone(request: PhoneLoginRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/phone/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging in with phone:', error);
    throw error;
  }
}

/**
 * Register with email and password
 */
export async function registerWithEmail(request: EmailRegisterRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/email/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error registering with email:', error);
    throw error;
  }
}

/**
 * Login with email and password
 */
export async function loginWithEmail(request: EmailLoginRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/email/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging in with email:', error);
    throw error;
  }
}

/**
 * Login with social provider (Google, WeChat)
 */
export async function loginWithSocial(request: SocialLoginRequest): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/social/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging in with social provider:', error);
    throw error;
  }
}


/**
 * Get WeChat OAuth login URL
 */
export async function getWeChatLoginUrl(): Promise<{
  success: boolean;
  login_url?: string;
  state?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/wechat/login-url`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting WeChat login URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Handle WeChat OAuth callback
 */
export async function handleWeChatCallback(code: string, state: string): Promise<AuthResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/auth/wechat/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error handling WeChat callback:', error);
    throw error;
  }
}

/**
 * Get user conversations (recent chats)
 */
export async function getUserConversations(userId: string): Promise<{
  ok: boolean;
  conversations?: Array<{
    id: number;
    session_id: string;
    user_id: string | null;
    created_at: string;
    updated_at: string;
    extra_data: any;
  }>;
  error?: string;
}> {
  try {
    console.log('[API] getUserConversations called for userId:', userId);
    const url = `${API_BASE_URL}/conversations/user/${userId}`;
    console.log('[API] Fetching from:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[API] Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API] Error response:', errorData);
      return {
        ok: false,
        error: errorData.detail || `Failed to fetch conversations: ${response.statusText}`,
      };
    }

    const conversations = await response.json();
    console.log('[API] Received conversations:', conversations.length, 'items');
    return {
      ok: true,
      conversations,
    };
  } catch (error) {
    console.error('[API] Error fetching user conversations:', error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user psychology reports (history)
 */
export async function getUserReports(userId: string): Promise<{
  ok: boolean;
  reports?: Array<{
    id: number;
    type: string;
    date: string;
    title: string;
    preview: string;
    mind_indices?: Record<string, number>;
    has_file?: boolean;
  }>;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/psychology/reports/user/${userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      return { ok: false, reports: [], error: `Failed: ${response.statusText}` };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] Error fetching user reports:', error);
    return { ok: false, reports: [], error: error instanceof Error ? error.message : 'Unknown error' };
  }
}


// ============================================================================
// Inline Assessment API Methods
// ============================================================================

export interface InlineAssessmentProgress {
  total_answered: number;
  total_questions: number;
  completion_percentage: number;
  domains_covered: string[];
  domain_question_counts: Record<string, number>;
  can_generate_report: boolean;
}

export async function getInlineAssessmentProgress(userId: string): Promise<{
  ok: boolean;
  progress?: InlineAssessmentProgress;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/psychology/inline-assessment/progress/${userId}`);
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }
    const data = await response.json();
    return { ok: true, progress: data.progress };
  } catch (error) {
    console.error('[API] Error fetching inline assessment progress:', error);
    return { ok: false, error: String(error) };
  }
}

export interface InlineQuestion {
  id: number;
  text: string;
  domain: string;
  subcategory?: string;
  options: Array<{ value: number; text: string }>;
}

export async function fetchInlineQuestion(userId: string, domain: string): Promise<{
  ok: boolean;
  question?: InlineQuestion;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/psychology/inline-assessment/question/${userId}/${domain}`);
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    const data = await response.json();
    return { ok: data.ok, question: data.question, error: data.error };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

export async function recordInlineAnswer(
  userId: string,
  conversationId: number,
  questionId: number,
  answerValue: number
): Promise<{ ok: boolean; progress?: InlineAssessmentProgress; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/psychology/inline-assessment/record-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        conversation_id: conversationId,
        question_id: questionId,
        answer_value: answerValue,
      }),
    });
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` };
    }
    const data = await response.json();
    return { ok: true, progress: data.progress };
  } catch (error) {
    console.error('[API] Error recording inline answer:', error);
    return { ok: false, error: String(error) };
  }
}

// Configuración para la API de Gemini
export interface GeminiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

// Estructura de mensaje para Gemini
export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

// Estructura de petición a Gemini
export interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
  };
}

// Estructura de respuesta de Gemini
export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason?: string;
    index: number;
  }>;
  promptFeedback?: {
    blockReason?: string;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  };
}

// Configuración por defecto para Gemini
export const GEMINI_CONFIG: Omit<GeminiConfig, 'apiKey'> = {
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
  model: 'gemini-2.5-pro'
};

// Configuración por defecto para generación
export const DEFAULT_GENERATION_CONFIG = {
  temperature: 0.7,
  maxOutputTokens: 4096,
  topP: 0.8,
  topK: 40
};
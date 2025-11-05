// Configuración para EmbeddingGemma de Hugging Face
export interface EmbeddingConfig {
  model: string;
  apiUrl: string;
  apiKey: string;
  dimensions: number;
  maxInputLength: number;
  batchSize: number;
  timeout: number;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model_used: string;
  usage?: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface EmbeddingRequest {
  inputs: string | string[];
  options?: {
    wait_for_model?: boolean;
    use_cache?: boolean;
  };
}

// Configuración por defecto para EmbeddingGemma
export const EMBEDDING_CONFIG: Omit<EmbeddingConfig, 'apiKey'> = {
  model: 'google/embeddinggemma-300m',
  apiUrl: 'https://api-inference.huggingface.co/models/google/embeddinggemma-300m',
  dimensions: 300,
  maxInputLength: 512,
  batchSize: 10,
  timeout: 30000
};

// Configuración de similitud semántica (legacy - usar vectorConfigService para nueva configuración)
export const SIMILARITY_CONFIG = {
  defaultThreshold: 0.7,
  maxModulesPerQuery: 5,
  minSimilarityScore: 0.5,
  boostFactors: {
    exactMatch: 1.2,
    categoryMatch: 1.1,
    recentUsage: 1.05
  }
};

// Configuración de cache
export const CACHE_CONFIG = {
  maxEmbeddings: 1000,
  maxQueries: 500,
  ttlMinutes: 60,
  persistToDisk: true,
  cacheFilePath: './cache/embeddings.json'
};
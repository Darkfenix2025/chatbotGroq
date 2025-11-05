import { EMBEDDING_CONFIG, SIMILARITY_CONFIG, EmbeddingRequest, EmbeddingResponse } from '../config/embedding';
import { vectorConfigService } from './vectorConfigService';

export interface PromptModule {
  id: string;
  name: string;
  content: string;
  embedding?: number[];
  metadata: {
    category: string;
    priority: number;
    maxTokens: number;
    keywords: string[];
  };
}

export interface SemanticMatch {
  moduleId: string;
  similarity: number;
  relevanceScore: number;
}

export class VectorService {
  private apiKey: string;
  private embeddingCache: Map<string, number[]> = new Map();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Genera embedding para un texto usando EmbeddingGemma
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Verificar cache primero
    const cacheKey = this.getCacheKey(text);
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey)!;
    }

    try {
      // Truncar texto si es muy largo
      const truncatedText = this.truncateText(text, EMBEDDING_CONFIG.maxInputLength);
      
      const requestBody: EmbeddingRequest = {
        inputs: truncatedText,
        options: {
          wait_for_model: true,
          use_cache: true
        }
      };

      const response = await fetch(EMBEDDING_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const data = await response.json();
      
      // EmbeddingGemma devuelve directamente el array de embeddings
      const embedding = Array.isArray(data) ? data : data.embeddings?.[0] || data;
      
      if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_CONFIG.dimensions) {
        throw new Error(`Embedding inválido: esperado array de ${EMBEDDING_CONFIG.dimensions} dimensiones`);
      }

      // Guardar en cache
      this.embeddingCache.set(cacheKey, embedding);
      
      return embedding;

    } catch (error) {
      console.error('Error generando embedding:', error);
      throw error;
    }
  }

  /**
   * Genera embeddings para múltiples textos en lote
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    // Procesar en lotes para evitar límites de API
    for (let i = 0; i < texts.length; i += EMBEDDING_CONFIG.batchSize) {
      const batch = texts.slice(i, i + EMBEDDING_CONFIG.batchSize);
      
      const batchPromises = batch.map(text => this.generateEmbedding(text));
      const batchEmbeddings = await Promise.all(batchPromises);
      
      embeddings.push(...batchEmbeddings);
      
      // Pequeña pausa entre lotes para evitar rate limiting
      if (i + EMBEDDING_CONFIG.batchSize < texts.length) {
        await this.sleep(100);
      }
    }
    
    return embeddings;
  }

  /**
   * Calcula similitud coseno entre dos embeddings
   */
  calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Los embeddings deben tener la misma dimensión');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  /**
   * Encuentra módulos similares a un embedding de consulta
   */
  findSimilarModules(
    queryEmbedding: number[], 
    modules: PromptModule[], 
    threshold?: number
  ): SemanticMatch[] {
    // Usar configuración dinámica si no se especifica threshold
    const config = vectorConfigService.getCurrentConfig();
    const actualThreshold = threshold ?? config.similarity.minSimilarity;
    
    const matches: SemanticMatch[] = [];

    for (const module of modules) {
      if (!module.embedding) {
        continue;
      }

      const similarity = this.calculateCosineSimilarity(queryEmbedding, module.embedding);
      
      if (similarity >= actualThreshold) {
        // Calcular score de relevancia considerando similitud y prioridad
        const relevanceScore = this.calculateRelevanceScore(similarity, module);
        
        matches.push({
          moduleId: module.id,
          similarity,
          relevanceScore
        });
      }
    }

    // Ordenar por relevancia descendente
    return matches.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Rankea y selecciona los mejores módulos considerando límites de tokens
   */
  rankModules(matches: SemanticMatch[], modules: PromptModule[], maxTokens?: number): PromptModule[] {
    const config = vectorConfigService.getCurrentConfig();
    const actualMaxTokens = maxTokens ?? (config.tokens.maxTokensPerQuery - config.tokens.basePromptTokens - config.tokens.responseTokenReserve);
    
    const selectedModules: PromptModule[] = [];
    let totalTokens = 0;

    // Aplicar ranking avanzado con pesos configurables
    const rankedMatches = this.applyAdvancedRanking(matches, modules);

    for (const match of rankedMatches) {
      const module = modules.find(m => m.id === match.moduleId);
      
      if (!module) continue;

      // Verificar límites de tokens y módulos
      const moduleTokens = Math.min(module.metadata.maxTokens, config.tokens.maxTokensPerModule);
      
      if (totalTokens + moduleTokens <= actualMaxTokens) {
        selectedModules.push(module);
        totalTokens += moduleTokens;
      }

      // Limitar número máximo de módulos
      if (selectedModules.length >= config.modules.maxModulesPerQuery) {
        break;
      }
    }

    return selectedModules;
  }

  /**
   * Calcula score de relevancia considerando similitud y metadata
   */
  private calculateRelevanceScore(similarity: number, module: PromptModule): number {
    const config = vectorConfigService.getCurrentConfig();
    const weights = config.rankingWeights;
    const categoryWeights = config.categoryWeights;
    
    let score = 0;

    // Componente de similitud semántica
    score += similarity * weights.semanticSimilarity;

    // Componente de prioridad del módulo (normalizada)
    const normalizedPriority = module.metadata.priority / 10; // Asumiendo prioridad 1-10
    score += normalizedPriority * weights.modulePriority;

    // Componente de peso por categoría
    const categoryWeight = categoryWeights[module.metadata.category as keyof typeof categoryWeights] || 1.0;
    score += (categoryWeight - 1) * weights.categoryWeight;

    // Boost adicional por categoría core
    if (module.metadata.category === 'core') {
      score *= 1.1; // Boost fijo para módulos core
    }

    return Math.max(0, Math.min(1, score)); // Normalizar entre 0 y 1
  }

  /**
   * Aplica ranking avanzado con múltiples criterios
   */
  private applyAdvancedRanking(matches: SemanticMatch[], modules: PromptModule[]): SemanticMatch[] {
    const config = vectorConfigService.getCurrentConfig();
    const weights = config.rankingWeights;

    return matches.map(match => {
      const module = modules.find(m => m.id === match.moduleId);
      if (!module) return match;

      // Recalcular score con todos los factores
      let enhancedScore = 0;

      // Factor de similitud semántica
      enhancedScore += match.similarity * weights.semanticSimilarity;

      // Factor de prioridad del módulo
      const normalizedPriority = module.metadata.priority / 10;
      enhancedScore += normalizedPriority * weights.modulePriority;

      // Factor de categoría
      const categoryWeight = config.categoryWeights[module.metadata.category as keyof typeof config.categoryWeights] || 1.0;
      enhancedScore += (categoryWeight - 1) * weights.categoryWeight;

      // Factor de coincidencia de palabras clave (simulado)
      const keywordMatchScore = this.calculateKeywordMatch(module);
      enhancedScore += keywordMatchScore * weights.keywordMatch;

      // Factor de uso reciente (simulado - en implementación real se basaría en historial)
      const recentUsageScore = 0.5; // Placeholder
      enhancedScore += recentUsageScore * weights.recentUsage;

      return {
        ...match,
        relevanceScore: Math.max(0, Math.min(1, enhancedScore))
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calcula score de coincidencia de palabras clave (placeholder)
   */
  private calculateKeywordMatch(module: PromptModule): number {
    // En una implementación real, esto compararía las palabras clave del módulo
    // con las palabras clave detectadas en la consulta
    return 0.5; // Placeholder
  }

  /**
   * Trunca texto para ajustarse al límite de tokens
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    // Truncar en el último espacio para evitar cortar palabras
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
  }

  /**
   * Genera clave de cache para un texto
   */
  private getCacheKey(text: string): string {
    // Usar hash simple para la clave de cache
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Maneja errores específicos de la API de Hugging Face
   */
  private async handleApiError(response: Response): Promise<never> {
    const errorData = await response.json().catch(() => ({}));
    
    switch (response.status) {
      case 401:
        throw new Error('API key de Hugging Face inválida o faltante');
      case 429:
        throw new Error('Límite de rate limiting excedido. Intenta nuevamente en unos momentos');
      case 503:
        throw new Error('Modelo EmbeddingGemma está cargando. Intenta nuevamente en unos segundos');
      case 400:
        throw new Error(`Error en la petición: ${errorData.error || 'Parámetros inválidos'}`);
      default:
        throw new Error(`Error de API de Hugging Face (${response.status}): ${errorData.error || 'Error desconocido'}`);
    }
  }

  /**
   * Pausa la ejecución por un número de milisegundos
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpia el cache de embeddings
   */
  clearCache(): void {
    this.embeddingCache.clear();
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.embeddingCache.size,
      maxSize: SIMILARITY_CONFIG.maxModulesPerQuery
    };
  }
}
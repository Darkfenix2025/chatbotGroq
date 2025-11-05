/**
 * Sistema de Configuración Vectorial
 * Configuración centralizada para thresholds, límites y pesos del sistema vectorial
 */

export interface SimilarityThresholds {
  /** Threshold mínimo para considerar un módulo relevante */
  minSimilarity: number;
  /** Threshold para módulos de alta confianza */
  highConfidence: number;
  /** Threshold para activación automática de módulos core */
  coreActivation: number;
  /** Threshold para módulos especializados */
  specializedModules: number;
}

export interface TokenLimits {
  /** Límite máximo de tokens por consulta */
  maxTokensPerQuery: number;
  /** Límite de tokens para prompt base */
  basePromptTokens: number;
  /** Límite de tokens por módulo individual */
  maxTokensPerModule: number;
  /** Reserva de tokens para respuesta del modelo */
  responseTokenReserve: number;
}

export interface ModuleLimits {
  /** Número máximo de módulos por consulta */
  maxModulesPerQuery: number;
  /** Número mínimo de módulos core siempre activos */
  minCoreModules: number;
  /** Número máximo de módulos por categoría */
  maxModulesPerCategory: number;
  /** Número máximo de módulos especializados */
  maxSpecializedModules: number;
}

export interface CategoryWeights {
  /** Peso para módulos core (siempre activos) */
  core: number;
  /** Peso para módulos de análisis */
  analysis: number;
  /** Peso para módulos tácticos */
  tactics: number;
  /** Peso para módulos especiales/modos */
  modes: number;
}

export interface RankingWeights {
  /** Peso de la similitud semántica en el ranking */
  semanticSimilarity: number;
  /** Peso de la prioridad del módulo */
  modulePriority: number;
  /** Peso de la categoría del módulo */
  categoryWeight: number;
  /** Peso de palabras clave coincidentes */
  keywordMatch: number;
  /** Peso de uso reciente del módulo */
  recentUsage: number;
}

export interface PerformanceConfig {
  /** Tamaño del cache de embeddings */
  embeddingCacheSize: number;
  /** Tamaño del cache de consultas */
  queryCacheSize: number;
  /** TTL del cache en minutos */
  cacheTTLMinutes: number;
  /** Timeout para generación de embeddings (ms) */
  embeddingTimeout: number;
  /** Tamaño de lote para procesamiento de embeddings */
  batchSize: number;
}

export interface VectorConfig {
  /** Configuración de thresholds de similitud */
  similarity: SimilarityThresholds;
  /** Límites de tokens */
  tokens: TokenLimits;
  /** Límites de módulos */
  modules: ModuleLimits;
  /** Pesos por categoría */
  categoryWeights: CategoryWeights;
  /** Pesos para ranking */
  rankingWeights: RankingWeights;
  /** Configuración de rendimiento */
  performance: PerformanceConfig;
}

/**
 * Configuración por defecto del sistema vectorial
 */
export const DEFAULT_VECTOR_CONFIG: VectorConfig = {
  similarity: {
    minSimilarity: 0.5,
    highConfidence: 0.8,
    coreActivation: 0.3,
    specializedModules: 0.7
  },
  tokens: {
    maxTokensPerQuery: 4000,
    basePromptTokens: 500,
    maxTokensPerModule: 800,
    responseTokenReserve: 1000
  },
  modules: {
    maxModulesPerQuery: 5,
    minCoreModules: 2,
    maxModulesPerCategory: 3,
    maxSpecializedModules: 2
  },
  categoryWeights: {
    core: 1.5,
    analysis: 1.2,
    tactics: 1.0,
    modes: 0.8
  },
  rankingWeights: {
    semanticSimilarity: 0.4,
    modulePriority: 0.25,
    categoryWeight: 0.15,
    keywordMatch: 0.1,
    recentUsage: 0.1
  },
  performance: {
    embeddingCacheSize: 1000,
    queryCacheSize: 500,
    cacheTTLMinutes: 60,
    embeddingTimeout: 30000,
    batchSize: 10
  }
};

/**
 * Configuraciones predefinidas para diferentes escenarios
 */
export const VECTOR_CONFIG_PRESETS = {
  /** Configuración optimizada para velocidad */
  FAST: {
    ...DEFAULT_VECTOR_CONFIG,
    similarity: {
      ...DEFAULT_VECTOR_CONFIG.similarity,
      minSimilarity: 0.6,
      highConfidence: 0.85
    },
    modules: {
      ...DEFAULT_VECTOR_CONFIG.modules,
      maxModulesPerQuery: 3,
      maxModulesPerCategory: 2
    },
    performance: {
      ...DEFAULT_VECTOR_CONFIG.performance,
      embeddingCacheSize: 2000,
      batchSize: 15
    }
  } as VectorConfig,

  /** Configuración optimizada para precisión */
  PRECISE: {
    ...DEFAULT_VECTOR_CONFIG,
    similarity: {
      ...DEFAULT_VECTOR_CONFIG.similarity,
      minSimilarity: 0.4,
      highConfidence: 0.75,
      specializedModules: 0.6
    },
    modules: {
      ...DEFAULT_VECTOR_CONFIG.modules,
      maxModulesPerQuery: 7,
      maxModulesPerCategory: 4
    },
    tokens: {
      ...DEFAULT_VECTOR_CONFIG.tokens,
      maxTokensPerQuery: 6000,
      maxTokensPerModule: 1000
    }
  } as VectorConfig,

  /** Configuración balanceada (por defecto) */
  BALANCED: DEFAULT_VECTOR_CONFIG,

  /** Configuración para consultas complejas */
  COMPLEX: {
    ...DEFAULT_VECTOR_CONFIG,
    similarity: {
      ...DEFAULT_VECTOR_CONFIG.similarity,
      minSimilarity: 0.3,
      specializedModules: 0.5
    },
    modules: {
      ...DEFAULT_VECTOR_CONFIG.modules,
      maxModulesPerQuery: 8,
      maxSpecializedModules: 3
    },
    tokens: {
      ...DEFAULT_VECTOR_CONFIG.tokens,
      maxTokensPerQuery: 8000,
      maxTokensPerModule: 1200
    },
    rankingWeights: {
      ...DEFAULT_VECTOR_CONFIG.rankingWeights,
      semanticSimilarity: 0.3,
      modulePriority: 0.3,
      categoryWeight: 0.2
    }
  } as VectorConfig
};

/**
 * Validador de configuración vectorial
 */
export class VectorConfigValidator {
  /**
   * Valida una configuración vectorial
   */
  static validate(config: VectorConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validar thresholds de similitud
    if (config.similarity.minSimilarity < 0 || config.similarity.minSimilarity > 1) {
      errors.push('minSimilarity debe estar entre 0 y 1');
    }
    if (config.similarity.highConfidence <= config.similarity.minSimilarity) {
      errors.push('highConfidence debe ser mayor que minSimilarity');
    }

    // Validar límites de tokens
    if (config.tokens.maxTokensPerQuery <= 0) {
      errors.push('maxTokensPerQuery debe ser positivo');
    }
    if (config.tokens.basePromptTokens >= config.tokens.maxTokensPerQuery) {
      errors.push('basePromptTokens debe ser menor que maxTokensPerQuery');
    }

    // Validar límites de módulos
    if (config.modules.maxModulesPerQuery <= 0) {
      errors.push('maxModulesPerQuery debe ser positivo');
    }
    if (config.modules.minCoreModules > config.modules.maxModulesPerQuery) {
      errors.push('minCoreModules no puede ser mayor que maxModulesPerQuery');
    }

    // Validar pesos de ranking (deben sumar aproximadamente 1)
    const totalWeight = Object.values(config.rankingWeights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalWeight - 1) > 0.1) {
      errors.push('Los pesos de ranking deben sumar aproximadamente 1.0');
    }

    // Validar configuración de rendimiento
    if (config.performance.embeddingCacheSize <= 0) {
      errors.push('embeddingCacheSize debe ser positivo');
    }
    if (config.performance.batchSize <= 0) {
      errors.push('batchSize debe ser positivo');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Normaliza los pesos de ranking para que sumen 1
   */
  static normalizeRankingWeights(weights: RankingWeights): RankingWeights {
    const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    if (total === 0) {
      // Si todos los pesos son 0, usar distribución uniforme
      const uniformWeight = 1 / Object.keys(weights).length;
      return Object.keys(weights).reduce((normalized, key) => {
        normalized[key as keyof RankingWeights] = uniformWeight;
        return normalized;
      }, {} as RankingWeights);
    }

    // Normalizar pesos
    return Object.keys(weights).reduce((normalized, key) => {
      normalized[key as keyof RankingWeights] = weights[key as keyof RankingWeights] / total;
      return normalized;
    }, {} as RankingWeights);
  }
}

/**
 * Gestor de configuración vectorial
 */
export class VectorConfigManager {
  private currentConfig: VectorConfig;
  private configHistory: VectorConfig[] = [];

  constructor(initialConfig: VectorConfig = DEFAULT_VECTOR_CONFIG) {
    this.currentConfig = { ...initialConfig };
    this.validateAndNormalize();
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): VectorConfig {
    return { ...this.currentConfig };
  }

  /**
   * Actualiza la configuración
   */
  updateConfig(newConfig: Partial<VectorConfig>): void {
    // Guardar configuración actual en historial
    this.configHistory.push({ ...this.currentConfig });

    // Aplicar cambios
    this.currentConfig = {
      ...this.currentConfig,
      ...newConfig,
      // Merge profundo para objetos anidados
      similarity: { ...this.currentConfig.similarity, ...newConfig.similarity },
      tokens: { ...this.currentConfig.tokens, ...newConfig.tokens },
      modules: { ...this.currentConfig.modules, ...newConfig.modules },
      categoryWeights: { ...this.currentConfig.categoryWeights, ...newConfig.categoryWeights },
      rankingWeights: { ...this.currentConfig.rankingWeights, ...newConfig.rankingWeights },
      performance: { ...this.currentConfig.performance, ...newConfig.performance }
    };

    this.validateAndNormalize();
  }

  /**
   * Carga un preset de configuración
   */
  loadPreset(presetName: keyof typeof VECTOR_CONFIG_PRESETS): void {
    const preset = VECTOR_CONFIG_PRESETS[presetName];
    if (!preset) {
      throw new Error(`Preset '${presetName}' no encontrado`);
    }

    this.configHistory.push({ ...this.currentConfig });
    this.currentConfig = { ...preset };
    this.validateAndNormalize();
  }

  /**
   * Revierte al estado anterior de configuración
   */
  revertToPrevious(): boolean {
    if (this.configHistory.length === 0) {
      return false;
    }

    this.currentConfig = this.configHistory.pop()!;
    return true;
  }

  /**
   * Exporta la configuración actual
   */
  exportConfig(): string {
    return JSON.stringify(this.currentConfig, null, 2);
  }

  /**
   * Importa configuración desde JSON
   */
  importConfig(configJson: string): void {
    try {
      const newConfig = JSON.parse(configJson) as VectorConfig;
      this.updateConfig(newConfig);
    } catch (error) {
      throw new Error(`Error importando configuración: ${error}`);
    }
  }

  /**
   * Obtiene estadísticas de la configuración
   */
  getConfigStats(): {
    totalTokenBudget: number;
    maxPossibleModules: number;
    averageTokensPerModule: number;
    cacheEfficiency: number;
  } {
    const config = this.currentConfig;
    const availableTokens = config.tokens.maxTokensPerQuery - config.tokens.basePromptTokens - config.tokens.responseTokenReserve;
    const maxPossibleModules = Math.floor(availableTokens / config.tokens.maxTokensPerModule);
    
    return {
      totalTokenBudget: availableTokens,
      maxPossibleModules: Math.min(maxPossibleModules, config.modules.maxModulesPerQuery),
      averageTokensPerModule: config.tokens.maxTokensPerModule,
      cacheEfficiency: config.performance.embeddingCacheSize / (config.performance.embeddingCacheSize + config.performance.queryCacheSize)
    };
  }

  /**
   * Valida y normaliza la configuración actual
   */
  private validateAndNormalize(): void {
    const validation = VectorConfigValidator.validate(this.currentConfig);
    
    if (!validation.isValid) {
      console.warn('Configuración vectorial inválida:', validation.errors);
      // Aplicar configuración por defecto para valores inválidos
      this.currentConfig = { ...DEFAULT_VECTOR_CONFIG };
    }

    // Normalizar pesos de ranking
    this.currentConfig.rankingWeights = VectorConfigValidator.normalizeRankingWeights(
      this.currentConfig.rankingWeights
    );
  }
}

/**
 * Instancia global del gestor de configuración
 */
export const vectorConfigManager = new VectorConfigManager();
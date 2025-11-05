/**
 * Utilidades para interfaz de usuario de configuración vectorial
 * Proporciona funciones helper para mostrar y editar configuración vectorial
 */

import { 
  VectorConfig, 
  VECTOR_CONFIG_PRESETS,
  VectorConfigValidator 
} from '../config/vectorConfig';
import { vectorConfigService, ConfigurationProfile } from './vectorConfigService';

export interface ConfigurationUIState {
  currentConfig: VectorConfig;
  availableProfiles: ConfigurationProfile[];
  currentProfile: string;
  metrics: any;
  recommendations: string[];
  validation: { isValid: boolean; errors: string[]; warnings: string[] };
}

export interface ConfigurationFormData {
  // Similarity thresholds
  minSimilarity: number;
  highConfidence: number;
  coreActivation: number;
  specializedModules: number;
  
  // Token limits
  maxTokensPerQuery: number;
  basePromptTokens: number;
  maxTokensPerModule: number;
  responseTokenReserve: number;
  
  // Module limits
  maxModulesPerQuery: number;
  minCoreModules: number;
  maxModulesPerCategory: number;
  maxSpecializedModules: number;
  
  // Category weights
  coreWeight: number;
  analysisWeight: number;
  tacticsWeight: number;
  modesWeight: number;
  
  // Ranking weights
  semanticSimilarityWeight: number;
  modulePriorityWeight: number;
  categoryWeightFactor: number;
  keywordMatchWeight: number;
  recentUsageWeight: number;
  
  // Performance
  embeddingCacheSize: number;
  queryCacheSize: number;
  cacheTTLMinutes: number;
  embeddingTimeout: number;
  batchSize: number;
}

export class VectorConfigUI {
  /**
   * Obtiene el estado actual de la configuración para la UI
   */
  static getCurrentUIState(): ConfigurationUIState {
    const currentConfig = vectorConfigService.getCurrentConfig();
    const availableProfiles = vectorConfigService.getProfiles();
    const currentProfile = vectorConfigService.getCurrentProfile()?.name || 'default';
    const metrics = vectorConfigService.getMetrics();
    const recommendations = vectorConfigService.getConfigurationRecommendations();
    const validation = vectorConfigService.validateCurrentConfig();

    return {
      currentConfig,
      availableProfiles,
      currentProfile,
      metrics,
      recommendations,
      validation
    };
  }

  /**
   * Convierte configuración vectorial a datos de formulario
   */
  static configToFormData(config: VectorConfig): ConfigurationFormData {
    return {
      // Similarity thresholds
      minSimilarity: config.similarity.minSimilarity,
      highConfidence: config.similarity.highConfidence,
      coreActivation: config.similarity.coreActivation,
      specializedModules: config.similarity.specializedModules,
      
      // Token limits
      maxTokensPerQuery: config.tokens.maxTokensPerQuery,
      basePromptTokens: config.tokens.basePromptTokens,
      maxTokensPerModule: config.tokens.maxTokensPerModule,
      responseTokenReserve: config.tokens.responseTokenReserve,
      
      // Module limits
      maxModulesPerQuery: config.modules.maxModulesPerQuery,
      minCoreModules: config.modules.minCoreModules,
      maxModulesPerCategory: config.modules.maxModulesPerCategory,
      maxSpecializedModules: config.modules.maxSpecializedModules,
      
      // Category weights
      coreWeight: config.categoryWeights.core,
      analysisWeight: config.categoryWeights.analysis,
      tacticsWeight: config.categoryWeights.tactics,
      modesWeight: config.categoryWeights.modes,
      
      // Ranking weights
      semanticSimilarityWeight: config.rankingWeights.semanticSimilarity,
      modulePriorityWeight: config.rankingWeights.modulePriority,
      categoryWeightFactor: config.rankingWeights.categoryWeight,
      keywordMatchWeight: config.rankingWeights.keywordMatch,
      recentUsageWeight: config.rankingWeights.recentUsage,
      
      // Performance
      embeddingCacheSize: config.performance.embeddingCacheSize,
      queryCacheSize: config.performance.queryCacheSize,
      cacheTTLMinutes: config.performance.cacheTTLMinutes,
      embeddingTimeout: config.performance.embeddingTimeout,
      batchSize: config.performance.batchSize
    };
  }

  /**
   * Convierte datos de formulario a configuración vectorial
   */
  static formDataToConfig(formData: ConfigurationFormData): VectorConfig {
    return {
      similarity: {
        minSimilarity: formData.minSimilarity,
        highConfidence: formData.highConfidence,
        coreActivation: formData.coreActivation,
        specializedModules: formData.specializedModules
      },
      tokens: {
        maxTokensPerQuery: formData.maxTokensPerQuery,
        basePromptTokens: formData.basePromptTokens,
        maxTokensPerModule: formData.maxTokensPerModule,
        responseTokenReserve: formData.responseTokenReserve
      },
      modules: {
        maxModulesPerQuery: formData.maxModulesPerQuery,
        minCoreModules: formData.minCoreModules,
        maxModulesPerCategory: formData.maxModulesPerCategory,
        maxSpecializedModules: formData.maxSpecializedModules
      },
      categoryWeights: {
        core: formData.coreWeight,
        analysis: formData.analysisWeight,
        tactics: formData.tacticsWeight,
        modes: formData.modesWeight
      },
      rankingWeights: {
        semanticSimilarity: formData.semanticSimilarityWeight,
        modulePriority: formData.modulePriorityWeight,
        categoryWeight: formData.categoryWeightFactor,
        keywordMatch: formData.keywordMatchWeight,
        recentUsage: formData.recentUsageWeight
      },
      performance: {
        embeddingCacheSize: formData.embeddingCacheSize,
        queryCacheSize: formData.queryCacheSize,
        cacheTTLMinutes: formData.cacheTTLMinutes,
        embeddingTimeout: formData.embeddingTimeout,
        batchSize: formData.batchSize
      }
    };
  }

  /**
   * Valida datos de formulario
   */
  static validateFormData(formData: ConfigurationFormData): { isValid: boolean; errors: string[] } {
    const config = this.formDataToConfig(formData);
    return VectorConfigValidator.validate(config);
  }

  /**
   * Obtiene opciones de presets para la UI
   */
  static getPresetOptions(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'FAST',
        label: 'Rápido',
        description: 'Optimizado para velocidad de respuesta'
      },
      {
        value: 'PRECISE',
        label: 'Preciso',
        description: 'Optimizado para precisión y cobertura'
      },
      {
        value: 'BALANCED',
        label: 'Balanceado',
        description: 'Balance entre velocidad y precisión'
      },
      {
        value: 'COMPLEX',
        label: 'Complejo',
        description: 'Para consultas complejas que requieren múltiples módulos'
      }
    ];
  }

  /**
   * Obtiene rangos recomendados para campos de configuración
   */
  static getFieldRanges(): Record<keyof ConfigurationFormData, { min: number; max: number; step: number; recommended: number }> {
    return {
      // Similarity thresholds
      minSimilarity: { min: 0, max: 1, step: 0.05, recommended: 0.5 },
      highConfidence: { min: 0, max: 1, step: 0.05, recommended: 0.8 },
      coreActivation: { min: 0, max: 1, step: 0.05, recommended: 0.3 },
      specializedModules: { min: 0, max: 1, step: 0.05, recommended: 0.7 },
      
      // Token limits
      maxTokensPerQuery: { min: 1000, max: 10000, step: 500, recommended: 4000 },
      basePromptTokens: { min: 100, max: 2000, step: 50, recommended: 500 },
      maxTokensPerModule: { min: 200, max: 2000, step: 100, recommended: 800 },
      responseTokenReserve: { min: 500, max: 3000, step: 100, recommended: 1000 },
      
      // Module limits
      maxModulesPerQuery: { min: 1, max: 15, step: 1, recommended: 5 },
      minCoreModules: { min: 1, max: 5, step: 1, recommended: 2 },
      maxModulesPerCategory: { min: 1, max: 8, step: 1, recommended: 3 },
      maxSpecializedModules: { min: 0, max: 5, step: 1, recommended: 2 },
      
      // Category weights
      coreWeight: { min: 0.5, max: 3, step: 0.1, recommended: 1.5 },
      analysisWeight: { min: 0.5, max: 3, step: 0.1, recommended: 1.2 },
      tacticsWeight: { min: 0.5, max: 3, step: 0.1, recommended: 1.0 },
      modesWeight: { min: 0.5, max: 3, step: 0.1, recommended: 0.8 },
      
      // Ranking weights
      semanticSimilarityWeight: { min: 0, max: 1, step: 0.05, recommended: 0.4 },
      modulePriorityWeight: { min: 0, max: 1, step: 0.05, recommended: 0.25 },
      categoryWeightFactor: { min: 0, max: 1, step: 0.05, recommended: 0.15 },
      keywordMatchWeight: { min: 0, max: 1, step: 0.05, recommended: 0.1 },
      recentUsageWeight: { min: 0, max: 1, step: 0.05, recommended: 0.1 },
      
      // Performance
      embeddingCacheSize: { min: 50, max: 5000, step: 50, recommended: 1000 },
      queryCacheSize: { min: 25, max: 2000, step: 25, recommended: 500 },
      cacheTTLMinutes: { min: 10, max: 480, step: 10, recommended: 60 },
      embeddingTimeout: { min: 5000, max: 120000, step: 5000, recommended: 30000 },
      batchSize: { min: 1, max: 50, step: 1, recommended: 10 }
    };
  }

  /**
   * Obtiene descripciones de campos para tooltips
   */
  static getFieldDescriptions(): Record<keyof ConfigurationFormData, string> {
    return {
      // Similarity thresholds
      minSimilarity: 'Threshold mínimo para considerar un módulo relevante (0-1)',
      highConfidence: 'Threshold para módulos de alta confianza (0-1)',
      coreActivation: 'Threshold para activación automática de módulos core (0-1)',
      specializedModules: 'Threshold específico para módulos especializados (0-1)',
      
      // Token limits
      maxTokensPerQuery: 'Límite máximo de tokens por consulta completa',
      basePromptTokens: 'Tokens reservados para el prompt base',
      maxTokensPerModule: 'Límite de tokens por módulo individual',
      responseTokenReserve: 'Tokens reservados para la respuesta del modelo',
      
      // Module limits
      maxModulesPerQuery: 'Número máximo de módulos por consulta',
      minCoreModules: 'Número mínimo de módulos core siempre activos',
      maxModulesPerCategory: 'Número máximo de módulos por categoría',
      maxSpecializedModules: 'Número máximo de módulos especializados',
      
      // Category weights
      coreWeight: 'Peso para módulos core en el ranking',
      analysisWeight: 'Peso para módulos de análisis en el ranking',
      tacticsWeight: 'Peso para módulos tácticos en el ranking',
      modesWeight: 'Peso para módulos especiales/modos en el ranking',
      
      // Ranking weights
      semanticSimilarityWeight: 'Peso de la similitud semántica en el ranking final',
      modulePriorityWeight: 'Peso de la prioridad del módulo en el ranking',
      categoryWeightFactor: 'Peso de la categoría del módulo en el ranking',
      keywordMatchWeight: 'Peso de coincidencia de palabras clave',
      recentUsageWeight: 'Peso del uso reciente del módulo',
      
      // Performance
      embeddingCacheSize: 'Tamaño del cache de embeddings en memoria',
      queryCacheSize: 'Tamaño del cache de consultas procesadas',
      cacheTTLMinutes: 'Tiempo de vida del cache en minutos',
      embeddingTimeout: 'Timeout para generación de embeddings (ms)',
      batchSize: 'Tamaño de lote para procesamiento de embeddings'
    };
  }

  /**
   * Calcula estadísticas de configuración para mostrar en la UI
   */
  static calculateConfigStats(config: VectorConfig): {
    tokenBudget: number;
    maxPossibleModules: number;
    cacheEfficiency: number;
    rankingWeightSum: number;
    categoryWeightAverage: number;
  } {
    const availableTokens = config.tokens.maxTokensPerQuery - 
                           config.tokens.basePromptTokens - 
                           config.tokens.responseTokenReserve;
    
    const maxPossibleModules = Math.floor(availableTokens / config.tokens.maxTokensPerModule);
    
    const cacheEfficiency = config.performance.embeddingCacheSize / 
                           (config.performance.embeddingCacheSize + config.performance.queryCacheSize);
    
    const rankingWeightSum = Object.values(config.rankingWeights).reduce((sum, weight) => sum + weight, 0);
    
    const categoryWeightAverage = Object.values(config.categoryWeights).reduce((sum, weight) => sum + weight, 0) / 
                                 Object.keys(config.categoryWeights).length;

    return {
      tokenBudget: availableTokens,
      maxPossibleModules: Math.min(maxPossibleModules, config.modules.maxModulesPerQuery),
      cacheEfficiency,
      rankingWeightSum,
      categoryWeightAverage
    };
  }

  /**
   * Genera configuración de ejemplo para testing
   */
  static generateTestConfig(): VectorConfig {
    return VECTOR_CONFIG_PRESETS.BALANCED;
  }

  /**
   * Compara dos configuraciones y retorna diferencias
   */
  static compareConfigs(config1: VectorConfig, config2: VectorConfig): {
    differences: Array<{ path: string; value1: any; value2: any }>;
    similarity: number;
  } {
    const differences: Array<{ path: string; value1: any; value2: any }> = [];
    
    // Función recursiva para comparar objetos
    const compareObjects = (obj1: any, obj2: any, path: string = '') => {
      for (const key in obj1) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof obj1[key] === 'object' && obj1[key] !== null) {
          compareObjects(obj1[key], obj2[key], currentPath);
        } else if (obj1[key] !== obj2[key]) {
          differences.push({
            path: currentPath,
            value1: obj1[key],
            value2: obj2[key]
          });
        }
      }
    };

    compareObjects(config1, config2);
    
    // Calcular similitud (porcentaje de campos iguales)
    const totalFields = this.countFields(config1);
    const similarity = (totalFields - differences.length) / totalFields;

    return { differences, similarity };
  }

  /**
   * Cuenta el número total de campos en una configuración
   */
  private static countFields(obj: any, count: number = 0): number {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        count = this.countFields(obj[key], count);
      } else {
        count++;
      }
    }
    return count;
  }
}

/**
 * Hook personalizado para React (si se usa React)
 */
export const useVectorConfig = () => {
  const getCurrentState = () => VectorConfigUI.getCurrentUIState();
  
  const updateConfig = (formData: ConfigurationFormData) => {
    const config = VectorConfigUI.formDataToConfig(formData);
    vectorConfigService.updateConfig(config);
  };

  const loadPreset = (presetName: keyof typeof VECTOR_CONFIG_PRESETS) => {
    vectorConfigService.loadPreset(presetName);
  };

  const createProfile = (name: string, description: string, formData: ConfigurationFormData) => {
    const config = VectorConfigUI.formDataToConfig(formData);
    vectorConfigService.createProfile(name, description, config);
  };

  return {
    getCurrentState,
    updateConfig,
    loadPreset,
    createProfile,
    validateFormData: VectorConfigUI.validateFormData,
    getFieldRanges: VectorConfigUI.getFieldRanges,
    getFieldDescriptions: VectorConfigUI.getFieldDescriptions,
    calculateStats: VectorConfigUI.calculateConfigStats
  };
};
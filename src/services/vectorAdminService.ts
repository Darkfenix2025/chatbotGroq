/**
 * Servicio de Administración Vectorial
 * Proporciona funcionalidades avanzadas para la gestión del sistema vectorial
 */

import { VectorDatabase } from './vectorDatabase';
import { VectorService, PromptModule } from './vectorService';
import { PromptManager } from './promptManager';
import { vectorConfigService } from './vectorConfigService';

export interface SimilarityAnalysis {
  moduleId: string;
  moduleName: string;
  category: string;
  averageSimilarity: number;
  maxSimilarity: number;
  minSimilarity: number;
  similarModules: Array<{
    moduleId: string;
    moduleName: string;
    similarity: number;
  }>;
  redundancyRisk: 'low' | 'medium' | 'high';
}

export interface PerformanceReport {
  timestamp: Date;
  totalModules: number;
  averageProcessingTime: number;
  cacheEfficiency: number;
  memoryUsage: number;
  recommendedOptimizations: string[];
  criticalIssues: string[];
}

export interface ConfigurationValidation {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  suggestions: Array<{
    field: string;
    currentValue: any;
    suggestedValue: any;
    reason: string;
  }>;
}

export interface ModuleInsights {
  moduleId: string;
  moduleName: string;
  category: string;
  usageFrequency: number;
  averageRelevance: number;
  contextualEffectiveness: Record<string, number>;
  recommendedActions: string[];
  lastOptimized: Date | null;
}

export class VectorAdminService {
  private vectorDatabase: VectorDatabase;
  private vectorService: VectorService;
  private promptManager: PromptManager;

  constructor(
    vectorDatabase: VectorDatabase,
    vectorService: VectorService,
    promptManager: PromptManager
  ) {
    this.vectorDatabase = vectorDatabase;
    this.vectorService = vectorService;
    this.promptManager = promptManager;
  }

  /**
   * Analiza similitudes entre módulos para detectar redundancias
   */
  async analyzeSimilarities(): Promise<SimilarityAnalysis[]> {
    const modules = this.vectorDatabase.getAllModules();
    const analyses: SimilarityAnalysis[] = [];

    for (const module of modules) {
      if (!module.embedding) continue;

      const similarities: Array<{ moduleId: string; moduleName: string; similarity: number }> = [];
      let totalSimilarity = 0;
      let maxSimilarity = 0;
      let minSimilarity = 1;

      // Calcular similitudes con otros módulos
      for (const otherModule of modules) {
        if (module.id === otherModule.id || !otherModule.embedding) continue;

        const similarity = this.vectorService.calculateCosineSimilarity(
          module.embedding,
          otherModule.embedding
        );

        similarities.push({
          moduleId: otherModule.id,
          moduleName: otherModule.name,
          similarity
        });

        totalSimilarity += similarity;
        maxSimilarity = Math.max(maxSimilarity, similarity);
        minSimilarity = Math.min(minSimilarity, similarity);
      }

      // Ordenar por similitud descendente
      similarities.sort((a, b) => b.similarity - a.similarity);

      // Determinar riesgo de redundancia
      let redundancyRisk: 'low' | 'medium' | 'high' = 'low';
      if (maxSimilarity > 0.9) {
        redundancyRisk = 'high';
      } else if (maxSimilarity > 0.75) {
        redundancyRisk = 'medium';
      }

      analyses.push({
        moduleId: module.id,
        moduleName: module.name,
        category: module.metadata.category,
        averageSimilarity: totalSimilarity / (modules.length - 1),
        maxSimilarity,
        minSimilarity,
        similarModules: similarities.slice(0, 5), // Top 5 más similares
        redundancyRisk
      });
    }

    return analyses.sort((a, b) => b.maxSimilarity - a.maxSimilarity);
  }

  /**
   * Genera un reporte de rendimiento del sistema vectorial
   */
  async generatePerformanceReport(): Promise<PerformanceReport> {
    const startTime = Date.now();
    
    // Obtener métricas del sistema
    const configMetrics = vectorConfigService.getMetrics();
    const indexStats = this.vectorDatabase.getIndexStats();
    const cacheStats = this.vectorService.getCacheStats();

    // Simular análisis de memoria (en un entorno real se obtendría del sistema)
    const memoryUsage = this.estimateMemoryUsage();

    // Generar recomendaciones
    const recommendedOptimizations = this.generateOptimizationRecommendations(
      configMetrics,
      indexStats,
      cacheStats
    );

    // Identificar problemas críticos
    const criticalIssues = this.identifyCriticalIssues(configMetrics, indexStats);

    const processingTime = Date.now() - startTime;

    return {
      timestamp: new Date(),
      totalModules: indexStats.totalModules,
      averageProcessingTime: configMetrics.averageProcessingTime,
      cacheEfficiency: configMetrics.cacheHitRate,
      memoryUsage,
      recommendedOptimizations,
      criticalIssues
    };
  }

  /**
   * Valida la configuración actual y proporciona sugerencias
   */
  validateConfiguration(): ConfigurationValidation {
    const config = vectorConfigService.getCurrentConfig();
    const errors: ConfigurationValidation['errors'] = [];
    const suggestions: ConfigurationValidation['suggestions'] = [];

    // Validar límites de tokens
    const availableTokens = config.tokens.maxTokensPerQuery - 
                           config.tokens.basePromptTokens - 
                           config.tokens.responseTokenReserve;

    if (availableTokens <= 0) {
      errors.push({
        field: 'tokens.maxTokensPerQuery',
        message: 'No hay tokens suficientes para módulos después de reservas',
        severity: 'error'
      });
    }

    if (availableTokens < config.tokens.maxTokensPerModule) {
      errors.push({
        field: 'tokens.maxTokensPerModule',
        message: 'maxTokensPerModule excede tokens disponibles',
        severity: 'error'
      });
    }

    // Validar parámetros de similitud
    if (config.similarity.minSimilarity > config.similarity.highConfidence) {
      errors.push({
        field: 'similarity.minSimilarity',
        message: 'minSimilarity no puede ser mayor que highConfidence',
        severity: 'error'
      });
    }

    if (config.similarity.minSimilarity < 0.1) {
      errors.push({
        field: 'similarity.minSimilarity',
        message: 'minSimilarity muy bajo puede incluir módulos irrelevantes',
        severity: 'warning'
      });
    }

    // Validar límites de módulos
    if (config.modules.maxModulesPerQuery > 10) {
      errors.push({
        field: 'modules.maxModulesPerQuery',
        message: 'Demasiados módulos pueden degradar la calidad',
        severity: 'warning'
      });
    }

    // Validar pesos de ranking
    const totalWeight = Object.values(config.rankingWeights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(totalWeight - 1) > 0.2) {
      suggestions.push({
        field: 'rankingWeights',
        currentValue: totalWeight,
        suggestedValue: 1.0,
        reason: 'Los pesos de ranking deberían sumar aproximadamente 1.0'
      });
    }

    // Sugerencias de optimización
    const metrics = vectorConfigService.getMetrics();
    
    if (metrics.averageProcessingTime > 2000) {
      suggestions.push({
        field: 'modules.maxModulesPerQuery',
        currentValue: config.modules.maxModulesPerQuery,
        suggestedValue: Math.max(3, config.modules.maxModulesPerQuery - 1),
        reason: 'Reducir módulos para mejorar velocidad de procesamiento'
      });
    }

    if (metrics.cacheHitRate < 0.5) {
      suggestions.push({
        field: 'performance.embeddingCacheSize',
        currentValue: config.performance.embeddingCacheSize,
        suggestedValue: config.performance.embeddingCacheSize * 1.5,
        reason: 'Aumentar cache para mejorar eficiencia'
      });
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      suggestions
    };
  }

  /**
   * Proporciona insights detallados sobre módulos individuales
   */
  async getModuleInsights(): Promise<ModuleInsights[]> {
    const modules = this.vectorDatabase.getAllModules();
    const moduleEffectiveness = this.promptManager.getModuleEffectiveness();
    const insights: ModuleInsights[] = [];

    for (const module of modules) {
      const effectiveness = moduleEffectiveness.find(e => e.moduleId === module.id);
      
      const insight: ModuleInsights = {
        moduleId: module.id,
        moduleName: module.name,
        category: module.metadata.category,
        usageFrequency: effectiveness?.usageCount || 0,
        averageRelevance: effectiveness?.averageRating || 0,
        contextualEffectiveness: effectiveness?.contextEffectiveness || {},
        recommendedActions: [],
        lastOptimized: effectiveness?.lastUpdated || null
      };

      // Generar recomendaciones específicas
      if (insight.usageFrequency === 0) {
        insight.recommendedActions.push('Módulo no utilizado - considerar eliminación o revisión');
      } else if (insight.averageRelevance < 2.5) {
        insight.recommendedActions.push('Baja calificación - revisar contenido y relevancia');
      } else if (insight.usageFrequency > 100 && insight.averageRelevance > 4) {
        insight.recommendedActions.push('Módulo altamente efectivo - considerar expansión');
      }

      // Verificar contextos efectivos
      const effectiveContexts = Object.entries(insight.contextualEffectiveness)
        .filter(([_, effectiveness]) => effectiveness > 0.7);
      
      if (effectiveContexts.length > 0) {
        insight.recommendedActions.push(
          `Especialmente efectivo en: ${effectiveContexts.map(([context]) => context).join(', ')}`
        );
      }

      insights.push(insight);
    }

    return insights.sort((a, b) => b.usageFrequency - a.usageFrequency);
  }

  /**
   * Optimiza automáticamente la configuración basada en métricas
   */
  async autoOptimizeConfiguration(): Promise<{
    previousConfig: any;
    newConfig: any;
    changes: string[];
    expectedImprovements: string[];
  }> {
    const previousConfig = vectorConfigService.getCurrentConfig();
    const optimizedConfig = vectorConfigService.autoOptimizeConfig();
    
    // Aplicar optimización
    vectorConfigService.updateConfig(optimizedConfig);
    
    // Identificar cambios
    const changes = this.identifyConfigChanges(previousConfig, optimizedConfig);
    
    // Predecir mejoras
    const expectedImprovements = this.predictImprovements(changes);

    return {
      previousConfig,
      newConfig: optimizedConfig,
      changes,
      expectedImprovements
    };
  }

  /**
   * Exporta análisis completo del sistema
   */
  async exportSystemAnalysis(): Promise<string> {
    const [
      similarities,
      performanceReport,
      configValidation,
      moduleInsights
    ] = await Promise.all([
      this.analyzeSimilarities(),
      this.generatePerformanceReport(),
      Promise.resolve(this.validateConfiguration()),
      this.getModuleInsights()
    ]);

    const analysis = {
      timestamp: new Date().toISOString(),
      systemOverview: {
        totalModules: this.vectorDatabase.getIndexStats().totalModules,
        configuration: vectorConfigService.getCurrentConfig(),
        metrics: vectorConfigService.getMetrics()
      },
      similarities,
      performance: performanceReport,
      validation: configValidation,
      moduleInsights,
      recommendations: this.generateSystemRecommendations(
        similarities,
        performanceReport,
        configValidation,
        moduleInsights
      )
    };

    return JSON.stringify(analysis, null, 2);
  }

  /**
   * Estima el uso de memoria del sistema vectorial
   */
  private estimateMemoryUsage(): number {
    const modules = this.vectorDatabase.getAllModules();
    let totalMemory = 0;

    // Estimar memoria de embeddings (300 dimensiones * 4 bytes por float)
    const embeddingMemory = modules.length * 300 * 4;
    
    // Estimar memoria de contenido de módulos
    const contentMemory = modules.reduce((sum, module) => 
      sum + (module.content.length * 2), 0); // 2 bytes por carácter UTF-16

    // Estimar memoria de índices y cache
    const indexMemory = modules.length * 1000; // Estimación de metadata
    const cacheMemory = this.vectorService.getCacheStats().size * 300 * 4;

    totalMemory = embeddingMemory + contentMemory + indexMemory + cacheMemory;
    
    return Math.round(totalMemory / (1024 * 1024)); // Convertir a MB
  }

  /**
   * Genera recomendaciones de optimización
   */
  private generateOptimizationRecommendations(
    configMetrics: any,
    indexStats: any,
    cacheStats: any
  ): string[] {
    const recommendations: string[] = [];

    if (configMetrics.averageProcessingTime > 2000) {
      recommendations.push('Reducir maxModulesPerQuery para mejorar velocidad');
    }

    if (configMetrics.cacheHitRate < 0.5) {
      recommendations.push('Aumentar tamaño del cache de embeddings');
    }

    if (indexStats.totalModules > 50) {
      recommendations.push('Considerar clustering de módulos similares');
    }

    if (configMetrics.averageTokenUsage > 3500) {
      recommendations.push('Optimizar límites de tokens por módulo');
    }

    return recommendations;
  }

  /**
   * Identifica problemas críticos del sistema
   */
  private identifyCriticalIssues(configMetrics: any, indexStats: any): string[] {
    const issues: string[] = [];

    if (configMetrics.averageProcessingTime > 5000) {
      issues.push('Tiempo de procesamiento excesivamente alto');
    }

    if (indexStats.totalModules === 0) {
      issues.push('No hay módulos indexados en el sistema');
    }

    if (configMetrics.averageAccuracy < 0.3) {
      issues.push('Precisión del sistema muy baja');
    }

    return issues;
  }

  /**
   * Identifica cambios entre configuraciones
   */
  private identifyConfigChanges(oldConfig: any, newConfig: any): string[] {
    const changes: string[] = [];

    // Comparar propiedades principales
    if (oldConfig.similarity.minSimilarity !== newConfig.similarity.minSimilarity) {
      changes.push(`Similitud mínima: ${oldConfig.similarity.minSimilarity} → ${newConfig.similarity.minSimilarity}`);
    }

    if (oldConfig.modules.maxModulesPerQuery !== newConfig.modules.maxModulesPerQuery) {
      changes.push(`Módulos por consulta: ${oldConfig.modules.maxModulesPerQuery} → ${newConfig.modules.maxModulesPerQuery}`);
    }

    if (oldConfig.tokens.maxTokensPerModule !== newConfig.tokens.maxTokensPerModule) {
      changes.push(`Tokens por módulo: ${oldConfig.tokens.maxTokensPerModule} → ${newConfig.tokens.maxTokensPerModule}`);
    }

    return changes;
  }

  /**
   * Predice mejoras basadas en cambios de configuración
   */
  private predictImprovements(changes: string[]): string[] {
    const improvements: string[] = [];

    changes.forEach(change => {
      if (change.includes('Módulos por consulta') && change.includes('→') && 
          parseInt(change.split('→')[1]) < parseInt(change.split('→')[0])) {
        improvements.push('Mejora esperada en velocidad de procesamiento');
      }

      if (change.includes('Similitud mínima') && change.includes('→') &&
          parseFloat(change.split('→')[1]) < parseFloat(change.split('→')[0])) {
        improvements.push('Mayor cobertura de módulos relevantes');
      }

      if (change.includes('Tokens por módulo') && change.includes('→') &&
          parseInt(change.split('→')[1]) < parseInt(change.split('→')[0])) {
        improvements.push('Reducción en uso de tokens');
      }
    });

    return improvements;
  }

  /**
   * Genera recomendaciones generales del sistema
   */
  private generateSystemRecommendations(
    similarities: SimilarityAnalysis[],
    performance: PerformanceReport,
    validation: ConfigurationValidation,
    insights: ModuleInsights[]
  ): string[] {
    const recommendations: string[] = [];

    // Recomendaciones basadas en similitudes
    const highRedundancy = similarities.filter(s => s.redundancyRisk === 'high');
    if (highRedundancy.length > 0) {
      recommendations.push(`Revisar ${highRedundancy.length} módulos con alta redundancia`);
    }

    // Recomendaciones basadas en rendimiento
    if (performance.criticalIssues.length > 0) {
      recommendations.push('Resolver problemas críticos de rendimiento');
    }

    // Recomendaciones basadas en validación
    if (!validation.isValid) {
      recommendations.push('Corregir errores de configuración identificados');
    }

    // Recomendaciones basadas en insights
    const unusedModules = insights.filter(i => i.usageFrequency === 0);
    if (unusedModules.length > 0) {
      recommendations.push(`Revisar ${unusedModules.length} módulos no utilizados`);
    }

    const lowPerformingModules = insights.filter(i => i.averageRelevance < 2.5 && i.usageFrequency > 0);
    if (lowPerformingModules.length > 0) {
      recommendations.push(`Optimizar ${lowPerformingModules.length} módulos con bajo rendimiento`);
    }

    return recommendations;
  }
}
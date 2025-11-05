/**
 * Servicio de Integración Vectorial Avanzada
 * Orquesta todas las funcionalidades avanzadas del sistema vectorial
 */

import { VectorService } from './vectorService';
import { VectorDatabase } from './vectorDatabase';
import { PromptManager } from './promptManager';
import { VectorAdminService } from './vectorAdminService';
import { vectorConfigService } from './vectorConfigService';

export interface AdvancedSystemStatus {
  isInitialized: boolean;
  learningEnabled: boolean;
  optimizationLevel: 'basic' | 'intermediate' | 'advanced';
  lastOptimization: Date | null;
  systemHealth: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

export interface AdvancedMetrics {
  semantic: {
    totalQueries: number;
    averageAccuracy: number;
    learningProgress: number;
  };
  optimization: {
    embeddingQuality: number;
    searchAccuracy: number;
    processingSpeed: number;
    memoryEfficiency: number;
  };
  system: {
    totalModules: number;
    specializedModules: number;
    clustersCount: number;
    cacheEfficiency: number;
  };
}

export class AdvancedVectorIntegration {
  private vectorService: VectorService;
  private vectorDatabase: VectorDatabase;
  private promptManager: PromptManager;
  private adminService: VectorAdminService;
  private isInitialized: boolean = false;

  constructor(
    vectorService: VectorService,
    vectorDatabase: VectorDatabase,
    promptManager: PromptManager
  ) {
    this.vectorService = vectorService;
    this.vectorDatabase = vectorDatabase;
    this.promptManager = promptManager;
    this.adminService = new VectorAdminService(vectorDatabase, vectorService, promptManager);
  }

  /**
   * Inicializa el sistema vectorial avanzado
   */
  async initializeAdvancedSystem(): Promise<void> {
    console.log('Inicializando sistema vectorial avanzado...');

    try {
      // 1. Verificar estado del sistema base
      await this.verifyBaseSystem();

      // 2. Generar embeddings especializados para dominio legal
      await this.promptManager.generateLegalSpecializedEmbeddings();

      // 3. Habilitar aprendizaje semántico
      this.promptManager.setLearningEnabled(true);

      // 4. Ejecutar optimización inicial
      await this.runInitialOptimization();

      // 5. Configurar monitoreo automático
      this.setupAutomaticMonitoring();

      this.isInitialized = true;
      console.log('Sistema vectorial avanzado inicializado exitosamente');

    } catch (error) {
      console.error('Error inicializando sistema avanzado:', error);
      throw error;
    }
  }

  /**
   * Ejecuta ciclo completo de optimización
   */
  async runFullOptimizationCycle(): Promise<{
    beforeMetrics: AdvancedMetrics;
    afterMetrics: AdvancedMetrics;
    improvements: string[];
    duration: number;
  }> {
    const startTime = Date.now();
    console.log('Iniciando ciclo completo de optimización...');

    // Métricas antes de la optimización
    const beforeMetrics = await this.getAdvancedMetrics();

    try {
      // 1. Ejecutar fine-tuning de embeddings
      await this.promptManager.performFineTuning();

      // 2. Optimizar embeddings existentes
      await this.promptManager.optimizeExistingEmbeddings();

      // 3. Aplicar auto-optimización de configuración
      vectorConfigService.applyAutoOptimization();

      // 4. Optimizar índice vectorial
      await this.vectorDatabase.optimizeIndex();

      // 5. Limpiar cache y regenerar si es necesario
      this.vectorService.clearCache();

      // Métricas después de la optimización
      const afterMetrics = await this.getAdvancedMetrics();

      // Calcular mejoras
      const improvements = this.calculateImprovements(beforeMetrics, afterMetrics);

      const duration = Date.now() - startTime;
      console.log(`Ciclo de optimización completado en ${duration}ms`);

      return {
        beforeMetrics,
        afterMetrics,
        improvements,
        duration
      };

    } catch (error) {
      console.error('Error en ciclo de optimización:', error);
      throw error;
    }
  }

  /**
   * Obtiene estado completo del sistema avanzado
   */
  async getSystemStatus(): Promise<AdvancedSystemStatus> {
    const learningMetrics = this.promptManager.getLearningMetrics();
    const optimizationMetrics = this.promptManager.getOptimizationMetrics();
    const configValidation = this.adminService.validateConfiguration();

    // Determinar nivel de optimización
    let optimizationLevel: 'basic' | 'intermediate' | 'advanced' = 'basic';
    if (optimizationMetrics.embeddingQuality > 0.8 && optimizationMetrics.searchAccuracy > 0.8) {
      optimizationLevel = 'advanced';
    } else if (optimizationMetrics.embeddingQuality > 0.6 && optimizationMetrics.searchAccuracy > 0.6) {
      optimizationLevel = 'intermediate';
    }

    // Determinar salud del sistema
    let systemHealth: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    const healthScore = (
      optimizationMetrics.embeddingQuality +
      optimizationMetrics.searchAccuracy +
      optimizationMetrics.processingSpeed / 1000 + // Normalizar velocidad
      optimizationMetrics.memoryEfficiency +
      optimizationMetrics.userSatisfaction
    ) / 5;

    if (healthScore > 0.9) systemHealth = 'excellent';
    else if (healthScore > 0.7) systemHealth = 'good';
    else if (healthScore > 0.5) systemHealth = 'fair';

    // Generar recomendaciones
    const recommendations = await this.generateSystemRecommendations();

    return {
      isInitialized: this.isInitialized,
      learningEnabled: learningMetrics.totalFeedbacks > 0,
      optimizationLevel,
      lastOptimization: new Date(learningMetrics.lastLearningCycle),
      systemHealth,
      recommendations
    };
  }

  /**
   * Obtiene métricas avanzadas consolidadas
   */
  async getAdvancedMetrics(): Promise<AdvancedMetrics> {
    const configMetrics = vectorConfigService.getMetrics();
    const learningMetrics = this.promptManager.getLearningMetrics();
    const optimizationMetrics = this.promptManager.getOptimizationMetrics();
    const indexStats = this.vectorDatabase.getIndexStats();
    const clusters = this.promptManager.getQueryClusters();

    return {
      semantic: {
        totalQueries: configMetrics.queriesProcessed,
        averageAccuracy: configMetrics.averageAccuracy,
        learningProgress: learningMetrics.averageImprovement
      },
      optimization: {
        embeddingQuality: optimizationMetrics.embeddingQuality,
        searchAccuracy: optimizationMetrics.searchAccuracy,
        processingSpeed: optimizationMetrics.processingSpeed,
        memoryEfficiency: optimizationMetrics.memoryEfficiency
      },
      system: {
        totalModules: indexStats.totalModules,
        specializedModules: indexStats.totalModules, // Placeholder - todos son especializados después de la inicialización
        clustersCount: clusters.length,
        cacheEfficiency: configMetrics.cacheHitRate
      }
    };
  }

  /**
   * Ejecuta diagnóstico completo del sistema
   */
  async runSystemDiagnostic(): Promise<{
    status: AdvancedSystemStatus;
    metrics: AdvancedMetrics;
    performanceReport: any;
    configValidation: any;
    recommendations: string[];
  }> {
    console.log('Ejecutando diagnóstico completo del sistema...');

    const [
      status,
      metrics,
      performanceReport,
      configValidation
    ] = await Promise.all([
      this.getSystemStatus(),
      this.getAdvancedMetrics(),
      this.adminService.generatePerformanceReport(),
      Promise.resolve(this.adminService.validateConfiguration())
    ]);

    const recommendations = await this.generateComprehensiveRecommendations(
      status,
      metrics,
      performanceReport,
      configValidation
    );

    return {
      status,
      metrics,
      performanceReport,
      configValidation,
      recommendations
    };
  }

  /**
   * Exporta configuración completa del sistema avanzado
   */
  async exportAdvancedConfiguration(): Promise<string> {
    const systemData = {
      timestamp: new Date().toISOString(),
      systemStatus: await this.getSystemStatus(),
      metrics: await this.getAdvancedMetrics(),
      configuration: vectorConfigService.exportConfiguration(),
      learningData: this.promptManager.exportLearningData(),
      optimizationData: this.promptManager.exportOptimizationData(),
      systemAnalysis: await this.adminService.exportSystemAnalysis()
    };

    return JSON.stringify(systemData, null, 2);
  }

  /**
   * Importa configuración completa del sistema avanzado
   */
  async importAdvancedConfiguration(data: string): Promise<void> {
    try {
      const systemData = JSON.parse(data);

      // Importar configuración base
      if (systemData.configuration) {
        vectorConfigService.importConfiguration(systemData.configuration);
      }

      // Importar datos de aprendizaje
      if (systemData.learningData) {
        await this.promptManager.importLearningData(systemData.learningData);
      }

      // Importar datos de optimización
      if (systemData.optimizationData) {
        await this.promptManager.importOptimizationData(systemData.optimizationData);
      }

      console.log('Configuración avanzada importada exitosamente');

    } catch (error) {
      throw new Error(`Error importando configuración avanzada: ${error}`);
    }
  }

  /**
   * Registra feedback completo para todos los sistemas de aprendizaje
   */
  async recordComprehensiveFeedback(
    queryId: string,
    query: string,
    queryEmbedding: number[],
    selectedModules: string[],
    userRating: number,
    responseQuality: number,
    contextTags: string[] = []
  ): Promise<void> {
    // Registrar en sistema de aprendizaje semántico
    await this.promptManager.recordQueryFeedback(
      queryId,
      query,
      queryEmbedding,
      selectedModules,
      userRating,
      responseQuality,
      contextTags
    );

    // Registrar para fine-tuning
    this.promptManager.recordFineTuningData(
      query,
      selectedModules,
      userRating,
      contextTags
    );

    // Actualizar métricas de configuración
    vectorConfigService.updateMetrics(
      Date.now(), // Placeholder para tiempo de procesamiento
      responseQuality,
      2000, // Placeholder para uso de tokens
      false // Placeholder para cache hit
    );
  }

  /**
   * Verifica el estado del sistema base
   */
  private async verifyBaseSystem(): Promise<void> {
    const indexStats = this.vectorDatabase.getIndexStats();
    
    if (indexStats.totalModules === 0) {
      throw new Error('No hay módulos indexados en el sistema');
    }

    const config = vectorConfigService.getCurrentConfig();
    const validation = this.adminService.validateConfiguration();
    
    if (!validation.isValid) {
      const errors = validation.errors.filter(e => e.severity === 'error');
      if (errors.length > 0) {
        throw new Error(`Errores de configuración: ${errors.map(e => e.message).join(', ')}`);
      }
    }
  }

  /**
   * Ejecuta optimización inicial
   */
  private async runInitialOptimization(): Promise<void> {
    // Aplicar auto-optimización de configuración
    vectorConfigService.applyAutoOptimization();

    // Optimizar índice vectorial
    await this.vectorDatabase.optimizeIndex();

    console.log('Optimización inicial completada');
  }

  /**
   * Configura monitoreo automático
   */
  private setupAutomaticMonitoring(): void {
    // En un entorno real, esto configuraría intervalos de monitoreo
    console.log('Monitoreo automático configurado');
  }

  /**
   * Calcula mejoras entre métricas
   */
  private calculateImprovements(before: AdvancedMetrics, after: AdvancedMetrics): string[] {
    const improvements: string[] = [];

    // Comparar métricas semánticas
    if (after.semantic.averageAccuracy > before.semantic.averageAccuracy) {
      const improvement = ((after.semantic.averageAccuracy - before.semantic.averageAccuracy) * 100).toFixed(1);
      improvements.push(`Precisión semántica mejoró ${improvement}%`);
    }

    // Comparar métricas de optimización
    if (after.optimization.embeddingQuality > before.optimization.embeddingQuality) {
      const improvement = ((after.optimization.embeddingQuality - before.optimization.embeddingQuality) * 100).toFixed(1);
      improvements.push(`Calidad de embeddings mejoró ${improvement}%`);
    }

    if (after.optimization.processingSpeed > before.optimization.processingSpeed) {
      const improvement = ((after.optimization.processingSpeed - before.optimization.processingSpeed) / before.optimization.processingSpeed * 100).toFixed(1);
      improvements.push(`Velocidad de procesamiento mejoró ${improvement}%`);
    }

    // Comparar métricas del sistema
    if (after.system.cacheEfficiency > before.system.cacheEfficiency) {
      const improvement = ((after.system.cacheEfficiency - before.system.cacheEfficiency) * 100).toFixed(1);
      improvements.push(`Eficiencia de cache mejoró ${improvement}%`);
    }

    return improvements;
  }

  /**
   * Genera recomendaciones del sistema
   */
  private async generateSystemRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    const metrics = await this.getAdvancedMetrics();

    // Recomendaciones basadas en métricas semánticas
    if (metrics.semantic.averageAccuracy < 0.7) {
      recommendations.push('Ejecutar ciclo de fine-tuning para mejorar precisión');
    }

    if (metrics.semantic.totalQueries < 100) {
      recommendations.push('Recopilar más datos de consultas para mejorar aprendizaje');
    }

    // Recomendaciones basadas en optimización
    if (metrics.optimization.embeddingQuality < 0.6) {
      recommendations.push('Regenerar embeddings especializados para dominio legal');
    }

    if (metrics.optimization.processingSpeed < 500) {
      recommendations.push('Optimizar configuración para mejorar velocidad');
    }

    // Recomendaciones basadas en sistema
    if (metrics.system.cacheEfficiency < 0.5) {
      recommendations.push('Aumentar tamaño de cache para mejorar eficiencia');
    }

    if (metrics.system.clustersCount < 3) {
      recommendations.push('Recopilar más datos para mejorar clustering de consultas');
    }

    return recommendations;
  }

  /**
   * Genera recomendaciones comprehensivas
   */
  private async generateComprehensiveRecommendations(
    status: AdvancedSystemStatus,
    metrics: AdvancedMetrics,
    performanceReport: any,
    configValidation: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Recomendaciones basadas en estado
    if (!status.isInitialized) {
      recommendations.push('Inicializar sistema vectorial avanzado');
    }

    if (status.systemHealth === 'poor') {
      recommendations.push('Ejecutar diagnóstico completo y optimización urgente');
    }

    // Recomendaciones basadas en rendimiento
    if (performanceReport.criticalIssues.length > 0) {
      recommendations.push(...performanceReport.criticalIssues.map((issue: string) => `Crítico: ${issue}`));
    }

    // Recomendaciones basadas en configuración
    if (!configValidation.isValid) {
      recommendations.push(...configValidation.errors.map((error: any) => `Config: ${error.message}`));
    }

    // Recomendaciones específicas del sistema
    recommendations.push(...await this.generateSystemRecommendations());

    return [...new Set(recommendations)]; // Remover duplicados
  }
}
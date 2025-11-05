import { VectorService } from './vectorService';
import { VectorDatabase } from './vectorDatabase';
import { PromptManager } from './promptManager';
import { EmbeddingInitializer } from './embeddingInitializer';

export interface IntelligentPromptResult {
  finalPrompt: string;
  usedModules: string[];
  totalTokens: number;
  relevanceScore: number;
  processingTime: number;
  queryAnalysis?: {
    intent: string;
    complexity: number;
    legalArea: string[];
    requiresSpecialMode: boolean;
  };
  moduleSelectionDetails?: {
    candidateModules: number;
    selectedModules: number;
    averageSimilarity: number;
    topSimilarity: number;
  };
}

export interface ModuleRelevanceMetrics {
  moduleId: string;
  moduleName: string;
  category: string;
  usageCount: number;
  averageRelevance: number;
  lastUsed: Date;
  topQueries: string[];
}

export interface SemanticPrecisionReport {
  timestamp: Date;
  totalQueries: number;
  averageProcessingTime: number;
  averageRelevanceScore: number;
  moduleMetrics: ModuleRelevanceMetrics[];
  queryComplexityDistribution: {
    low: number;    // 0-0.3
    medium: number; // 0.3-0.7
    high: number;   // 0.7-1.0
  };
  intentDistribution: Record<string, number>;
  performanceStats: {
    fastQueries: number;    // < 500ms
    mediumQueries: number;  // 500-1500ms
    slowQueries: number;    // > 1500ms
  };
}

export class IntelligentPromptService {
  private vectorService: VectorService;
  private vectorDatabase: VectorDatabase;
  private promptManager: PromptManager;
  private isInitialized: boolean = false;
  
  // Métricas y tracking
  private queryHistory: Array<{
    query: string;
    result: IntelligentPromptResult;
    timestamp: Date;
  }> = [];
  private moduleUsageStats: Map<string, {
    count: number;
    totalRelevance: number;
    lastUsed: Date;
    queries: string[];
  }> = new Map();

  constructor(huggingFaceApiKey: string) {
    this.vectorService = new VectorService(huggingFaceApiKey);
    this.vectorDatabase = new VectorDatabase();
    this.promptManager = new PromptManager(this.vectorService, this.vectorDatabase);
  }

  /**
   * Inicializa el sistema si no está inicializado
   */
  async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('🔄 Inicializando sistema inteligente de prompts...');
    
    const initializer = new EmbeddingInitializer(this.vectorService['apiKey']);
    await initializer.initializeSystem();
    
    this.isInitialized = true;
    console.log('✅ Sistema inteligente de prompts inicializado');
  }

  /**
   * Genera un prompt inteligente para una consulta con métricas detalladas
   */
  async generateIntelligentPrompt(
    userQuery: string, 
    maxTokens: number = 4000
  ): Promise<IntelligentPromptResult> {
    const startTime = Date.now();

    try {
      // Asegurar que el sistema esté inicializado
      await this.ensureInitialized();

      console.log(`🧠 Generando prompt inteligente para: "${userQuery.substring(0, 50)}..."`);

      // 1. Analizar la consulta
      const analysis = await this.promptManager.analyzeQuery(userQuery);
      console.log(`🔍 Análisis completado - Intención: ${analysis.intent}, Complejidad: ${(analysis.complexity * 100).toFixed(0)}%`);

      // 2. Obtener módulos candidatos para métricas
      const queryEmbedding = await this.vectorService.generateEmbedding(userQuery);
      const candidateSearch = await this.vectorDatabase.searchSimilar(queryEmbedding, 10);
      
      // 3. Seleccionar módulos semánticamente
      const selectedModules = await this.promptManager.selectModulesSemanticaly(analysis);
      console.log(`📊 Seleccionados ${selectedModules.length} módulos de ${candidateSearch.modules.length} candidatos`);

      // 4. Construir prompt óptimo
      const promptResult = this.promptManager.buildOptimalPrompt(selectedModules, maxTokens);
      console.log(`✅ Prompt construido - ${promptResult.totalTokens} tokens, ${promptResult.usedModules.length} módulos`);

      const processingTime = Date.now() - startTime;

      // 5. Calcular métricas de selección
      const similarities = candidateSearch.similarities.slice(0, selectedModules.length);
      const averageSimilarity = similarities.length > 0 
        ? similarities.reduce((a, b) => a + b, 0) / similarities.length 
        : 0;
      const topSimilarity = similarities.length > 0 ? Math.max(...similarities) : 0;

      const result: IntelligentPromptResult = {
        finalPrompt: promptResult.finalPrompt,
        usedModules: promptResult.usedModules.map(m => m.id),
        totalTokens: promptResult.totalTokens,
        relevanceScore: promptResult.relevanceScore,
        processingTime,
        queryAnalysis: {
          intent: analysis.intent,
          complexity: analysis.complexity,
          legalArea: analysis.legalArea,
          requiresSpecialMode: analysis.requiresSpecialMode
        },
        moduleSelectionDetails: {
          candidateModules: candidateSearch.modules.length,
          selectedModules: selectedModules.length,
          averageSimilarity,
          topSimilarity
        }
      };

      // 6. Registrar métricas
      this.recordQueryMetrics(userQuery, result);

      console.log(`⚡ Procesamiento completado en ${processingTime}ms`);
      console.log(`📈 Métricas: Similitud promedio ${(averageSimilarity * 100).toFixed(1)}%, Top ${(topSimilarity * 100).toFixed(1)}%`);
      
      return result;

    } catch (error) {
      console.error('❌ Error generando prompt inteligente:', error);
      throw error;
    }
  }

  /**
   * Obtiene información sobre los módulos utilizados
   */
  async getModuleInfo(moduleIds: string[]): Promise<any[]> {
    const moduleInfo = [];
    
    for (const moduleId of moduleIds) {
      const module = this.vectorDatabase.getModule(moduleId);
      if (module) {
        moduleInfo.push({
          id: module.id,
          name: module.name,
          category: module.metadata.category,
          priority: module.metadata.priority,
          tokens: module.metadata.maxTokens,
          keywords: module.metadata.keywords
        });
      }
    }

    return moduleInfo;
  }

  /**
   * Analiza una consulta sin generar el prompt completo
   */
  async analyzeQuery(userQuery: string) {
    await this.ensureInitialized();
    return await this.promptManager.analyzeQuery(userQuery);
  }

  /**
   * Busca módulos similares a una consulta
   */
  async findSimilarModules(userQuery: string, topK: number = 5) {
    await this.ensureInitialized();
    
    const queryEmbedding = await this.vectorService.generateEmbedding(userQuery);
    const searchResult = await this.vectorDatabase.searchSimilar(queryEmbedding, topK);
    
    return {
      modules: searchResult.modules.map(m => ({
        id: m.id,
        name: m.name,
        category: m.metadata.category,
        keywords: m.metadata.keywords
      })),
      similarities: searchResult.similarities,
      totalRelevance: searchResult.totalRelevance
    };
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getSystemStats() {
    const dbStats = this.vectorDatabase.getIndexStats();
    const cacheStats = this.vectorService.getCacheStats();
    
    return {
      isInitialized: this.isInitialized,
      database: dbStats,
      cache: cacheStats
    };
  }

  /**
   * Reinicializa el sistema (útil para desarrollo)
   */
  async reinitialize(): Promise<void> {
    console.log('🔄 Reinicializando sistema...');
    
    this.vectorDatabase.clearCache();
    this.vectorService.clearCache();
    this.isInitialized = false;
    
    await this.ensureInitialized();
    console.log('✅ Sistema reinicializado');
  }

  /**
   * Registra métricas de una consulta para análisis posterior
   */
  private recordQueryMetrics(userQuery: string, result: IntelligentPromptResult): void {
    const timestamp = new Date();
    
    // Agregar a historial (mantener últimas 500 consultas)
    this.queryHistory.push({
      query: userQuery,
      result,
      timestamp
    });
    
    if (this.queryHistory.length > 500) {
      this.queryHistory = this.queryHistory.slice(-500);
    }

    // Actualizar estadísticas de uso de módulos
    result.usedModules.forEach(moduleId => {
      const stats = this.moduleUsageStats.get(moduleId) || {
        count: 0,
        totalRelevance: 0,
        lastUsed: timestamp,
        queries: []
      };

      stats.count++;
      stats.totalRelevance += result.relevanceScore;
      stats.lastUsed = timestamp;
      stats.queries.push(userQuery.substring(0, 100)); // Limitar longitud
      
      // Mantener solo las últimas 10 consultas por módulo
      if (stats.queries.length > 10) {
        stats.queries = stats.queries.slice(-10);
      }

      this.moduleUsageStats.set(moduleId, stats);
    });
  }

  /**
   * Genera reporte de precisión semántica
   */
  generateSemanticPrecisionReport(): SemanticPrecisionReport {
    const now = new Date();
    const recentQueries = this.queryHistory.filter(
      entry => now.getTime() - entry.timestamp.getTime() < 24 * 60 * 60 * 1000 // Últimas 24 horas
    );

    if (recentQueries.length === 0) {
      return {
        timestamp: now,
        totalQueries: 0,
        averageProcessingTime: 0,
        averageRelevanceScore: 0,
        moduleMetrics: [],
        queryComplexityDistribution: { low: 0, medium: 0, high: 0 },
        intentDistribution: {},
        performanceStats: { fastQueries: 0, mediumQueries: 0, slowQueries: 0 }
      };
    }

    // Calcular métricas básicas
    const totalQueries = recentQueries.length;
    const averageProcessingTime = recentQueries.reduce((sum, entry) => 
      sum + entry.result.processingTime, 0) / totalQueries;
    const averageRelevanceScore = recentQueries.reduce((sum, entry) => 
      sum + entry.result.relevanceScore, 0) / totalQueries;

    // Distribución de complejidad
    const complexityDistribution = { low: 0, medium: 0, high: 0 };
    recentQueries.forEach(entry => {
      const complexity = entry.result.queryAnalysis?.complexity || 0;
      if (complexity < 0.3) complexityDistribution.low++;
      else if (complexity < 0.7) complexityDistribution.medium++;
      else complexityDistribution.high++;
    });

    // Distribución de intenciones
    const intentDistribution: Record<string, number> = {};
    recentQueries.forEach(entry => {
      const intent = entry.result.queryAnalysis?.intent || 'unknown';
      intentDistribution[intent] = (intentDistribution[intent] || 0) + 1;
    });

    // Estadísticas de rendimiento
    const performanceStats = { fastQueries: 0, mediumQueries: 0, slowQueries: 0 };
    recentQueries.forEach(entry => {
      const time = entry.result.processingTime;
      if (time < 500) performanceStats.fastQueries++;
      else if (time < 1500) performanceStats.mediumQueries++;
      else performanceStats.slowQueries++;
    });

    // Métricas de módulos
    const moduleMetrics: ModuleRelevanceMetrics[] = [];
    this.moduleUsageStats.forEach((stats, moduleId) => {
      const module = this.vectorDatabase.getModule(moduleId);
      if (module) {
        moduleMetrics.push({
          moduleId,
          moduleName: module.name,
          category: module.metadata.category,
          usageCount: stats.count,
          averageRelevance: stats.totalRelevance / stats.count,
          lastUsed: stats.lastUsed,
          topQueries: stats.queries.slice(-3) // Últimas 3 consultas
        });
      }
    });

    // Ordenar módulos por uso
    moduleMetrics.sort((a, b) => b.usageCount - a.usageCount);

    return {
      timestamp: now,
      totalQueries,
      averageProcessingTime,
      averageRelevanceScore,
      moduleMetrics,
      queryComplexityDistribution: complexityDistribution,
      intentDistribution,
      performanceStats
    };
  }

  /**
   * Obtiene logs de similitudes para debugging
   */
  getSimilarityLogs(limit: number = 20): Array<{
    query: string;
    timestamp: Date;
    moduleRankings: Array<{
      moduleId: string;
      moduleName: string;
      similarity: number;
      selected: boolean;
    }>;
  }> {
    return this.queryHistory
      .slice(-limit)
      .map(entry => {
        const moduleRankings: Array<{
          moduleId: string;
          moduleName: string;
          similarity: number;
          selected: boolean;
        }> = [];

        // Obtener información de módulos candidatos
        entry.result.usedModules.forEach(moduleId => {
          const module = this.vectorDatabase.getModule(moduleId);
          if (module) {
            moduleRankings.push({
              moduleId,
              moduleName: module.name,
              similarity: entry.result.moduleSelectionDetails?.averageSimilarity || 0,
              selected: true
            });
          }
        });

        return {
          query: entry.query,
          timestamp: entry.timestamp,
          moduleRankings
        };
      })
      .reverse(); // Más recientes primero
  }

  /**
   * Obtiene métricas de relevancia por módulo
   */
  getModuleRelevanceMetrics(): ModuleRelevanceMetrics[] {
    const metrics: ModuleRelevanceMetrics[] = [];
    
    this.moduleUsageStats.forEach((stats, moduleId) => {
      const module = this.vectorDatabase.getModule(moduleId);
      if (module) {
        metrics.push({
          moduleId,
          moduleName: module.name,
          category: module.metadata.category,
          usageCount: stats.count,
          averageRelevance: stats.totalRelevance / stats.count,
          lastUsed: stats.lastUsed,
          topQueries: stats.queries.slice(-5) // Últimas 5 consultas
        });
      }
    });

    return metrics.sort((a, b) => b.averageRelevance - a.averageRelevance);
  }

  /**
   * Limpia métricas y historial
   */
  clearMetrics(): void {
    this.queryHistory = [];
    this.moduleUsageStats.clear();
    console.log('🧹 Métricas del sistema inteligente limpiadas');
  }

  /**
   * Exporta métricas para análisis externo
   */
  exportMetrics(): {
    queryHistory: Array<{
      query: string;
      result: IntelligentPromptResult;
      timestamp: Date;
    }>;
    moduleUsageStats: Record<string, any>;
    systemStats: any;
  } {
    const moduleUsageStats: Record<string, any> = {};
    this.moduleUsageStats.forEach((stats, moduleId) => {
      moduleUsageStats[moduleId] = stats;
    });

    return {
      queryHistory: this.queryHistory,
      moduleUsageStats,
      systemStats: this.getSystemStats()
    };
  }

  /**
   * Prueba el sistema con consultas de ejemplo y genera reporte
   */
  async runTests(): Promise<void> {
    console.log('\n🧪 Ejecutando pruebas del sistema con métricas...');

    const testQueries = [
      "¿Cómo analizar un caso de despido laboral?",
      "Necesito redactar una demanda por daños y perjuicios",
      "¿Qué estrategia usar en una negociación comercial?",
      "Activa modo estratega rojo para evaluar mi caso",
      "Análisis técnico de jurisprudencia sobre contratos",
      "¿Cuáles son mis derechos en un contrato de alquiler?",
      "Estrategia para negociar una indemnización",
      "Análisis de riesgo en una inversión comercial"
    ];

    for (const query of testQueries) {
      console.log(`\n📝 Probando: "${query}"`);
      
      try {
        const result = await this.generateIntelligentPrompt(query, 2000);
        console.log(`  ✅ Módulos: ${result.usedModules.length}, Tokens: ${result.totalTokens}, Tiempo: ${result.processingTime}ms`);
        console.log(`  📊 Relevancia: ${(result.relevanceScore * 100).toFixed(1)}%`);
        console.log(`  🎯 Similitud promedio: ${((result.moduleSelectionDetails?.averageSimilarity || 0) * 100).toFixed(1)}%`);
        console.log(`  📦 Módulos: ${result.usedModules.join(', ')}`);
      } catch (error) {
        console.error(`  ❌ Error: ${error}`);
      }
    }

    console.log('\n📊 Generando reporte de precisión semántica...');
    const report = this.generateSemanticPrecisionReport();
    
    console.log(`\n✅ Reporte de Precisión Semántica:`);
    console.log(`  📈 Total consultas: ${report.totalQueries}`);
    console.log(`  ⚡ Tiempo promedio: ${report.averageProcessingTime.toFixed(0)}ms`);
    console.log(`  🎯 Relevancia promedio: ${(report.averageRelevanceScore * 100).toFixed(1)}%`);
    console.log(`  📊 Distribución complejidad: Baja ${report.queryComplexityDistribution.low}, Media ${report.queryComplexityDistribution.medium}, Alta ${report.queryComplexityDistribution.high}`);
    console.log(`  🚀 Rendimiento: Rápidas ${report.performanceStats.fastQueries}, Medias ${report.performanceStats.mediumQueries}, Lentas ${report.performanceStats.slowQueries}`);
    
    if (report.moduleMetrics.length > 0) {
      console.log(`\n🏆 Top 5 módulos más utilizados:`);
      report.moduleMetrics.slice(0, 5).forEach((metric, index) => {
        console.log(`  ${index + 1}. ${metric.moduleName} (${metric.category}): ${metric.usageCount} usos, ${(metric.averageRelevance * 100).toFixed(1)}% relevancia`);
      });
    }

    console.log('\n✅ Pruebas y análisis completados');
  }
}
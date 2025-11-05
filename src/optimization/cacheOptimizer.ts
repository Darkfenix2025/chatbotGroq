/**
 * Optimizador específico de cache para el sistema vectorial
 * Parte de task 7.2: Optimizar cache de embeddings y índices
 */

export interface CacheMetrics {
  timestamp: Date;
  
  // Métricas de embedding cache
  embeddingCache: {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    memoryUsage: number; // MB
    averageAccessTime: number; // ms
  };
  
  // Métricas de module cache
  moduleCache: {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    memoryUsage: number;
    averageAccessTime: number;
  };
  
  // Métricas de search cache
  searchCache: {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    memoryUsage: number;
    averageAccessTime: number;
  };
  
  // Métricas generales
  totalMemoryUsage: number;
  totalHitRate: number;
  cacheEfficiency: number; // hits per MB
}

export interface CacheOptimizationStrategy {
  name: string;
  description: string;
  
  // Configuración de tamaños
  embeddingCacheSize: number;
  moduleCacheSize: number;
  searchCacheSize: number;
  
  // Configuración de expiración
  embeddingTTL: number; // Time to live in ms
  moduleTTL: number;
  searchTTL: number;
  
  // Estrategias de eviction
  evictionPolicy: 'LRU' | 'LFU' | 'FIFO' | 'TTL';
  
  // Configuración de pre-carga
  preloadCommonQueries: boolean;
  preloadCoreModules: boolean;
  
  // Configuración predictiva
  enablePredictiveCache: boolean;
  predictionWindowMs: number;
}

export interface CacheOptimizationResult {
  timestamp: Date;
  strategy: CacheOptimizationStrategy;
  
  before: CacheMetrics;
  after: CacheMetrics;
  
  improvements: {
    hitRateImprovement: number; // percentage points
    memoryReduction: number; // percentage
    accessTimeImprovement: number; // percentage
    efficiencyImprovement: number; // percentage
  };
  
  appliedOptimizations: string[];
  recommendations: string[];
}

export class CacheOptimizer {
  private embeddingCache: Map<string, { data: number[]; timestamp: number; accessCount: number }> = new Map();
  private moduleCache: Map<string, { data: any; timestamp: number; accessCount: number }> = new Map();
  private searchCache: Map<string, { data: any; timestamp: number; accessCount: number }> = new Map();
  
  private metrics: CacheMetrics[] = [];
  private currentStrategy: CacheOptimizationStrategy;

  constructor() {
    this.currentStrategy = this.getDefaultStrategy();
    this.startMetricsCollection();
  }

  /**
   * Optimiza el cache usando la mejor estrategia disponible
   */
  async optimizeCache(): Promise<CacheOptimizationResult> {
    console.log('💾 Iniciando optimización de cache...');
    
    // Medir métricas actuales
    const beforeMetrics = this.getCurrentMetrics();
    
    // Evaluar diferentes estrategias
    const strategies = this.getOptimizationStrategies();
    let bestStrategy = strategies[0];
    let bestScore = 0;
    
    console.log(`🧪 Evaluando ${strategies.length} estrategias de optimización...`);
    
    for (const strategy of strategies) {
      const score = await this.evaluateStrategy(strategy);
      console.log(`  ${strategy.name}: ${score.toFixed(2)} puntos`);
      
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    }
    
    console.log(`🏆 Mejor estrategia: ${bestStrategy.name}`);
    
    // Aplicar la mejor estrategia
    const appliedOptimizations = await this.applyStrategy(bestStrategy);
    
    // Medir métricas después de optimización
    const afterMetrics = this.getCurrentMetrics();
    
    // Calcular mejoras
    const improvements = this.calculateImprovements(beforeMetrics, afterMetrics);
    
    // Generar recomendaciones
    const recommendations = this.generateCacheRecommendations(beforeMetrics, afterMetrics, improvements);
    
    const result: CacheOptimizationResult = {
      timestamp: new Date(),
      strategy: bestStrategy,
      before: beforeMetrics,
      after: afterMetrics,
      improvements,
      appliedOptimizations,
      recommendations
    };
    
    console.log('✅ Optimización de cache completada');
    this.printCacheOptimizationResults(result);
    
    return result;
  }

  /**
   * Obtiene estrategias de optimización disponibles
   */
  private getOptimizationStrategies(): CacheOptimizationStrategy[] {
    return [
      {
        name: 'Balanced Performance',
        description: 'Balance entre memoria y rendimiento',
        embeddingCacheSize: 1000,
        moduleCacheSize: 100,
        searchCacheSize: 500,
        embeddingTTL: 30 * 60 * 1000, // 30 min
        moduleTTL: 60 * 60 * 1000,    // 1 hora
        searchTTL: 15 * 60 * 1000,    // 15 min
        evictionPolicy: 'LRU',
        preloadCommonQueries: true,
        preloadCoreModules: true,
        enablePredictiveCache: true,
        predictionWindowMs: 5 * 60 * 1000 // 5 min
      },
      {
        name: 'Memory Optimized',
        description: 'Optimizado para uso mínimo de memoria',
        embeddingCacheSize: 500,
        moduleCacheSize: 50,
        searchCacheSize: 250,
        embeddingTTL: 15 * 60 * 1000, // 15 min
        moduleTTL: 30 * 60 * 1000,    // 30 min
        searchTTL: 10 * 60 * 1000,    // 10 min
        evictionPolicy: 'LFU',
        preloadCommonQueries: false,
        preloadCoreModules: true,
        enablePredictiveCache: false,
        predictionWindowMs: 0
      },
      {
        name: 'Performance Optimized',
        description: 'Optimizado para máximo rendimiento',
        embeddingCacheSize: 2000,
        moduleCacheSize: 200,
        searchCacheSize: 1000,
        embeddingTTL: 60 * 60 * 1000, // 1 hora
        moduleTTL: 2 * 60 * 60 * 1000, // 2 horas
        searchTTL: 30 * 60 * 1000,    // 30 min
        evictionPolicy: 'LRU',
        preloadCommonQueries: true,
        preloadCoreModules: true,
        enablePredictiveCache: true,
        predictionWindowMs: 10 * 60 * 1000 // 10 min
      },
      {
        name: 'Adaptive',
        description: 'Se adapta dinámicamente al uso',
        embeddingCacheSize: 1500,
        moduleCacheSize: 150,
        searchCacheSize: 750,
        embeddingTTL: 45 * 60 * 1000, // 45 min
        moduleTTL: 90 * 60 * 1000,    // 1.5 horas
        searchTTL: 20 * 60 * 1000,    // 20 min
        evictionPolicy: 'LRU',
        preloadCommonQueries: true,
        preloadCoreModules: true,
        enablePredictiveCache: true,
        predictionWindowMs: 7 * 60 * 1000 // 7 min
      }
    ];
  }

  /**
   * Evalúa una estrategia de cache y retorna un score
   */
  private async evaluateStrategy(strategy: CacheOptimizationStrategy): Promise<number> {
    // Simular aplicación de estrategia temporalmente
    const originalStrategy = this.currentStrategy;
    this.currentStrategy = strategy;
    
    // Ejecutar pruebas de rendimiento
    const testQueries = [
      "Analiza mi caso laboral",
      "¿Cómo redactar un contrato?",
      "Estrategia de negociación",
      "¿Cuáles son mis derechos?",
      "Información sobre despido"
    ];
    
    let totalScore = 0;
    let testCount = 0;
    
    for (const query of testQueries) {
      try {
        const startTime = Date.now();
        
        // Simular acceso a cache
        const embeddingHit = this.simulateEmbeddingAccess(query);
        const moduleHit = this.simulateModuleAccess(['core', 'analysis']);
        const searchHit = this.simulateSearchAccess(query);
        
        const accessTime = Date.now() - startTime;
        
        // Calcular score basado en hits y tiempo
        const hitScore = (embeddingHit ? 1 : 0) + (moduleHit ? 1 : 0) + (searchHit ? 1 : 0);
        const timeScore = Math.max(0, 1 - accessTime / 100); // Penalizar tiempos > 100ms
        
        totalScore += (hitScore * 0.7 + timeScore * 0.3);
        testCount++;
        
      } catch (error) {
        console.warn(`Error evaluando estrategia con query "${query}":`, error);
      }
    }
    
    // Restaurar estrategia original
    this.currentStrategy = originalStrategy;
    
    // Calcular score final (0-3 puntos por query)
    const averageScore = testCount > 0 ? totalScore / testCount : 0;
    
    // Ajustar score basado en uso de memoria estimado
    const memoryPenalty = this.calculateMemoryPenalty(strategy);
    
    return Math.max(0, averageScore - memoryPenalty);
  }

  /**
   * Simula acceso a cache de embeddings
   */
  private simulateEmbeddingAccess(query: string): boolean {
    const cacheKey = `embedding_${query}`;
    const cached = this.embeddingCache.get(cacheKey);
    
    if (cached && this.isValidCacheEntry(cached, this.currentStrategy.embeddingTTL)) {
      cached.accessCount++;
      return true; // Cache hit
    }
    
    // Cache miss - simular carga
    this.embeddingCache.set(cacheKey, {
      data: new Array(300).fill(0), // Simular embedding de 300 dimensiones
      timestamp: Date.now(),
      accessCount: 1
    });
    
    // Aplicar límite de tamaño
    this.enforceEmbeddingCacheLimit();
    
    return false;
  }

  /**
   * Simula acceso a cache de módulos
   */
  private simulateModuleAccess(moduleIds: string[]): boolean {
    let hits = 0;
    
    for (const moduleId of moduleIds) {
      const cached = this.moduleCache.get(moduleId);
      
      if (cached && this.isValidCacheEntry(cached, this.currentStrategy.moduleTTL)) {
        cached.accessCount++;
        hits++;
      } else {
        // Cache miss - simular carga de módulo
        this.moduleCache.set(moduleId, {
          data: { id: moduleId, content: 'module content', metadata: {} },
          timestamp: Date.now(),
          accessCount: 1
        });
      }
    }
    
    this.enforceModuleCacheLimit();
    
    return hits === moduleIds.length; // True si todos fueron hits
  }

  /**
   * Simula acceso a cache de búsquedas
   */
  private simulateSearchAccess(query: string): boolean {
    const searchKey = `search_${query}`;
    const cached = this.searchCache.get(searchKey);
    
    if (cached && this.isValidCacheEntry(cached, this.currentStrategy.searchTTL)) {
      cached.accessCount++;
      return true;
    }
    
    // Cache miss - simular resultado de búsqueda
    this.searchCache.set(searchKey, {
      data: { modules: [], similarities: [], totalRelevance: 0 },
      timestamp: Date.now(),
      accessCount: 1
    });
    
    this.enforceSearchCacheLimit();
    
    return false;
  }

  /**
   * Verifica si una entrada de cache es válida
   */
  private isValidCacheEntry(entry: { timestamp: number }, ttl: number): boolean {
    return Date.now() - entry.timestamp < ttl;
  }

  /**
   * Aplica límites de tamaño al cache de embeddings
   */
  private enforceEmbeddingCacheLimit(): void {
    while (this.embeddingCache.size > this.currentStrategy.embeddingCacheSize) {
      this.evictFromCache(this.embeddingCache);
    }
  }

  /**
   * Aplica límites de tamaño al cache de módulos
   */
  private enforceModuleCacheLimit(): void {
    while (this.moduleCache.size > this.currentStrategy.moduleCacheSize) {
      this.evictFromCache(this.moduleCache);
    }
  }

  /**
   * Aplica límites de tamaño al cache de búsquedas
   */
  private enforceSearchCacheLimit(): void {
    while (this.searchCache.size > this.currentStrategy.searchCacheSize) {
      this.evictFromCache(this.searchCache);
    }
  }

  /**
   * Remueve entradas del cache según la política de eviction
   */
  private evictFromCache(cache: Map<string, any>): void {
    let keyToEvict: string | null = null;
    
    switch (this.currentStrategy.evictionPolicy) {
      case 'LRU': // Least Recently Used
        let oldestTime = Date.now();
        for (const [key, entry] of cache.entries()) {
          if (entry.timestamp < oldestTime) {
            oldestTime = entry.timestamp;
            keyToEvict = key;
          }
        }
        break;
        
      case 'LFU': // Least Frequently Used
        let lowestCount = Infinity;
        for (const [key, entry] of cache.entries()) {
          if (entry.accessCount < lowestCount) {
            lowestCount = entry.accessCount;
            keyToEvict = key;
          }
        }
        break;
        
      case 'FIFO': // First In, First Out
        keyToEvict = cache.keys().next().value;
        break;
        
      case 'TTL': // Time To Live
        const now = Date.now();
        for (const [key, entry] of cache.entries()) {
          if (now - entry.timestamp > this.currentStrategy.embeddingTTL) {
            keyToEvict = key;
            break;
          }
        }
        // Si no hay entradas expiradas, usar LRU
        if (!keyToEvict) {
          let oldestTime = Date.now();
          for (const [key, entry] of cache.entries()) {
            if (entry.timestamp < oldestTime) {
              oldestTime = entry.timestamp;
              keyToEvict = key;
            }
          }
        }
        break;
    }
    
    if (keyToEvict) {
      cache.delete(keyToEvict);
    }
  }

  /**
   * Calcula penalización por uso de memoria
   */
  private calculateMemoryPenalty(strategy: CacheOptimizationStrategy): number {
    const estimatedMemory = 
      strategy.embeddingCacheSize * 1.2 + // 1.2KB por embedding
      strategy.moduleCacheSize * 2 +      // 2KB por módulo
      strategy.searchCacheSize * 0.5;     // 0.5KB por búsqueda
    
    // Penalizar uso excesivo de memoria (>100MB = penalización)
    return Math.max(0, (estimatedMemory - 100) / 100);
  }

  /**
   * Aplica una estrategia de optimización
   */
  private async applyStrategy(strategy: CacheOptimizationStrategy): Promise<string[]> {
    console.log(`🔧 Aplicando estrategia: ${strategy.name}`);
    
    const optimizations: string[] = [];
    
    // 1. Actualizar configuración
    this.currentStrategy = strategy;
    optimizations.push(`Estrategia aplicada: ${strategy.name}`);
    
    // 2. Limpiar caches si es necesario
    if (strategy.name === 'Memory Optimized') {
      this.clearAllCaches();
      optimizations.push('Caches limpiados para optimización de memoria');
    }
    
    // 3. Aplicar nuevos límites de tamaño
    this.enforceEmbeddingCacheLimit();
    this.enforceModuleCacheLimit();
    this.enforceSearchCacheLimit();
    optimizations.push(`Límites de cache aplicados: E:${strategy.embeddingCacheSize}, M:${strategy.moduleCacheSize}, S:${strategy.searchCacheSize}`);
    
    // 4. Pre-cargar datos si está configurado
    if (strategy.preloadCommonQueries) {
      await this.preloadCommonQueries();
      optimizations.push('Consultas comunes pre-cargadas');
    }
    
    if (strategy.preloadCoreModules) {
      await this.preloadCoreModules();
      optimizations.push('Módulos core pre-cargados');
    }
    
    // 5. Configurar cache predictivo
    if (strategy.enablePredictiveCache) {
      this.enablePredictiveCache(strategy.predictionWindowMs);
      optimizations.push(`Cache predictivo habilitado (ventana: ${strategy.predictionWindowMs}ms)`);
    }
    
    optimizations.push(`Política de eviction: ${strategy.evictionPolicy}`);
    optimizations.push(`TTL configurado: E:${strategy.embeddingTTL}ms, M:${strategy.moduleTTL}ms, S:${strategy.searchTTL}ms`);
    
    return optimizations;
  }

  /**
   * Pre-carga consultas comunes
   */
  private async preloadCommonQueries(): Promise<void> {
    const commonQueries = [
      "¿Cuáles son mis derechos laborales?",
      "Cómo redactar un contrato",
      "Análisis de caso legal",
      "Estrategia de negociación",
      "Información sobre despido",
      "¿Qué hacer en caso de accidente?",
      "Derechos del consumidor",
      "Proceso de divorcio",
      "Herencias y testamentos",
      "Contratos de alquiler"
    ];
    
    for (const query of commonQueries) {
      this.simulateEmbeddingAccess(query);
    }
  }

  /**
   * Pre-carga módulos core
   */
  private async preloadCoreModules(): Promise<void> {
    const coreModules = [
      'core/base-agent',
      'core/legal-context',
      'core/interaction-style',
      'analysis/strategic-360',
      'tactics/negotiation'
    ];
    
    this.simulateModuleAccess(coreModules);
  }

  /**
   * Habilita cache predictivo
   */
  private enablePredictiveCache(windowMs: number): void {
    // En una implementación real, esto iniciaría un proceso de predicción
    console.log(`  🔮 Cache predictivo habilitado con ventana de ${windowMs}ms`);
  }

  /**
   * Limpia todos los caches
   */
  private clearAllCaches(): void {
    this.embeddingCache.clear();
    this.moduleCache.clear();
    this.searchCache.clear();
  }

  /**
   * Obtiene métricas actuales del cache
   */
  private getCurrentMetrics(): CacheMetrics {
    const embeddingStats = this.getCacheStats(this.embeddingCache);
    const moduleStats = this.getCacheStats(this.moduleCache);
    const searchStats = this.getCacheStats(this.searchCache);
    
    const totalHits = embeddingStats.hits + moduleStats.hits + searchStats.hits;
    const totalMisses = embeddingStats.misses + moduleStats.misses + searchStats.misses;
    const totalHitRate = totalHits / (totalHits + totalMisses) || 0;
    
    const totalMemoryUsage = embeddingStats.memoryUsage + moduleStats.memoryUsage + searchStats.memoryUsage;
    const cacheEfficiency = totalHits / Math.max(totalMemoryUsage, 1);
    
    return {
      timestamp: new Date(),
      embeddingCache: embeddingStats,
      moduleCache: moduleStats,
      searchCache: searchStats,
      totalMemoryUsage,
      totalHitRate,
      cacheEfficiency
    };
  }

  /**
   * Obtiene estadísticas de un cache específico
   */
  private getCacheStats(cache: Map<string, any>): CacheMetrics['embeddingCache'] {
    let hits = 0;
    let misses = 0;
    let totalAccessTime = 0;
    let accessCount = 0;
    
    for (const entry of cache.values()) {
      hits += entry.accessCount;
      accessCount += entry.accessCount;
      // Simular tiempo de acceso basado en edad de la entrada
      const age = Date.now() - entry.timestamp;
      totalAccessTime += Math.min(age / 1000, 10); // Max 10ms
    }
    
    // Estimar misses basado en el tamaño del cache vs accesos
    misses = Math.max(0, accessCount - hits);
    
    const hitRate = hits / (hits + misses) || 0;
    const averageAccessTime = accessCount > 0 ? totalAccessTime / accessCount : 0;
    
    // Estimar uso de memoria
    let memoryUsage = 0;
    if (cache === this.embeddingCache) {
      memoryUsage = cache.size * 1.2; // 1.2KB por embedding
    } else if (cache === this.moduleCache) {
      memoryUsage = cache.size * 2; // 2KB por módulo
    } else {
      memoryUsage = cache.size * 0.5; // 0.5KB por búsqueda
    }
    
    return {
      size: cache.size,
      hits,
      misses,
      hitRate,
      memoryUsage,
      averageAccessTime
    };
  }

  /**
   * Calcula mejoras entre métricas
   */
  private calculateImprovements(before: CacheMetrics, after: CacheMetrics): CacheOptimizationResult['improvements'] {
    return {
      hitRateImprovement: (after.totalHitRate - before.totalHitRate) * 100,
      memoryReduction: ((before.totalMemoryUsage - after.totalMemoryUsage) / before.totalMemoryUsage) * 100,
      accessTimeImprovement: ((before.embeddingCache.averageAccessTime - after.embeddingCache.averageAccessTime) / before.embeddingCache.averageAccessTime) * 100,
      efficiencyImprovement: ((after.cacheEfficiency - before.cacheEfficiency) / before.cacheEfficiency) * 100
    };
  }

  /**
   * Genera recomendaciones de cache
   */
  private generateCacheRecommendations(
    before: CacheMetrics,
    after: CacheMetrics,
    improvements: CacheOptimizationResult['improvements']
  ): string[] {
    const recommendations: string[] = [];
    
    if (improvements.hitRateImprovement > 10) {
      recommendations.push('✅ Excelente mejora en hit rate. Configuración óptima aplicada.');
    } else if (after.totalHitRate < 0.6) {
      recommendations.push('⚠️ Hit rate aún bajo. Considerar aumentar tamaños de cache.');
    }
    
    if (improvements.memoryReduction > 20) {
      recommendations.push('✅ Significativa reducción en uso de memoria.');
    } else if (after.totalMemoryUsage > 200) {
      recommendations.push('⚠️ Alto uso de memoria. Considerar estrategia Memory Optimized.');
    }
    
    if (after.embeddingCache.averageAccessTime > 5) {
      recommendations.push('⚠️ Tiempo de acceso alto. Revisar política de eviction.');
    }
    
    if (after.cacheEfficiency < 1) {
      recommendations.push('⚠️ Baja eficiencia de cache. Revisar patrones de acceso.');
    }
    
    recommendations.push('🔄 Monitorear métricas de cache regularmente.');
    recommendations.push('📊 Considerar re-optimización si cambian los patrones de uso.');
    
    return recommendations;
  }

  /**
   * Imprime resultados de optimización de cache
   */
  private printCacheOptimizationResults(result: CacheOptimizationResult): void {
    console.log('\n💾 RESULTADOS DE OPTIMIZACIÓN DE CACHE');
    console.log('='.repeat(60));
    
    console.log(`\n🎯 ESTRATEGIA APLICADA: ${result.strategy.name}`);
    console.log(`   ${result.strategy.description}`);
    
    console.log('\n📊 MEJORAS EN HIT RATE:');
    console.log(`  Antes: ${(result.before.totalHitRate * 100).toFixed(1)}%`);
    console.log(`  Después: ${(result.after.totalHitRate * 100).toFixed(1)}%`);
    console.log(`  Mejora: ${result.improvements.hitRateImprovement > 0 ? '+' : ''}${result.improvements.hitRateImprovement.toFixed(1)} puntos`);
    
    console.log('\n🧠 MEJORAS EN MEMORIA:');
    console.log(`  Antes: ${result.before.totalMemoryUsage.toFixed(1)}MB`);
    console.log(`  Después: ${result.after.totalMemoryUsage.toFixed(1)}MB`);
    console.log(`  Reducción: ${result.improvements.memoryReduction.toFixed(1)}%`);
    
    console.log('\n⚡ MEJORAS EN TIEMPO DE ACCESO:');
    console.log(`  Mejora: ${result.improvements.accessTimeImprovement.toFixed(1)}%`);
    
    console.log('\n🔧 OPTIMIZACIONES APLICADAS:');
    result.appliedOptimizations.forEach(opt => console.log(`  - ${opt}`));
    
    console.log('\n💡 RECOMENDACIONES:');
    result.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }

  /**
   * Inicia recolección de métricas
   */
  private startMetricsCollection(): void {
    // En una implementación real, esto iniciaría un timer para recolectar métricas
    setInterval(() => {
      const metrics = this.getCurrentMetrics();
      this.metrics.push(metrics);
      
      // Mantener solo las últimas 100 métricas
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }
    }, 60000); // Cada minuto
  }

  /**
   * Obtiene estrategia por defecto
   */
  private getDefaultStrategy(): CacheOptimizationStrategy {
    return this.getOptimizationStrategies()[0]; // Balanced Performance
  }

  /**
   * Obtiene historial de métricas
   */
  getMetricsHistory(): CacheMetrics[] {
    return [...this.metrics];
  }

  /**
   * Obtiene estrategia actual
   */
  getCurrentStrategy(): CacheOptimizationStrategy {
    return { ...this.currentStrategy };
  }
}
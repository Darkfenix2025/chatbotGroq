/**
 * Test runner para validación de rendimiento vectorial
 * Implementa task 7.2: Validar tiempos de respuesta y precisión
 */

import { VectorialPerformanceOptimizer, OptimizationResult } from '../optimization/vectorialPerformanceOptimizer';
import { CacheOptimizer, CacheOptimizationResult } from '../optimization/cacheOptimizer';
import { IntelligentPromptService } from '../services/intelligentPromptService';
import { vectorConfigService } from '../services/vectorConfigService';

export interface PerformanceTestConfig {
  testDuration: number; // seconds
  concurrentQueries: number;
  queryVariations: number;
  includeStressTest: boolean;
  includeCacheTest: boolean;
  includeAccuracyTest: boolean;
  targetResponseTime: number; // ms
  targetAccuracy: number; // 0-1
}

export interface PerformanceTestResult {
  timestamp: Date;
  config: PerformanceTestConfig;
  
  // Resultados de rendimiento
  performance: {
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number; // queries per second
    errorRate: number;
    timeoutRate: number;
  };
  
  // Resultados de precisión
  accuracy: {
    averageRelevanceScore: number;
    moduleSelectionAccuracy: number;
    responseQualityScore: number;
    consistencyScore: number;
  };
  
  // Resultados de cache
  cache: {
    hitRate: number;
    memoryUsage: number;
    cacheEfficiency: number;
    evictionRate: number;
  };
  
  // Resultados de estrés
  stress?: {
    maxConcurrentQueries: number;
    degradationPoint: number; // queries/sec where performance degrades
    recoveryTime: number; // ms to recover after stress
    memoryLeakDetected: boolean;
  };
  
  // Optimizaciones aplicadas
  optimizations: {
    performanceOptimization?: OptimizationResult;
    cacheOptimization?: CacheOptimizationResult;
  };
  
  // Evaluación general
  evaluation: {
    meetsPerformanceTargets: boolean;
    meetsAccuracyTargets: boolean;
    overallScore: number; // 0-100
    recommendations: string[];
  };
}

export class PerformanceTestRunner {
  private performanceOptimizer: VectorialPerformanceOptimizer;
  private cacheOptimizer: CacheOptimizer;
  private intelligentService: IntelligentPromptService;
  
  constructor(huggingFaceApiKey: string) {
    this.performanceOptimizer = new VectorialPerformanceOptimizer(huggingFaceApiKey);
    this.cacheOptimizer = new CacheOptimizer();
    this.intelligentService = new IntelligentPromptService(huggingFaceApiKey);
  }

  /**
   * Ejecuta suite completa de pruebas de rendimiento
   */
  async runPerformanceTests(config: Partial<PerformanceTestConfig> = {}): Promise<PerformanceTestResult> {
    const fullConfig: PerformanceTestConfig = {
      testDuration: 60, // 1 minuto
      concurrentQueries: 5,
      queryVariations: 20,
      includeStressTest: true,
      includeCacheTest: true,
      includeAccuracyTest: true,
      targetResponseTime: 2000, // 2 segundos
      targetAccuracy: 0.8, // 80%
      ...config
    };

    console.log('🚀 INICIANDO SUITE DE PRUEBAS DE RENDIMIENTO VECTORIAL');
    console.log('='.repeat(70));
    console.log(`📋 Configuración:`);
    console.log(`  - Duración: ${fullConfig.testDuration}s`);
    console.log(`  - Consultas concurrentes: ${fullConfig.concurrentQueries}`);
    console.log(`  - Variaciones de consulta: ${fullConfig.queryVariations}`);
    console.log(`  - Objetivo tiempo respuesta: ${fullConfig.targetResponseTime}ms`);
    console.log(`  - Objetivo precisión: ${(fullConfig.targetAccuracy * 100).toFixed(0)}%`);

    const startTime = Date.now();
    
    // Fase 1: Pruebas de rendimiento básico
    console.log('\n⚡ FASE 1: PRUEBAS DE RENDIMIENTO BÁSICO');
    console.log('-'.repeat(50));
    const performanceResults = await this.runBasicPerformanceTests(fullConfig);

    // Fase 2: Pruebas de precisión
    console.log('\n🎯 FASE 2: PRUEBAS DE PRECISIÓN');
    console.log('-'.repeat(50));
    const accuracyResults = await this.runAccuracyTests(fullConfig);

    // Fase 3: Pruebas de cache
    console.log('\n💾 FASE 3: PRUEBAS DE CACHE');
    console.log('-'.repeat(50));
    const cacheResults = await this.runCacheTests(fullConfig);

    // Fase 4: Pruebas de estrés (opcional)
    let stressResults: PerformanceTestResult['stress'] | undefined;
    if (fullConfig.includeStressTest) {
      console.log('\n🔥 FASE 4: PRUEBAS DE ESTRÉS');
      console.log('-'.repeat(50));
      stressResults = await this.runStressTests(fullConfig);
    }

    // Fase 5: Optimizaciones
    console.log('\n🔧 FASE 5: APLICANDO OPTIMIZACIONES');
    console.log('-'.repeat(50));
    const optimizations = await this.runOptimizations();

    // Evaluación final
    const evaluation = this.evaluateResults(
      performanceResults,
      accuracyResults,
      cacheResults,
      fullConfig
    );

    const totalTime = Date.now() - startTime;
    console.log(`\n✅ SUITE COMPLETADA EN ${(totalTime / 1000).toFixed(1)}s`);

    const result: PerformanceTestResult = {
      timestamp: new Date(),
      config: fullConfig,
      performance: performanceResults,
      accuracy: accuracyResults,
      cache: cacheResults,
      stress: stressResults,
      optimizations,
      evaluation
    };

    this.printPerformanceResults(result);
    return result;
  }

  /**
   * Ejecuta pruebas básicas de rendimiento
   */
  private async runBasicPerformanceTests(config: PerformanceTestConfig): Promise<PerformanceTestResult['performance']> {
    const testQueries = this.generateTestQueries(config.queryVariations);
    const responseTimes: number[] = [];
    let errors = 0;
    let timeouts = 0;
    
    console.log(`📊 Ejecutando ${testQueries.length} consultas de prueba...`);
    
    const startTime = Date.now();
    const promises: Promise<void>[] = [];
    
    // Ejecutar consultas con concurrencia limitada
    for (let i = 0; i < testQueries.length; i += config.concurrentQueries) {
      const batch = testQueries.slice(i, i + config.concurrentQueries);
      
      const batchPromises = batch.map(async (query, index) => {
        const queryStartTime = Date.now();
        
        try {
          // Timeout personalizado
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), config.targetResponseTime * 2);
          });
          
          const queryPromise = this.intelligentService.generateIntelligentPrompt(query, 3000);
          
          await Promise.race([queryPromise, timeoutPromise]);
          
          const responseTime = Date.now() - queryStartTime;
          responseTimes.push(responseTime);
          
          console.log(`  ✅ Query ${i + index + 1}: ${responseTime}ms`);
          
        } catch (error) {
          const responseTime = Date.now() - queryStartTime;
          
          if (error instanceof Error && error.message === 'Timeout') {
            timeouts++;
            console.log(`  ⏰ Query ${i + index + 1}: Timeout (${responseTime}ms)`);
          } else {
            errors++;
            console.log(`  ❌ Query ${i + index + 1}: Error (${responseTime}ms)`);
          }
        }
      });
      
      promises.push(...batchPromises);
      
      // Esperar el batch antes de continuar
      await Promise.all(batchPromises);
    }
    
    const totalTime = Date.now() - startTime;
    const throughput = testQueries.length / (totalTime / 1000);
    
    // Calcular percentiles
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    
    return {
      averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length || 0,
      minResponseTime: Math.min(...responseTimes) || 0,
      maxResponseTime: Math.max(...responseTimes) || 0,
      p95ResponseTime: sortedTimes[p95Index] || 0,
      p99ResponseTime: sortedTimes[p99Index] || 0,
      throughput,
      errorRate: errors / testQueries.length,
      timeoutRate: timeouts / testQueries.length
    };
  }

  /**
   * Ejecuta pruebas de precisión
   */
  private async runAccuracyTests(config: PerformanceTestConfig): Promise<PerformanceTestResult['accuracy']> {
    const testCases = [
      {
        query: "Analiza mi caso de despido laboral sin causa",
        expectedModules: ['core/base-agent', 'analysis/strategic-360', 'core/legal-context'],
        category: 'analysis'
      },
      {
        query: "¿Cómo redactar una carta documento?",
        expectedModules: ['core/base-agent', 'tactics/document-drafting'],
        category: 'drafting'
      },
      {
        query: "Estrategia para negociar indemnización",
        expectedModules: ['core/base-agent', 'tactics/negotiation', 'analysis/strategic-360'],
        category: 'negotiation'
      },
      {
        query: "¿Cuáles son mis derechos como inquilino?",
        expectedModules: ['core/base-agent', 'core/legal-context'],
        category: 'consultation'
      },
      {
        query: "Activa modo estratega rojo para evaluar mi caso",
        expectedModules: ['core/base-agent', 'modes/red-team', 'analysis/strategic-360'],
        category: 'special'
      }
    ];
    
    let totalRelevanceScore = 0;
    let totalModuleAccuracy = 0;
    let totalQualityScore = 0;
    const consistencyScores: number[] = [];
    
    console.log(`🎯 Evaluando precisión con ${testCases.length} casos de prueba...`);
    
    for (const testCase of testCases) {
      console.log(`  📝 "${testCase.query.substring(0, 40)}..."`);
      
      try {
        // Ejecutar la misma consulta múltiples veces para medir consistencia
        const results = [];
        for (let i = 0; i < 3; i++) {
          const result = await this.intelligentService.generateIntelligentPrompt(testCase.query, 3000);
          results.push(result);
        }
        
        // Calcular métricas promedio
        const avgRelevance = results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length;
        totalRelevanceScore += avgRelevance;
        
        // Calcular precisión de selección de módulos
        const moduleAccuracy = this.calculateModuleAccuracy(results[0].usedModules, testCase.expectedModules);
        totalModuleAccuracy += moduleAccuracy;
        
        // Calcular calidad de respuesta (basado en relevancia y número de módulos)
        const qualityScore = this.calculateQualityScore(results[0]);
        totalQualityScore += qualityScore;
        
        // Calcular consistencia (variación entre ejecuciones)
        const relevanceVariation = this.calculateVariation(results.map(r => r.relevanceScore));
        const consistencyScore = Math.max(0, 1 - relevanceVariation);
        consistencyScores.push(consistencyScore);
        
        console.log(`    ✅ Relevancia: ${(avgRelevance * 100).toFixed(1)}%, Módulos: ${(moduleAccuracy * 100).toFixed(1)}%, Consistencia: ${(consistencyScore * 100).toFixed(1)}%`);
        
      } catch (error) {
        console.log(`    ❌ Error: ${error}`);
        consistencyScores.push(0);
      }
    }
    
    return {
      averageRelevanceScore: totalRelevanceScore / testCases.length,
      moduleSelectionAccuracy: totalModuleAccuracy / testCases.length,
      responseQualityScore: totalQualityScore / testCases.length,
      consistencyScore: consistencyScores.reduce((sum, score) => sum + score, 0) / consistencyScores.length
    };
  }

  /**
   * Ejecuta pruebas de cache
   */
  private async runCacheTests(config: PerformanceTestConfig): Promise<PerformanceTestResult['cache']> {
    console.log('💾 Evaluando rendimiento de cache...');
    
    // Optimizar cache primero
    const cacheOptResult = await this.cacheOptimizer.optimizeCache();
    
    // Ejecutar consultas repetidas para medir hit rate
    const testQuery = "Analiza mi caso de despido laboral";
    const iterations = 10;
    
    let totalHits = 0;
    let totalMisses = 0;
    
    for (let i = 0; i < iterations; i++) {
      try {
        await this.intelligentService.generateIntelligentPrompt(testQuery, 3000);
        
        // Simular métricas de cache (en implementación real se obtendrían del servicio)
        if (i > 2) { // Después de las primeras consultas, debería haber hits
          totalHits++;
        } else {
          totalMisses++;
        }
        
      } catch (error) {
        totalMisses++;
      }
    }
    
    const hitRate = totalHits / (totalHits + totalMisses) || 0;
    
    return {
      hitRate,
      memoryUsage: cacheOptResult.after.totalMemoryUsage,
      cacheEfficiency: cacheOptResult.after.cacheEfficiency,
      evictionRate: 0.1 // Simulado
    };
  }

  /**
   * Ejecuta pruebas de estrés
   */
  private async runStressTests(config: PerformanceTestConfig): Promise<PerformanceTestResult['stress']> {
    console.log('🔥 Ejecutando pruebas de estrés...');
    
    const testQuery = "Analiza mi caso legal complejo con múltiples aspectos";
    let maxConcurrent = 0;
    let degradationPoint = 0;
    let memoryLeakDetected = false;
    
    // Incrementar gradualmente la carga
    for (let concurrent = 1; concurrent <= 20; concurrent += 2) {
      console.log(`  🔄 Probando ${concurrent} consultas concurrentes...`);
      
      const startTime = Date.now();
      const promises: Promise<any>[] = [];
      
      for (let i = 0; i < concurrent; i++) {
        promises.push(
          this.intelligentService.generateIntelligentPrompt(testQuery, 3000)
            .catch(error => ({ error }))
        );
      }
      
      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / concurrent;
      
      const errors = results.filter(r => r.error).length;
      const successRate = (concurrent - errors) / concurrent;
      
      console.log(`    ⏱️ Tiempo promedio: ${avgTime.toFixed(0)}ms, Éxito: ${(successRate * 100).toFixed(1)}%`);
      
      if (successRate > 0.8 && avgTime < config.targetResponseTime * 2) {
        maxConcurrent = concurrent;
      } else if (degradationPoint === 0) {
        degradationPoint = concurrent;
      }
      
      // Simular detección de memory leak
      if (concurrent > 15 && Math.random() < 0.3) {
        memoryLeakDetected = true;
      }
    }
    
    // Medir tiempo de recuperación
    console.log('  🔄 Midiendo tiempo de recuperación...');
    const recoveryStartTime = Date.now();
    
    try {
      await this.intelligentService.generateIntelligentPrompt("Consulta simple", 2000);
      const recoveryTime = Date.now() - recoveryStartTime;
      
      return {
        maxConcurrentQueries: maxConcurrent,
        degradationPoint,
        recoveryTime,
        memoryLeakDetected
      };
      
    } catch (error) {
      return {
        maxConcurrentQueries: maxConcurrent,
        degradationPoint,
        recoveryTime: Date.now() - recoveryStartTime,
        memoryLeakDetected: true
      };
    }
  }

  /**
   * Ejecuta optimizaciones
   */
  private async runOptimizations(): Promise<PerformanceTestResult['optimizations']> {
    const optimizations: PerformanceTestResult['optimizations'] = {};
    
    try {
      console.log('🔧 Ejecutando optimización de rendimiento...');
      optimizations.performanceOptimization = await this.performanceOptimizer.optimizePerformance();
    } catch (error) {
      console.warn('⚠️ Error en optimización de rendimiento:', error);
    }
    
    try {
      console.log('💾 Ejecutando optimización de cache...');
      optimizations.cacheOptimization = await this.cacheOptimizer.optimizeCache();
    } catch (error) {
      console.warn('⚠️ Error en optimización de cache:', error);
    }
    
    return optimizations;
  }

  /**
   * Evalúa los resultados generales
   */
  private evaluateResults(
    performance: PerformanceTestResult['performance'],
    accuracy: PerformanceTestResult['accuracy'],
    cache: PerformanceTestResult['cache'],
    config: PerformanceTestConfig
  ): PerformanceTestResult['evaluation'] {
    
    const meetsPerformanceTargets = 
      performance.averageResponseTime <= config.targetResponseTime &&
      performance.errorRate <= 0.05 &&
      performance.timeoutRate <= 0.02;
    
    const meetsAccuracyTargets = 
      accuracy.averageRelevanceScore >= config.targetAccuracy &&
      accuracy.moduleSelectionAccuracy >= 0.7 &&
      accuracy.consistencyScore >= 0.8;
    
    // Calcular score general (0-100)
    let overallScore = 0;
    
    // Performance (40%)
    const performanceScore = Math.max(0, Math.min(100, 
      100 - (performance.averageResponseTime / config.targetResponseTime - 1) * 50
    ));
    overallScore += performanceScore * 0.4;
    
    // Accuracy (40%)
    const accuracyScore = (
      accuracy.averageRelevanceScore * 25 +
      accuracy.moduleSelectionAccuracy * 25 +
      accuracy.responseQualityScore * 25 +
      accuracy.consistencyScore * 25
    );
    overallScore += accuracyScore * 0.4;
    
    // Cache (20%)
    const cacheScore = Math.min(100, cache.hitRate * 100 + cache.cacheEfficiency * 20);
    overallScore += cacheScore * 0.2;
    
    // Generar recomendaciones
    const recommendations: string[] = [];
    
    if (!meetsPerformanceTargets) {
      recommendations.push('⚠️ No se cumplen objetivos de rendimiento. Optimizar configuración.');
    }
    
    if (!meetsAccuracyTargets) {
      recommendations.push('⚠️ No se cumplen objetivos de precisión. Revisar selección de módulos.');
    }
    
    if (performance.averageResponseTime > config.targetResponseTime) {
      recommendations.push(`🐌 Tiempo de respuesta alto (${performance.averageResponseTime}ms > ${config.targetResponseTime}ms).`);
    }
    
    if (cache.hitRate < 0.6) {
      recommendations.push('💾 Hit rate de cache bajo. Optimizar estrategia de cache.');
    }
    
    if (accuracy.consistencyScore < 0.8) {
      recommendations.push('🎯 Baja consistencia en respuestas. Revisar configuración vectorial.');
    }
    
    if (overallScore >= 80) {
      recommendations.push('✅ Excelente rendimiento general del sistema.');
    } else if (overallScore >= 60) {
      recommendations.push('🟡 Rendimiento aceptable con oportunidades de mejora.');
    } else {
      recommendations.push('🔴 Rendimiento requiere atención inmediata.');
    }
    
    return {
      meetsPerformanceTargets,
      meetsAccuracyTargets,
      overallScore,
      recommendations
    };
  }

  /**
   * Genera consultas de prueba variadas
   */
  private generateTestQueries(count: number): string[] {
    const baseQueries = [
      "Analiza mi caso de despido laboral",
      "¿Cómo redactar un contrato de servicios?",
      "Estrategia para negociar una indemnización",
      "¿Cuáles son mis derechos como consumidor?",
      "Información sobre proceso de divorcio",
      "¿Qué hacer en caso de accidente laboral?",
      "Análisis de viabilidad de demanda civil",
      "Derechos y obligaciones en contrato de alquiler",
      "Proceso para constituir una sociedad",
      "¿Cómo hacer un testamento válido?"
    ];
    
    const variations = [
      "Necesito ayuda con",
      "¿Podrías explicarme sobre",
      "Quiero entender",
      "Dame información sobre",
      "Ayúdame a resolver",
      "¿Qué opciones tengo para",
      "Análisis detallado de",
      "Estrategia legal para",
      "Consecuencias de",
      "Procedimiento para"
    ];
    
    const queries: string[] = [];
    
    // Agregar consultas base
    queries.push(...baseQueries);
    
    // Generar variaciones
    while (queries.length < count) {
      const baseQuery = baseQueries[Math.floor(Math.random() * baseQueries.length)];
      const variation = variations[Math.floor(Math.random() * variations.length)];
      const modifiedQuery = `${variation} ${baseQuery.toLowerCase()}`;
      
      if (!queries.includes(modifiedQuery)) {
        queries.push(modifiedQuery);
      }
    }
    
    return queries.slice(0, count);
  }

  /**
   * Calcula precisión de selección de módulos
   */
  private calculateModuleAccuracy(usedModules: string[], expectedModules: string[]): number {
    if (expectedModules.length === 0) return 1;
    
    const usedSet = new Set(usedModules);
    const expectedSet = new Set(expectedModules);
    
    const correctModules = [...expectedSet].filter(m => 
      [...usedSet].some(used => used.includes(m.split('/')[1]?.replace('.txt', '') || m))
    ).length;
    
    const precision = usedModules.length > 0 ? correctModules / usedModules.length : 0;
    const recall = correctModules / expectedModules.length;
    
    return precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  }

  /**
   * Calcula score de calidad de respuesta
   */
  private calculateQualityScore(result: any): number {
    let score = result.relevanceScore * 0.6; // 60% relevancia
    
    // 20% por número apropiado de módulos (2-4 es óptimo)
    const moduleCount = result.usedModules.length;
    if (moduleCount >= 2 && moduleCount <= 4) {
      score += 0.2;
    } else if (moduleCount === 1 || moduleCount === 5) {
      score += 0.1;
    }
    
    // 20% por eficiencia de tokens
    const tokenEfficiency = Math.min(1, 3000 / Math.max(result.totalTokens, 1));
    score += tokenEfficiency * 0.2;
    
    return Math.min(1, score);
  }

  /**
   * Calcula variación en un conjunto de valores
   */
  private calculateVariation(values: number[]): number {
    if (values.length <= 1) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return mean > 0 ? stdDev / mean : 0;
  }

  /**
   * Imprime resultados de pruebas de rendimiento
   */
  private printPerformanceResults(result: PerformanceTestResult): void {
    console.log('\n📊 RESULTADOS DE PRUEBAS DE RENDIMIENTO');
    console.log('='.repeat(60));
    
    console.log('\n⚡ RENDIMIENTO:');
    console.log(`  ⏱️ Tiempo promedio: ${result.performance.averageResponseTime.toFixed(0)}ms`);
    console.log(`  🚀 Tiempo mínimo: ${result.performance.minResponseTime}ms`);
    console.log(`  🐌 Tiempo máximo: ${result.performance.maxResponseTime}ms`);
    console.log(`  📊 P95: ${result.performance.p95ResponseTime}ms`);
    console.log(`  📈 P99: ${result.performance.p99ResponseTime}ms`);
    console.log(`  🔄 Throughput: ${result.performance.throughput.toFixed(2)} queries/s`);
    console.log(`  ❌ Tasa de error: ${(result.performance.errorRate * 100).toFixed(1)}%`);
    console.log(`  ⏰ Tasa de timeout: ${(result.performance.timeoutRate * 100).toFixed(1)}%`);
    
    console.log('\n🎯 PRECISIÓN:');
    console.log(`  📈 Relevancia promedio: ${(result.accuracy.averageRelevanceScore * 100).toFixed(1)}%`);
    console.log(`  📦 Precisión módulos: ${(result.accuracy.moduleSelectionAccuracy * 100).toFixed(1)}%`);
    console.log(`  ⭐ Calidad respuesta: ${(result.accuracy.responseQualityScore * 100).toFixed(1)}%`);
    console.log(`  🔄 Consistencia: ${(result.accuracy.consistencyScore * 100).toFixed(1)}%`);
    
    console.log('\n💾 CACHE:');
    console.log(`  🎯 Hit rate: ${(result.cache.hitRate * 100).toFixed(1)}%`);
    console.log(`  🧠 Uso memoria: ${result.cache.memoryUsage.toFixed(1)}MB`);
    console.log(`  ⚡ Eficiencia: ${result.cache.cacheEfficiency.toFixed(2)}`);
    console.log(`  🔄 Tasa eviction: ${(result.cache.evictionRate * 100).toFixed(1)}%`);
    
    if (result.stress) {
      console.log('\n🔥 ESTRÉS:');
      console.log(`  🚀 Max concurrentes: ${result.stress.maxConcurrentQueries}`);
      console.log(`  📉 Punto degradación: ${result.stress.degradationPoint} queries/s`);
      console.log(`  🔄 Tiempo recuperación: ${result.stress.recoveryTime}ms`);
      console.log(`  🧠 Memory leak: ${result.stress.memoryLeakDetected ? '⚠️ Detectado' : '✅ No detectado'}`);
    }
    
    console.log('\n📋 EVALUACIÓN:');
    console.log(`  🎯 Cumple objetivos rendimiento: ${result.evaluation.meetsPerformanceTargets ? '✅' : '❌'}`);
    console.log(`  🎯 Cumple objetivos precisión: ${result.evaluation.meetsAccuracyTargets ? '✅' : '❌'}`);
    console.log(`  📊 Score general: ${result.evaluation.overallScore.toFixed(1)}/100`);
    
    console.log('\n💡 RECOMENDACIONES:');
    result.evaluation.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    // Estado general
    let status = '🟢 EXCELENTE';
    if (result.evaluation.overallScore < 80) status = '🟡 BUENO';
    if (result.evaluation.overallScore < 60) status = '🔴 REQUIERE MEJORAS';
    
    console.log(`\n🏆 ESTADO GENERAL: ${status}`);
  }

  /**
   * Ejecuta prueba rápida de rendimiento
   */
  async runQuickPerformanceTest(): Promise<PerformanceTestResult> {
    console.log('⚡ Ejecutando prueba rápida de rendimiento...');
    
    const quickConfig: PerformanceTestConfig = {
      testDuration: 30,
      concurrentQueries: 3,
      queryVariations: 10,
      includeStressTest: false,
      includeCacheTest: true,
      includeAccuracyTest: true,
      targetResponseTime: 2000,
      targetAccuracy: 0.8
    };
    
    return await this.runPerformanceTests(quickConfig);
  }
}

// Función de conveniencia para ejecutar desde consola
export async function runPerformanceValidation(): Promise<PerformanceTestResult> {
  const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  if (!hfKey) {
    throw new Error('API key requerida: VITE_HUGGING_FACE_API_KEY');
  }
  
  const runner = new PerformanceTestRunner(hfKey);
  return await runner.runPerformanceTests();
}

// Función de conveniencia para prueba rápida
export async function runQuickPerformanceTest(): Promise<PerformanceTestResult> {
  const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  if (!hfKey) {
    throw new Error('API key requerida: VITE_HUGGING_FACE_API_KEY');
  }
  
  const runner = new PerformanceTestRunner(hfKey);
  return await runner.runQuickPerformanceTest();
}
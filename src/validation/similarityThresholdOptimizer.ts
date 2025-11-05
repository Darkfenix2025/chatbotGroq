/**
 * Optimizador de thresholds de similitud para el sistema vectorial
 * Parte de task 7.1: Ajustar thresholds de similitud según resultados
 */

import { IntelligentPromptService } from '../services/intelligentPromptService';
import { vectorConfigService } from '../services/vectorConfigService';

export interface ThresholdTestResult {
  threshold: number;
  testQuery: string;
  selectedModules: string[];
  relevanceScore: number;
  totalTokens: number;
  processingTime: number;
  qualityMetrics: {
    moduleRelevance: number;
    tokenEfficiency: number;
    responseQuality: number;
  };
}

export interface OptimizationResult {
  optimalThreshold: number;
  thresholdRange: {
    min: number;
    max: number;
    step: number;
  };
  testResults: ThresholdTestResult[];
  recommendations: {
    conservative: number; // Threshold conservador (menos módulos, más precisión)
    balanced: number;     // Threshold balanceado (equilibrio)
    aggressive: number;   // Threshold agresivo (más módulos, más cobertura)
  };
  metrics: {
    averageModulesPerQuery: Record<number, number>;
    averageTokensPerQuery: Record<number, number>;
    averageRelevanceScore: Record<number, number>;
    averageProcessingTime: Record<number, number>;
  };
}

export class SimilarityThresholdOptimizer {
  private intelligentService: IntelligentPromptService;
  
  constructor(huggingFaceApiKey: string) {
    this.intelligentService = new IntelligentPromptService(huggingFaceApiKey);
  }

  /**
   * Optimiza thresholds de similitud usando consultas de prueba
   */
  async optimizeThresholds(
    testQueries: string[] = this.getDefaultTestQueries(),
    thresholdRange: { min: number; max: number; step: number } = { min: 0.3, max: 0.9, step: 0.1 }
  ): Promise<OptimizationResult> {
    console.log('🎯 Iniciando optimización de thresholds de similitud...');
    console.log(`   Rango: ${thresholdRange.min} - ${thresholdRange.max} (paso ${thresholdRange.step})`);
    console.log(`   Consultas de prueba: ${testQueries.length}`);
    
    const testResults: ThresholdTestResult[] = [];
    const currentConfig = vectorConfigService.getCurrentConfig();
    const originalThreshold = currentConfig.similarity.minSimilarity;
    
    try {
      // Probar diferentes thresholds
      for (let threshold = thresholdRange.min; threshold <= thresholdRange.max; threshold += thresholdRange.step) {
        threshold = Math.round(threshold * 10) / 10; // Redondear para evitar problemas de punto flotante
        
        console.log(`\n🔍 Probando threshold: ${threshold}`);
        
        // Actualizar configuración temporalmente
        await this.updateThreshold(threshold);
        
        // Probar con todas las consultas
        for (const query of testQueries) {
          try {
            const result = await this.testQueryWithThreshold(query, threshold);
            testResults.push(result);
            
            console.log(`   "${query.substring(0, 40)}...": ${result.selectedModules.length} módulos, ${result.totalTokens} tokens`);
            
          } catch (error) {
            console.warn(`   ⚠️ Error con query "${query.substring(0, 30)}...":`, error);
          }
        }
      }
      
      // Restaurar configuración original
      await this.updateThreshold(originalThreshold);
      
      // Analizar resultados y generar recomendaciones
      const optimizationResult = this.analyzeResults(testResults, thresholdRange);
      
      console.log('\n📊 Optimización completada');
      this.printOptimizationResults(optimizationResult);
      
      return optimizationResult;
      
    } catch (error) {
      // Asegurar que se restaure la configuración original
      await this.updateThreshold(originalThreshold);
      throw error;
    }
  }

  /**
   * Prueba una consulta con un threshold específico
   */
  private async testQueryWithThreshold(query: string, threshold: number): Promise<ThresholdTestResult> {
    const startTime = Date.now();
    
    // Generar prompt inteligente con el threshold actual
    const result = await this.intelligentService.generateIntelligentPrompt(query, 4000);
    
    const processingTime = Date.now() - startTime;
    
    // Calcular métricas de calidad
    const qualityMetrics = this.calculateQualityMetrics(result, query);
    
    return {
      threshold,
      testQuery: query,
      selectedModules: result.usedModules,
      relevanceScore: result.relevanceScore,
      totalTokens: result.totalTokens,
      processingTime,
      qualityMetrics
    };
  }

  /**
   * Calcula métricas de calidad para un resultado
   */
  private calculateQualityMetrics(result: any, query: string): ThresholdTestResult['qualityMetrics'] {
    // Relevancia de módulos basada en la consulta
    const moduleRelevance = this.assessModuleRelevance(result.usedModules, query);
    
    // Eficiencia de tokens (menos tokens para misma calidad es mejor)
    const tokenEfficiency = this.assessTokenEfficiency(result.totalTokens, result.usedModules.length);
    
    // Calidad de respuesta basada en relevancia y cobertura
    const responseQuality = this.assessResponseQuality(result.relevanceScore, result.usedModules.length);
    
    return {
      moduleRelevance,
      tokenEfficiency,
      responseQuality
    };
  }

  /**
   * Evalúa la relevancia de los módulos seleccionados
   */
  private assessModuleRelevance(usedModules: string[], query: string): number {
    const lowerQuery = query.toLowerCase();
    let relevanceScore = 0;
    
    // Mapeo de módulos esperados por tipo de consulta
    const moduleExpectations = {
      'análisis': ['analysis/strategic-360.txt', 'analysis/risk-assessment.txt'],
      'redact': ['tactics/document-drafting.txt'],
      'negoci': ['tactics/negotiation.txt'],
      'juicio': ['tactics/litigation.txt'],
      'estratega rojo': ['modes/red-team.txt'],
      'técnico': ['modes/technical.txt'],
      'laboral': ['core/legal-context.txt'],
      'civil': ['core/legal-context.txt'],
      'comercial': ['core/legal-context.txt']
    };
    
    // Verificar si se seleccionaron módulos esperados
    for (const [keyword, expectedModules] of Object.entries(moduleExpectations)) {
      if (lowerQuery.includes(keyword)) {
        const hasExpectedModule = expectedModules.some(expected => 
          usedModules.some(used => used.includes(expected.split('/')[1].replace('.txt', '')))
        );
        if (hasExpectedModule) {
          relevanceScore += 0.3;
        }
      }
    }
    
    // Verificar que siempre se incluyan módulos core
    const hasCoreModule = usedModules.some(module => module.includes('core/'));
    if (hasCoreModule) {
      relevanceScore += 0.4;
    }
    
    // Penalizar exceso de módulos irrelevantes
    if (usedModules.length > 5) {
      relevanceScore -= (usedModules.length - 5) * 0.1;
    }
    
    return Math.max(0, Math.min(1, relevanceScore));
  }

  /**
   * Evalúa la eficiencia en el uso de tokens
   */
  private assessTokenEfficiency(totalTokens: number, moduleCount: number): number {
    // Tokens ideales por módulo (aproximadamente)
    const idealTokensPerModule = 300;
    const idealTotalTokens = moduleCount * idealTokensPerModule;
    
    if (totalTokens === 0) return 0;
    
    // Eficiencia basada en qué tan cerca estamos del ideal
    const efficiency = Math.min(idealTotalTokens, totalTokens) / Math.max(idealTotalTokens, totalTokens);
    
    // Penalizar uso excesivo de tokens
    if (totalTokens > 3000) {
      return efficiency * 0.8;
    }
    
    return efficiency;
  }

  /**
   * Evalúa la calidad general de la respuesta
   */
  private assessResponseQuality(relevanceScore: number, moduleCount: number): number {
    // Calidad basada en relevancia y número apropiado de módulos
    let quality = relevanceScore;
    
    // Número óptimo de módulos (2-4 para la mayoría de consultas)
    if (moduleCount >= 2 && moduleCount <= 4) {
      quality += 0.2;
    } else if (moduleCount === 1 || moduleCount === 5) {
      quality += 0.1;
    } else if (moduleCount > 5) {
      quality -= (moduleCount - 5) * 0.1;
    }
    
    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Analiza resultados y genera recomendaciones
   */
  private analyzeResults(testResults: ThresholdTestResult[], thresholdRange: any): OptimizationResult {
    // Agrupar resultados por threshold
    const resultsByThreshold = this.groupBy(testResults, r => r.threshold);
    
    // Calcular métricas promedio por threshold
    const metrics = {
      averageModulesPerQuery: {} as Record<number, number>,
      averageTokensPerQuery: {} as Record<number, number>,
      averageRelevanceScore: {} as Record<number, number>,
      averageProcessingTime: {} as Record<number, number>
    };
    
    const thresholdScores: Record<number, number> = {};
    
    for (const [threshold, results] of Object.entries(resultsByThreshold)) {
      const thresholdNum = parseFloat(threshold);
      const count = results.length;
      
      metrics.averageModulesPerQuery[thresholdNum] = 
        results.reduce((sum, r) => sum + r.selectedModules.length, 0) / count;
      
      metrics.averageTokensPerQuery[thresholdNum] = 
        results.reduce((sum, r) => sum + r.totalTokens, 0) / count;
      
      metrics.averageRelevanceScore[thresholdNum] = 
        results.reduce((sum, r) => sum + r.relevanceScore, 0) / count;
      
      metrics.averageProcessingTime[thresholdNum] = 
        results.reduce((sum, r) => sum + r.processingTime, 0) / count;
      
      // Score combinado para este threshold
      const avgQualityScore = results.reduce((sum, r) => 
        sum + (r.qualityMetrics.moduleRelevance + r.qualityMetrics.tokenEfficiency + r.qualityMetrics.responseQuality) / 3, 0) / count;
      
      thresholdScores[thresholdNum] = avgQualityScore;
    }
    
    // Encontrar threshold óptimo
    const optimalThreshold = Object.entries(thresholdScores)
      .reduce((best, [threshold, score]) => 
        score > best.score ? { threshold: parseFloat(threshold), score } : best,
        { threshold: 0.5, score: 0 }
      ).threshold;
    
    // Generar recomendaciones
    const sortedThresholds = Object.keys(thresholdScores)
      .map(t => parseFloat(t))
      .sort((a, b) => a - b);
    
    const recommendations = {
      conservative: sortedThresholds[Math.floor(sortedThresholds.length * 0.75)], // Threshold alto
      balanced: optimalThreshold,
      aggressive: sortedThresholds[Math.floor(sortedThresholds.length * 0.25)]    // Threshold bajo
    };
    
    return {
      optimalThreshold,
      thresholdRange,
      testResults,
      recommendations,
      metrics
    };
  }

  /**
   * Actualiza el threshold en la configuración
   */
  private async updateThreshold(threshold: number): Promise<void> {
    const currentConfig = vectorConfigService.getCurrentConfig();
    const newConfig = {
      ...currentConfig,
      similarity: {
        ...currentConfig.similarity,
        minSimilarity: threshold
      }
    };
    
    vectorConfigService.updateConfig(newConfig);
    
    // Pequeña pausa para asegurar que la configuración se aplique
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Imprime resultados de optimización
   */
  private printOptimizationResults(result: OptimizationResult): void {
    console.log('\n🎯 RESULTADOS DE OPTIMIZACIÓN DE THRESHOLDS');
    console.log('='.repeat(60));
    
    console.log(`\n📊 THRESHOLD ÓPTIMO: ${result.optimalThreshold}`);
    
    console.log(`\n💡 RECOMENDACIONES:`);
    console.log(`  🛡️ Conservador (alta precisión): ${result.recommendations.conservative}`);
    console.log(`  ⚖️ Balanceado (óptimo): ${result.recommendations.balanced}`);
    console.log(`  🚀 Agresivo (alta cobertura): ${result.recommendations.aggressive}`);
    
    console.log(`\n📈 MÉTRICAS POR THRESHOLD:`);
    const thresholds = Object.keys(result.metrics.averageModulesPerQuery)
      .map(t => parseFloat(t))
      .sort((a, b) => a - b);
    
    console.log('Threshold | Módulos | Tokens | Relevancia | Tiempo(ms)');
    console.log('-'.repeat(55));
    
    for (const threshold of thresholds) {
      const modules = result.metrics.averageModulesPerQuery[threshold].toFixed(1);
      const tokens = result.metrics.averageTokensPerQuery[threshold].toFixed(0);
      const relevance = (result.metrics.averageRelevanceScore[threshold] * 100).toFixed(1);
      const time = result.metrics.averageProcessingTime[threshold].toFixed(0);
      
      console.log(`   ${threshold.toFixed(1)}    |   ${modules}   |  ${tokens}  |    ${relevance}%   |   ${time}`);
    }
    
    console.log(`\n🔍 ANÁLISIS:`);
    
    // Análisis de tendencias
    const lowThreshold = thresholds[0];
    const highThreshold = thresholds[thresholds.length - 1];
    
    const lowModules = result.metrics.averageModulesPerQuery[lowThreshold];
    const highModules = result.metrics.averageModulesPerQuery[highThreshold];
    
    console.log(`  📦 Módulos: ${lowModules.toFixed(1)} (threshold ${lowThreshold}) → ${highModules.toFixed(1)} (threshold ${highThreshold})`);
    
    const lowTokens = result.metrics.averageTokensPerQuery[lowThreshold];
    const highTokens = result.metrics.averageTokensPerQuery[highThreshold];
    
    console.log(`  🔢 Tokens: ${lowTokens.toFixed(0)} (threshold ${lowThreshold}) → ${highTokens.toFixed(0)} (threshold ${highThreshold})`);
    
    // Recomendación final
    console.log(`\n✅ RECOMENDACIÓN FINAL:`);
    console.log(`  Usar threshold ${result.optimalThreshold} para balance óptimo entre precisión y cobertura.`);
    
    if (result.optimalThreshold > 0.7) {
      console.log(`  ⚠️ Threshold alto: Excelente precisión pero puede perder módulos relevantes.`);
    } else if (result.optimalThreshold < 0.4) {
      console.log(`  ⚠️ Threshold bajo: Buena cobertura pero puede incluir módulos irrelevantes.`);
    } else {
      console.log(`  ✅ Threshold balanceado: Buen equilibrio entre precisión y cobertura.`);
    }
  }

  /**
   * Consultas de prueba por defecto
   */
  private getDefaultTestQueries(): string[] {
    return [
      // Consultas simples
      "¿Cuáles son mis derechos como empleado?",
      "Información sobre contratos de alquiler",
      "¿Cómo hacer una denuncia penal?",
      
      // Consultas de análisis
      "Analiza mi caso de despido laboral",
      "Evalúa los riesgos de esta inversión",
      "¿Qué estrategia usar en este conflicto?",
      
      // Consultas de redacción
      "Ayúdame a redactar una carta documento",
      "Necesito escribir una demanda civil",
      "Redacta un contrato de servicios",
      
      // Consultas de negociación
      "Estrategia para negociar una indemnización",
      "Cómo negociar términos contractuales",
      "Tácticas para mediación familiar",
      
      // Consultas especializadas
      "Activa modo estratega rojo para mi caso",
      "Análisis técnico de jurisprudencia",
      "Evaluación crítica de mi posición legal"
    ];
  }

  /**
   * Agrupa elementos por una función de agrupación
   */
  private groupBy<T, K extends string | number | symbol>(
    array: T[],
    keyFn: (item: T) => K
  ): Record<K, T[]> {
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<K, T[]>);
  }

  /**
   * Aplica el threshold óptimo encontrado
   */
  async applyOptimalThreshold(optimizationResult: OptimizationResult): Promise<void> {
    console.log(`🎯 Aplicando threshold óptimo: ${optimizationResult.optimalThreshold}`);
    
    await this.updateThreshold(optimizationResult.optimalThreshold);
    
    console.log('✅ Threshold óptimo aplicado a la configuración');
  }

  /**
   * Ejecuta optimización rápida con parámetros predeterminados
   */
  async quickOptimization(): Promise<OptimizationResult> {
    console.log('⚡ Ejecutando optimización rápida de thresholds...');
    
    const quickQueries = [
      "Analiza mi caso laboral",
      "Redacta una carta documento",
      "Estrategia de negociación",
      "¿Cuáles son mis derechos?",
      "Activa modo estratega rojo"
    ];
    
    const quickRange = { min: 0.4, max: 0.8, step: 0.2 };
    
    return await this.optimizeThresholds(quickQueries, quickRange);
  }
}
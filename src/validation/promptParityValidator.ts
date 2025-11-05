/**
 * Sistema de validación de paridad funcional entre sistema vectorial y prompt original
 * Implementa task 7.1: Comparar respuestas vectoriales con prompt original
 */

import { GeminiService } from '../services/geminiService';
import { IntelligentPromptService } from '../services/intelligentPromptService';

export interface TestQuery {
  id: string;
  query: string;
  category: string;
  expectedModules?: string[];
  complexity: 'low' | 'medium' | 'high';
  legalArea: string[];
  description: string;
}

export interface ValidationResult {
  queryId: string;
  query: string;
  category: string;
  
  // Resultados del sistema vectorial
  vectorial: {
    usedModules: string[];
    totalTokens: number;
    relevanceScore: number;
    processingTime: number;
    response: string;
    success: boolean;
    error?: string;
  };
  
  // Resultados del prompt original (simulado)
  original: {
    totalTokens: number;
    processingTime: number;
    response: string;
    success: boolean;
    error?: string;
  };
  
  // Métricas de comparación
  comparison: {
    tokenEfficiency: number; // vectorial tokens / original tokens
    responseTimeDiff: number; // vectorial time - original time
    qualityScore: number; // 0-1 basado en similitud de respuestas
    moduleRelevance: number; // 0-1 basado en módulos esperados vs usados
    overallScore: number; // Score general de paridad
  };
  
  timestamp: Date;
}

export interface ValidationReport {
  timestamp: Date;
  totalTests: number;
  successfulTests: number;
  averageTokenEfficiency: number;
  averageQualityScore: number;
  averageModuleRelevance: number;
  averageOverallScore: number;
  categoryBreakdown: Record<string, {
    tests: number;
    avgScore: number;
    avgTokenEfficiency: number;
  }>;
  complexityBreakdown: Record<string, {
    tests: number;
    avgScore: number;
    avgProcessingTime: number;
  }>;
  recommendations: string[];
  results: ValidationResult[];
}

export class PromptParityValidator {
  private geminiService: GeminiService;
  private intelligentService: IntelligentPromptService;
  private originalPrompt: string;
  
  constructor(geminiApiKey: string, huggingFaceApiKey: string) {
    this.geminiService = new GeminiService(geminiApiKey, huggingFaceApiKey, true);
    this.intelligentService = new IntelligentPromptService(huggingFaceApiKey);
    this.originalPrompt = this.getOriginalPrompt();
  }

  /**
   * Suite de consultas de prueba diversas
   */
  getTestQueries(): TestQuery[] {
    return [
      // Consultas de análisis estratégico
      {
        id: 'analysis_001',
        query: '¿Cómo analizar un caso de despido laboral sin causa?',
        category: 'analysis',
        expectedModules: ['core/base-agent.txt', 'analysis/strategic-360.txt', 'core/legal-context.txt'],
        complexity: 'high',
        legalArea: ['laboral'],
        description: 'Análisis estratégico de caso laboral complejo'
      },
      {
        id: 'analysis_002',
        query: 'Evalúa los riesgos de una inversión inmobiliaria',
        category: 'analysis',
        expectedModules: ['core/base-agent.txt', 'analysis/risk-assessment.txt', 'analysis/strategic-360.txt'],
        complexity: 'high',
        legalArea: ['civil', 'comercial'],
        description: 'Análisis de riesgo en inversión'
      },
      
      // Consultas de redacción
      {
        id: 'drafting_001',
        query: 'Necesito redactar una carta documento por incumplimiento contractual',
        category: 'drafting',
        expectedModules: ['core/base-agent.txt', 'tactics/document-drafting.txt', 'core/legal-context.txt'],
        complexity: 'medium',
        legalArea: ['civil'],
        description: 'Redacción de documento legal formal'
      },
      {
        id: 'drafting_002',
        query: 'Ayúdame a escribir una demanda por daños y perjuicios',
        category: 'drafting',
        expectedModules: ['core/base-agent.txt', 'tactics/document-drafting.txt', 'tactics/litigation.txt'],
        complexity: 'high',
        legalArea: ['civil'],
        description: 'Redacción de demanda judicial'
      },
      
      // Consultas de negociación
      {
        id: 'negotiation_001',
        query: '¿Qué estrategia usar para negociar una indemnización laboral?',
        category: 'negotiation',
        expectedModules: ['core/base-agent.txt', 'tactics/negotiation.txt', 'analysis/strategic-360.txt'],
        complexity: 'medium',
        legalArea: ['laboral'],
        description: 'Estrategia de negociación laboral'
      },
      {
        id: 'negotiation_002',
        query: 'Cómo negociar los términos de un contrato comercial',
        category: 'negotiation',
        expectedModules: ['core/base-agent.txt', 'tactics/negotiation.txt', 'core/legal-context.txt'],
        complexity: 'medium',
        legalArea: ['comercial'],
        description: 'Negociación contractual comercial'
      },
      
      // Consultas de litigio
      {
        id: 'litigation_001',
        query: 'Estrategia procesal para un juicio por responsabilidad civil',
        category: 'litigation',
        expectedModules: ['core/base-agent.txt', 'tactics/litigation.txt', 'analysis/strategic-360.txt'],
        complexity: 'high',
        legalArea: ['civil'],
        description: 'Estrategia procesal civil'
      },
      
      // Consultas generales
      {
        id: 'general_001',
        query: '¿Cuáles son mis derechos como inquilino?',
        category: 'consultation',
        expectedModules: ['core/base-agent.txt', 'core/legal-context.txt'],
        complexity: 'low',
        legalArea: ['civil'],
        description: 'Consulta general sobre derechos'
      },
      {
        id: 'general_002',
        query: 'Información sobre licencia por maternidad',
        category: 'consultation',
        expectedModules: ['core/base-agent.txt', 'core/legal-context.txt'],
        complexity: 'low',
        legalArea: ['laboral'],
        description: 'Consulta informativa laboral'
      },
      
      // Consultas de modo especial
      {
        id: 'special_001',
        query: 'Activa modo estratega rojo para evaluar las debilidades de mi caso',
        category: 'special_mode',
        expectedModules: ['core/base-agent.txt', 'modes/red-team.txt', 'analysis/strategic-360.txt'],
        complexity: 'high',
        legalArea: ['general'],
        description: 'Activación de modo estratega rojo'
      },
      
      // Consultas técnicas
      {
        id: 'technical_001',
        query: 'Análisis jurisprudencial sobre prescripción en responsabilidad civil',
        category: 'technical',
        expectedModules: ['core/base-agent.txt', 'modes/technical.txt', 'analysis/case-reasoning.txt'],
        complexity: 'high',
        legalArea: ['civil'],
        description: 'Análisis jurisprudencial técnico'
      }
    ];
  }

  /**
   * Ejecuta validación completa de paridad funcional
   */
  async runValidation(): Promise<ValidationReport> {
    console.log('🧪 Iniciando validación de paridad funcional...');
    
    const testQueries = this.getTestQueries();
    const results: ValidationResult[] = [];
    
    for (let i = 0; i < testQueries.length; i++) {
      const testQuery = testQueries[i];
      console.log(`\n📝 Ejecutando prueba ${i + 1}/${testQueries.length}: ${testQuery.id}`);
      console.log(`   "${testQuery.query}"`);
      
      try {
        const result = await this.validateQuery(testQuery);
        results.push(result);
        
        console.log(`   ✅ Completada - Score: ${(result.comparison.overallScore * 100).toFixed(1)}%`);
        console.log(`   📊 Eficiencia tokens: ${(result.comparison.tokenEfficiency * 100).toFixed(1)}%`);
        console.log(`   🎯 Relevancia módulos: ${(result.comparison.moduleRelevance * 100).toFixed(1)}%`);
        
      } catch (error) {
        console.error(`   ❌ Error en prueba ${testQuery.id}:`, error);
        
        // Crear resultado de error
        const errorResult: ValidationResult = {
          queryId: testQuery.id,
          query: testQuery.query,
          category: testQuery.category,
          vectorial: {
            usedModules: [],
            totalTokens: 0,
            relevanceScore: 0,
            processingTime: 0,
            response: '',
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
          },
          original: {
            totalTokens: 0,
            processingTime: 0,
            response: '',
            success: false,
            error: 'No ejecutado debido a error vectorial'
          },
          comparison: {
            tokenEfficiency: 0,
            responseTimeDiff: 0,
            qualityScore: 0,
            moduleRelevance: 0,
            overallScore: 0
          },
          timestamp: new Date()
        };
        
        results.push(errorResult);
      }
    }
    
    // Generar reporte
    const report = this.generateReport(results);
    
    console.log('\n📊 Validación completada. Generando reporte...');
    this.printReport(report);
    
    return report;
  }

  /**
   * Valida una consulta específica comparando sistemas
   */
  async validateQuery(testQuery: TestQuery): Promise<ValidationResult> {
    const messages = [{ role: 'user' as const, content: testQuery.query }];
    
    // Ejecutar con sistema vectorial
    const vectorialStart = Date.now();
    let vectorialResult: any;
    let vectorialResponse = '';
    let vectorialSuccess = false;
    let vectorialError: string | undefined;
    
    try {
      vectorialResponse = await this.geminiService.sendMessage(messages);
      vectorialSuccess = true;
      
      // Obtener métricas del último query
      const recentMetrics = this.geminiService.getRecentVectorMetrics(1);
      vectorialResult = recentMetrics[0] || {
        usedModules: [],
        totalTokens: 0,
        relevanceScore: 0,
        processingTime: Date.now() - vectorialStart
      };
      
    } catch (error) {
      vectorialError = error instanceof Error ? error.message : 'Error desconocido';
      vectorialResult = {
        usedModules: [],
        totalTokens: 0,
        relevanceScore: 0,
        processingTime: Date.now() - vectorialStart
      };
    }
    
    // Ejecutar con prompt original (simulado)
    const originalStart = Date.now();
    let originalResponse = '';
    let originalSuccess = false;
    let originalError: string | undefined;
    let originalTokens = 0;
    
    try {
      // Crear servicio sin sistema vectorial para simular prompt original
      const originalService = new GeminiService(
        import.meta.env.VITE_GEMINI_API_KEY,
        undefined, // Sin HF API key = sin sistema vectorial
        false // Sin métricas
      );
      
      originalResponse = await originalService.sendMessage(messages, this.originalPrompt);
      originalSuccess = true;
      originalTokens = this.estimateTokens(this.originalPrompt);
      
    } catch (error) {
      originalError = error instanceof Error ? error.message : 'Error desconocido';
    }
    
    const originalProcessingTime = Date.now() - originalStart;
    
    // Calcular métricas de comparación
    const comparison = this.calculateComparison(
      testQuery,
      vectorialResult,
      vectorialResponse,
      originalTokens,
      originalResponse
    );
    
    return {
      queryId: testQuery.id,
      query: testQuery.query,
      category: testQuery.category,
      vectorial: {
        usedModules: vectorialResult.usedModules || [],
        totalTokens: vectorialResult.totalTokens || 0,
        relevanceScore: vectorialResult.relevanceScore || 0,
        processingTime: vectorialResult.processingTime || 0,
        response: vectorialResponse,
        success: vectorialSuccess,
        error: vectorialError
      },
      original: {
        totalTokens: originalTokens,
        processingTime: originalProcessingTime,
        response: originalResponse,
        success: originalSuccess,
        error: originalError
      },
      comparison,
      timestamp: new Date()
    };
  }

  /**
   * Calcula métricas de comparación entre sistemas
   */
  private calculateComparison(
    testQuery: TestQuery,
    vectorialResult: any,
    vectorialResponse: string,
    originalTokens: number,
    originalResponse: string
  ): ValidationResult['comparison'] {
    
    // Eficiencia de tokens (menor es mejor)
    const tokenEfficiency = originalTokens > 0 
      ? (vectorialResult.totalTokens || 0) / originalTokens 
      : 1;
    
    // Diferencia en tiempo de respuesta
    const responseTimeDiff = (vectorialResult.processingTime || 0) - 0; // Original time not tracked
    
    // Score de calidad basado en longitud y contenido de respuesta
    const qualityScore = this.calculateQualityScore(vectorialResponse, originalResponse);
    
    // Relevancia de módulos (comparar con módulos esperados)
    const moduleRelevance = this.calculateModuleRelevance(
      vectorialResult.usedModules || [],
      testQuery.expectedModules || []
    );
    
    // Score general (promedio ponderado)
    const overallScore = (
      qualityScore * 0.4 +           // 40% calidad de respuesta
      moduleRelevance * 0.3 +        // 30% relevancia de módulos
      Math.min(1, 1/tokenEfficiency) * 0.2 + // 20% eficiencia de tokens
      Math.max(0, 1 - Math.abs(responseTimeDiff) / 1000) * 0.1 // 10% tiempo
    );
    
    return {
      tokenEfficiency,
      responseTimeDiff,
      qualityScore,
      moduleRelevance,
      overallScore
    };
  }

  /**
   * Calcula score de calidad comparando respuestas
   */
  private calculateQualityScore(vectorialResponse: string, originalResponse: string): number {
    if (!vectorialResponse || !originalResponse) {
      return vectorialResponse && originalResponse ? 0 : (vectorialResponse ? 0.5 : 0);
    }
    
    // Métricas básicas de calidad
    const lengthRatio = Math.min(vectorialResponse.length, originalResponse.length) / 
                       Math.max(vectorialResponse.length, originalResponse.length);
    
    // Similitud de palabras clave (simplificado)
    const vectorialWords = new Set(vectorialResponse.toLowerCase().split(/\s+/));
    const originalWords = new Set(originalResponse.toLowerCase().split(/\s+/));
    const intersection = new Set([...vectorialWords].filter(x => originalWords.has(x)));
    const union = new Set([...vectorialWords, ...originalWords]);
    const wordSimilarity = intersection.size / union.size;
    
    // Score combinado
    return (lengthRatio * 0.3 + wordSimilarity * 0.7);
  }

  /**
   * Calcula relevancia de módulos seleccionados
   */
  private calculateModuleRelevance(usedModules: string[], expectedModules: string[]): number {
    if (expectedModules.length === 0) {
      return usedModules.length > 0 ? 0.5 : 1; // Si no hay expectativas, cualquier selección es parcialmente correcta
    }
    
    const usedSet = new Set(usedModules);
    const expectedSet = new Set(expectedModules);
    
    // Módulos correctamente seleccionados
    const correctModules = [...expectedSet].filter(m => usedSet.has(m)).length;
    
    // Penalizar módulos innecesarios
    const unnecessaryModules = [...usedSet].filter(m => !expectedSet.has(m)).length;
    
    // Score basado en precisión y recall
    const precision = usedModules.length > 0 ? correctModules / usedModules.length : 0;
    const recall = correctModules / expectedModules.length;
    
    // F1 score con penalización por módulos innecesarios
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    const penalty = Math.min(0.5, unnecessaryModules * 0.1);
    
    return Math.max(0, f1 - penalty);
  }

  /**
   * Genera reporte completo de validación
   */
  private generateReport(results: ValidationResult[]): ValidationReport {
    const successfulResults = results.filter(r => r.vectorial.success && r.original.success);
    const totalTests = results.length;
    const successfulTests = successfulResults.length;
    
    // Métricas promedio
    const averageTokenEfficiency = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.comparison.tokenEfficiency, 0) / successfulResults.length
      : 0;
    
    const averageQualityScore = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.comparison.qualityScore, 0) / successfulResults.length
      : 0;
    
    const averageModuleRelevance = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.comparison.moduleRelevance, 0) / successfulResults.length
      : 0;
    
    const averageOverallScore = successfulResults.length > 0
      ? successfulResults.reduce((sum, r) => sum + r.comparison.overallScore, 0) / successfulResults.length
      : 0;
    
    // Breakdown por categoría
    const categoryBreakdown: Record<string, any> = {};
    const categoryGroups = this.groupBy(successfulResults, r => r.category);
    
    for (const [category, categoryResults] of Object.entries(categoryGroups)) {
      categoryBreakdown[category] = {
        tests: categoryResults.length,
        avgScore: categoryResults.reduce((sum, r) => sum + r.comparison.overallScore, 0) / categoryResults.length,
        avgTokenEfficiency: categoryResults.reduce((sum, r) => sum + r.comparison.tokenEfficiency, 0) / categoryResults.length
      };
    }
    
    // Breakdown por complejidad
    const complexityBreakdown: Record<string, any> = {};
    const testQueries = this.getTestQueries();
    const complexityGroups = this.groupBy(successfulResults, r => {
      const testQuery = testQueries.find(q => q.id === r.queryId);
      return testQuery?.complexity || 'unknown';
    });
    
    for (const [complexity, complexityResults] of Object.entries(complexityGroups)) {
      complexityBreakdown[complexity] = {
        tests: complexityResults.length,
        avgScore: complexityResults.reduce((sum, r) => sum + r.comparison.overallScore, 0) / complexityResults.length,
        avgProcessingTime: complexityResults.reduce((sum, r) => sum + r.vectorial.processingTime, 0) / complexityResults.length
      };
    }
    
    // Generar recomendaciones
    const recommendations = this.generateRecommendations(results, averageOverallScore, averageTokenEfficiency);
    
    return {
      timestamp: new Date(),
      totalTests,
      successfulTests,
      averageTokenEfficiency,
      averageQualityScore,
      averageModuleRelevance,
      averageOverallScore,
      categoryBreakdown,
      complexityBreakdown,
      recommendations,
      results
    };
  }

  /**
   * Genera recomendaciones basadas en resultados
   */
  private generateRecommendations(
    results: ValidationResult[],
    averageOverallScore: number,
    averageTokenEfficiency: number
  ): string[] {
    const recommendations: string[] = [];
    
    // Recomendaciones basadas en score general
    if (averageOverallScore < 0.7) {
      recommendations.push('Score general bajo (<70%). Revisar selección de módulos y thresholds de similitud.');
    }
    
    if (averageOverallScore >= 0.8) {
      recommendations.push('Excelente paridad funcional (≥80%). Sistema vectorial funcionando correctamente.');
    }
    
    // Recomendaciones basadas en eficiencia de tokens
    if (averageTokenEfficiency > 1.2) {
      recommendations.push('Uso excesivo de tokens (+20% vs original). Ajustar límites de módulos o tokens por módulo.');
    }
    
    if (averageTokenEfficiency < 0.8) {
      recommendations.push('Excelente eficiencia de tokens (-20% vs original). Considerar aumentar límites para mejor calidad.');
    }
    
    // Recomendaciones por categoría
    const lowPerformingCategories = Object.entries(this.generateReport(results).categoryBreakdown)
      .filter(([_, data]) => data.avgScore < 0.6)
      .map(([category, _]) => category);
    
    if (lowPerformingCategories.length > 0) {
      recommendations.push(`Categorías con bajo rendimiento: ${lowPerformingCategories.join(', ')}. Revisar módulos específicos.`);
    }
    
    // Recomendaciones por errores
    const errorResults = results.filter(r => !r.vectorial.success || !r.original.success);
    if (errorResults.length > 0) {
      recommendations.push(`${errorResults.length} pruebas fallaron. Revisar configuración de APIs y manejo de errores.`);
    }
    
    return recommendations;
  }

  /**
   * Imprime reporte en consola
   */
  private printReport(report: ValidationReport): void {
    console.log('\n📊 REPORTE DE VALIDACIÓN DE PARIDAD FUNCIONAL');
    console.log('='.repeat(60));
    
    console.log(`\n📈 MÉTRICAS GENERALES:`);
    console.log(`  Total de pruebas: ${report.totalTests}`);
    console.log(`  Pruebas exitosas: ${report.successfulTests} (${(report.successfulTests/report.totalTests*100).toFixed(1)}%)`);
    console.log(`  Score general promedio: ${(report.averageOverallScore * 100).toFixed(1)}%`);
    console.log(`  Eficiencia de tokens: ${(report.averageTokenEfficiency * 100).toFixed(1)}%`);
    console.log(`  Calidad de respuestas: ${(report.averageQualityScore * 100).toFixed(1)}%`);
    console.log(`  Relevancia de módulos: ${(report.averageModuleRelevance * 100).toFixed(1)}%`);
    
    console.log(`\n📊 BREAKDOWN POR CATEGORÍA:`);
    for (const [category, data] of Object.entries(report.categoryBreakdown)) {
      console.log(`  ${category}: ${data.tests} pruebas, ${(data.avgScore * 100).toFixed(1)}% score, ${(data.avgTokenEfficiency * 100).toFixed(1)}% eficiencia`);
    }
    
    console.log(`\n🎯 BREAKDOWN POR COMPLEJIDAD:`);
    for (const [complexity, data] of Object.entries(report.complexityBreakdown)) {
      console.log(`  ${complexity}: ${data.tests} pruebas, ${(data.avgScore * 100).toFixed(1)}% score, ${data.avgProcessingTime.toFixed(0)}ms promedio`);
    }
    
    console.log(`\n💡 RECOMENDACIONES:`);
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    console.log(`\n🔍 RESULTADOS DETALLADOS:`);
    report.results.forEach(result => {
      const status = result.vectorial.success && result.original.success ? '✅' : '❌';
      console.log(`  ${status} ${result.queryId}: ${(result.comparison.overallScore * 100).toFixed(1)}% | Tokens: ${result.vectorial.totalTokens} | Módulos: ${result.vectorial.usedModules.length}`);
    });
  }

  /**
   * Obtiene el prompt original completo (simulado)
   */
  private getOriginalPrompt(): string {
    return `Eres un abogado profesional especializado en derecho argentino con expertise en civil, laboral y comercial.

NÚCLEO DEL SISTEMA:
- Identidad: Abogado argentino especializado con 15+ años de experiencia
- Especialización: Derecho civil, laboral y comercial argentino
- Enfoque: Análisis estratégico 360°, evaluación de riesgos, tácticas procesales

ARQUITECTURA DEL RAZONAMIENTO:
1. Análisis estratégico integral de la situación
2. Evaluación de riesgos y oportunidades
3. Identificación de precedentes y jurisprudencia relevante
4. Desarrollo de estrategias tácticas específicas
5. Recomendaciones de acción priorizadas

BASE DE CONOCIMIENTO:
- Código Civil y Comercial de la Nación (CCCN)
- Ley de Contrato de Trabajo (LCT)
- Código Procesal Civil y Comercial
- Jurisprudencia de CSJN y tribunales superiores
- Doctrina legal argentina actualizada

PROTOCOLO DE INTERACCIÓN:
- Tono profesional pero accesible
- Explicaciones claras y estructuradas
- Citas de normativa cuando corresponda
- Sugerencias de consulta personalizada para casos complejos
- Advertencias sobre limitaciones del asesoramiento virtual

ARSENAL TÁCTICO:
- Estrategias de negociación y mediación
- Tácticas procesales y litigiosas
- Redacción de documentos legales
- Análisis de contratos y acuerdos
- Evaluación de viabilidad de acciones legales

MODO ESTRATEGA ROJO:
Cuando se active explícitamente, adoptar perspectiva crítica para:
- Identificar debilidades en la posición del consultante
- Anticipar argumentos de la contraparte
- Evaluar riesgos procesales y económicos
- Sugerir fortalecimiento de la estrategia

DIRECTIVAS OPERATIVAS:
- Mantener confidencialidad y ética profesional
- No brindar asesoramiento en materias fuera de especialización
- Recomendar consulta presencial para casos urgentes o complejos
- Actualizar conocimiento con cambios normativos relevantes

Proporciona asesoramiento legal claro, preciso y profesional basado en la legislación argentina vigente.`;
  }

  /**
   * Estima tokens en un texto
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
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
}
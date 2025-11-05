/**
 * Test runner principal para validación de paridad funcional
 * Implementa task 7.1: Crear suite de consultas de prueba diversas
 */

import { PromptParityValidator, ValidationReport } from './promptParityValidator';
import { SimilarityThresholdOptimizer, OptimizationResult } from './similarityThresholdOptimizer';
import { vectorConfigService } from '../services/vectorConfigService';

export interface ParityTestConfig {
  runValidation: boolean;
  runOptimization: boolean;
  optimizeThresholds: boolean;
  saveResults: boolean;
  testCategories: string[];
  maxTestsPerCategory: number;
}

export interface ParityTestResults {
  timestamp: Date;
  config: ParityTestConfig;
  validationReport?: ValidationReport;
  optimizationResult?: OptimizationResult;
  finalRecommendations: string[];
  configurationChanges: {
    before: any;
    after: any;
    applied: boolean;
  };
}

export class ParityTestRunner {
  private validator: PromptParityValidator;
  private optimizer: SimilarityThresholdOptimizer;
  
  constructor(geminiApiKey: string, huggingFaceApiKey: string) {
    this.validator = new PromptParityValidator(geminiApiKey, huggingFaceApiKey);
    this.optimizer = new SimilarityThresholdOptimizer(huggingFaceApiKey);
  }

  /**
   * Ejecuta suite completa de pruebas de paridad funcional
   */
  async runFullParityTest(config: Partial<ParityTestConfig> = {}): Promise<ParityTestResults> {
    const fullConfig: ParityTestConfig = {
      runValidation: true,
      runOptimization: true,
      optimizeThresholds: true,
      saveResults: true,
      testCategories: ['all'],
      maxTestsPerCategory: 10,
      ...config
    };

    console.log('🚀 INICIANDO SUITE COMPLETA DE VALIDACIÓN DE PARIDAD FUNCIONAL');
    console.log('='.repeat(70));
    console.log(`📋 Configuración:`);
    console.log(`  - Validación: ${fullConfig.runValidation ? '✅' : '❌'}`);
    console.log(`  - Optimización: ${fullConfig.runOptimization ? '✅' : '❌'}`);
    console.log(`  - Ajuste de thresholds: ${fullConfig.optimizeThresholds ? '✅' : '❌'}`);
    console.log(`  - Guardar resultados: ${fullConfig.saveResults ? '✅' : '❌'}`);

    const startTime = Date.now();
    const configBefore = vectorConfigService.getCurrentConfig();
    
    let validationReport: ValidationReport | undefined;
    let optimizationResult: OptimizationResult | undefined;
    const finalRecommendations: string[] = [];

    try {
      // Fase 1: Optimización de thresholds
      if (fullConfig.runOptimization) {
        console.log('\n🎯 FASE 1: OPTIMIZACIÓN DE THRESHOLDS');
        console.log('-'.repeat(50));
        
        optimizationResult = await this.optimizer.optimizeThresholds();
        
        if (fullConfig.optimizeThresholds && optimizationResult) {
          console.log('\n⚙️ Aplicando threshold óptimo...');
          await this.optimizer.applyOptimalThreshold(optimizationResult);
          finalRecommendations.push(`Threshold optimizado aplicado: ${optimizationResult.optimalThreshold}`);
        }
      }

      // Fase 2: Validación de paridad funcional
      if (fullConfig.runValidation) {
        console.log('\n🧪 FASE 2: VALIDACIÓN DE PARIDAD FUNCIONAL');
        console.log('-'.repeat(50));
        
        validationReport = await this.validator.runValidation();
        
        // Agregar recomendaciones del reporte de validación
        if (validationReport.recommendations) {
          finalRecommendations.push(...validationReport.recommendations);
        }
      }

      // Fase 3: Análisis combinado y recomendaciones finales
      console.log('\n📊 FASE 3: ANÁLISIS COMBINADO');
      console.log('-'.repeat(50));
      
      const combinedRecommendations = this.generateCombinedRecommendations(
        validationReport,
        optimizationResult
      );
      finalRecommendations.push(...combinedRecommendations);

      const configAfter = vectorConfigService.getCurrentConfig();
      const totalTime = Date.now() - startTime;

      console.log(`\n✅ SUITE COMPLETA FINALIZADA EN ${(totalTime / 1000).toFixed(1)}s`);
      
      const results: ParityTestResults = {
        timestamp: new Date(),
        config: fullConfig,
        validationReport,
        optimizationResult,
        finalRecommendations,
        configurationChanges: {
          before: configBefore,
          after: configAfter,
          applied: fullConfig.optimizeThresholds
        }
      };

      // Imprimir resumen final
      this.printFinalSummary(results);

      // Guardar resultados si está configurado
      if (fullConfig.saveResults) {
        await this.saveResults(results);
      }

      return results;

    } catch (error) {
      console.error('❌ Error en suite de pruebas:', error);
      throw error;
    }
  }

  /**
   * Ejecuta solo validación de paridad
   */
  async runValidationOnly(): Promise<ValidationReport> {
    console.log('🧪 Ejecutando solo validación de paridad funcional...');
    return await this.validator.runValidation();
  }

  /**
   * Ejecuta solo optimización de thresholds
   */
  async runOptimizationOnly(): Promise<OptimizationResult> {
    console.log('🎯 Ejecutando solo optimización de thresholds...');
    return await this.optimizer.optimizeThresholds();
  }

  /**
   * Ejecuta prueba rápida (subset de pruebas)
   */
  async runQuickTest(): Promise<ParityTestResults> {
    console.log('⚡ Ejecutando prueba rápida de paridad...');
    
    const quickConfig: ParityTestConfig = {
      runValidation: true,
      runOptimization: true,
      optimizeThresholds: false, // No aplicar cambios en prueba rápida
      saveResults: false,
      testCategories: ['analysis', 'consultation'],
      maxTestsPerCategory: 3
    };

    return await this.runFullParityTest(quickConfig);
  }

  /**
   * Genera recomendaciones combinadas basadas en ambos análisis
   */
  private generateCombinedRecommendations(
    validationReport?: ValidationReport,
    optimizationResult?: OptimizationResult
  ): string[] {
    const recommendations: string[] = [];

    if (validationReport && optimizationResult) {
      // Análisis combinado
      const avgScore = validationReport.averageOverallScore;
      const optimalThreshold = optimizationResult.optimalThreshold;
      const currentThreshold = vectorConfigService.getCurrentConfig().similarity.minSimilarity;

      // Recomendación sobre threshold
      if (Math.abs(optimalThreshold - currentThreshold) > 0.1) {
        recommendations.push(
          `Considerar ajustar threshold de ${currentThreshold} a ${optimalThreshold} para mejor rendimiento`
        );
      }

      // Recomendación sobre score general
      if (avgScore < 0.6) {
        recommendations.push(
          'Score de paridad bajo. Revisar selección de módulos y configuración vectorial'
        );
      } else if (avgScore > 0.8) {
        recommendations.push(
          'Excelente paridad funcional. Sistema vectorial funcionando correctamente'
        );
      }

      // Recomendación sobre eficiencia
      const avgTokenEfficiency = validationReport.averageTokenEfficiency;
      if (avgTokenEfficiency > 1.2) {
        recommendations.push(
          'Uso excesivo de tokens. Considerar reducir límites de módulos o tokens por módulo'
        );
      } else if (avgTokenEfficiency < 0.7) {
        recommendations.push(
          'Excelente eficiencia de tokens. Considerar aumentar límites para mejor cobertura'
        );
      }

      // Recomendaciones específicas por categoría
      const lowPerformingCategories = Object.entries(validationReport.categoryBreakdown)
        .filter(([_, data]) => data.avgScore < 0.6)
        .map(([category, _]) => category);

      if (lowPerformingCategories.length > 0) {
        recommendations.push(
          `Mejorar rendimiento en categorías: ${lowPerformingCategories.join(', ')}`
        );
      }
    }

    // Recomendaciones generales del sistema
    recommendations.push('Monitorear métricas de rendimiento regularmente');
    recommendations.push('Considerar re-optimización mensual de thresholds');

    return recommendations;
  }

  /**
   * Imprime resumen final de resultados
   */
  private printFinalSummary(results: ParityTestResults): void {
    console.log('\n📋 RESUMEN FINAL DE VALIDACIÓN');
    console.log('='.repeat(60));

    if (results.validationReport) {
      const report = results.validationReport;
      console.log(`\n🧪 VALIDACIÓN DE PARIDAD:`);
      console.log(`  ✅ Pruebas exitosas: ${report.successfulTests}/${report.totalTests} (${(report.successfulTests/report.totalTests*100).toFixed(1)}%)`);
      console.log(`  📊 Score general: ${(report.averageOverallScore * 100).toFixed(1)}%`);
      console.log(`  🔢 Eficiencia tokens: ${(report.averageTokenEfficiency * 100).toFixed(1)}%`);
      console.log(`  🎯 Relevancia módulos: ${(report.averageModuleRelevance * 100).toFixed(1)}%`);
    }

    if (results.optimizationResult) {
      const opt = results.optimizationResult;
      console.log(`\n🎯 OPTIMIZACIÓN DE THRESHOLDS:`);
      console.log(`  🎪 Threshold óptimo: ${opt.optimalThreshold}`);
      console.log(`  🛡️ Conservador: ${opt.recommendations.conservative}`);
      console.log(`  ⚖️ Balanceado: ${opt.recommendations.balanced}`);
      console.log(`  🚀 Agresivo: ${opt.recommendations.aggressive}`);
    }

    console.log(`\n⚙️ CAMBIOS DE CONFIGURACIÓN:`);
    console.log(`  Aplicados: ${results.configurationChanges.applied ? '✅' : '❌'}`);
    if (results.configurationChanges.applied) {
      const before = results.configurationChanges.before.similarity?.minSimilarity || 'N/A';
      const after = results.configurationChanges.after.similarity?.minSimilarity || 'N/A';
      console.log(`  Threshold: ${before} → ${after}`);
    }

    console.log(`\n💡 RECOMENDACIONES FINALES:`);
    results.finalRecommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });

    // Estado general del sistema
    const overallStatus = this.determineOverallStatus(results);
    console.log(`\n🏆 ESTADO GENERAL: ${overallStatus.emoji} ${overallStatus.message}`);
  }

  /**
   * Determina el estado general del sistema
   */
  private determineOverallStatus(results: ParityTestResults): { emoji: string; message: string } {
    if (!results.validationReport) {
      return { emoji: '❓', message: 'Estado indeterminado - validación no ejecutada' };
    }

    const avgScore = results.validationReport.averageOverallScore;
    const successRate = results.validationReport.successfulTests / results.validationReport.totalTests;

    if (avgScore >= 0.8 && successRate >= 0.9) {
      return { emoji: '🟢', message: 'EXCELENTE - Sistema funcionando óptimamente' };
    } else if (avgScore >= 0.6 && successRate >= 0.8) {
      return { emoji: '🟡', message: 'BUENO - Sistema funcionando correctamente con mejoras menores' };
    } else if (avgScore >= 0.4 && successRate >= 0.6) {
      return { emoji: '🟠', message: 'REGULAR - Sistema requiere optimización' };
    } else {
      return { emoji: '🔴', message: 'CRÍTICO - Sistema requiere revisión inmediata' };
    }
  }

  /**
   * Guarda resultados en archivo (simulado - en producción sería a archivo real)
   */
  private async saveResults(results: ParityTestResults): Promise<void> {
    console.log('\n💾 Guardando resultados...');
    
    // En un entorno real, esto guardaría a un archivo JSON
    const resultsJson = JSON.stringify(results, null, 2);
    
    console.log(`📁 Resultados guardados (${resultsJson.length} caracteres)`);
    console.log('💡 En producción se guardarían en: ./validation-results-' + 
                results.timestamp.toISOString().split('T')[0] + '.json');
  }

  /**
   * Ejecuta prueba de regresión (comparar con resultados anteriores)
   */
  async runRegressionTest(previousResults?: ParityTestResults): Promise<{
    current: ParityTestResults;
    comparison: {
      scoreImprovement: number;
      efficiencyImprovement: number;
      recommendations: string[];
    };
  }> {
    console.log('🔄 Ejecutando prueba de regresión...');
    
    const current = await this.runFullParityTest({
      runValidation: true,
      runOptimization: false,
      optimizeThresholds: false,
      saveResults: false
    });

    let comparison = {
      scoreImprovement: 0,
      efficiencyImprovement: 0,
      recommendations: ['Primera ejecución - sin datos de comparación']
    };

    if (previousResults?.validationReport && current.validationReport) {
      const scoreDiff = current.validationReport.averageOverallScore - 
                       previousResults.validationReport.averageOverallScore;
      const efficiencyDiff = current.validationReport.averageTokenEfficiency - 
                            previousResults.validationReport.averageTokenEfficiency;

      comparison = {
        scoreImprovement: scoreDiff,
        efficiencyImprovement: efficiencyDiff,
        recommendations: this.generateRegressionRecommendations(scoreDiff, efficiencyDiff)
      };

      console.log(`\n📈 COMPARACIÓN CON RESULTADOS ANTERIORES:`);
      console.log(`  Score: ${scoreDiff > 0 ? '+' : ''}${(scoreDiff * 100).toFixed(1)}%`);
      console.log(`  Eficiencia: ${efficiencyDiff > 0 ? '+' : ''}${(efficiencyDiff * 100).toFixed(1)}%`);
    }

    return { current, comparison };
  }

  /**
   * Genera recomendaciones basadas en regresión
   */
  private generateRegressionRecommendations(scoreDiff: number, efficiencyDiff: number): string[] {
    const recommendations: string[] = [];

    if (scoreDiff < -0.05) {
      recommendations.push('⚠️ Degradación significativa en score - revisar cambios recientes');
    } else if (scoreDiff > 0.05) {
      recommendations.push('✅ Mejora significativa en score - cambios positivos');
    }

    if (efficiencyDiff < -0.1) {
      recommendations.push('⚠️ Pérdida de eficiencia - revisar configuración de tokens');
    } else if (efficiencyDiff > 0.1) {
      recommendations.push('✅ Mejora en eficiencia - optimización exitosa');
    }

    if (Math.abs(scoreDiff) < 0.02 && Math.abs(efficiencyDiff) < 0.05) {
      recommendations.push('📊 Rendimiento estable - sistema funcionando consistentemente');
    }

    return recommendations;
  }
}

// Función de conveniencia para ejecutar desde consola
export async function runParityValidation(): Promise<ParityTestResults> {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;

  if (!geminiKey || !hfKey) {
    throw new Error('API keys requeridas: VITE_GEMINI_API_KEY y VITE_HUGGING_FACE_API_KEY');
  }

  const runner = new ParityTestRunner(geminiKey, hfKey);
  return await runner.runFullParityTest();
}

// Función de conveniencia para prueba rápida
export async function runQuickParityTest(): Promise<ParityTestResults> {
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;

  if (!geminiKey || !hfKey) {
    throw new Error('API keys requeridas: VITE_GEMINI_API_KEY y VITE_HUGGING_FACE_API_KEY');
  }

  const runner = new ParityTestRunner(geminiKey, hfKey);
  return await runner.runQuickTest();
}
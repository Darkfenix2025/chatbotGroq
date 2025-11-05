/**
 * Script principal para ejecutar validación de paridad funcional
 * Implementa task 7: Validar paridad funcional con sistema vectorial
 * 
 * Ejecutar desde la consola del navegador:
 * - runParityValidation() - Suite completa
 * - runQuickParityTest() - Prueba rápida
 * - runPerformanceValidation() - Solo rendimiento
 */

import { ParityTestRunner, runParityValidation, runQuickParityTest } from './validation/parityTestRunner';
import { PerformanceTestRunner, runPerformanceValidation, runQuickPerformanceTest } from './validation/performanceTestRunner';
import { SimilarityThresholdOptimizer } from './validation/similarityThresholdOptimizer';
import { VectorialPerformanceOptimizer } from './optimization/vectorialPerformanceOptimizer';

// Hacer funciones disponibles globalmente
(window as any).runParityValidation = runParityValidation;
(window as any).runQuickParityTest = runQuickParityTest;
(window as any).runPerformanceValidation = runPerformanceValidation;
(window as any).runQuickPerformanceTest = runQuickPerformanceTest;

// Función principal que ejecuta toda la validación
(window as any).runFullValidation = async function() {
  console.log('🚀 INICIANDO VALIDACIÓN COMPLETA DEL SISTEMA VECTORIAL');
  console.log('='.repeat(70));
  
  // Verificar API keys
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  console.log('🔑 Verificando API keys...');
  console.log(`  Gemini: ${geminiKey ? '✅ Configurada' : '❌ Faltante'}`);
  console.log(`  Hugging Face: ${hfKey ? '✅ Configurada' : '❌ Faltante'}`);
  
  if (!geminiKey || !hfKey) {
    console.error('❌ Se requieren ambas API keys para la validación completa');
    console.log('💡 Configura las claves en el archivo .env:');
    console.log('   VITE_GEMINI_API_KEY=tu_clave_gemini');
    console.log('   VITE_HUGGING_FACE_API_KEY=tu_clave_hf');
    return;
  }
  
  const startTime = Date.now();
  
  try {
    // Fase 1: Validación de paridad funcional
    console.log('\n🧪 FASE 1: VALIDACIÓN DE PARIDAD FUNCIONAL');
    console.log('-'.repeat(50));
    
    const parityRunner = new ParityTestRunner(geminiKey, hfKey);
    const parityResults = await parityRunner.runFullParityTest();
    
    // Fase 2: Validación de rendimiento
    console.log('\n⚡ FASE 2: VALIDACIÓN DE RENDIMIENTO');
    console.log('-'.repeat(50));
    
    const performanceRunner = new PerformanceTestRunner(hfKey);
    const performanceResults = await performanceRunner.runPerformanceTests();
    
    // Fase 3: Optimización de thresholds
    console.log('\n🎯 FASE 3: OPTIMIZACIÓN DE THRESHOLDS');
    console.log('-'.repeat(50));
    
    const thresholdOptimizer = new SimilarityThresholdOptimizer(hfKey);
    const thresholdResults = await thresholdOptimizer.optimizeThresholds();
    
    // Aplicar threshold óptimo si es significativamente mejor
    if (Math.abs(thresholdResults.optimalThreshold - 0.6) > 0.1) {
      console.log('🔧 Aplicando threshold óptimo...');
      await thresholdOptimizer.applyOptimalThreshold(thresholdResults);
    }
    
    // Resumen final
    const totalTime = Date.now() - startTime;
    console.log('\n📊 RESUMEN FINAL DE VALIDACIÓN');
    console.log('='.repeat(60));
    console.log(`⏱️ Tiempo total: ${(totalTime / 1000).toFixed(1)}s`);
    
    // Resultados de paridad
    if (parityResults.validationReport) {
      const report = parityResults.validationReport;
      console.log(`\n🧪 PARIDAD FUNCIONAL:`);
      console.log(`  ✅ Pruebas exitosas: ${report.successfulTests}/${report.totalTests}`);
      console.log(`  📊 Score general: ${(report.averageOverallScore * 100).toFixed(1)}%`);
      console.log(`  🔢 Eficiencia tokens: ${(report.averageTokenEfficiency * 100).toFixed(1)}%`);
    }
    
    // Resultados de rendimiento
    console.log(`\n⚡ RENDIMIENTO:`);
    console.log(`  ⏱️ Tiempo promedio: ${performanceResults.performance.averageResponseTime.toFixed(0)}ms`);
    console.log(`  🎯 Precisión: ${(performanceResults.accuracy.averageRelevanceScore * 100).toFixed(1)}%`);
    console.log(`  💾 Cache hit rate: ${(performanceResults.cache.hitRate * 100).toFixed(1)}%`);
    console.log(`  📊 Score general: ${performanceResults.evaluation.overallScore.toFixed(1)}/100`);
    
    // Resultados de optimización
    console.log(`\n🎯 OPTIMIZACIÓN:`);
    console.log(`  🎪 Threshold óptimo: ${thresholdResults.optimalThreshold}`);
    console.log(`  🛡️ Conservador: ${thresholdResults.recommendations.conservative}`);
    console.log(`  🚀 Agresivo: ${thresholdResults.recommendations.aggressive}`);
    
    // Estado general del sistema
    const parityScore = parityResults.validationReport?.averageOverallScore || 0;
    const performanceScore = performanceResults.evaluation.overallScore / 100;
    const overallSystemScore = (parityScore + performanceScore) / 2;
    
    let systemStatus = '🟢 EXCELENTE';
    if (overallSystemScore < 0.8) systemStatus = '🟡 BUENO';
    if (overallSystemScore < 0.6) systemStatus = '🔴 REQUIERE MEJORAS';
    
    console.log(`\n🏆 ESTADO GENERAL DEL SISTEMA: ${systemStatus}`);
    console.log(`   Score combinado: ${(overallSystemScore * 100).toFixed(1)}%`);
    
    // Recomendaciones finales
    console.log(`\n💡 RECOMENDACIONES FINALES:`);
    const allRecommendations = [
      ...parityResults.finalRecommendations,
      ...performanceResults.evaluation.recommendations
    ];
    
    // Eliminar duplicados y mostrar las más importantes
    const uniqueRecommendations = [...new Set(allRecommendations)].slice(0, 5);
    uniqueRecommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    
    console.log('\n✅ VALIDACIÓN COMPLETA FINALIZADA');
    
    return {
      parityResults,
      performanceResults,
      thresholdResults,
      overallSystemScore,
      systemStatus,
      recommendations: uniqueRecommendations
    };
    
  } catch (error) {
    console.error('❌ Error durante la validación:', error);
    throw error;
  }
};

// Función para validación rápida (solo lo esencial)
(window as any).runQuickValidation = async function() {
  console.log('⚡ INICIANDO VALIDACIÓN RÁPIDA DEL SISTEMA VECTORIAL');
  console.log('='.repeat(60));
  
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  if (!geminiKey || !hfKey) {
    console.error('❌ Se requieren ambas API keys');
    return;
  }
  
  try {
    const startTime = Date.now();
    
    // Solo pruebas esenciales
    console.log('\n🧪 Ejecutando pruebas esenciales...');
    
    const parityRunner = new ParityTestRunner(geminiKey, hfKey);
    const parityResults = await parityRunner.runQuickTest();
    
    const performanceRunner = new PerformanceTestRunner(hfKey);
    const performanceResults = await performanceRunner.runQuickPerformanceTest();
    
    const totalTime = Date.now() - startTime;
    
    console.log('\n📊 RESULTADOS RÁPIDOS');
    console.log('-'.repeat(40));
    console.log(`⏱️ Tiempo total: ${(totalTime / 1000).toFixed(1)}s`);
    
    if (parityResults.validationReport) {
      console.log(`🧪 Paridad: ${(parityResults.validationReport.averageOverallScore * 100).toFixed(1)}%`);
    }
    console.log(`⚡ Rendimiento: ${performanceResults.evaluation.overallScore.toFixed(1)}/100`);
    
    const overallScore = (
      (parityResults.validationReport?.averageOverallScore || 0) + 
      (performanceResults.evaluation.overallScore / 100)
    ) / 2;
    
    console.log(`🏆 Score general: ${(overallScore * 100).toFixed(1)}%`);
    
    return { parityResults, performanceResults, overallScore };
    
  } catch (error) {
    console.error('❌ Error en validación rápida:', error);
    throw error;
  }
};

// Función para optimizar solo thresholds
(window as any).optimizeThresholds = async function() {
  console.log('🎯 OPTIMIZANDO THRESHOLDS DE SIMILITUD');
  console.log('='.repeat(50));
  
  const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  if (!hfKey) {
    console.error('❌ Se requiere VITE_HUGGING_FACE_API_KEY');
    return;
  }
  
  try {
    const optimizer = new SimilarityThresholdOptimizer(hfKey);
    const result = await optimizer.quickOptimization();
    
    console.log('\n🎯 ¿Aplicar threshold óptimo? Ejecuta:');
    console.log(`   applyOptimalThreshold(${result.optimalThreshold})`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error optimizando thresholds:', error);
    throw error;
  }
};

// Función para aplicar threshold óptimo
(window as any).applyOptimalThreshold = async function(threshold: number) {
  console.log(`🔧 Aplicando threshold: ${threshold}`);
  
  const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  if (!hfKey) {
    console.error('❌ Se requiere VITE_HUGGING_FACE_API_KEY');
    return;
  }
  
  try {
    const optimizer = new SimilarityThresholdOptimizer(hfKey);
    await optimizer['updateThreshold'](threshold);
    
    console.log('✅ Threshold aplicado correctamente');
    
  } catch (error) {
    console.error('❌ Error aplicando threshold:', error);
    throw error;
  }
};

// Función para optimizar rendimiento
(window as any).optimizePerformance = async function() {
  console.log('🚀 OPTIMIZANDO RENDIMIENTO VECTORIAL');
  console.log('='.repeat(50));
  
  const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  if (!hfKey) {
    console.error('❌ Se requiere VITE_HUGGING_FACE_API_KEY');
    return;
  }
  
  try {
    const optimizer = new VectorialPerformanceOptimizer(hfKey);
    const result = await optimizer.optimizePerformance();
    
    console.log('✅ Optimización de rendimiento completada');
    return result;
    
  } catch (error) {
    console.error('❌ Error optimizando rendimiento:', error);
    throw error;
  }
};

// Función para ejecutar benchmark
(window as any).runBenchmark = async function(iterations: number = 10) {
  console.log(`🏃 EJECUTANDO BENCHMARK (${iterations} iteraciones)`);
  console.log('='.repeat(50));
  
  const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  if (!hfKey) {
    console.error('❌ Se requiere VITE_HUGGING_FACE_API_KEY');
    return;
  }
  
  try {
    const optimizer = new VectorialPerformanceOptimizer(hfKey);
    const result = await optimizer.runPerformanceBenchmark(iterations);
    
    console.log('✅ Benchmark completado');
    return result;
    
  } catch (error) {
    console.error('❌ Error en benchmark:', error);
    throw error;
  }
};

// Mostrar funciones disponibles
console.log('🧪 FUNCIONES DE VALIDACIÓN DISPONIBLES:');
console.log('');
console.log('📋 VALIDACIÓN COMPLETA:');
console.log('  - runFullValidation() - Suite completa de validación');
console.log('  - runQuickValidation() - Validación rápida esencial');
console.log('');
console.log('🧪 VALIDACIÓN ESPECÍFICA:');
console.log('  - runParityValidation() - Solo paridad funcional');
console.log('  - runQuickParityTest() - Paridad rápida');
console.log('  - runPerformanceValidation() - Solo rendimiento');
console.log('  - runQuickPerformanceTest() - Rendimiento rápido');
console.log('');
console.log('🎯 OPTIMIZACIÓN:');
console.log('  - optimizeThresholds() - Optimizar thresholds de similitud');
console.log('  - applyOptimalThreshold(0.7) - Aplicar threshold específico');
console.log('  - optimizePerformance() - Optimizar rendimiento general');
console.log('');
console.log('🏃 BENCHMARK:');
console.log('  - runBenchmark(10) - Ejecutar benchmark de rendimiento');
console.log('');
console.log('💡 RECOMENDACIÓN: Ejecuta runQuickValidation() para empezar');
console.log('   o runFullValidation() para análisis completo');
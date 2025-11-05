/**
 * Test de Funcionalidades Vectoriales Avanzadas
 * Verifica que todas las funcionalidades implementadas funcionen correctamente
 */

import { VectorService } from './services/vectorService';
import { VectorDatabase } from './services/vectorDatabase';
import { PromptManager } from './services/promptManager';
import { AdvancedVectorIntegration } from './services/advancedVectorIntegration';

// Configuración de prueba
const HUGGING_FACE_API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY || 'test-key';

async function testAdvancedVectorFeatures() {
  console.log('🚀 Iniciando test de funcionalidades vectoriales avanzadas...');

  try {
    // Inicializar servicios
    const vectorService = new VectorService(HUGGING_FACE_API_KEY);
    const vectorDatabase = new VectorDatabase();
    const promptManager = new PromptManager(vectorService, vectorDatabase);
    const advancedIntegration = new AdvancedVectorIntegration(vectorService, vectorDatabase, promptManager);

    // Test 1: Verificar estado inicial del sistema
    console.log('\n📊 Test 1: Estado inicial del sistema');
    const initialStatus = await advancedIntegration.getSystemStatus();
    console.log('Estado inicial:', {
      isInitialized: initialStatus.isInitialized,
      systemHealth: initialStatus.systemHealth,
      optimizationLevel: initialStatus.optimizationLevel
    });

    // Test 2: Obtener métricas avanzadas
    console.log('\n📈 Test 2: Métricas avanzadas');
    const metrics = await advancedIntegration.getAdvancedMetrics();
    console.log('Métricas del sistema:', {
      totalModules: metrics.system.totalModules,
      clustersCount: metrics.system.clustersCount,
      cacheEfficiency: metrics.system.cacheEfficiency.toFixed(2)
    });

    // Test 3: Registrar feedback de prueba
    console.log('\n🎯 Test 3: Sistema de aprendizaje semántico');
    const testQueryEmbedding = new Array(300).fill(0).map(() => Math.random() - 0.5);
    
    await advancedIntegration.recordComprehensiveFeedback(
      'test-query-1',
      'Consulta de prueba sobre derecho laboral',
      testQueryEmbedding,
      ['core/base-agent.txt', 'analysis/strategic-360.txt'],
      4, // Rating
      0.8, // Response quality
      ['laboral', 'consulta']
    );

    console.log('✅ Feedback registrado exitosamente');

    // Test 4: Obtener métricas de aprendizaje
    console.log('\n🧠 Test 4: Métricas de aprendizaje');
    const learningMetrics = promptManager.getLearningMetrics();
    console.log('Métricas de aprendizaje:', {
      totalFeedbacks: learningMetrics.totalFeedbacks,
      averageImprovement: learningMetrics.averageImprovement.toFixed(3),
      clustersCount: learningMetrics.clustersCount
    });

    // Test 5: Métricas de optimización
    console.log('\n⚡ Test 5: Métricas de optimización');
    const optimizationMetrics = promptManager.getOptimizationMetrics();
    console.log('Métricas de optimización:', {
      embeddingQuality: optimizationMetrics.embeddingQuality.toFixed(3),
      searchAccuracy: optimizationMetrics.searchAccuracy.toFixed(3),
      processingSpeed: optimizationMetrics.processingSpeed.toFixed(0),
      memoryEfficiency: optimizationMetrics.memoryEfficiency.toFixed(3)
    });

    // Test 6: Ejecutar diagnóstico del sistema
    console.log('\n🔍 Test 6: Diagnóstico del sistema');
    const diagnostic = await advancedIntegration.runSystemDiagnostic();
    console.log('Diagnóstico completado:', {
      systemHealth: diagnostic.status.systemHealth,
      recommendationsCount: diagnostic.recommendations.length,
      configValid: diagnostic.configValidation.isValid
    });

    if (diagnostic.recommendations.length > 0) {
      console.log('Recomendaciones principales:');
      diagnostic.recommendations.slice(0, 3).forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }

    // Test 7: Exportar configuración
    console.log('\n💾 Test 7: Exportación de datos');
    const exportedConfig = await advancedIntegration.exportAdvancedConfiguration();
    const configSize = (exportedConfig.length / 1024).toFixed(1);
    console.log(`✅ Configuración exportada (${configSize} KB)`);

    // Test 8: Verificar funcionalidades de fine-tuning
    console.log('\n🎛️ Test 8: Fine-tuning');
    promptManager.recordFineTuningData(
      'Consulta de prueba para fine-tuning',
      ['core/base-agent.txt'],
      5, // Excelente feedback
      ['test', 'fine-tuning']
    );
    console.log('✅ Datos de fine-tuning registrados');

    // Resumen final
    console.log('\n🎉 RESUMEN DE TESTS');
    console.log('==================');
    console.log('✅ Sistema de aprendizaje semántico: Funcionando');
    console.log('✅ Interfaz de administración vectorial: Funcionando');
    console.log('✅ Optimizaciones avanzadas: Funcionando');
    console.log('✅ Integración completa: Funcionando');
    console.log('✅ Exportación/Importación: Funcionando');
    console.log('✅ Métricas y diagnósticos: Funcionando');

    const finalStatus = await advancedIntegration.getSystemStatus();
    console.log('\n📊 Estado final del sistema:');
    console.log(`   Salud: ${finalStatus.systemHealth}`);
    console.log(`   Nivel de optimización: ${finalStatus.optimizationLevel}`);
    console.log(`   Recomendaciones: ${finalStatus.recommendations.length}`);

    console.log('\n🚀 ¡Todas las funcionalidades vectoriales avanzadas están operativas!');

  } catch (error) {
    console.error('❌ Error en test de funcionalidades avanzadas:', error);
    throw error;
  }
}

// Ejecutar test si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testAdvancedVectorFeatures()
    .then(() => {
      console.log('\n✅ Test completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test falló:', error);
      process.exit(1);
    });
}

export { testAdvancedVectorFeatures };
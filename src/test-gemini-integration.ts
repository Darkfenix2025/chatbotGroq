/**
 * Test script para verificar la integración del sistema vectorial con GeminiService
 */

import { GeminiService } from './services/geminiService';

async function testGeminiIntegration() {
  console.log('🧪 Iniciando pruebas de integración GeminiService + Sistema Vectorial\n');

  // Verificar variables de entorno
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const hfApiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;

  if (!geminiApiKey) {
    console.error('❌ VITE_GEMINI_API_KEY no está configurada');
    return;
  }

  if (!hfApiKey) {
    console.warn('⚠️ VITE_HUGGING_FACE_API_KEY no está configurada - usando modo básico');
  }

  try {
    // Crear instancia de GeminiService con sistema vectorial
    const geminiService = new GeminiService(geminiApiKey, hfApiKey, true);
    
    console.log('✅ GeminiService inicializado con sistema vectorial');

    // Consultas de prueba
    const testQueries = [
      "¿Cómo analizar un caso de despido laboral?",
      "Necesito estrategia para una negociación comercial",
      "Activa modo estratega rojo para evaluar riesgos"
    ];

    for (let i = 0; i < testQueries.length; i++) {
      const query = testQueries[i];
      console.log(`\n📝 Prueba ${i + 1}: "${query}"`);
      
      try {
        const startTime = Date.now();
        
        // Simular conversación
        const messages = [
          { role: 'user' as const, content: query }
        ];

        const response = await geminiService.sendMessage(messages);
        const responseTime = Date.now() - startTime;
        
        console.log(`✅ Respuesta recibida en ${responseTime}ms`);
        console.log(`📄 Longitud respuesta: ${response.length} caracteres`);
        
        // Mostrar métricas si están disponibles
        const metrics = geminiService.getSemanticPrecisionMetrics();
        if (metrics.totalQueries > 0) {
          console.log(`📊 Métricas acumuladas:`);
          console.log(`  - Total consultas: ${metrics.totalQueries}`);
          console.log(`  - Tiempo promedio: ${metrics.averageProcessingTime.toFixed(0)}ms`);
          console.log(`  - Relevancia promedio: ${(metrics.averageRelevanceScore * 100).toFixed(1)}%`);
          console.log(`  - Tasa de éxito: ${(metrics.successRate * 100).toFixed(1)}%`);
        }

      } catch (error) {
        console.error(`❌ Error en consulta ${i + 1}:`, error);
      }
    }

    // Mostrar métricas finales
    console.log('\n📊 Métricas finales del sistema:');
    const finalMetrics = geminiService.getSemanticPrecisionMetrics();
    console.log(`  📈 Total consultas procesadas: ${finalMetrics.totalQueries}`);
    console.log(`  ⚡ Tiempo promedio de procesamiento: ${finalMetrics.averageProcessingTime.toFixed(0)}ms`);
    console.log(`  🎯 Score de relevancia promedio: ${(finalMetrics.averageRelevanceScore * 100).toFixed(1)}%`);
    console.log(`  ✅ Tasa de éxito: ${(finalMetrics.successRate * 100).toFixed(1)}%`);
    console.log(`  🔧 Eficiencia de tokens: ${(finalMetrics.tokenEfficiency * 100).toFixed(1)}%`);

    // Mostrar ranking de módulos
    const moduleRanking = geminiService.getModuleUsageRanking();
    if (moduleRanking.length > 0) {
      console.log('\n🏆 Ranking de módulos más utilizados:');
      moduleRanking.slice(0, 5).forEach((module, index) => {
        console.log(`  ${index + 1}. ${module.moduleId}: ${module.usage} usos, ${(module.avgRelevance * 100).toFixed(1)}% relevancia`);
      });
    }

    // Mostrar métricas recientes
    const recentMetrics = geminiService.getRecentVectorMetrics(3);
    if (recentMetrics.length > 0) {
      console.log('\n📋 Últimas consultas procesadas:');
      recentMetrics.forEach((metric, index) => {
        console.log(`  ${index + 1}. "${metric.userQuery.substring(0, 50)}..."`);
        console.log(`     ⏱️ ${metric.processingTime}ms | 🎯 ${(metric.relevanceScore * 100).toFixed(1)}% | 📦 ${metric.usedModules.length} módulos`);
      });
    }

    console.log('\n✅ Pruebas de integración completadas exitosamente');

  } catch (error) {
    console.error('❌ Error en pruebas de integración:', error);
  }
}

// Ejecutar pruebas si el script se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testGeminiIntegration();
}

export { testGeminiIntegration };
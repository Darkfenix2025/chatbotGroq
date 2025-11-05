/**
 * Script de prueba para el sistema vectorial
 * Ejecutar con: npm run dev y luego abrir la consola del navegador
 */

import { IntelligentPromptService } from './services/intelligentPromptService';

// Esta función se puede llamar desde la consola del navegador
(window as any).testVectorialSystem = async function() {
  console.log('🚀 Iniciando prueba del sistema vectorial...');
  
  // Verificar que las API keys estén configuradas
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  console.log('🔑 Verificando API keys...');
  console.log(`  Gemini: ${geminiKey ? '✅ Configurada' : '❌ Faltante'}`);
  console.log(`  Hugging Face: ${hfKey ? '✅ Configurada' : '❌ Faltante'}`);
  
  if (!hfKey) {
    console.error('❌ Se requiere VITE_HUGGING_FACE_API_KEY para el sistema vectorial');
    console.log('💡 Configura tu API key de Hugging Face en el archivo .env');
    console.log('💡 Obtén tu clave gratuita en: https://huggingface.co/settings/tokens');
    return;
  }
  
  try {
    // Crear instancia del servicio inteligente
    const intelligentService = new IntelligentPromptService(hfKey);
    
    // Ejecutar pruebas
    await intelligentService.runTests();
    
    // Mostrar estadísticas
    const stats = intelligentService.getSystemStats();
    console.log('\n📊 Estadísticas del sistema:', stats);
    
    console.log('\n🎉 Prueba del sistema vectorial completada exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en la prueba del sistema vectorial:', error);
  }
};

// Función para probar una consulta específica
(window as any).testQuery = async function(query: string) {
  const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  if (!hfKey) {
    console.error('❌ Se requiere VITE_HUGGING_FACE_API_KEY');
    return;
  }
  
  try {
    const intelligentService = new IntelligentPromptService(hfKey);
    const result = await intelligentService.generateIntelligentPrompt(query);
    
    console.log('\n🧠 Resultado del prompt inteligente:');
    console.log(`📝 Consulta: "${query}"`);
    console.log(`📊 Módulos utilizados: ${result.usedModules.length}`);
    console.log(`🔢 Tokens totales: ${result.totalTokens}`);
    console.log(`⚡ Tiempo: ${result.processingTime}ms`);
    console.log(`🎯 Relevancia: ${result.relevanceScore.toFixed(2)}`);
    console.log('\n📋 Módulos seleccionados:');
    result.usedModules.forEach(moduleId => console.log(`  - ${moduleId}`));
    
    return result;
    
  } catch (error) {
    console.error('❌ Error probando consulta:', error);
  }
};

// Función para analizar una consulta sin generar el prompt completo
(window as any).analyzeQuery = async function(query: string) {
  const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  
  if (!hfKey) {
    console.error('❌ Se requiere VITE_HUGGING_FACE_API_KEY');
    return;
  }
  
  try {
    const intelligentService = new IntelligentPromptService(hfKey);
    const analysis = await intelligentService.analyzeQuery(query);
    
    console.log('\n🔍 Análisis de consulta:');
    console.log(`📝 Consulta: "${query}"`);
    console.log(`🎯 Intención: ${analysis.intent}`);
    console.log(`📊 Complejidad: ${(analysis.complexity * 100).toFixed(0)}%`);
    console.log(`⚖️ Área legal: ${analysis.legalArea.join(', ')}`);
    console.log(`🔴 Modo especial: ${analysis.requiresSpecialMode ? 'Sí' : 'No'}`);
    console.log(`🔑 Palabras clave: ${analysis.detectedKeywords.join(', ')}`);
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Error analizando consulta:', error);
  }
};

console.log('🧪 Funciones de prueba disponibles en la consola:');
console.log('  - testVectorialSystem() - Ejecuta pruebas completas del sistema');
console.log('  - testQuery("tu consulta") - Prueba una consulta específica');
console.log('  - analyzeQuery("tu consulta") - Analiza una consulta sin generar prompt');
console.log('\n💡 Ejemplo: testQuery("¿Cómo analizar un despido laboral?")');
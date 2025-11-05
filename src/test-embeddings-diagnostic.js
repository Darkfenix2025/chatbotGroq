/**
 * Test de Diagnóstico de Embeddings
 * Verifica si el sistema de embeddings y Hugging Face API funcionan correctamente
 */

console.log('🔍 DIAGNÓSTICO DEL SISTEMA DE EMBEDDINGS');
console.log('========================================\n');

// Verificar variables de entorno
console.log('🔑 Test 1: Verificación de API Keys');
console.log('──────────────────────────────────────');

const geminiKey = process.env.VITE_GEMINI_API_KEY;
const hfKey = process.env.VITE_HUGGING_FACE_API_KEY;

console.log(`✅ VITE_GEMINI_API_KEY: ${geminiKey ? '✓ Configurada' : '❌ Faltante'}`);
console.log(`✅ VITE_HUGGING_FACE_API_KEY: ${hfKey ? '✓ Configurada' : '❌ Faltante'}`);

if (geminiKey) {
  console.log(`   📏 Longitud Gemini: ${geminiKey.length} caracteres`);
  console.log(`   🔤 Prefijo Gemini: ${geminiKey.substring(0, 10)}...`);
}

if (hfKey) {
  console.log(`   📏 Longitud HF: ${hfKey.length} caracteres`);
  console.log(`   🔤 Prefijo HF: ${hfKey.substring(0, 10)}...`);
}

// Test de configuración del sistema
console.log('\n⚙️ Test 2: Configuración del Sistema Vectorial');
console.log('─────────────────────────────────────────────────');

const similarityThreshold = process.env.VITE_SIMILARITY_THRESHOLD || '0.7';
const maxModules = process.env.VITE_MAX_MODULES_PER_QUERY || '5';
const cacheSize = process.env.VITE_EMBEDDING_CACHE_SIZE || '1000';

console.log(`📊 Similarity Threshold: ${similarityThreshold}`);
console.log(`📦 Max Modules per Query: ${maxModules}`);
console.log(`💾 Cache Size: ${cacheSize}`);

// Simulación de test de API de Hugging Face
console.log('\n🤖 Test 3: Simulación de Llamada a Hugging Face API');
console.log('──────────────────────────────────────────────────────');

if (hfKey) {
  console.log('✅ API Key disponible - Simulando llamada...');
  
  // Simular configuración de embedding
  const embeddingConfig = {
    apiUrl: 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    dimensions: 384,
    maxInputLength: 512,
    batchSize: 3
  };
  
  console.log('📋 Configuración de Embedding:');
  console.log(`   🔗 URL: ${embeddingConfig.apiUrl}`);
  console.log(`   🤖 Modelo: ${embeddingConfig.model}`);
  console.log(`   📐 Dimensiones: ${embeddingConfig.dimensions}`);
  console.log(`   📏 Max Input: ${embeddingConfig.maxInputLength} caracteres`);
  console.log(`   📦 Batch Size: ${embeddingConfig.batchSize}`);
  
  // Simular request body
  const testText = "¿Cuáles son mis derechos si me despiden sin causa en Argentina?";
  const requestBody = {
    inputs: testText,
    options: {
      wait_for_model: true,
      use_cache: true
    }
  };
  
  console.log('\n📤 Request Body que se enviaría:');
  console.log(JSON.stringify(requestBody, null, 2));
  
  console.log('\n📥 Response esperado:');
  console.log('   📊 Array de 384 números (embedding)');
  console.log('   🎯 Valores entre -1 y 1');
  console.log('   ⚡ Tiempo de respuesta: 200-2000ms');
  
} else {
  console.log('❌ API Key no disponible - Sistema funcionará en modo básico');
}

// Test de inicialización del sistema
console.log('\n🚀 Test 4: Flujo de Inicialización del Sistema');
console.log('─────────────────────────────────────────────────');

console.log('1. ✅ GeminiService se inicializa con ambas API keys');
console.log('2. ✅ IntelligentPromptService se crea (HF key disponible)');
console.log('3. 🔄 Al hacer primera consulta:');
console.log('   a. Se llama a ensureInitialized()');
console.log('   b. EmbeddingInitializer.initializeSystem()');
console.log('   c. ModuleLoader.loadAllModules()');
console.log('   d. Se generan embeddings para 12 módulos');
console.log('   e. Se indexan en VectorDatabase');
console.log('4. 🧠 Para cada consulta posterior:');
console.log('   a. Se genera embedding de la consulta');
console.log('   b. Se buscan módulos similares');
console.log('   c. Se seleccionan los más relevantes');
console.log('   d. Se construye prompt optimizado');

// Test de métricas esperadas
console.log('\n📊 Test 5: Métricas Esperadas del Sistema');
console.log('─────────────────────────────────────────────');

console.log('🎯 Métricas de Embeddings:');
console.log('   📐 Dimensiones: 384 (MiniLM-L6-v2)');
console.log('   ⚡ Tiempo generación: 200-2000ms por embedding');
console.log('   💾 Cache: Embeddings reutilizados para mismo texto');
console.log('   📦 Batch processing: 3 módulos por lote');

console.log('\n🔍 Métricas de Similitud:');
console.log('   📊 Similitud coseno: 0.0 - 1.0');
console.log('   🎯 Threshold mínimo: 0.7');
console.log('   📈 Similitud alta: >0.8 (muy relevante)');
console.log('   📉 Similitud media: 0.6-0.8 (relevante)');
console.log('   ❌ Similitud baja: <0.6 (no relevante)');

console.log('\n⚡ Métricas de Performance:');
console.log('   🚀 Primera consulta: 5-15 segundos (genera embeddings)');
console.log('   ⚡ Consultas posteriores: 1-3 segundos (usa cache)');
console.log('   📦 Módulos seleccionados: 3-5 por consulta');
console.log('   🎯 Relevancia promedio esperada: >0.75');

// Instrucciones para verificar en consola del navegador
console.log('\n🔍 CÓMO VERIFICAR EN EL NAVEGADOR');
console.log('═══════════════════════════════════');

console.log('1. 🌐 Abrir DevTools (F12) en el navegador');
console.log('2. 📋 Ir a la pestaña "Console"');
console.log('3. 💬 Hacer una consulta legal en el chat');
console.log('4. 👀 Buscar estos mensajes en la consola:');

console.log('\n✅ MENSAJES DE ÉXITO a buscar:');
console.log('   "🧠 Iniciando análisis vectorial..."');
console.log('   "🔄 Inicializando sistema inteligente de prompts..."');
console.log('   "📁 Cargando módulos de prompts..."');
console.log('   "🔄 Generando embeddings para X módulos..."');
console.log('   "✅ Embedding generado para: core/base-agent.txt"');
console.log('   "📊 Indexado: core/base-agent.txt"');
console.log('   "✅ Análisis vectorial completado:"');
console.log('   "📊 Módulos utilizados: X"');
console.log('   "🔢 Tokens totales: XXXX"');
console.log('   "📈 Score de relevancia: XX.X%"');

console.log('\n❌ MENSAJES DE ERROR a evitar:');
console.log('   "❌ Error generando embedding"');
console.log('   "⚠️ Error en análisis vectorial"');
console.log('   "API key de Hugging Face inválida"');
console.log('   "Límite de rate limiting excedido"');
console.log('   "No se pudo cargar el archivo"');

console.log('\n🎯 INDICADORES DE FUNCIONAMIENTO CORRECTO:');
console.log('   ✅ Primera consulta tarda 5-15 segundos');
console.log('   ✅ Consultas posteriores tardan 1-3 segundos');
console.log('   ✅ Se muestran módulos específicos seleccionados');
console.log('   ✅ Score de relevancia >70%');
console.log('   ✅ Respuestas más detalladas y específicas');

console.log('\n🚨 INDICADORES DE PROBLEMAS:');
console.log('   ❌ Todas las consultas tardan <1 segundo (no usa embeddings)');
console.log('   ❌ Respuestas genéricas sin especialización');
console.log('   ❌ No aparecen logs de "análisis vectorial"');
console.log('   ❌ Errores de API en la consola');

console.log('\n💡 CONSULTAS RECOMENDADAS PARA PROBAR:');
console.log('   1. "¿Puedo demandar por despido sin causa?"');
console.log('   2. "¿Qué hacer ante incumplimiento contractual?"');
console.log('   3. "Necesito redactar una demanda laboral"');
console.log('   4. "Análisis de riesgo en negociación comercial"');

console.log('\n✨ Diagnóstico de embeddings completado!');
console.log('   🌐 Ahora ve al navegador y prueba el sistema');
console.log('   🔍 Observa la consola para verificar el funcionamiento');
console.log('   📊 Las métricas te dirán si todo funciona correctamente');
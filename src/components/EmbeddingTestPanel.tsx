/**
 * Panel de Test de Embeddings
 * Permite probar directamente la API de Hugging Face y el sistema de embeddings
 */

import React, { useState } from 'react';

interface EmbeddingTestResult {
  success: boolean;
  embedding?: number[];
  error?: string;
  duration: number;
  apiResponse?: any;
}

export const EmbeddingTestPanel: React.FC = () => {
  const [testText, setTestText] = useState("¿Cuáles son mis derechos si me despiden sin causa en Argentina?");
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<EmbeddingTestResult | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<{gemini: boolean, hf: boolean} | null>(null);

  // Verificar API keys al cargar
  React.useEffect(() => {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const hfKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
    
    setApiKeyStatus({
      gemini: !!geminiKey,
      hf: !!hfKey
    });

    console.log('🔑 API Keys Status:');
    console.log(`   GEMINI: ${geminiKey ? '✅ Configurada' : '❌ Faltante'}`);
    console.log(`   HUGGING_FACE: ${hfKey ? '✅ Configurada' : '❌ Faltante'}`);
  }, []);

  const testHuggingFaceAPI = async () => {
    setIsLoading(true);
    setTestResult(null);

    const startTime = Date.now();
    const hfApiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;

    if (!hfApiKey) {
      setTestResult({
        success: false,
        error: 'API Key de Hugging Face no configurada',
        duration: Date.now() - startTime
      });
      setIsLoading(false);
      return;
    }

    try {
      console.log('🧪 Iniciando test directo de Hugging Face API...');
      console.log(`📝 Texto de prueba: "${testText}"`);

      const apiUrl = 'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2';
      
      const requestBody = {
        inputs: testText,
        options: {
          wait_for_model: true,
          use_cache: true
        }
      };

      console.log('📤 Enviando request a:', apiUrl);
      console.log('📋 Request body:', requestBody);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`📥 Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', errorData);
        
        let errorMessage = `HTTP ${response.status}`;
        if (response.status === 401) {
          errorMessage = 'API key inválida o sin permisos';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit excedido - intenta en unos minutos';
        } else if (response.status === 503) {
          errorMessage = 'Modelo cargando - intenta en unos segundos';
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }

        setTestResult({
          success: false,
          error: errorMessage,
          duration: Date.now() - startTime,
          apiResponse: errorData
        });
        return;
      }

      const data = await response.json();
      console.log('✅ Response data type:', typeof data);
      console.log('📊 Response data:', data);

      // Verificar que sea un array de números
      const embedding = Array.isArray(data) ? data : data.embeddings?.[0] || data;
      
      if (!Array.isArray(embedding)) {
        throw new Error('Response no es un array de embeddings');
      }

      if (embedding.length !== 384) {
        console.warn(`⚠️ Embedding tiene ${embedding.length} dimensiones, esperado 384`);
      }

      console.log(`✅ Embedding generado exitosamente:`);
      console.log(`   📐 Dimensiones: ${embedding.length}`);
      console.log(`   📊 Rango: ${Math.min(...embedding).toFixed(3)} a ${Math.max(...embedding).toFixed(3)}`);
      console.log(`   🎯 Primeros 5 valores: [${embedding.slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]`);

      setTestResult({
        success: true,
        embedding,
        duration: Date.now() - startTime,
        apiResponse: data
      });

    } catch (error) {
      console.error('❌ Error en test de API:', error);
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        duration: Date.now() - startTime
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testVectorSystem = async () => {
    console.log('🧠 Iniciando test del sistema vectorial completo...');
    
    try {
      // Importar dinámicamente los servicios
      const { VectorService } = await import('../services/vectorService');
      const { VectorDatabase } = await import('../services/vectorDatabase');
      const { IntelligentPromptService } = await import('../services/intelligentPromptService');

      const hfApiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
      
      if (!hfApiKey) {
        console.error('❌ No se puede probar sistema vectorial sin API key de HF');
        return;
      }

      console.log('🔄 Creando servicios...');
      const intelligentService = new IntelligentPromptService(hfApiKey);

      console.log('📊 Estadísticas iniciales:');
      const initialStats = intelligentService.getSystemStats();
      console.log('   Sistema inicializado:', initialStats.isInitialized);
      console.log('   Módulos en DB:', initialStats.database.totalModules);
      console.log('   Cache size:', initialStats.cache.size);

      console.log('🧪 Probando análisis de consulta...');
      const analysis = await intelligentService.analyzeQuery(testText);
      console.log('✅ Análisis completado:', analysis);

      console.log('🔍 Probando búsqueda de módulos similares...');
      const similarModules = await intelligentService.findSimilarModules(testText, 5);
      console.log('✅ Módulos similares encontrados:', similarModules);

      console.log('🚀 Probando generación de prompt inteligente...');
      const promptResult = await intelligentService.generateIntelligentPrompt(testText, 2000);
      console.log('✅ Prompt inteligente generado:', promptResult);

      console.log('📊 Estadísticas finales:');
      const finalStats = intelligentService.getSystemStats();
      console.log('   Sistema inicializado:', finalStats.isInitialized);
      console.log('   Módulos en DB:', finalStats.database.totalModules);
      console.log('   Cache size:', finalStats.cache.size);

    } catch (error) {
      console.error('❌ Error en test del sistema vectorial:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🧪 Test de Sistema de Embeddings
        </h2>
        <p className="text-gray-600">
          Verifica el funcionamiento de la API de Hugging Face y el sistema vectorial
        </p>
      </div>

      {/* Estado de API Keys */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">🔑 Estado de API Keys</h3>
        {apiKeyStatus && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${apiKeyStatus.gemini ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>VITE_GEMINI_API_KEY: {apiKeyStatus.gemini ? 'Configurada' : 'Faltante'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${apiKeyStatus.hf ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>VITE_HUGGING_FACE_API_KEY: {apiKeyStatus.hf ? 'Configurada' : 'Faltante'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input de texto */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Texto para generar embedding:
        </label>
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Ingresa el texto para probar..."
        />
      </div>

      {/* Botones de test */}
      <div className="mb-6 space-x-4">
        <button
          onClick={testHuggingFaceAPI}
          disabled={isLoading || !apiKeyStatus?.hf}
          className={`px-6 py-3 rounded-lg font-medium ${
            isLoading || !apiKeyStatus?.hf
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
        >
          {isLoading ? '🔄 Probando API...' : '🧪 Test API Hugging Face'}
        </button>

        <button
          onClick={testVectorSystem}
          disabled={!apiKeyStatus?.hf}
          className={`px-6 py-3 rounded-lg font-medium ${
            !apiKeyStatus?.hf
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          } text-white transition-colors`}
        >
          🧠 Test Sistema Vectorial
        </button>
      </div>

      {/* Resultados */}
      {testResult && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-4">📊 Resultados del Test</h3>
          
          <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{testResult.success ? '✅' : '❌'}</span>
              <span className="font-medium">
                {testResult.success ? 'Test Exitoso' : 'Test Fallido'}
              </span>
              <span className="text-sm text-gray-500">({testResult.duration}ms)</span>
            </div>

            {testResult.error && (
              <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                <strong>Error:</strong> {testResult.error}
              </div>
            )}

            {testResult.embedding && (
              <div className="mt-4 space-y-2">
                <div className="text-sm">
                  <strong>Embedding generado:</strong>
                  <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono">
                    📐 Dimensiones: {testResult.embedding.length}<br/>
                    📊 Rango: {Math.min(...testResult.embedding).toFixed(3)} a {Math.max(...testResult.embedding).toFixed(3)}<br/>
                    🎯 Muestra: [{testResult.embedding.slice(0, 5).map(v => v.toFixed(3)).join(', ')}...]
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instrucciones */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">💡 Instrucciones</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>1. <strong>Abre la consola del navegador</strong> (F12 → Console) para ver logs detallados</p>
          <p>2. <strong>Test API Hugging Face:</strong> Prueba directamente la API de embeddings</p>
          <p>3. <strong>Test Sistema Vectorial:</strong> Prueba todo el sistema de selección de módulos</p>
          <p>4. <strong>Observa los logs:</strong> Verifica mensajes de éxito/error en la consola</p>
          <p>5. <strong>Tiempos esperados:</strong> Primera vez 5-15s, posteriores 1-3s</p>
        </div>
      </div>
    </div>
  );
};
/**
 * Componente de Test para Funcionalidades Vectoriales Avanzadas
 * Permite probar el sistema desde la interfaz web
 */

import React, { useState } from 'react';
import { VectorService } from '../services/vectorService';
import { VectorDatabase } from '../services/vectorDatabase';
import { PromptManager } from '../services/promptManager';
import { AdvancedVectorIntegration } from '../services/advancedVectorIntegration';

interface TestResult {
  testName: string;
  status: 'pending' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
  duration?: number;
}

export const AdvancedVectorTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  const updateTestResult = (testName: string, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map(test => 
      test.testName === testName ? { ...test, ...updates } : test
    ));
  };

  const runAdvancedVectorTests = async () => {
    setIsRunning(true);
    setTestResults([
      { testName: 'Inicialización de Servicios', status: 'pending' },
      { testName: 'Estado del Sistema', status: 'pending' },
      { testName: 'Métricas Avanzadas', status: 'pending' },
      { testName: 'Sistema de Aprendizaje', status: 'pending' },
      { testName: 'Optimización Avanzada', status: 'pending' },
      { testName: 'Diagnóstico Completo', status: 'pending' }
    ]);

    try {
      // Test 1: Inicialización de Servicios
      updateTestResult('Inicialización de Servicios', { status: 'running' });
      const startTime1 = Date.now();
      
      const HUGGING_FACE_API_KEY = import.meta.env.VITE_HUGGING_FACE_API_KEY || 'test-key';
      const vectorService = new VectorService(HUGGING_FACE_API_KEY);
      const vectorDatabase = new VectorDatabase();
      const promptManager = new PromptManager(vectorService, vectorDatabase);
      const advancedIntegration = new AdvancedVectorIntegration(vectorService, vectorDatabase, promptManager);

      updateTestResult('Inicialización de Servicios', { 
        status: 'success', 
        result: 'Servicios inicializados correctamente',
        duration: Date.now() - startTime1
      });

      // Test 2: Estado del Sistema
      updateTestResult('Estado del Sistema', { status: 'running' });
      const startTime2 = Date.now();
      
      const status = await advancedIntegration.getSystemStatus();
      setSystemStatus(status);
      
      updateTestResult('Estado del Sistema', { 
        status: 'success', 
        result: {
          isInitialized: status.isInitialized,
          systemHealth: status.systemHealth,
          optimizationLevel: status.optimizationLevel,
          recommendationsCount: status.recommendations.length
        },
        duration: Date.now() - startTime2
      });

      // Test 3: Métricas Avanzadas
      updateTestResult('Métricas Avanzadas', { status: 'running' });
      const startTime3 = Date.now();
      
      const metrics = await advancedIntegration.getAdvancedMetrics();
      
      updateTestResult('Métricas Avanzadas', { 
        status: 'success', 
        result: {
          totalModules: metrics.system.totalModules,
          clustersCount: metrics.system.clustersCount,
          cacheEfficiency: metrics.system.cacheEfficiency.toFixed(3),
          embeddingQuality: metrics.optimization.embeddingQuality.toFixed(3)
        },
        duration: Date.now() - startTime3
      });

      // Test 4: Sistema de Aprendizaje
      updateTestResult('Sistema de Aprendizaje', { status: 'running' });
      const startTime4 = Date.now();
      
      // Simular feedback de prueba
      const testQueryEmbedding = new Array(300).fill(0).map(() => Math.random() - 0.5);
      
      await advancedIntegration.recordComprehensiveFeedback(
        'test-query-advanced',
        'Consulta de prueba sobre derecho laboral argentino',
        testQueryEmbedding,
        ['core/base-agent.txt', 'analysis/strategic-360.txt'],
        4, // Rating
        0.85, // Response quality
        ['laboral', 'argentina', 'test']
      );

      const learningMetrics = promptManager.getLearningMetrics();
      
      updateTestResult('Sistema de Aprendizaje', { 
        status: 'success', 
        result: {
          totalFeedbacks: learningMetrics.totalFeedbacks,
          averageImprovement: learningMetrics.averageImprovement.toFixed(3),
          clustersCount: learningMetrics.clustersCount,
          moduleUpdates: learningMetrics.moduleEffectivenessUpdates
        },
        duration: Date.now() - startTime4
      });

      // Test 5: Optimización Avanzada
      updateTestResult('Optimización Avanzada', { status: 'running' });
      const startTime5 = Date.now();
      
      const optimizationMetrics = promptManager.getOptimizationMetrics();
      
      // Registrar datos adicionales para fine-tuning
      promptManager.recordFineTuningData(
        'Consulta sobre despido sin causa en Argentina',
        ['laboral/despido.txt', 'core/base-agent.txt'],
        5, // Excelente feedback
        ['laboral', 'despido', 'argentina']
      );
      
      updateTestResult('Optimización Avanzada', { 
        status: 'success', 
        result: {
          embeddingQuality: optimizationMetrics.embeddingQuality.toFixed(3),
          searchAccuracy: optimizationMetrics.searchAccuracy.toFixed(3),
          processingSpeed: optimizationMetrics.processingSpeed.toFixed(0),
          memoryEfficiency: optimizationMetrics.memoryEfficiency.toFixed(3),
          userSatisfaction: optimizationMetrics.userSatisfaction.toFixed(3)
        },
        duration: Date.now() - startTime5
      });

      // Test 6: Diagnóstico Completo
      updateTestResult('Diagnóstico Completo', { status: 'running' });
      const startTime6 = Date.now();
      
      const diagnostic = await advancedIntegration.runSystemDiagnostic();
      
      updateTestResult('Diagnóstico Completo', { 
        status: 'success', 
        result: {
          systemHealth: diagnostic.status.systemHealth,
          configValid: diagnostic.configValidation.isValid,
          recommendationsCount: diagnostic.recommendations.length,
          criticalIssues: diagnostic.performanceReport.criticalIssues.length,
          topRecommendations: diagnostic.recommendations.slice(0, 3)
        },
        duration: Date.now() - startTime6
      });

    } catch (error) {
      console.error('Error en tests:', error);
      // Marcar el test actual como error
      setTestResults(prev => prev.map(test => 
        test.status === 'running' ? { 
          ...test, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Error desconocido' 
        } : test
      ));
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'running': return 'text-blue-500';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🧪 Test de Funcionalidades Vectoriales Avanzadas
        </h2>
        <p className="text-gray-600">
          Prueba completa del sistema de aprendizaje semántico, optimización avanzada e interfaz de administración
        </p>
      </div>

      {/* Botón de ejecución */}
      <div className="mb-6">
        <button
          onClick={runAdvancedVectorTests}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg font-medium ${
            isRunning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white transition-colors`}
        >
          {isRunning ? '🔄 Ejecutando Tests...' : '🚀 Ejecutar Tests Avanzados'}
        </button>
      </div>

      {/* Estado del Sistema */}
      {systemStatus && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">📊 Estado del Sistema</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Inicializado:</span>
              <span className={`ml-2 ${systemStatus.isInitialized ? 'text-green-600' : 'text-red-600'}`}>
                {systemStatus.isInitialized ? 'Sí' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Salud:</span>
              <span className="ml-2 font-medium">{systemStatus.systemHealth}</span>
            </div>
            <div>
              <span className="text-blue-700">Optimización:</span>
              <span className="ml-2 font-medium">{systemStatus.optimizationLevel}</span>
            </div>
            <div>
              <span className="text-blue-700">Recomendaciones:</span>
              <span className="ml-2 font-medium">{systemStatus.recommendations.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Resultados de Tests */}
      {testResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Resultados de Tests</h3>
          
          {testResults.map((test, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getStatusIcon(test.status)}</span>
                  <span className="font-medium text-gray-900">{test.testName}</span>
                  <span className={`text-sm ${getStatusColor(test.status)}`}>
                    {test.status === 'running' && '(ejecutando...)'}
                  </span>
                </div>
                {test.duration && (
                  <span className="text-sm text-gray-500">{test.duration}ms</span>
                )}
              </div>

              {test.error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  <strong>Error:</strong> {test.error}
                </div>
              )}

              {test.result && (
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {typeof test.result === 'string' 
                      ? test.result 
                      : JSON.stringify(test.result, null, 2)
                    }
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resumen */}
      {testResults.length > 0 && !isRunning && (
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">📋 Resumen de Tests</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-green-700">Total:</span>
              <span className="ml-2 font-medium">{testResults.length}</span>
            </div>
            <div>
              <span className="text-green-700">Exitosos:</span>
              <span className="ml-2 font-medium text-green-600">
                {testResults.filter(t => t.status === 'success').length}
              </span>
            </div>
            <div>
              <span className="text-green-700">Errores:</span>
              <span className="ml-2 font-medium text-red-600">
                {testResults.filter(t => t.status === 'error').length}
              </span>
            </div>
            <div>
              <span className="text-green-700">Tiempo Total:</span>
              <span className="ml-2 font-medium">
                {testResults.reduce((sum, t) => sum + (t.duration || 0), 0)}ms
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ Información del Test</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Sistema de Aprendizaje Semántico:</strong> Mejora automática basada en feedback</p>
          <p>• <strong>Interfaz de Administración:</strong> Visualización de similitudes y métricas</p>
          <p>• <strong>Optimizaciones Avanzadas:</strong> Embeddings especializados y búsqueda híbrida</p>
          <p>• <strong>Integración Completa:</strong> Orquestación de todas las funcionalidades</p>
        </div>
      </div>
    </div>
  );
};
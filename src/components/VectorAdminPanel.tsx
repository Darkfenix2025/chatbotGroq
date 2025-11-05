/**
 * Panel de Administración Vectorial
 * Interfaz para visualizar similitudes, editar parámetros y monitorear métricas
 */

import React, { useState, useEffect } from 'react';
import { vectorConfigService } from '../services/vectorConfigService';
import { VectorDatabase } from '../services/vectorDatabase';
import { PromptManager } from '../services/promptManager';
import { VectorService } from '../services/vectorService';

interface ModuleSimilarity {
  moduleId1: string;
  moduleId2: string;
  similarity: number;
  module1Name: string;
  module2Name: string;
}

interface SemanticMetrics {
  totalQueries: number;
  averageAccuracy: number;
  averageProcessingTime: number;
  cacheHitRate: number;
  moduleUsage: Record<string, number>;
  clusterCount: number;
}

interface VectorAdminPanelProps {
  vectorDatabase: VectorDatabase;
  promptManager: PromptManager;
  vectorService: VectorService;
}

export const VectorAdminPanel: React.FC<VectorAdminPanelProps> = ({
  vectorDatabase,
  promptManager,
  vectorService
}) => {
  const [activeTab, setActiveTab] = useState<'similarities' | 'parameters' | 'metrics' | 'learning'>('similarities');
  const [moduleSimilarities, setModuleSimilarities] = useState<ModuleSimilarity[]>([]);
  const [semanticMetrics, setSemanticMetrics] = useState<SemanticMetrics | null>(null);
  const [config, setConfig] = useState(vectorConfigService.getCurrentConfig());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        loadModuleSimilarities(),
        loadSemanticMetrics()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const loadModuleSimilarities = async () => {
    const modules = vectorDatabase.getAllModules();
    const similarities: ModuleSimilarity[] = [];

    // Calcular similitudes entre todos los pares de módulos
    for (let i = 0; i < modules.length; i++) {
      for (let j = i + 1; j < modules.length; j++) {
        const module1 = modules[i];
        const module2 = modules[j];

        if (module1.embedding && module2.embedding) {
          const similarity = vectorService.calculateCosineSimilarity(
            module1.embedding,
            module2.embedding
          );

          similarities.push({
            moduleId1: module1.id,
            moduleId2: module2.id,
            similarity,
            module1Name: module1.name,
            module2Name: module2.name
          });
        }
      }
    }

    // Ordenar por similitud descendente
    similarities.sort((a, b) => b.similarity - a.similarity);
    setModuleSimilarities(similarities);
  };

  const loadSemanticMetrics = async () => {
    const configMetrics = vectorConfigService.getMetrics();
    const learningMetrics = promptManager.getLearningMetrics();
    const moduleEffectiveness = promptManager.getModuleEffectiveness();
    const clusters = promptManager.getQueryClusters();

    // Calcular uso de módulos
    const moduleUsage: Record<string, number> = {};
    moduleEffectiveness.forEach(effectiveness => {
      moduleUsage[effectiveness.moduleId] = effectiveness.usageCount;
    });

    const metrics: SemanticMetrics = {
      totalQueries: configMetrics.queriesProcessed,
      averageAccuracy: configMetrics.averageAccuracy,
      averageProcessingTime: configMetrics.averageProcessingTime,
      cacheHitRate: configMetrics.cacheHitRate,
      moduleUsage,
      clusterCount: clusters.length
    };

    setSemanticMetrics(metrics);
  };

  const updateConfig = (updates: any) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    vectorConfigService.updateConfig(updates);
  };

  const resetMetrics = () => {
    vectorConfigService.resetMetrics();
    loadSemanticMetrics();
  };

  const exportData = () => {
    const configData = vectorConfigService.exportConfiguration();
    const learningData = promptManager.exportLearningData();
    
    const exportData = {
      configuration: JSON.parse(configData),
      learning: JSON.parse(learningData),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vector-admin-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.configuration) {
          vectorConfigService.importConfiguration(JSON.stringify(data.configuration));
        }
        
        if (data.learning) {
          await promptManager.importLearningData(JSON.stringify(data.learning));
        }

        setConfig(vectorConfigService.getCurrentConfig());
        await loadData();
        alert('Datos importados exitosamente');
      } catch (err) {
        alert('Error importando datos: ' + (err instanceof Error ? err.message : 'Error desconocido'));
      }
    };
    reader.readAsText(file);
  };

  const renderSimilaritiesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Similitudes entre Módulos</h3>
        <button
          onClick={loadModuleSimilarities}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          Actualizar
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Módulo 1
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Módulo 2
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Similitud
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visualización
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {moduleSimilarities.slice(0, 50).map((similarity, index) => (
                <tr key={index} className={similarity.similarity > 0.8 ? 'bg-red-50' : similarity.similarity > 0.6 ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {similarity.module1Name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {similarity.module2Name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {similarity.similarity.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          similarity.similarity > 0.8 ? 'bg-red-500' :
                          similarity.similarity > 0.6 ? 'bg-yellow-500' :
                          similarity.similarity > 0.4 ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${similarity.similarity * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Interpretación de Colores</h4>
        <div className="space-y-1 text-sm text-blue-800">
          <div><span className="inline-block w-4 h-4 bg-red-500 rounded mr-2"></span>Similitud muy alta (&gt; 0.8) - Posible redundancia</div>
          <div><span className="inline-block w-4 h-4 bg-yellow-500 rounded mr-2"></span>Similitud alta (&gt; 0.6) - Revisar solapamiento</div>
          <div><span className="inline-block w-4 h-4 bg-blue-500 rounded mr-2"></span>Similitud media (&gt; 0.4) - Relacionados</div>
          <div><span className="inline-block w-4 h-4 bg-gray-400 rounded mr-2"></span>Similitud baja (&lt; 0.4) - Independientes</div>
        </div>
      </div>
    </div>
  );

  const renderParametersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Parámetros Vectoriales</h3>
        <div className="space-x-2">
          <button
            onClick={() => vectorConfigService.applyAutoOptimization()}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Auto-Optimizar
          </button>
          <button
            onClick={() => setConfig(vectorConfigService.getCurrentConfig())}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Recargar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parámetros de Similitud */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-900 mb-4">Similitud</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Similitud Mínima
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.similarity.minSimilarity}
                onChange={(e) => updateConfig({
                  similarity: { ...config.similarity, minSimilarity: parseFloat(e.target.value) }
                })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{config.similarity.minSimilarity.toFixed(2)}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alta Confianza
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.similarity.highConfidence}
                onChange={(e) => updateConfig({
                  similarity: { ...config.similarity, highConfidence: parseFloat(e.target.value) }
                })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{config.similarity.highConfidence.toFixed(2)}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Activación Core
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.similarity.coreActivation}
                onChange={(e) => updateConfig({
                  similarity: { ...config.similarity, coreActivation: parseFloat(e.target.value) }
                })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{config.similarity.coreActivation.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Parámetros de Módulos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-900 mb-4">Módulos</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo por Consulta
              </label>
              <input
                type="number"
                min="1"
                max="15"
                value={config.modules.maxModulesPerQuery}
                onChange={(e) => updateConfig({
                  modules: { ...config.modules, maxModulesPerQuery: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo por Categoría
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.modules.maxModulesPerCategory}
                onChange={(e) => updateConfig({
                  modules: { ...config.modules, maxModulesPerCategory: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mínimo Core
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={config.modules.minCoreModules}
                onChange={(e) => updateConfig({
                  modules: { ...config.modules, minCoreModules: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Parámetros de Tokens */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-900 mb-4">Tokens</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo por Consulta
              </label>
              <input
                type="number"
                min="1000"
                max="8000"
                step="100"
                value={config.tokens.maxTokensPerQuery}
                onChange={(e) => updateConfig({
                  tokens: { ...config.tokens, maxTokensPerQuery: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Máximo por Módulo
              </label>
              <input
                type="number"
                min="100"
                max="2000"
                step="50"
                value={config.tokens.maxTokensPerModule}
                onChange={(e) => updateConfig({
                  tokens: { ...config.tokens, maxTokensPerModule: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reserva para Respuesta
              </label>
              <input
                type="number"
                min="500"
                max="2000"
                step="100"
                value={config.tokens.responseTokenReserve}
                onChange={(e) => updateConfig({
                  tokens: { ...config.tokens, responseTokenReserve: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Pesos de Ranking */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-900 mb-4">Pesos de Ranking</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Similitud Semántica
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.rankingWeights.semanticSimilarity}
                onChange={(e) => updateConfig({
                  rankingWeights: { ...config.rankingWeights, semanticSimilarity: parseFloat(e.target.value) }
                })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{config.rankingWeights.semanticSimilarity.toFixed(2)}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad de Módulo
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.rankingWeights.modulePriority}
                onChange={(e) => updateConfig({
                  rankingWeights: { ...config.rankingWeights, modulePriority: parseFloat(e.target.value) }
                })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{config.rankingWeights.modulePriority.toFixed(2)}</span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso de Categoría
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.rankingWeights.categoryWeight}
                onChange={(e) => updateConfig({
                  rankingWeights: { ...config.rankingWeights, categoryWeight: parseFloat(e.target.value) }
                })}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{config.rankingWeights.categoryWeight.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Recomendaciones</h4>
        <ul className="space-y-1 text-sm text-yellow-800">
          {vectorConfigService.getConfigurationRecommendations().map((recommendation, index) => (
            <li key={index}>• {recommendation}</li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderMetricsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Métricas de Precisión Semántica</h3>
        <div className="space-x-2">
          <button
            onClick={loadSemanticMetrics}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            disabled={loading}
          >
            Actualizar
          </button>
          <button
            onClick={resetMetrics}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Reiniciar
          </button>
        </div>
      </div>

      {semanticMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{semanticMetrics.totalQueries}</div>
            <div className="text-sm text-gray-500">Consultas Procesadas</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {(semanticMetrics.averageAccuracy * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Precisión Promedio</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-orange-600">
              {semanticMetrics.averageProcessingTime.toFixed(0)}ms
            </div>
            <div className="text-sm text-gray-500">Tiempo Promedio</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">
              {(semanticMetrics.cacheHitRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Tasa de Cache</div>
          </div>
        </div>
      )}

      {/* Uso de Módulos */}
      {semanticMetrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-900 mb-4">Uso de Módulos</h4>
          <div className="space-y-3">
            {Object.entries(semanticMetrics.moduleUsage)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([moduleId, usage]) => (
                <div key={moduleId} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 truncate flex-1 mr-4">
                    {moduleId}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (usage / Math.max(...Object.values(semanticMetrics.moduleUsage))) * 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8 text-right">{usage}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Clusters */}
      {semanticMetrics && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-900 mb-4">Clusters de Consultas</h4>
          <div className="text-3xl font-bold text-indigo-600 mb-2">
            {semanticMetrics.clusterCount}
          </div>
          <div className="text-sm text-gray-500">
            Patrones de consulta identificados
          </div>
        </div>
      )}
    </div>
  );

  const renderLearningTab = () => {
    const learningMetrics = promptManager.getLearningMetrics();
    const moduleEffectiveness = promptManager.getModuleEffectiveness();
    const clusters = promptManager.getQueryClusters();

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Sistema de Aprendizaje</h3>
          <div className="space-x-2">
            <button
              onClick={() => promptManager.setLearningEnabled(true)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Activar
            </button>
            <button
              onClick={() => promptManager.setLearningEnabled(false)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Desactivar
            </button>
          </div>
        </div>

        {/* Métricas de Aprendizaje */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">{learningMetrics.totalFeedbacks}</div>
            <div className="text-sm text-gray-500">Feedbacks Recibidos</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {(learningMetrics.averageImprovement * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Mejora Promedio</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-600">{learningMetrics.clustersCount}</div>
            <div className="text-sm text-gray-500">Clusters Activos</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-orange-600">{learningMetrics.moduleEffectivenessUpdates}</div>
            <div className="text-sm text-gray-500">Actualizaciones</div>
          </div>
        </div>

        {/* Efectividad de Módulos */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-900 mb-4">Efectividad de Módulos</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Módulo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Éxito
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {moduleEffectiveness.slice(0, 10).map((effectiveness) => (
                  <tr key={effectiveness.moduleId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {effectiveness.moduleId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {effectiveness.usageCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {effectiveness.averageRating.toFixed(1)}/5
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(effectiveness.successRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clusters de Consultas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-medium text-gray-900 mb-4">Clusters de Consultas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clusters.slice(0, 6).map((cluster) => (
              <div key={cluster.id} className="border border-gray-200 rounded-lg p-4">
                <div className="font-medium text-gray-900 mb-2">
                  Cluster {cluster.id.slice(-8)}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Tamaño: {cluster.size} consultas</div>
                  <div>Complejidad: {(cluster.averageComplexity * 100).toFixed(0)}%</div>
                  <div>Módulos: {cluster.commonModules.length}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Panel de Administración Vectorial</h2>
        <p className="text-gray-600">
          Gestiona parámetros vectoriales, visualiza similitudes y monitorea el rendimiento semántico
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Controles de Exportación/Importación */}
      <div className="mb-6 flex justify-end space-x-2">
        <button
          onClick={exportData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Exportar Datos
        </button>
        <label className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 cursor-pointer">
          Importar Datos
          <input
            type="file"
            accept=".json"
            onChange={importData}
            className="hidden"
          />
        </label>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'similarities', label: 'Similitudes' },
            { id: 'parameters', label: 'Parámetros' },
            { id: 'metrics', label: 'Métricas' },
            { id: 'learning', label: 'Aprendizaje' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'similarities' && renderSimilaritiesTab()}
      {activeTab === 'parameters' && renderParametersTab()}
      {activeTab === 'metrics' && renderMetricsTab()}
      {activeTab === 'learning' && renderLearningTab()}
    </div>
  );
};
/**
 * Panel de Configuración Vectorial
 * Componente de ejemplo para mostrar cómo usar el sistema de configuración vectorial
 */

import React, { useState, useEffect } from 'react';
import { VectorConfigUI, ConfigurationFormData, useVectorConfig } from '../services/vectorConfigUI';
import { VECTOR_CONFIG_PRESETS } from '../config/vectorConfig';

interface VectorConfigPanelProps {
  onConfigChange?: (config: any) => void;
}

export const VectorConfigPanel: React.FC<VectorConfigPanelProps> = ({ onConfigChange }) => {
  const {
    getCurrentState,
    updateConfig,
    loadPreset,
    createProfile,
    validateFormData,
    getFieldRanges,
    getFieldDescriptions,
    calculateStats
  } = useVectorConfig();

  const [uiState, setUIState] = useState(getCurrentState());
  const [formData, setFormData] = useState<ConfigurationFormData>(
    VectorConfigUI.configToFormData(uiState.currentConfig)
  );
  const [activeTab, setActiveTab] = useState<'similarity' | 'tokens' | 'modules' | 'weights' | 'performance'>('similarity');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fieldRanges = getFieldRanges();
  const fieldDescriptions = getFieldDescriptions();

  useEffect(() => {
    const newState = getCurrentState();
    setUIState(newState);
    setFormData(VectorConfigUI.configToFormData(newState.currentConfig));
  }, []);

  const handleFieldChange = (field: keyof ConfigurationFormData, value: number) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Validar y aplicar cambios si son válidos
    const validation = validateFormData(newFormData);
    if (validation.isValid) {
      updateConfig(newFormData);
      onConfigChange?.(VectorConfigUI.formDataToConfig(newFormData));
    }
  };

  const handlePresetLoad = (presetName: string) => {
    loadPreset(presetName as keyof typeof VECTOR_CONFIG_PRESETS);
    const newState = getCurrentState();
    setUIState(newState);
    setFormData(VectorConfigUI.configToFormData(newState.currentConfig));
  };

  const renderSlider = (
    field: keyof ConfigurationFormData,
    label: string,
    value: number
  ) => {
    const range = fieldRanges[field];
    const description = fieldDescriptions[field];

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">
            {label}
          </label>
          <span className="text-sm text-gray-500">
            {value.toFixed(range.step < 1 ? 2 : 0)}
          </span>
        </div>
        <input
          type="range"
          min={range.min}
          max={range.max}
          step={range.step}
          value={value}
          onChange={(e) => handleFieldChange(field, parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{range.min}</span>
          <span title={description} className="cursor-help">
            Recomendado: {range.recommended}
          </span>
          <span>{range.max}</span>
        </div>
      </div>
    );
  };

  const renderSimilarityTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Thresholds de Similitud</h3>
      {renderSlider('minSimilarity', 'Similitud Mínima', formData.minSimilarity)}
      {renderSlider('highConfidence', 'Alta Confianza', formData.highConfidence)}
      {renderSlider('coreActivation', 'Activación Core', formData.coreActivation)}
      {renderSlider('specializedModules', 'Módulos Especializados', formData.specializedModules)}
    </div>
  );

  const renderTokensTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Límites de Tokens</h3>
      {renderSlider('maxTokensPerQuery', 'Tokens por Consulta', formData.maxTokensPerQuery)}
      {renderSlider('basePromptTokens', 'Tokens Prompt Base', formData.basePromptTokens)}
      {renderSlider('maxTokensPerModule', 'Tokens por Módulo', formData.maxTokensPerModule)}
      {renderSlider('responseTokenReserve', 'Reserva de Respuesta', formData.responseTokenReserve)}
    </div>
  );

  const renderModulesTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Límites de Módulos</h3>
      {renderSlider('maxModulesPerQuery', 'Módulos por Consulta', formData.maxModulesPerQuery)}
      {renderSlider('minCoreModules', 'Módulos Core Mínimos', formData.minCoreModules)}
      {renderSlider('maxModulesPerCategory', 'Módulos por Categoría', formData.maxModulesPerCategory)}
      {renderSlider('maxSpecializedModules', 'Módulos Especializados', formData.maxSpecializedModules)}
    </div>
  );

  const renderWeightsTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Pesos y Prioridades</h3>
      
      <div className="mb-6">
        <h4 className="text-md font-medium mb-3">Pesos por Categoría</h4>
        {renderSlider('coreWeight', 'Peso Core', formData.coreWeight)}
        {renderSlider('analysisWeight', 'Peso Análisis', formData.analysisWeight)}
        {renderSlider('tacticsWeight', 'Peso Tácticas', formData.tacticsWeight)}
        {renderSlider('modesWeight', 'Peso Modos', formData.modesWeight)}
      </div>

      <div>
        <h4 className="text-md font-medium mb-3">Pesos de Ranking</h4>
        {renderSlider('semanticSimilarityWeight', 'Similitud Semántica', formData.semanticSimilarityWeight)}
        {renderSlider('modulePriorityWeight', 'Prioridad Módulo', formData.modulePriorityWeight)}
        {renderSlider('categoryWeightFactor', 'Factor Categoría', formData.categoryWeightFactor)}
        {renderSlider('keywordMatchWeight', 'Coincidencia Keywords', formData.keywordMatchWeight)}
        {renderSlider('recentUsageWeight', 'Uso Reciente', formData.recentUsageWeight)}
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Configuración de Rendimiento</h3>
      {renderSlider('embeddingCacheSize', 'Cache Embeddings', formData.embeddingCacheSize)}
      {renderSlider('queryCacheSize', 'Cache Consultas', formData.queryCacheSize)}
      {renderSlider('cacheTTLMinutes', 'TTL Cache (min)', formData.cacheTTLMinutes)}
      {renderSlider('embeddingTimeout', 'Timeout Embedding (ms)', formData.embeddingTimeout)}
      {renderSlider('batchSize', 'Tamaño Lote', formData.batchSize)}
    </div>
  );

  const stats = calculateStats(VectorConfigUI.formDataToConfig(formData));

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Configuración del Sistema Vectorial
        </h2>
        <p className="text-gray-600">
          Ajusta los parámetros del sistema de selección semántica de módulos
        </p>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Presets Rápidos</h3>
        <div className="flex flex-wrap gap-2">
          {VectorConfigUI.getPresetOptions().map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetLoad(preset.value)}
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Estadísticas de Configuración</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Presupuesto Tokens:</span>
            <div className="font-semibold">{stats.tokenBudget}</div>
          </div>
          <div>
            <span className="text-gray-600">Máx. Módulos:</span>
            <div className="font-semibold">{stats.maxPossibleModules}</div>
          </div>
          <div>
            <span className="text-gray-600">Eficiencia Cache:</span>
            <div className="font-semibold">{(stats.cacheEfficiency * 100).toFixed(1)}%</div>
          </div>
          <div>
            <span className="text-gray-600">Suma Pesos:</span>
            <div className={`font-semibold ${Math.abs(stats.rankingWeightSum - 1) > 0.1 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.rankingWeightSum.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Validación */}
      {!uiState.validation.isValid && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="text-red-800 font-semibold mb-2">Errores de Configuración:</h4>
          <ul className="text-red-700 text-sm space-y-1">
            {uiState.validation.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recomendaciones */}
      {uiState.recommendations.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="text-yellow-800 font-semibold mb-2">Recomendaciones:</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            {uiState.recommendations.map((rec, index) => (
              <li key={index}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'similarity', label: 'Similitud' },
              { id: 'tokens', label: 'Tokens' },
              { id: 'modules', label: 'Módulos' },
              { id: 'weights', label: 'Pesos' },
              { id: 'performance', label: 'Rendimiento' }
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
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'similarity' && renderSimilarityTab()}
        {activeTab === 'tokens' && renderTokensTab()}
        {activeTab === 'modules' && renderModulesTab()}
        {activeTab === 'weights' && renderWeightsTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-between items-center">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {showAdvanced ? 'Ocultar' : 'Mostrar'} opciones avanzadas
        </button>
        
        <div className="space-x-3">
          <button
            onClick={() => {
              const config = VectorConfigUI.formDataToConfig(formData);
              console.log('Configuración exportada:', JSON.stringify(config, null, 2));
            }}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Exportar
          </button>
          <button
            onClick={() => {
              // Reset to default
              const defaultFormData = VectorConfigUI.configToFormData(
                VectorConfigUI.generateTestConfig()
              );
              setFormData(defaultFormData);
              updateConfig(defaultFormData);
            }}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Restaurar Defecto
          </button>
        </div>
      </div>
    </div>
  );
};
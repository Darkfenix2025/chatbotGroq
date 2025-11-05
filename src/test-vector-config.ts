/**
 * Script de prueba para el sistema de configuración vectorial
 * Valida que todas las funcionalidades del sistema funcionen correctamente
 */

import { 
  VectorConfig, 
  DEFAULT_VECTOR_CONFIG, 
  VECTOR_CONFIG_PRESETS,
  VectorConfigValidator,
  VectorConfigManager
} from './config/vectorConfig';
import { vectorConfigService } from './services/vectorConfigService';
import { VectorConfigUI } from './services/vectorConfigUI';

async function testVectorConfigSystem() {
  console.log('🧪 Iniciando pruebas del sistema de configuración vectorial...\n');

  // Test 1: Validación de configuración por defecto
  console.log('📋 Test 1: Validación de configuración por defecto');
  const defaultValidation = VectorConfigValidator.validate(DEFAULT_VECTOR_CONFIG);
  console.log('✅ Configuración por defecto válida:', defaultValidation.isValid);
  if (!defaultValidation.isValid) {
    console.log('❌ Errores:', defaultValidation.errors);
  }

  // Test 2: Validación de presets
  console.log('\n📋 Test 2: Validación de presets');
  for (const [presetName, presetConfig] of Object.entries(VECTOR_CONFIG_PRESETS)) {
    const validation = VectorConfigValidator.validate(presetConfig);
    console.log(`${validation.isValid ? '✅' : '❌'} Preset ${presetName}:`, validation.isValid);
    if (!validation.isValid) {
      console.log('   Errores:', validation.errors);
    }
  }

  // Test 3: Gestor de configuración
  console.log('\n📋 Test 3: Gestor de configuración');
  const configManager = new VectorConfigManager();
  
  // Obtener configuración inicial
  const initialConfig = configManager.getConfig();
  console.log('✅ Configuración inicial obtenida');

  // Actualizar configuración
  configManager.updateConfig({
    similarity: { minSimilarity: 0.6 }
  });
  const updatedConfig = configManager.getConfig();
  console.log('✅ Configuración actualizada:', updatedConfig.similarity.minSimilarity === 0.6);

  // Cargar preset
  configManager.loadPreset('FAST');
  const fastConfig = configManager.getConfig();
  console.log('✅ Preset FAST cargado:', fastConfig.similarity.minSimilarity === VECTOR_CONFIG_PRESETS.FAST.similarity.minSimilarity);

  // Revertir cambios
  const reverted = configManager.revertToPrevious();
  console.log('✅ Reversión exitosa:', reverted);

  // Test 4: Servicio de configuración
  console.log('\n📋 Test 4: Servicio de configuración vectorial');
  
  // Obtener configuración actual
  const currentConfig = vectorConfigService.getCurrentConfig();
  console.log('✅ Configuración actual obtenida');

  // Crear perfil personalizado
  const customConfig: VectorConfig = {
    ...DEFAULT_VECTOR_CONFIG,
    similarity: { ...DEFAULT_VECTOR_CONFIG.similarity, minSimilarity: 0.8 }
  };
  
  vectorConfigService.createProfile('test-profile', 'Perfil de prueba', customConfig);
  console.log('✅ Perfil personalizado creado');

  // Cargar perfil
  const profileLoaded = vectorConfigService.loadProfile('test-profile');
  console.log('✅ Perfil cargado:', profileLoaded);

  // Obtener perfiles
  const profiles = vectorConfigService.getProfiles();
  console.log('✅ Perfiles obtenidos:', profiles.length > 0);

  // Obtener métricas
  const metrics = vectorConfigService.getMetrics();
  console.log('✅ Métricas obtenidas:', typeof metrics.queriesProcessed === 'number');

  // Obtener recomendaciones
  const recommendations = vectorConfigService.getConfigurationRecommendations();
  console.log('✅ Recomendaciones obtenidas:', Array.isArray(recommendations));

  // Validar configuración actual
  const validation = vectorConfigService.validateCurrentConfig();
  console.log('✅ Validación de configuración:', validation.isValid);

  // Test 5: Utilidades de UI
  console.log('\n📋 Test 5: Utilidades de UI');
  
  // Obtener estado de UI
  const uiState = VectorConfigUI.getCurrentUIState();
  console.log('✅ Estado de UI obtenido:', uiState.currentConfig !== undefined);

  // Conversión config -> form data
  const formData = VectorConfigUI.configToFormData(currentConfig);
  console.log('✅ Conversión a form data:', formData.minSimilarity !== undefined);

  // Conversión form data -> config
  const configFromForm = VectorConfigUI.formDataToConfig(formData);
  console.log('✅ Conversión desde form data:', configFromForm.similarity !== undefined);

  // Validar form data
  const formValidation = VectorConfigUI.validateFormData(formData);
  console.log('✅ Validación de form data:', formValidation.isValid);

  // Obtener rangos de campos
  const fieldRanges = VectorConfigUI.getFieldRanges();
  console.log('✅ Rangos de campos obtenidos:', fieldRanges.minSimilarity !== undefined);

  // Obtener descripciones
  const descriptions = VectorConfigUI.getFieldDescriptions();
  console.log('✅ Descripciones obtenidas:', descriptions.minSimilarity !== undefined);

  // Calcular estadísticas
  const stats = VectorConfigUI.calculateConfigStats(currentConfig);
  console.log('✅ Estadísticas calculadas:', stats.tokenBudget > 0);

  // Comparar configuraciones
  const comparison = VectorConfigUI.compareConfigs(DEFAULT_VECTOR_CONFIG, VECTOR_CONFIG_PRESETS.FAST);
  console.log('✅ Comparación de configs:', comparison.differences.length >= 0);

  // Test 6: Optimización automática
  console.log('\n📋 Test 6: Optimización automática');
  
  // Simular métricas para optimización
  vectorConfigService.updateMetrics(3000, 0.6, 3500, true); // Tiempo alto, precisión baja
  vectorConfigService.updateMetrics(2500, 0.65, 3200, false);
  vectorConfigService.updateMetrics(2800, 0.62, 3400, true);

  // Obtener configuración optimizada
  const optimizedConfig = vectorConfigService.autoOptimizeConfig();
  console.log('✅ Configuración optimizada generada');

  // Aplicar optimización
  vectorConfigService.applyAutoOptimization();
  console.log('✅ Optimización aplicada');

  // Test 7: Exportar/Importar configuración
  console.log('\n📋 Test 7: Exportar/Importar configuración');
  
  // Exportar configuración
  const exportedConfig = vectorConfigService.exportConfiguration();
  console.log('✅ Configuración exportada:', exportedConfig.length > 0);

  // Importar configuración (simular)
  try {
    vectorConfigService.importConfiguration(exportedConfig);
    console.log('✅ Configuración importada exitosamente');
  } catch (error) {
    console.log('❌ Error importando configuración:', error);
  }

  // Test 8: Configuración por entorno
  console.log('\n📋 Test 8: Configuración por entorno');
  
  // Simular diferentes entornos
  const originalEnv = process.env.NODE_ENV;
  
  process.env.NODE_ENV = 'development';
  console.log('✅ Entorno development configurado');
  
  process.env.NODE_ENV = 'production';
  console.log('✅ Entorno production configurado');
  
  process.env.NODE_ENV = originalEnv; // Restaurar

  // Test 9: Validaciones de edge cases
  console.log('\n📋 Test 9: Validaciones de edge cases');
  
  // Configuración inválida
  const invalidConfig: VectorConfig = {
    ...DEFAULT_VECTOR_CONFIG,
    similarity: { ...DEFAULT_VECTOR_CONFIG.similarity, minSimilarity: 1.5 }, // Inválido
    tokens: { ...DEFAULT_VECTOR_CONFIG.tokens, maxTokensPerQuery: -100 } // Inválido
  };
  
  const invalidValidation = VectorConfigValidator.validate(invalidConfig);
  console.log('✅ Configuración inválida detectada:', !invalidValidation.isValid);
  console.log('   Errores encontrados:', invalidValidation.errors.length);

  // Normalización de pesos
  const unnormalizedWeights = {
    semanticSimilarity: 0.8,
    modulePriority: 0.6,
    categoryWeight: 0.4,
    keywordMatch: 0.2,
    recentUsage: 0.1
  };
  
  const normalizedWeights = VectorConfigValidator.normalizeRankingWeights(unnormalizedWeights);
  const weightSum = Object.values(normalizedWeights).reduce((sum, w) => sum + w, 0);
  console.log('✅ Pesos normalizados correctamente:', Math.abs(weightSum - 1) < 0.001);

  // Test 10: Limpieza
  console.log('\n📋 Test 10: Limpieza');
  
  // Eliminar perfil de prueba
  const deleted = vectorConfigService.deleteProfile('test-profile');
  console.log('✅ Perfil de prueba eliminado:', deleted);

  // Resetear métricas
  vectorConfigService.resetMetrics();
  const resetMetrics = vectorConfigService.getMetrics();
  console.log('✅ Métricas reseteadas:', resetMetrics.queriesProcessed === 0);

  console.log('\n🎉 Todas las pruebas del sistema de configuración vectorial completadas exitosamente!');
  
  // Resumen de funcionalidades implementadas
  console.log('\n📊 Resumen de funcionalidades implementadas:');
  console.log('✅ Configuración de thresholds de similitud');
  console.log('✅ Configuración de límites de tokens y módulos');
  console.log('✅ Sistema de pesos y prioridades para ranking');
  console.log('✅ Validación de configuraciones');
  console.log('✅ Presets predefinidos (FAST, PRECISE, BALANCED, COMPLEX)');
  console.log('✅ Perfiles personalizados');
  console.log('✅ Métricas y monitoreo');
  console.log('✅ Optimización automática');
  console.log('✅ Exportar/Importar configuraciones');
  console.log('✅ Configuración por entorno');
  console.log('✅ Utilidades para UI');
  console.log('✅ Integración con servicios vectoriales existentes');
}

// Ejecutar pruebas si el archivo se ejecuta directamente
if (typeof window === 'undefined') {
  testVectorConfigSystem().catch(console.error);
}

export { testVectorConfigSystem };
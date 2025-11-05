/**
 * Servicio de Configuración Vectorial
 * Integra el sistema de configuración con los servicios vectoriales existentes
 */

import { 
  VectorConfig, 
  VectorConfigManager, 
  DEFAULT_VECTOR_CONFIG,
  VECTOR_CONFIG_PRESETS,
  vectorConfigManager 
} from '../config/vectorConfig';
import vectorSettings from '../config/vectorSettings.json';

export interface ConfigurationMetrics {
  /** Número de consultas procesadas con la configuración actual */
  queriesProcessed: number;
  /** Tiempo promedio de procesamiento (ms) */
  averageProcessingTime: number;
  /** Precisión promedio de selección de módulos */
  averageAccuracy: number;
  /** Uso promedio de tokens */
  averageTokenUsage: number;
  /** Tasa de aciertos del cache */
  cacheHitRate: number;
}

export interface ConfigurationProfile {
  /** Nombre del perfil */
  name: string;
  /** Descripción del perfil */
  description: string;
  /** Configuración vectorial */
  config: VectorConfig;
  /** Métricas de rendimiento */
  metrics?: ConfigurationMetrics;
  /** Fecha de creación */
  createdAt: Date;
  /** Última actualización */
  updatedAt: Date;
}

export class VectorConfigService {
  private configManager: VectorConfigManager;
  private profiles: Map<string, ConfigurationProfile> = new Map();
  private currentProfile: string = 'default';
  private metrics: ConfigurationMetrics;

  constructor() {
    this.configManager = vectorConfigManager;
    this.metrics = this.initializeMetrics();
    this.loadEnvironmentConfig();
    this.initializeProfiles();
  }

  /**
   * Obtiene la configuración actual
   */
  getCurrentConfig(): VectorConfig {
    return this.configManager.getConfig();
  }

  /**
   * Actualiza la configuración vectorial
   */
  updateConfig(updates: Partial<VectorConfig>): void {
    this.configManager.updateConfig(updates);
    this.updateCurrentProfile();
  }

  /**
   * Carga un preset de configuración
   */
  loadPreset(presetName: keyof typeof VECTOR_CONFIG_PRESETS): void {
    this.configManager.loadPreset(presetName);
    this.currentProfile = presetName.toLowerCase();
    this.updateCurrentProfile();
  }

  /**
   * Crea un perfil personalizado de configuración
   */
  createProfile(name: string, description: string, config: VectorConfig): void {
    const profile: ConfigurationProfile = {
      name,
      description,
      config: { ...config },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.profiles.set(name, profile);
    this.saveProfilesToStorage();
  }

  /**
   * Carga un perfil de configuración
   */
  loadProfile(profileName: string): boolean {
    const profile = this.profiles.get(profileName);
    if (!profile) {
      return false;
    }

    this.configManager.updateConfig(profile.config);
    this.currentProfile = profileName;
    return true;
  }

  /**
   * Obtiene todos los perfiles disponibles
   */
  getProfiles(): ConfigurationProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Elimina un perfil
   */
  deleteProfile(profileName: string): boolean {
    if (profileName === 'default' || profileName === this.currentProfile) {
      return false; // No permitir eliminar el perfil por defecto o el actual
    }

    const deleted = this.profiles.delete(profileName);
    if (deleted) {
      this.saveProfilesToStorage();
    }
    return deleted;
  }

  /**
   * Obtiene el perfil actual
   */
  getCurrentProfile(): ConfigurationProfile | undefined {
    return this.profiles.get(this.currentProfile);
  }

  /**
   * Optimiza automáticamente la configuración basada en métricas
   */
  autoOptimizeConfig(): VectorConfig {
    const currentConfig = this.getCurrentConfig();
    const optimizedConfig = { ...currentConfig };

    // Optimizar basado en métricas actuales
    if (this.metrics.averageProcessingTime > 2000) {
      // Si el procesamiento es lento, reducir límites
      optimizedConfig.modules.maxModulesPerQuery = Math.max(3, optimizedConfig.modules.maxModulesPerQuery - 1);
      optimizedConfig.similarity.minSimilarity = Math.min(0.8, optimizedConfig.similarity.minSimilarity + 0.1);
    }

    if (this.metrics.averageTokenUsage > optimizedConfig.tokens.maxTokensPerQuery * 0.9) {
      // Si se usan muchos tokens, reducir límites
      optimizedConfig.tokens.maxTokensPerModule = Math.max(500, optimizedConfig.tokens.maxTokensPerModule - 100);
    }

    if (this.metrics.cacheHitRate < 0.5) {
      // Si el cache es ineficiente, aumentar tamaño
      optimizedConfig.performance.embeddingCacheSize = Math.min(3000, optimizedConfig.performance.embeddingCacheSize * 1.5);
    }

    if (this.metrics.averageAccuracy < 0.7) {
      // Si la precisión es baja, relajar thresholds
      optimizedConfig.similarity.minSimilarity = Math.max(0.3, optimizedConfig.similarity.minSimilarity - 0.1);
      optimizedConfig.modules.maxModulesPerQuery = Math.min(8, optimizedConfig.modules.maxModulesPerQuery + 1);
    }

    return optimizedConfig;
  }

  /**
   * Aplica optimización automática
   */
  applyAutoOptimization(): void {
    const optimizedConfig = this.autoOptimizeConfig();
    this.updateConfig(optimizedConfig);
    
    // Crear perfil optimizado
    this.createProfile(
      `auto-optimized-${Date.now()}`,
      'Configuración optimizada automáticamente',
      optimizedConfig
    );
  }

  /**
   * Actualiza métricas de rendimiento
   */
  updateMetrics(
    processingTime: number,
    accuracy: number,
    tokenUsage: number,
    cacheHit: boolean
  ): void {
    this.metrics.queriesProcessed++;
    
    // Calcular promedios móviles
    const alpha = 0.1; // Factor de suavizado
    this.metrics.averageProcessingTime = 
      this.metrics.averageProcessingTime * (1 - alpha) + processingTime * alpha;
    
    this.metrics.averageAccuracy = 
      this.metrics.averageAccuracy * (1 - alpha) + accuracy * alpha;
    
    this.metrics.averageTokenUsage = 
      this.metrics.averageTokenUsage * (1 - alpha) + tokenUsage * alpha;
    
    // Actualizar tasa de aciertos del cache
    const cacheHitValue = cacheHit ? 1 : 0;
    this.metrics.cacheHitRate = 
      this.metrics.cacheHitRate * (1 - alpha) + cacheHitValue * alpha;
  }

  /**
   * Obtiene métricas actuales
   */
  getMetrics(): ConfigurationMetrics {
    return { ...this.metrics };
  }

  /**
   * Reinicia métricas
   */
  resetMetrics(): void {
    this.metrics = this.initializeMetrics();
  }

  /**
   * Exporta configuración y perfiles
   */
  exportConfiguration(): string {
    const exportData = {
      currentProfile: this.currentProfile,
      currentConfig: this.getCurrentConfig(),
      profiles: Array.from(this.profiles.entries()),
      metrics: this.metrics,
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importa configuración y perfiles
   */
  importConfiguration(configData: string): void {
    try {
      const data = JSON.parse(configData);
      
      // Importar perfiles
      if (data.profiles) {
        this.profiles.clear();
        for (const [name, profile] of data.profiles) {
          this.profiles.set(name, {
            ...profile,
            createdAt: new Date(profile.createdAt),
            updatedAt: new Date(profile.updatedAt)
          });
        }
      }

      // Cargar configuración actual
      if (data.currentConfig) {
        this.configManager.updateConfig(data.currentConfig);
      }

      // Establecer perfil actual
      if (data.currentProfile && this.profiles.has(data.currentProfile)) {
        this.currentProfile = data.currentProfile;
      }

      this.saveProfilesToStorage();
    } catch (error) {
      throw new Error(`Error importando configuración: ${error}`);
    }
  }

  /**
   * Obtiene recomendaciones de configuración
   */
  getConfigurationRecommendations(): string[] {
    const recommendations: string[] = [];
    const config = this.getCurrentConfig();
    const metrics = this.metrics;

    // Recomendaciones basadas en métricas
    if (metrics.averageProcessingTime > 3000) {
      recommendations.push('Considera reducir maxModulesPerQuery para mejorar velocidad');
    }

    if (metrics.averageTokenUsage > config.tokens.maxTokensPerQuery * 0.95) {
      recommendations.push('Aumenta maxTokensPerQuery o reduce maxTokensPerModule');
    }

    if (metrics.cacheHitRate < 0.4) {
      recommendations.push('Aumenta embeddingCacheSize para mejorar eficiencia');
    }

    if (metrics.averageAccuracy < 0.6) {
      recommendations.push('Reduce minSimilarity para incluir más módulos relevantes');
    }

    // Recomendaciones basadas en configuración
    if (config.similarity.minSimilarity > 0.8) {
      recommendations.push('minSimilarity muy alto puede excluir módulos útiles');
    }

    if (config.modules.maxModulesPerQuery > 8) {
      recommendations.push('Muchos módulos pueden degradar la calidad de respuesta');
    }

    const totalWeight = Object.values(config.rankingWeights).reduce((sum, w) => sum + w, 0);
    if (Math.abs(totalWeight - 1) > 0.1) {
      recommendations.push('Los pesos de ranking deberían sumar aproximadamente 1.0');
    }

    return recommendations;
  }

  /**
   * Valida la configuración actual
   */
  validateCurrentConfig(): { isValid: boolean; errors: string[]; warnings: string[] } {
    const config = this.getCurrentConfig();
    const validation = { isValid: true, errors: [] as string[], warnings: [] as string[] };

    // Validaciones críticas
    if (config.tokens.maxTokensPerQuery <= config.tokens.basePromptTokens + config.tokens.responseTokenReserve) {
      validation.isValid = false;
      validation.errors.push('No hay tokens suficientes para módulos');
    }

    if (config.modules.maxModulesPerQuery <= 0) {
      validation.isValid = false;
      validation.errors.push('maxModulesPerQuery debe ser positivo');
    }

    // Advertencias
    if (config.similarity.minSimilarity < 0.2) {
      validation.warnings.push('minSimilarity muy bajo puede incluir módulos irrelevantes');
    }

    if (config.performance.embeddingCacheSize < 100) {
      validation.warnings.push('Cache pequeño puede afectar rendimiento');
    }

    return validation;
  }

  /**
   * Inicializa métricas por defecto
   */
  private initializeMetrics(): ConfigurationMetrics {
    return {
      queriesProcessed: 0,
      averageProcessingTime: 1000,
      averageAccuracy: 0.75,
      averageTokenUsage: 2000,
      cacheHitRate: 0.6
    };
  }

  /**
   * Carga configuración específica del entorno
   */
  private loadEnvironmentConfig(): void {
    const env = process.env.NODE_ENV || 'development';
    const envConfig = vectorSettings[env as keyof typeof vectorSettings];
    
    if (envConfig) {
      this.configManager.updateConfig(envConfig as VectorConfig);
    }
  }

  /**
   * Inicializa perfiles por defecto
   */
  private initializeProfiles(): void {
    // Cargar perfiles desde storage
    this.loadProfilesFromStorage();

    // Crear perfil por defecto si no existe
    if (!this.profiles.has('default')) {
      this.createProfile(
        'default',
        'Configuración por defecto del sistema',
        DEFAULT_VECTOR_CONFIG
      );
    }

    // Crear perfiles de presets
    for (const [presetName, presetConfig] of Object.entries(VECTOR_CONFIG_PRESETS)) {
      const profileName = presetName.toLowerCase();
      if (!this.profiles.has(profileName)) {
        this.createProfile(
          profileName,
          `Preset ${presetName}: ${this.getPresetDescription(presetName)}`,
          presetConfig
        );
      }
    }
  }

  /**
   * Obtiene descripción de un preset
   */
  private getPresetDescription(presetName: string): string {
    const descriptions = {
      'FAST': 'Optimizado para velocidad de respuesta',
      'PRECISE': 'Optimizado para precisión y cobertura',
      'BALANCED': 'Balance entre velocidad y precisión',
      'COMPLEX': 'Para consultas complejas que requieren múltiples módulos'
    };
    return descriptions[presetName as keyof typeof descriptions] || 'Configuración personalizada';
  }

  /**
   * Actualiza el perfil actual
   */
  private updateCurrentProfile(): void {
    const currentConfig = this.getCurrentConfig();
    const profile = this.profiles.get(this.currentProfile);
    
    if (profile) {
      profile.config = { ...currentConfig };
      profile.updatedAt = new Date();
      this.saveProfilesToStorage();
    }
  }

  /**
   * Carga perfiles desde localStorage
   */
  private loadProfilesFromStorage(): void {
    try {
      // Verificar si localStorage está disponible (entorno navegador)
      if (typeof localStorage === 'undefined') {
        return; // En Node.js, no hay persistencia
      }
      
      const stored = localStorage.getItem('vectorConfigProfiles');
      if (stored) {
        const profilesData = JSON.parse(stored);
        for (const [name, profile] of profilesData) {
          this.profiles.set(name, {
            ...profile,
            createdAt: new Date(profile.createdAt),
            updatedAt: new Date(profile.updatedAt)
          });
        }
      }
    } catch (error) {
      console.warn('Error cargando perfiles de configuración:', error);
    }
  }

  /**
   * Guarda perfiles en localStorage
   */
  private saveProfilesToStorage(): void {
    try {
      // Verificar si localStorage está disponible (entorno navegador)
      if (typeof localStorage === 'undefined') {
        return; // En Node.js, no hay persistencia
      }
      
      const profilesData = Array.from(this.profiles.entries());
      localStorage.setItem('vectorConfigProfiles', JSON.stringify(profilesData));
    } catch (error) {
      console.warn('Error guardando perfiles de configuración:', error);
    }
  }
}

/**
 * Instancia global del servicio de configuración vectorial
 */
export const vectorConfigService = new VectorConfigService();
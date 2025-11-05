/**
 * Sistema de Aprendizaje Semántico
 * Implementa mejora automática de embeddings, re-ranking dinámico y clustering de consultas
 */

import { PromptModule, SemanticMatch } from './vectorService';
import { VectorDatabase } from './vectorDatabase';
import { vectorConfigService } from './vectorConfigService';

export interface QueryFeedback {
  queryId: string;
  query: string;
  queryEmbedding: number[];
  selectedModules: string[];
  userRating: number; // 1-5 scale
  responseQuality: number; // 0-1 scale
  timestamp: Date;
  contextTags: string[];
}

export interface ModuleEffectiveness {
  moduleId: string;
  usageCount: number;
  averageRating: number;
  successRate: number;
  contextEffectiveness: Record<string, number>;
  lastUpdated: Date;
}

export interface QueryCluster {
  id: string;
  centroid: number[];
  queries: string[];
  commonModules: string[];
  averageComplexity: number;
  size: number;
  lastUpdated: Date;
}

export interface LearningMetrics {
  totalFeedbacks: number;
  averageImprovement: number;
  clustersCount: number;
  moduleEffectivenessUpdates: number;
  lastLearningCycle: Date;
}

export class SemanticLearningService {
  private vectorDatabase: VectorDatabase;
  private feedbackHistory: Map<string, QueryFeedback> = new Map();
  private moduleEffectiveness: Map<string, ModuleEffectiveness> = new Map();
  private queryClusters: Map<string, QueryCluster> = new Map();
  private learningMetrics: LearningMetrics;
  private learningEnabled: boolean = true;

  constructor(vectorDatabase: VectorDatabase) {
    this.vectorDatabase = vectorDatabase;
    this.learningMetrics = this.initializeLearningMetrics();
    this.loadLearningData();
  }

  /**
   * Registra feedback de una consulta para aprendizaje
   */
  async recordQueryFeedback(feedback: QueryFeedback): Promise<void> {
    if (!this.learningEnabled) return;

    // Almacenar feedback
    this.feedbackHistory.set(feedback.queryId, feedback);

    // Actualizar efectividad de módulos
    await this.updateModuleEffectiveness(feedback);

    // Actualizar clustering de consultas
    await this.updateQueryClustering(feedback);

    // Actualizar métricas
    this.learningMetrics.totalFeedbacks++;
    this.learningMetrics.lastLearningCycle = new Date();

    // Guardar datos de aprendizaje
    await this.saveLearningData();

    // Ejecutar ciclo de aprendizaje si es necesario
    if (this.shouldRunLearningCycle()) {
      await this.runLearningCycle();
    }
  }

  /**
   * Mejora automática de embeddings basado en feedback
   */
  async improveEmbeddings(): Promise<void> {
    const feedbacks = Array.from(this.feedbackHistory.values());
    const recentFeedbacks = feedbacks.filter(f => 
      Date.now() - f.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // Últimos 7 días
    );

    if (recentFeedbacks.length < 10) return; // Necesitamos suficientes datos

    // Identificar módulos con bajo rendimiento
    const underperformingModules = await this.identifyUnderperformingModules();

    // Ajustar embeddings de módulos problemáticos
    for (const moduleId of underperformingModules) {
      await this.adjustModuleEmbedding(moduleId, recentFeedbacks);
    }

    // Actualizar métricas
    this.learningMetrics.moduleEffectivenessUpdates++;
  }

  /**
   * Re-ranking dinámico de módulos según efectividad
   */
  async dynamicModuleReranking(
    matches: SemanticMatch[], 
    contextTags: string[] = []
  ): Promise<SemanticMatch[]> {
    if (!this.learningEnabled) return matches;

    const rerankedMatches = matches.map(match => {
      const effectiveness = this.moduleEffectiveness.get(match.moduleId);
      
      if (!effectiveness) return match;

      // Calcular boost basado en efectividad histórica
      let effectivenessBoost = effectiveness.averageRating / 5; // Normalizar a 0-1

      // Aplicar boost específico por contexto
      if (contextTags.length > 0) {
        const contextBoost = contextTags.reduce((boost, tag) => {
          return boost + (effectiveness.contextEffectiveness[tag] || 0);
        }, 0) / contextTags.length;
        
        effectivenessBoost = (effectivenessBoost + contextBoost) / 2;
      }

      // Aplicar factor de uso reciente
      const daysSinceUpdate = (Date.now() - effectiveness.lastUpdated.getTime()) / (24 * 60 * 60 * 1000);
      const recencyFactor = Math.max(0.5, 1 - (daysSinceUpdate / 30)); // Decae en 30 días

      // Calcular nuevo score de relevancia
      const enhancedRelevanceScore = match.relevanceScore * (1 + effectivenessBoost * 0.3) * recencyFactor;

      return {
        ...match,
        relevanceScore: Math.min(1, enhancedRelevanceScore)
      };
    });

    return rerankedMatches.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Clustering automático de consultas similares
   */
  async clusterSimilarQueries(): Promise<QueryCluster[]> {
    const feedbacks = Array.from(this.feedbackHistory.values());
    const recentFeedbacks = feedbacks.filter(f => 
      Date.now() - f.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000 // Últimos 30 días
    );

    if (recentFeedbacks.length < 5) return [];

    // Aplicar clustering K-means simplificado
    const clusters = await this.performKMeansClustering(recentFeedbacks);

    // Actualizar clusters existentes
    this.queryClusters.clear();
    clusters.forEach(cluster => {
      this.queryClusters.set(cluster.id, cluster);
    });

    this.learningMetrics.clustersCount = clusters.length;
    return clusters;
  }

  /**
   * Obtiene recomendaciones de módulos basadas en clustering
   */
  async getClusterBasedRecommendations(queryEmbedding: number[]): Promise<string[]> {
    if (this.queryClusters.size === 0) return [];

    // Encontrar cluster más similar
    let bestCluster: QueryCluster | null = null;
    let bestSimilarity = -1;

    for (const cluster of this.queryClusters.values()) {
      const similarity = this.calculateCosineSimilarity(queryEmbedding, cluster.centroid);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestCluster = cluster;
      }
    }

    // Retornar módulos comunes del cluster más similar
    return bestCluster?.commonModules || [];
  }

  /**
   * Obtiene métricas de aprendizaje
   */
  getLearningMetrics(): LearningMetrics {
    return { ...this.learningMetrics };
  }

  /**
   * Obtiene efectividad de módulos
   */
  getModuleEffectiveness(): ModuleEffectiveness[] {
    return Array.from(this.moduleEffectiveness.values());
  }

  /**
   * Obtiene clusters de consultas
   */
  getQueryClusters(): QueryCluster[] {
    return Array.from(this.queryClusters.values());
  }

  /**
   * Habilita o deshabilita el aprendizaje
   */
  setLearningEnabled(enabled: boolean): void {
    this.learningEnabled = enabled;
  }

  /**
   * Reinicia datos de aprendizaje
   */
  async resetLearningData(): Promise<void> {
    this.feedbackHistory.clear();
    this.moduleEffectiveness.clear();
    this.queryClusters.clear();
    this.learningMetrics = this.initializeLearningMetrics();
    await this.saveLearningData();
  }

  /**
   * Exporta datos de aprendizaje
   */
  exportLearningData(): string {
    const exportData = {
      feedbackHistory: Array.from(this.feedbackHistory.entries()),
      moduleEffectiveness: Array.from(this.moduleEffectiveness.entries()),
      queryClusters: Array.from(this.queryClusters.entries()),
      learningMetrics: this.learningMetrics,
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importa datos de aprendizaje
   */
  async importLearningData(data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);

      // Importar feedback
      if (importData.feedbackHistory) {
        this.feedbackHistory.clear();
        for (const [id, feedback] of importData.feedbackHistory) {
          this.feedbackHistory.set(id, {
            ...feedback,
            timestamp: new Date(feedback.timestamp)
          });
        }
      }

      // Importar efectividad de módulos
      if (importData.moduleEffectiveness) {
        this.moduleEffectiveness.clear();
        for (const [id, effectiveness] of importData.moduleEffectiveness) {
          this.moduleEffectiveness.set(id, {
            ...effectiveness,
            lastUpdated: new Date(effectiveness.lastUpdated)
          });
        }
      }

      // Importar clusters
      if (importData.queryClusters) {
        this.queryClusters.clear();
        for (const [id, cluster] of importData.queryClusters) {
          this.queryClusters.set(id, {
            ...cluster,
            lastUpdated: new Date(cluster.lastUpdated)
          });
        }
      }

      // Importar métricas
      if (importData.learningMetrics) {
        this.learningMetrics = {
          ...importData.learningMetrics,
          lastLearningCycle: new Date(importData.learningMetrics.lastLearningCycle)
        };
      }

      await this.saveLearningData();
    } catch (error) {
      throw new Error(`Error importando datos de aprendizaje: ${error}`);
    }
  }

  /**
   * Actualiza efectividad de módulos basado en feedback
   */
  private async updateModuleEffectiveness(feedback: QueryFeedback): Promise<void> {
    for (const moduleId of feedback.selectedModules) {
      let effectiveness = this.moduleEffectiveness.get(moduleId);

      if (!effectiveness) {
        effectiveness = {
          moduleId,
          usageCount: 0,
          averageRating: 0,
          successRate: 0,
          contextEffectiveness: {},
          lastUpdated: new Date()
        };
      }

      // Actualizar estadísticas
      effectiveness.usageCount++;
      effectiveness.averageRating = (effectiveness.averageRating * (effectiveness.usageCount - 1) + feedback.userRating) / effectiveness.usageCount;
      effectiveness.successRate = (effectiveness.successRate * (effectiveness.usageCount - 1) + feedback.responseQuality) / effectiveness.usageCount;
      effectiveness.lastUpdated = new Date();

      // Actualizar efectividad por contexto
      for (const tag of feedback.contextTags) {
        if (!effectiveness.contextEffectiveness[tag]) {
          effectiveness.contextEffectiveness[tag] = 0;
        }
        effectiveness.contextEffectiveness[tag] = 
          (effectiveness.contextEffectiveness[tag] + feedback.responseQuality) / 2;
      }

      this.moduleEffectiveness.set(moduleId, effectiveness);
    }
  }

  /**
   * Actualiza clustering de consultas
   */
  private async updateQueryClustering(feedback: QueryFeedback): Promise<void> {
    // Encontrar cluster más similar o crear uno nuevo
    let bestCluster: QueryCluster | null = null;
    let bestSimilarity = -1;
    const similarityThreshold = 0.7;

    for (const cluster of this.queryClusters.values()) {
      const similarity = this.calculateCosineSimilarity(feedback.queryEmbedding, cluster.centroid);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestCluster = cluster;
      }
    }

    if (bestCluster && bestSimilarity > similarityThreshold) {
      // Agregar a cluster existente
      bestCluster.queries.push(feedback.query);
      bestCluster.size++;
      bestCluster.lastUpdated = new Date();

      // Actualizar centroide (promedio móvil)
      const alpha = 0.1;
      for (let i = 0; i < bestCluster.centroid.length; i++) {
        bestCluster.centroid[i] = bestCluster.centroid[i] * (1 - alpha) + feedback.queryEmbedding[i] * alpha;
      }

      // Actualizar módulos comunes
      this.updateClusterCommonModules(bestCluster, feedback.selectedModules);
    } else {
      // Crear nuevo cluster
      const newCluster: QueryCluster = {
        id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        centroid: [...feedback.queryEmbedding],
        queries: [feedback.query],
        commonModules: [...feedback.selectedModules],
        averageComplexity: feedback.contextTags.includes('complex') ? 0.8 : 0.5,
        size: 1,
        lastUpdated: new Date()
      };

      this.queryClusters.set(newCluster.id, newCluster);
    }
  }

  /**
   * Actualiza módulos comunes de un cluster
   */
  private updateClusterCommonModules(cluster: QueryCluster, newModules: string[]): void {
    // Contar frecuencia de módulos en el cluster
    const moduleFrequency: Record<string, number> = {};
    
    // Contar módulos existentes
    for (const moduleId of cluster.commonModules) {
      moduleFrequency[moduleId] = (moduleFrequency[moduleId] || 0) + 1;
    }

    // Agregar nuevos módulos
    for (const moduleId of newModules) {
      moduleFrequency[moduleId] = (moduleFrequency[moduleId] || 0) + 1;
    }

    // Mantener solo módulos que aparecen en al menos 30% de las consultas
    const threshold = Math.max(1, Math.floor(cluster.size * 0.3));
    cluster.commonModules = Object.entries(moduleFrequency)
      .filter(([_, frequency]) => frequency >= threshold)
      .map(([moduleId, _]) => moduleId);
  }

  /**
   * Identifica módulos con bajo rendimiento
   */
  private async identifyUnderperformingModules(): Promise<string[]> {
    const underperforming: string[] = [];
    const minUsageThreshold = 5;
    const lowRatingThreshold = 2.5;
    const lowSuccessThreshold = 0.4;

    for (const [moduleId, effectiveness] of this.moduleEffectiveness.entries()) {
      if (effectiveness.usageCount >= minUsageThreshold &&
          (effectiveness.averageRating < lowRatingThreshold || 
           effectiveness.successRate < lowSuccessThreshold)) {
        underperforming.push(moduleId);
      }
    }

    return underperforming;
  }

  /**
   * Ajusta embedding de un módulo basado en feedback
   */
  private async adjustModuleEmbedding(moduleId: string, feedbacks: QueryFeedback[]): Promise<void> {
    const module = this.vectorDatabase.getModule(moduleId);
    if (!module || !module.embedding) return;

    // Encontrar feedbacks relacionados con este módulo
    const relatedFeedbacks = feedbacks.filter(f => f.selectedModules.includes(moduleId));
    if (relatedFeedbacks.length < 3) return;

    // Calcular ajuste basado en consultas exitosas vs fallidas
    const successfulQueries = relatedFeedbacks.filter(f => f.responseQuality > 0.7);
    const failedQueries = relatedFeedbacks.filter(f => f.responseQuality < 0.4);

    if (successfulQueries.length === 0) return;

    // Calcular centroide de consultas exitosas
    const successfulCentroid = this.calculateCentroid(successfulQueries.map(f => f.queryEmbedding));
    
    // Aplicar ajuste sutil hacia consultas exitosas
    const adjustmentFactor = 0.05; // Ajuste conservador
    const adjustedEmbedding = module.embedding.map((value, index) => 
      value * (1 - adjustmentFactor) + successfulCentroid[index] * adjustmentFactor
    );

    // Actualizar embedding en la base de datos
    await this.vectorDatabase.updateIndex(moduleId, adjustedEmbedding);
  }

  /**
   * Realiza clustering K-means simplificado
   */
  private async performKMeansClustering(feedbacks: QueryFeedback[]): Promise<QueryCluster[]> {
    const k = Math.min(Math.max(2, Math.floor(feedbacks.length / 5)), 10); // Entre 2 y 10 clusters
    const maxIterations = 20;
    const clusters: QueryCluster[] = [];

    // Inicializar centroides aleatoriamente
    for (let i = 0; i < k; i++) {
      const randomFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];
      clusters.push({
        id: `cluster_${i}`,
        centroid: [...randomFeedback.queryEmbedding],
        queries: [],
        commonModules: [],
        averageComplexity: 0,
        size: 0,
        lastUpdated: new Date()
      });
    }

    // Iteraciones de K-means
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Limpiar clusters
      clusters.forEach(cluster => {
        cluster.queries = [];
        cluster.commonModules = [];
        cluster.size = 0;
      });

      // Asignar feedbacks a clusters más cercanos
      for (const feedback of feedbacks) {
        let bestCluster = clusters[0];
        let bestDistance = this.calculateEuclideanDistance(feedback.queryEmbedding, bestCluster.centroid);

        for (let i = 1; i < clusters.length; i++) {
          const distance = this.calculateEuclideanDistance(feedback.queryEmbedding, clusters[i].centroid);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestCluster = clusters[i];
          }
        }

        bestCluster.queries.push(feedback.query);
        bestCluster.commonModules.push(...feedback.selectedModules);
        bestCluster.size++;
      }

      // Actualizar centroides
      let hasChanged = false;
      for (const cluster of clusters) {
        if (cluster.size === 0) continue;

        const relatedFeedbacks = feedbacks.filter(f => cluster.queries.includes(f.query));
        const newCentroid = this.calculateCentroid(relatedFeedbacks.map(f => f.queryEmbedding));
        
        // Verificar si el centroide cambió significativamente
        const change = this.calculateEuclideanDistance(cluster.centroid, newCentroid);
        if (change > 0.01) {
          hasChanged = true;
          cluster.centroid = newCentroid;
        }

        // Calcular módulos comunes
        const moduleFrequency: Record<string, number> = {};
        for (const moduleId of cluster.commonModules) {
          moduleFrequency[moduleId] = (moduleFrequency[moduleId] || 0) + 1;
        }

        const threshold = Math.max(1, Math.floor(cluster.size * 0.4));
        cluster.commonModules = Object.entries(moduleFrequency)
          .filter(([_, frequency]) => frequency >= threshold)
          .map(([moduleId, _]) => moduleId);
      }

      // Convergencia
      if (!hasChanged) break;
    }

    // Filtrar clusters vacíos
    return clusters.filter(cluster => cluster.size > 0);
  }

  /**
   * Calcula centroide de un conjunto de embeddings
   */
  private calculateCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return [];

    const dimensions = embeddings[0].length;
    const centroid = new Array(dimensions).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += embedding[i];
      }
    }

    return centroid.map(value => value / embeddings.length);
  }

  /**
   * Calcula similitud coseno entre dos embeddings
   */
  private calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Calcula distancia euclidiana entre dos embeddings
   */
  private calculateEuclideanDistance(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return Infinity;

    let sum = 0;
    for (let i = 0; i < embedding1.length; i++) {
      const diff = embedding1[i] - embedding2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Determina si debe ejecutar un ciclo de aprendizaje
   */
  private shouldRunLearningCycle(): boolean {
    const config = vectorConfigService.getCurrentConfig();
    const daysSinceLastCycle = (Date.now() - this.learningMetrics.lastLearningCycle.getTime()) / (24 * 60 * 60 * 1000);
    
    return this.learningMetrics.totalFeedbacks % 50 === 0 || // Cada 50 feedbacks
           daysSinceLastCycle >= 7; // O cada 7 días
  }

  /**
   * Ejecuta un ciclo completo de aprendizaje
   */
  private async runLearningCycle(): Promise<void> {
    console.log('Ejecutando ciclo de aprendizaje semántico...');

    try {
      // Mejorar embeddings
      await this.improveEmbeddings();

      // Actualizar clustering
      await this.clusterSimilarQueries();

      // Calcular mejora promedio
      const improvement = this.calculateAverageImprovement();
      this.learningMetrics.averageImprovement = improvement;

      console.log(`Ciclo de aprendizaje completado. Mejora promedio: ${improvement.toFixed(3)}`);
    } catch (error) {
      console.error('Error en ciclo de aprendizaje:', error);
    }
  }

  /**
   * Calcula mejora promedio basada en feedback reciente
   */
  private calculateAverageImprovement(): number {
    const recentFeedbacks = Array.from(this.feedbackHistory.values())
      .filter(f => Date.now() - f.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (recentFeedbacks.length < 10) return 0;

    const firstHalf = recentFeedbacks.slice(0, Math.floor(recentFeedbacks.length / 2));
    const secondHalf = recentFeedbacks.slice(Math.floor(recentFeedbacks.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, f) => sum + f.responseQuality, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, f) => sum + f.responseQuality, 0) / secondHalf.length;

    return secondHalfAvg - firstHalfAvg;
  }

  /**
   * Inicializa métricas de aprendizaje
   */
  private initializeLearningMetrics(): LearningMetrics {
    return {
      totalFeedbacks: 0,
      averageImprovement: 0,
      clustersCount: 0,
      moduleEffectivenessUpdates: 0,
      lastLearningCycle: new Date()
    };
  }

  /**
   * Carga datos de aprendizaje desde almacenamiento
   */
  private loadLearningData(): void {
    try {
      if (typeof localStorage === 'undefined') return;

      const data = localStorage.getItem('semanticLearningData');
      if (data) {
        const parsed = JSON.parse(data);
        
        // Cargar feedback
        if (parsed.feedbackHistory) {
          for (const [id, feedback] of parsed.feedbackHistory) {
            this.feedbackHistory.set(id, {
              ...feedback,
              timestamp: new Date(feedback.timestamp)
            });
          }
        }

        // Cargar efectividad
        if (parsed.moduleEffectiveness) {
          for (const [id, effectiveness] of parsed.moduleEffectiveness) {
            this.moduleEffectiveness.set(id, {
              ...effectiveness,
              lastUpdated: new Date(effectiveness.lastUpdated)
            });
          }
        }

        // Cargar clusters
        if (parsed.queryClusters) {
          for (const [id, cluster] of parsed.queryClusters) {
            this.queryClusters.set(id, {
              ...cluster,
              lastUpdated: new Date(cluster.lastUpdated)
            });
          }
        }

        // Cargar métricas
        if (parsed.learningMetrics) {
          this.learningMetrics = {
            ...parsed.learningMetrics,
            lastLearningCycle: new Date(parsed.learningMetrics.lastLearningCycle)
          };
        }
      }
    } catch (error) {
      console.warn('Error cargando datos de aprendizaje:', error);
    }
  }

  /**
   * Guarda datos de aprendizaje en almacenamiento
   */
  private async saveLearningData(): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') return;

      const data = {
        feedbackHistory: Array.from(this.feedbackHistory.entries()),
        moduleEffectiveness: Array.from(this.moduleEffectiveness.entries()),
        queryClusters: Array.from(this.queryClusters.entries()),
        learningMetrics: this.learningMetrics,
        savedAt: new Date().toISOString()
      };

      localStorage.setItem('semanticLearningData', JSON.stringify(data));
    } catch (error) {
      console.warn('Error guardando datos de aprendizaje:', error);
    }
  }
}
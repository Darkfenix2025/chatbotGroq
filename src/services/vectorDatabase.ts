import { PromptModule, SemanticMatch } from './vectorService';
import { CACHE_CONFIG } from '../config/embedding';
import { vectorConfigService } from './vectorConfigService';

export interface VectorIndex {
  moduleId: string;
  embedding: number[];
  metadata: Record<string, any>;
  lastUpdated: Date;
}

export interface SearchResult {
  modules: PromptModule[];
  similarities: number[];
  totalRelevance: number;
}

export class VectorDatabase {
  private index: Map<string, VectorIndex> = new Map();
  private modules: Map<string, PromptModule> = new Map();
  private categoryIndex: Map<string, string[]> = new Map();

  constructor() {
    this.loadFromCache();
  }

  /**
   * Indexa un módulo de prompt con su embedding
   */
  async indexModule(module: PromptModule): Promise<void> {
    if (!module.embedding) {
      throw new Error(`Módulo ${module.id} no tiene embedding`);
    }

    const vectorIndex: VectorIndex = {
      moduleId: module.id,
      embedding: module.embedding,
      metadata: {
        ...module.metadata,
        name: module.name,
        contentLength: module.content.length
      },
      lastUpdated: new Date()
    };

    // Guardar en índices
    this.index.set(module.id, vectorIndex);
    this.modules.set(module.id, module);

    // Actualizar índice por categoría
    const category = module.metadata.category;
    if (!this.categoryIndex.has(category)) {
      this.categoryIndex.set(category, []);
    }
    
    const categoryModules = this.categoryIndex.get(category)!;
    if (!categoryModules.includes(module.id)) {
      categoryModules.push(module.id);
    }

    // Persistir cambios
    await this.saveToCache();
  }

  /**
   * Busca módulos similares usando búsqueda semántica
   */
  async searchSimilar(
    queryEmbedding: number[], 
    topK?: number,
    categoryFilter?: string
  ): Promise<SearchResult> {
    const config = vectorConfigService.getCurrentConfig();
    const actualTopK = topK ?? config.modules.maxModulesPerQuery;
    const minSimilarity = config.similarity.minSimilarity;
    
    const similarities: { moduleId: string; similarity: number; module: PromptModule }[] = [];
    
    // Filtrar módulos por categoría si se especifica
    const moduleIds = categoryFilter 
      ? this.categoryIndex.get(categoryFilter) || []
      : Array.from(this.modules.keys());

    // Calcular similitudes
    for (const moduleId of moduleIds) {
      const vectorIndex = this.index.get(moduleId);
      const module = this.modules.get(moduleId);

      if (!vectorIndex || !module) continue;

      const similarity = this.calculateCosineSimilarity(queryEmbedding, vectorIndex.embedding);
      
      // Aplicar threshold mínimo de similitud
      if (similarity >= minSimilarity) {
        similarities.push({
          moduleId,
          similarity,
          module
        });
      }
    }

    // Aplicar filtros adicionales basados en configuración
    const filteredResults = this.applyConfigurationFilters(similarities);

    // Ordenar por similitud descendente y tomar top K
    const topResults = filteredResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, actualTopK);

    const modules = topResults.map(r => r.module);
    const similarityScores = topResults.map(r => r.similarity);
    const totalRelevance = similarityScores.reduce((sum, score) => sum + score, 0);

    return {
      modules,
      similarities: similarityScores,
      totalRelevance
    };
  }

  /**
   * Actualiza el embedding de un módulo existente
   */
  async updateIndex(moduleId: string, newEmbedding: number[]): Promise<void> {
    const existingIndex = this.index.get(moduleId);
    
    if (!existingIndex) {
      throw new Error(`Módulo ${moduleId} no encontrado en el índice`);
    }

    existingIndex.embedding = newEmbedding;
    existingIndex.lastUpdated = new Date();

    await this.saveToCache();
  }

  /**
   * Obtiene módulos por categoría
   */
  async getModulesByCategory(category: string): Promise<PromptModule[]> {
    const moduleIds = this.categoryIndex.get(category) || [];
    const modules: PromptModule[] = [];

    for (const moduleId of moduleIds) {
      const module = this.modules.get(moduleId);
      if (module) {
        modules.push(module);
      }
    }

    return modules;
  }

  /**
   * Obtiene todos los módulos indexados
   */
  getAllModules(): PromptModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Obtiene un módulo por ID
   */
  getModule(moduleId: string): PromptModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Elimina un módulo del índice
   */
  async removeModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    
    if (module) {
      // Remover de índices
      this.index.delete(moduleId);
      this.modules.delete(moduleId);

      // Remover de índice de categoría
      const category = module.metadata.category;
      const categoryModules = this.categoryIndex.get(category);
      if (categoryModules) {
        const index = categoryModules.indexOf(moduleId);
        if (index > -1) {
          categoryModules.splice(index, 1);
        }
      }

      await this.saveToCache();
    }
  }

  /**
   * Optimiza el índice vectorial
   */
  async optimizeIndex(): Promise<void> {
    // Limpiar módulos huérfanos
    const moduleIds = Array.from(this.modules.keys());
    const indexIds = Array.from(this.index.keys());

    // Remover índices sin módulos
    for (const indexId of indexIds) {
      if (!moduleIds.includes(indexId)) {
        this.index.delete(indexId);
      }
    }

    // Remover módulos sin índices
    for (const moduleId of moduleIds) {
      if (!indexIds.includes(moduleId)) {
        this.modules.delete(moduleId);
      }
    }

    // Limpiar categorías vacías
    for (const [category, moduleIds] of this.categoryIndex.entries()) {
      const validModuleIds = moduleIds.filter(id => this.modules.has(id));
      if (validModuleIds.length === 0) {
        this.categoryIndex.delete(category);
      } else {
        this.categoryIndex.set(category, validModuleIds);
      }
    }

    await this.saveToCache();
  }

  /**
   * Obtiene estadísticas del índice
   */
  getIndexStats(): {
    totalModules: number;
    totalCategories: number;
    modulesByCategory: Record<string, number>;
    lastUpdated: Date | null;
  } {
    const modulesByCategory: Record<string, number> = {};
    
    for (const [category, moduleIds] of this.categoryIndex.entries()) {
      modulesByCategory[category] = moduleIds.length;
    }

    const lastUpdated = Array.from(this.index.values())
      .map(idx => idx.lastUpdated)
      .sort((a, b) => b.getTime() - a.getTime())[0] || null;

    return {
      totalModules: this.modules.size,
      totalCategories: this.categoryIndex.size,
      modulesByCategory,
      lastUpdated
    };
  }

  /**
   * Calcula similitud coseno entre dos embeddings
   */
  private calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

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
   * Carga el índice desde cache local
   */
  private loadFromCache(): void {
    if (!CACHE_CONFIG.persistToDisk) return;

    try {
      // Verificar si localStorage está disponible (entorno navegador)
      if (typeof localStorage === 'undefined') {
        return; // En Node.js, no hay persistencia
      }
      
      // En un entorno de navegador, usar localStorage
      const cachedData = localStorage.getItem('vectorDatabase');
      if (cachedData) {
        const data = JSON.parse(cachedData);
        
        // Restaurar índices
        if (data.index) {
          for (const [key, value] of Object.entries(data.index)) {
            this.index.set(key, {
              ...value as any,
              lastUpdated: new Date((value as any).lastUpdated)
            });
          }
        }

        if (data.modules) {
          for (const [key, value] of Object.entries(data.modules)) {
            this.modules.set(key, value as PromptModule);
          }
        }

        if (data.categoryIndex) {
          for (const [key, value] of Object.entries(data.categoryIndex)) {
            this.categoryIndex.set(key, value as string[]);
          }
        }
      }
    } catch (error) {
      console.warn('Error cargando cache vectorial:', error);
    }
  }

  /**
   * Aplica filtros adicionales basados en configuración
   */
  private applyConfigurationFilters(
    similarities: { moduleId: string; similarity: number; module: PromptModule }[]
  ): { moduleId: string; similarity: number; module: PromptModule }[] {
    const config = vectorConfigService.getCurrentConfig();
    
    // Agrupar por categoría y aplicar límites
    const categoryCounts: Record<string, number> = {};
    const filtered: typeof similarities = [];

    for (const item of similarities) {
      const category = item.module.metadata.category;
      const currentCount = categoryCounts[category] || 0;
      
      // Verificar límite por categoría
      if (currentCount < config.modules.maxModulesPerCategory) {
        // Aplicar threshold específico para módulos especializados
        if (category === 'modes' && item.similarity < config.similarity.specializedModules) {
          continue;
        }
        
        // Aplicar threshold de alta confianza si está configurado
        if (item.similarity >= config.similarity.highConfidence || 
            category === 'core' && item.similarity >= config.similarity.coreActivation) {
          filtered.push(item);
          categoryCounts[category] = currentCount + 1;
        }
      }
    }

    return filtered;
  }

  /**
   * Guarda el índice en cache local
   */
  private async saveToCache(): Promise<void> {
    const config = vectorConfigService.getCurrentConfig();
    if (!config.performance || !CACHE_CONFIG.persistToDisk) return;

    try {
      // Verificar si localStorage está disponible (entorno navegador)
      if (typeof localStorage === 'undefined') {
        return; // En Node.js, no hay persistencia
      }
      
      const data = {
        index: Object.fromEntries(this.index.entries()),
        modules: Object.fromEntries(this.modules.entries()),
        categoryIndex: Object.fromEntries(this.categoryIndex.entries()),
        timestamp: new Date().toISOString(),
        configVersion: JSON.stringify(config) // Versionar con configuración
      };

      localStorage.setItem('vectorDatabase', JSON.stringify(data));
    } catch (error) {
      console.warn('Error guardando cache vectorial:', error);
    }
  }

  /**
   * Limpia todo el cache
   */
  clearCache(): void {
    this.index.clear();
    this.modules.clear();
    this.categoryIndex.clear();
    
    if (CACHE_CONFIG.persistToDisk && typeof localStorage !== 'undefined') {
      localStorage.removeItem('vectorDatabase');
    }
  }
}
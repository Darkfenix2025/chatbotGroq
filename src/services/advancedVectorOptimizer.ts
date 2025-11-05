/**
 * Optimizador Vectorial Avanzado
 * Implementa embeddings especializados, fine-tuning y búsqueda híbrida
 */

import { VectorService, PromptModule, SemanticMatch } from './vectorService';
import { VectorDatabase } from './vectorDatabase';
import { vectorConfigService } from './vectorConfigService';

export interface LegalDomainEmbedding {
  originalEmbedding: number[];
  domainSpecializedEmbedding: number[];
  legalTerms: string[];
  domainRelevance: number;
  specializationLevel: 'basic' | 'intermediate' | 'advanced';
}

export interface FineTuningData {
  queryText: string;
  expectedModules: string[];
  userFeedback: number;
  contextTags: string[];
  timestamp: Date;
}

export interface HybridSearchResult {
  semanticMatches: SemanticMatch[];
  keywordMatches: Array<{
    moduleId: string;
    keywordScore: number;
    matchedKeywords: string[];
  }>;
  combinedScore: number;
  searchStrategy: 'semantic' | 'keyword' | 'hybrid';
}

export interface OptimizationMetrics {
  embeddingQuality: number;
  searchAccuracy: number;
  processingSpeed: number;
  memoryEfficiency: number;
  userSatisfaction: number;
}

export class AdvancedVectorOptimizer {
  private vectorService: VectorService;
  private vectorDatabase: VectorDatabase;
  private legalTermsDict: Map<string, number> = new Map();
  private fineTuningData: FineTuningData[] = [];
  private domainEmbeddings: Map<string, LegalDomainEmbedding> = new Map();
  private keywordIndex: Map<string, string[]> = new Map();

  constructor(vectorService: VectorService, vectorDatabase: VectorDatabase) {
    this.vectorService = vectorService;
    this.vectorDatabase = vectorDatabase;
    this.initializeLegalTerms();
    this.buildKeywordIndex();
    this.loadOptimizationData();
  }

  /**
   * Genera embeddings especializados para dominio legal
   */
  async generateLegalSpecializedEmbeddings(modules: PromptModule[]): Promise<void> {
    console.log('Generando embeddings especializados para dominio legal...');

    for (const module of modules) {
      if (!module.embedding) continue;

      // Extraer términos legales del contenido
      const legalTerms = this.extractLegalTerms(module.content);
      
      // Calcular relevancia del dominio legal
      const domainRelevance = this.calculateDomainRelevance(module.content, legalTerms);
      
      // Generar embedding especializado
      const specializedEmbedding = await this.createDomainSpecializedEmbedding(
        module.embedding,
        legalTerms,
        domainRelevance
      );

      // Determinar nivel de especialización
      const specializationLevel = this.determineSpecializationLevel(domainRelevance, legalTerms.length);

      const domainEmbedding: LegalDomainEmbedding = {
        originalEmbedding: [...module.embedding],
        domainSpecializedEmbedding: specializedEmbedding,
        legalTerms,
        domainRelevance,
        specializationLevel
      };

      this.domainEmbeddings.set(module.id, domainEmbedding);

      // Actualizar embedding en la base de datos
      await this.vectorDatabase.updateIndex(module.id, specializedEmbedding);
    }

    await this.saveOptimizationData();
    console.log(`Embeddings especializados generados para ${modules.length} módulos`);
  }

  /**
   * Implementa fine-tuning de modelos de embedding basado en feedback
   */
  async performFineTuning(): Promise<void> {
    if (this.fineTuningData.length < 50) {
      console.log('Datos insuficientes para fine-tuning (mínimo 50 ejemplos)');
      return;
    }

    console.log('Iniciando proceso de fine-tuning...');

    // Agrupar datos por calidad de feedback
    const highQualityData = this.fineTuningData.filter(d => d.userFeedback >= 4);
    const lowQualityData = this.fineTuningData.filter(d => d.userFeedback <= 2);

    // Identificar patrones en datos de alta calidad
    const positivePatterns = await this.identifyPositivePatterns(highQualityData);
    
    // Identificar patrones problemáticos
    const negativePatterns = await this.identifyNegativePatterns(lowQualityData);

    // Aplicar ajustes a embeddings basados en patrones
    await this.applyFineTuningAdjustments(positivePatterns, negativePatterns);

    console.log('Fine-tuning completado');
  }

  /**
   * Implementa búsqueda híbrida (semántica + keywords)
   */
  async performHybridSearch(
    query: string,
    queryEmbedding: number[],
    maxResults: number = 10
  ): Promise<HybridSearchResult> {
    // Búsqueda semántica
    const semanticResults = await this.vectorDatabase.searchSimilar(queryEmbedding, maxResults);
    const semanticMatches: SemanticMatch[] = semanticResults.modules.map((module, index) => ({
      moduleId: module.id,
      similarity: semanticResults.similarities[index],
      relevanceScore: semanticResults.similarities[index]
    }));

    // Búsqueda por palabras clave
    const keywordMatches = this.performKeywordSearch(query, maxResults);

    // Determinar estrategia de búsqueda óptima
    const searchStrategy = this.determineSearchStrategy(query, semanticMatches, keywordMatches);

    // Combinar resultados según estrategia
    const combinedScore = this.combineSearchResults(semanticMatches, keywordMatches, searchStrategy);

    return {
      semanticMatches,
      keywordMatches,
      combinedScore,
      searchStrategy
    };
  }

  /**
   * Optimiza embeddings existentes basado en uso y feedback
   */
  async optimizeExistingEmbeddings(): Promise<OptimizationMetrics> {
    const startTime = Date.now();
    let optimizedCount = 0;

    const modules = this.vectorDatabase.getAllModules();
    
    for (const module of modules) {
      const domainEmbedding = this.domainEmbeddings.get(module.id);
      if (!domainEmbedding) continue;

      // Verificar si necesita optimización
      if (this.needsOptimization(module.id)) {
        await this.optimizeModuleEmbedding(module, domainEmbedding);
        optimizedCount++;
      }
    }

    const processingTime = Date.now() - startTime;

    // Calcular métricas de optimización
    const metrics: OptimizationMetrics = {
      embeddingQuality: this.calculateEmbeddingQuality(),
      searchAccuracy: this.calculateSearchAccuracy(),
      processingSpeed: 1000 / (processingTime / optimizedCount || 1),
      memoryEfficiency: this.calculateMemoryEfficiency(),
      userSatisfaction: this.calculateUserSatisfaction()
    };

    console.log(`Optimización completada: ${optimizedCount} embeddings optimizados`);
    return metrics;
  }

  /**
   * Registra datos para fine-tuning
   */
  recordFineTuningData(data: FineTuningData): void {
    this.fineTuningData.push(data);
    
    // Mantener solo los últimos 1000 registros
    if (this.fineTuningData.length > 1000) {
      this.fineTuningData = this.fineTuningData.slice(-1000);
    }

    this.saveOptimizationData();
  }

  /**
   * Obtiene métricas de optimización actuales
   */
  getOptimizationMetrics(): OptimizationMetrics {
    return {
      embeddingQuality: this.calculateEmbeddingQuality(),
      searchAccuracy: this.calculateSearchAccuracy(),
      processingSpeed: this.calculateProcessingSpeed(),
      memoryEfficiency: this.calculateMemoryEfficiency(),
      userSatisfaction: this.calculateUserSatisfaction()
    };
  }

  /**
   * Exporta datos de optimización
   */
  exportOptimizationData(): string {
    const exportData = {
      domainEmbeddings: Array.from(this.domainEmbeddings.entries()),
      fineTuningData: this.fineTuningData,
      legalTerms: Array.from(this.legalTermsDict.entries()),
      keywordIndex: Array.from(this.keywordIndex.entries()),
      exportedAt: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Importa datos de optimización
   */
  async importOptimizationData(data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);

      if (importData.domainEmbeddings) {
        this.domainEmbeddings.clear();
        for (const [id, embedding] of importData.domainEmbeddings) {
          this.domainEmbeddings.set(id, embedding);
        }
      }

      if (importData.fineTuningData) {
        this.fineTuningData = importData.fineTuningData.map((d: any) => ({
          ...d,
          timestamp: new Date(d.timestamp)
        }));
      }

      if (importData.legalTerms) {
        this.legalTermsDict.clear();
        for (const [term, weight] of importData.legalTerms) {
          this.legalTermsDict.set(term, weight);
        }
      }

      if (importData.keywordIndex) {
        this.keywordIndex.clear();
        for (const [keyword, moduleIds] of importData.keywordIndex) {
          this.keywordIndex.set(keyword, moduleIds);
        }
      }

      await this.saveOptimizationData();
    } catch (error) {
      throw new Error(`Error importando datos de optimización: ${error}`);
    }
  }

  /**
   * Inicializa diccionario de términos legales argentinos
   */
  private initializeLegalTerms(): void {
    const legalTerms = [
      // Términos generales
      { term: 'código civil', weight: 1.0 },
      { term: 'constitución nacional', weight: 1.0 },
      { term: 'jurisprudencia', weight: 0.9 },
      { term: 'doctrina', weight: 0.8 },
      { term: 'precedente', weight: 0.8 },
      
      // Derecho laboral
      { term: 'ley de contrato de trabajo', weight: 1.0 },
      { term: 'lct', weight: 1.0 },
      { term: 'despido', weight: 0.9 },
      { term: 'indemnización', weight: 0.9 },
      { term: 'preaviso', weight: 0.8 },
      { term: 'integración del mes de despido', weight: 0.8 },
      
      // Derecho civil
      { term: 'responsabilidad civil', weight: 0.9 },
      { term: 'daños y perjuicios', weight: 0.9 },
      { term: 'contrato', weight: 0.8 },
      { term: 'obligaciones', weight: 0.8 },
      { term: 'derechos reales', weight: 0.8 },
      
      // Derecho comercial
      { term: 'sociedad anónima', weight: 0.9 },
      { term: 'sociedad de responsabilidad limitada', weight: 0.9 },
      { term: 'ley de sociedades comerciales', weight: 1.0 },
      { term: 'quiebra', weight: 0.8 },
      { term: 'concurso preventivo', weight: 0.8 },
      
      // Procedimiento
      { term: 'código procesal', weight: 0.9 },
      { term: 'demanda', weight: 0.8 },
      { term: 'contestación', weight: 0.7 },
      { term: 'prueba', weight: 0.8 },
      { term: 'sentencia', weight: 0.8 },
      { term: 'recurso de apelación', weight: 0.7 },
      { term: 'casación', weight: 0.7 }
    ];

    legalTerms.forEach(({ term, weight }) => {
      this.legalTermsDict.set(term.toLowerCase(), weight);
    });
  }

  /**
   * Construye índice de palabras clave para búsqueda híbrida
   */
  private buildKeywordIndex(): void {
    const modules = this.vectorDatabase.getAllModules();
    
    for (const module of modules) {
      const keywords = this.extractKeywords(module.content);
      
      for (const keyword of keywords) {
        if (!this.keywordIndex.has(keyword)) {
          this.keywordIndex.set(keyword, []);
        }
        this.keywordIndex.get(keyword)!.push(module.id);
      }
    }
  }

  /**
   * Extrae términos legales del contenido
   */
  private extractLegalTerms(content: string): string[] {
    const legalTerms: string[] = [];
    const lowerContent = content.toLowerCase();

    for (const [term, weight] of this.legalTermsDict.entries()) {
      if (lowerContent.includes(term)) {
        legalTerms.push(term);
      }
    }

    return legalTerms;
  }

  /**
   * Calcula relevancia del dominio legal
   */
  private calculateDomainRelevance(content: string, legalTerms: string[]): number {
    if (legalTerms.length === 0) return 0;

    let totalWeight = 0;
    let termCount = 0;

    for (const term of legalTerms) {
      const weight = this.legalTermsDict.get(term) || 0.5;
      totalWeight += weight;
      termCount++;
    }

    // Normalizar por longitud del contenido
    const contentLength = content.length;
    const density = (termCount * 100) / contentLength;

    return Math.min(1, (totalWeight / termCount) * (1 + density));
  }

  /**
   * Crea embedding especializado para dominio legal
   */
  private async createDomainSpecializedEmbedding(
    originalEmbedding: number[],
    legalTerms: string[],
    domainRelevance: number
  ): Promise<number[]> {
    // Crear vector de especialización basado en términos legales
    const specializationVector = new Array(originalEmbedding.length).fill(0);
    
    // Aplicar pesos basados en términos legales encontrados
    for (let i = 0; i < legalTerms.length; i++) {
      const term = legalTerms[i];
      const weight = this.legalTermsDict.get(term) || 0.5;
      
      // Distribuir el peso a través de dimensiones específicas
      const startDim = (i * 50) % originalEmbedding.length;
      for (let j = 0; j < 10 && startDim + j < originalEmbedding.length; j++) {
        specializationVector[startDim + j] += weight * 0.1;
      }
    }

    // Combinar embedding original con vector de especialización
    const alpha = domainRelevance * 0.3; // Factor de mezcla
    const specializedEmbedding = originalEmbedding.map((value, index) => 
      value * (1 - alpha) + specializationVector[index] * alpha
    );

    // Normalizar el embedding resultante
    return this.normalizeEmbedding(specializedEmbedding);
  }

  /**
   * Determina nivel de especialización
   */
  private determineSpecializationLevel(
    domainRelevance: number,
    legalTermsCount: number
  ): 'basic' | 'intermediate' | 'advanced' {
    if (domainRelevance > 0.8 && legalTermsCount > 10) {
      return 'advanced';
    } else if (domainRelevance > 0.5 && legalTermsCount > 5) {
      return 'intermediate';
    } else {
      return 'basic';
    }
  }

  /**
   * Identifica patrones positivos en datos de alta calidad
   */
  private async identifyPositivePatterns(highQualityData: FineTuningData[]): Promise<any[]> {
    const patterns: any[] = [];

    // Agrupar por contexto
    const contextGroups = this.groupByContext(highQualityData);

    for (const [context, data] of contextGroups.entries()) {
      const commonModules = this.findCommonModules(data);
      const commonKeywords = this.findCommonKeywords(data);

      patterns.push({
        context,
        commonModules,
        commonKeywords,
        averageFeedback: data.reduce((sum, d) => sum + d.userFeedback, 0) / data.length,
        frequency: data.length
      });
    }

    return patterns;
  }

  /**
   * Identifica patrones negativos en datos de baja calidad
   */
  private async identifyNegativePatterns(lowQualityData: FineTuningData[]): Promise<any[]> {
    const patterns: any[] = [];

    // Similar al método anterior pero para patrones problemáticos
    const contextGroups = this.groupByContext(lowQualityData);

    for (const [context, data] of contextGroups.entries()) {
      const problematicModules = this.findCommonModules(data);
      const problematicKeywords = this.findCommonKeywords(data);

      patterns.push({
        context,
        problematicModules,
        problematicKeywords,
        averageFeedback: data.reduce((sum, d) => sum + d.userFeedback, 0) / data.length,
        frequency: data.length
      });
    }

    return patterns;
  }

  /**
   * Aplica ajustes de fine-tuning a embeddings
   */
  private async applyFineTuningAdjustments(
    positivePatterns: any[],
    negativePatterns: any[]
  ): Promise<void> {
    const modules = this.vectorDatabase.getAllModules();

    for (const module of modules) {
      const domainEmbedding = this.domainEmbeddings.get(module.id);
      if (!domainEmbedding) continue;

      let adjustment = new Array(domainEmbedding.domainSpecializedEmbedding.length).fill(0);
      let adjustmentApplied = false;

      // Aplicar ajustes positivos
      for (const pattern of positivePatterns) {
        if (pattern.commonModules.includes(module.id)) {
          const boost = pattern.averageFeedback / 5 * 0.1; // Boost sutil
          adjustment = adjustment.map(val => val + boost);
          adjustmentApplied = true;
        }
      }

      // Aplicar ajustes negativos
      for (const pattern of negativePatterns) {
        if (pattern.problematicModules.includes(module.id)) {
          const penalty = (5 - pattern.averageFeedback) / 5 * 0.05; // Penalización sutil
          adjustment = adjustment.map(val => val - penalty);
          adjustmentApplied = true;
        }
      }

      // Aplicar ajuste si es necesario
      if (adjustmentApplied) {
        const adjustedEmbedding = domainEmbedding.domainSpecializedEmbedding.map(
          (value, index) => value + adjustment[index]
        );

        const normalizedEmbedding = this.normalizeEmbedding(adjustedEmbedding);
        domainEmbedding.domainSpecializedEmbedding = normalizedEmbedding;

        await this.vectorDatabase.updateIndex(module.id, normalizedEmbedding);
      }
    }
  }

  /**
   * Realiza búsqueda por palabras clave
   */
  private performKeywordSearch(query: string, maxResults: number): Array<{
    moduleId: string;
    keywordScore: number;
    matchedKeywords: string[];
  }> {
    const queryKeywords = this.extractKeywords(query.toLowerCase());
    const results: Array<{
      moduleId: string;
      keywordScore: number;
      matchedKeywords: string[];
    }> = [];

    const moduleScores: Map<string, { score: number; keywords: string[] }> = new Map();

    // Buscar coincidencias de palabras clave
    for (const keyword of queryKeywords) {
      const moduleIds = this.keywordIndex.get(keyword) || [];
      
      for (const moduleId of moduleIds) {
        if (!moduleScores.has(moduleId)) {
          moduleScores.set(moduleId, { score: 0, keywords: [] });
        }
        
        const moduleScore = moduleScores.get(moduleId)!;
        moduleScore.score += this.calculateKeywordWeight(keyword);
        moduleScore.keywords.push(keyword);
      }
    }

    // Convertir a formato de resultado
    for (const [moduleId, { score, keywords }] of moduleScores.entries()) {
      results.push({
        moduleId,
        keywordScore: score / queryKeywords.length, // Normalizar
        matchedKeywords: keywords
      });
    }

    // Ordenar por score y limitar resultados
    return results
      .sort((a, b) => b.keywordScore - a.keywordScore)
      .slice(0, maxResults);
  }

  /**
   * Determina estrategia de búsqueda óptima
   */
  private determineSearchStrategy(
    query: string,
    semanticMatches: SemanticMatch[],
    keywordMatches: any[]
  ): 'semantic' | 'keyword' | 'hybrid' {
    const queryLength = query.length;
    const hasSpecificTerms = this.extractLegalTerms(query).length > 0;
    const semanticQuality = semanticMatches.length > 0 ? semanticMatches[0].similarity : 0;
    const keywordQuality = keywordMatches.length > 0 ? keywordMatches[0].keywordScore : 0;

    // Usar búsqueda por palabras clave para consultas cortas y específicas
    if (queryLength < 50 && hasSpecificTerms && keywordQuality > 0.7) {
      return 'keyword';
    }

    // Usar búsqueda semántica para consultas largas y conceptuales
    if (queryLength > 200 && semanticQuality > 0.6) {
      return 'semantic';
    }

    // Usar búsqueda híbrida en otros casos
    return 'hybrid';
  }

  /**
   * Combina resultados de búsqueda según estrategia
   */
  private combineSearchResults(
    semanticMatches: SemanticMatch[],
    keywordMatches: any[],
    strategy: 'semantic' | 'keyword' | 'hybrid'
  ): number {
    switch (strategy) {
      case 'semantic':
        return semanticMatches.length > 0 ? semanticMatches[0].relevanceScore : 0;
      
      case 'keyword':
        return keywordMatches.length > 0 ? keywordMatches[0].keywordScore : 0;
      
      case 'hybrid':
        const semanticScore = semanticMatches.length > 0 ? semanticMatches[0].relevanceScore : 0;
        const keywordScore = keywordMatches.length > 0 ? keywordMatches[0].keywordScore : 0;
        return (semanticScore * 0.7) + (keywordScore * 0.3); // Peso mayor a semántica
      
      default:
        return 0;
    }
  }

  /**
   * Extrae palabras clave del texto
   */
  private extractKeywords(text: string): string[] {
    // Palabras comunes a filtrar
    const stopWords = new Set([
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le',
      'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'una', 'como',
      'pero', 'sus', 'le', 'ya', 'o', 'fue', 'este', 'ha', 'si', 'porque', 'esta', 'son',
      'entre', 'cuando', 'muy', 'sin', 'sobre', 'ser', 'tiene', 'también', 'me', 'hasta'
    ]);

    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter((word, index, arr) => arr.indexOf(word) === index); // Remover duplicados
  }

  /**
   * Calcula peso de una palabra clave
   */
  private calculateKeywordWeight(keyword: string): number {
    // Dar mayor peso a términos legales
    if (this.legalTermsDict.has(keyword)) {
      return this.legalTermsDict.get(keyword)!;
    }

    // Peso base para otras palabras
    return 0.5;
  }

  /**
   * Normaliza un embedding
   */
  private normalizeEmbedding(embedding: number[]): number[] {
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  /**
   * Agrupa datos por contexto
   */
  private groupByContext(data: FineTuningData[]): Map<string, FineTuningData[]> {
    const groups = new Map<string, FineTuningData[]>();

    for (const item of data) {
      const context = item.contextTags.join(',') || 'general';
      if (!groups.has(context)) {
        groups.set(context, []);
      }
      groups.get(context)!.push(item);
    }

    return groups;
  }

  /**
   * Encuentra módulos comunes en un conjunto de datos
   */
  private findCommonModules(data: FineTuningData[]): string[] {
    const moduleFrequency: Map<string, number> = new Map();

    for (const item of data) {
      for (const moduleId of item.expectedModules) {
        moduleFrequency.set(moduleId, (moduleFrequency.get(moduleId) || 0) + 1);
      }
    }

    const threshold = Math.ceil(data.length * 0.3); // Al menos 30% de frecuencia
    return Array.from(moduleFrequency.entries())
      .filter(([_, frequency]) => frequency >= threshold)
      .map(([moduleId, _]) => moduleId);
  }

  /**
   * Encuentra palabras clave comunes
   */
  private findCommonKeywords(data: FineTuningData[]): string[] {
    const keywordFrequency: Map<string, number> = new Map();

    for (const item of data) {
      const keywords = this.extractKeywords(item.queryText);
      for (const keyword of keywords) {
        keywordFrequency.set(keyword, (keywordFrequency.get(keyword) || 0) + 1);
      }
    }

    const threshold = Math.ceil(data.length * 0.2); // Al menos 20% de frecuencia
    return Array.from(keywordFrequency.entries())
      .filter(([_, frequency]) => frequency >= threshold)
      .map(([keyword, _]) => keyword);
  }

  /**
   * Verifica si un módulo necesita optimización
   */
  private needsOptimization(moduleId: string): boolean {
    // Criterios para determinar si necesita optimización
    const recentData = this.fineTuningData
      .filter(d => d.expectedModules.includes(moduleId))
      .filter(d => Date.now() - d.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000); // Últimos 7 días

    if (recentData.length < 3) return false;

    const averageFeedback = recentData.reduce((sum, d) => sum + d.userFeedback, 0) / recentData.length;
    return averageFeedback < 3.5; // Feedback promedio bajo
  }

  /**
   * Optimiza embedding de un módulo específico
   */
  private async optimizeModuleEmbedding(
    module: PromptModule,
    domainEmbedding: LegalDomainEmbedding
  ): Promise<void> {
    // Regenerar embedding especializado con datos actualizados
    const legalTerms = this.extractLegalTerms(module.content);
    const domainRelevance = this.calculateDomainRelevance(module.content, legalTerms);
    
    const optimizedEmbedding = await this.createDomainSpecializedEmbedding(
      domainEmbedding.originalEmbedding,
      legalTerms,
      domainRelevance
    );

    // Actualizar embedding de dominio
    domainEmbedding.domainSpecializedEmbedding = optimizedEmbedding;
    domainEmbedding.legalTerms = legalTerms;
    domainEmbedding.domainRelevance = domainRelevance;

    // Actualizar en base de datos
    await this.vectorDatabase.updateIndex(module.id, optimizedEmbedding);
  }

  /**
   * Calcula métricas de calidad
   */
  private calculateEmbeddingQuality(): number {
    const embeddings = Array.from(this.domainEmbeddings.values());
    if (embeddings.length === 0) return 0;

    const averageRelevance = embeddings.reduce((sum, e) => sum + e.domainRelevance, 0) / embeddings.length;
    return averageRelevance;
  }

  private calculateSearchAccuracy(): number {
    // Simular cálculo de precisión basado en feedback reciente
    const recentData = this.fineTuningData.filter(d => 
      Date.now() - d.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
    );

    if (recentData.length === 0) return 0.75; // Valor por defecto

    const averageFeedback = recentData.reduce((sum, d) => sum + d.userFeedback, 0) / recentData.length;
    return averageFeedback / 5; // Normalizar a 0-1
  }

  private calculateProcessingSpeed(): number {
    // Simular cálculo de velocidad de procesamiento
    return 850; // Operaciones por segundo (placeholder)
  }

  private calculateMemoryEfficiency(): number {
    const totalEmbeddings = this.domainEmbeddings.size;
    const cacheSize = this.vectorService.getCacheStats().size;
    
    // Eficiencia basada en ratio cache/total
    return totalEmbeddings > 0 ? Math.min(1, cacheSize / totalEmbeddings) : 0;
  }

  private calculateUserSatisfaction(): number {
    const recentData = this.fineTuningData.filter(d => 
      Date.now() - d.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000 // Últimos 30 días
    );

    if (recentData.length === 0) return 0.75; // Valor por defecto

    const averageFeedback = recentData.reduce((sum, d) => sum + d.userFeedback, 0) / recentData.length;
    return averageFeedback / 5; // Normalizar a 0-1
  }

  /**
   * Carga datos de optimización desde almacenamiento
   */
  private loadOptimizationData(): void {
    try {
      if (typeof localStorage === 'undefined') return;

      const data = localStorage.getItem('advancedVectorOptimization');
      if (data) {
        const parsed = JSON.parse(data);
        
        if (parsed.domainEmbeddings) {
          for (const [id, embedding] of parsed.domainEmbeddings) {
            this.domainEmbeddings.set(id, embedding);
          }
        }

        if (parsed.fineTuningData) {
          this.fineTuningData = parsed.fineTuningData.map((d: any) => ({
            ...d,
            timestamp: new Date(d.timestamp)
          }));
        }
      }
    } catch (error) {
      console.warn('Error cargando datos de optimización avanzada:', error);
    }
  }

  /**
   * Guarda datos de optimización en almacenamiento
   */
  private async saveOptimizationData(): Promise<void> {
    try {
      if (typeof localStorage === 'undefined') return;

      const data = {
        domainEmbeddings: Array.from(this.domainEmbeddings.entries()),
        fineTuningData: this.fineTuningData,
        savedAt: new Date().toISOString()
      };

      localStorage.setItem('advancedVectorOptimization', JSON.stringify(data));
    } catch (error) {
      console.warn('Error guardando datos de optimización avanzada:', error);
    }
  }
}
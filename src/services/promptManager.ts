import { VectorService, PromptModule } from './vectorService';
import { VectorDatabase } from './vectorDatabase';
import { vectorConfigService } from './vectorConfigService';
import { SemanticLearningService } from './semanticLearningService';
import { AdvancedVectorOptimizer } from './advancedVectorOptimizer';

export interface QueryAnalysis {
  embedding: number[];
  intent: string;
  complexity: number;
  legalArea: string[];
  requiresSpecialMode: boolean;
  detectedKeywords: string[];
}

export interface PromptBuildResult {
  finalPrompt: string;
  usedModules: PromptModule[];
  totalTokens: number;
  relevanceScore: number;
}

export class PromptManager {
  private vectorService: VectorService;
  private vectorDatabase: VectorDatabase;
  private semanticLearningService: SemanticLearningService;
  private advancedOptimizer: AdvancedVectorOptimizer;
  private basePrompt: string;

  constructor(vectorService: VectorService, vectorDatabase: VectorDatabase) {
    this.vectorService = vectorService;
    this.vectorDatabase = vectorDatabase;
    this.semanticLearningService = new SemanticLearningService(vectorDatabase);
    this.advancedOptimizer = new AdvancedVectorOptimizer(vectorService, vectorDatabase);
    this.basePrompt = this.getBasePrompt();
  }

  /**
   * Analiza una consulta del usuario
   */
  async analyzeQuery(query: string): Promise<QueryAnalysis> {
    // Generar embedding de la consulta
    const embedding = await this.vectorService.generateEmbedding(query);

    // Detectar intención
    const intent = this.detectIntent(query);

    // Evaluar complejidad
    const complexity = this.assessComplexity(query);

    // Detectar área legal
    const legalArea = this.detectLegalArea(query);

    // Verificar si requiere modo especial
    const requiresSpecialMode = this.detectSpecialMode(query);

    // Extraer palabras clave
    const detectedKeywords = this.extractKeywords(query);

    return {
      embedding,
      intent,
      complexity,
      legalArea,
      requiresSpecialMode,
      detectedKeywords
    };
  }

  /**
   * Selecciona módulos usando búsqueda semántica avanzada con aprendizaje
   */
  async selectModulesSemanticaly(analysis: QueryAnalysis): Promise<PromptModule[]> {
    const config = vectorConfigService.getCurrentConfig();
    
    // Usar búsqueda híbrida avanzada
    const hybridResult = await this.advancedOptimizer.performHybridSearch(
      analysis.intent, // Usar intent como query text
      analysis.embedding,
      config.modules.maxModulesPerQuery * 2
    );

    // Combinar resultados semánticos y de palabras clave
    let allMatches = [...hybridResult.semanticMatches];
    
    // Agregar matches de palabras clave como matches semánticos
    for (const keywordMatch of hybridResult.keywordMatches) {
      const existingMatch = allMatches.find(m => m.moduleId === keywordMatch.moduleId);
      if (existingMatch) {
        // Combinar scores si ya existe
        existingMatch.relevanceScore = (existingMatch.relevanceScore + keywordMatch.keywordScore) / 2;
      } else {
        // Agregar nuevo match
        allMatches.push({
          moduleId: keywordMatch.moduleId,
          similarity: keywordMatch.keywordScore,
          relevanceScore: keywordMatch.keywordScore
        });
      }
    }

    // Aplicar re-ranking dinámico basado en aprendizaje
    const rerankedMatches = await this.semanticLearningService.dynamicModuleReranking(
      allMatches,
      analysis.detectedKeywords
    );

    // Obtener recomendaciones basadas en clustering
    const clusterRecommendations = await this.semanticLearningService.getClusterBasedRecommendations(analysis.embedding);

    // Filtrar por threshold de similitud configurado
    const relevantModules = rerankedMatches
      .filter(match => match.similarity >= config.similarity.minSimilarity)
      .map(match => this.vectorDatabase.getModule(match.moduleId))
      .filter(Boolean) as PromptModule[];

    // Agregar módulos recomendados por clustering
    const recommendedModules = clusterRecommendations
      .map(moduleId => this.vectorDatabase.getModule(moduleId))
      .filter(Boolean) as PromptModule[];

    // Agregar módulos core (siempre activos) según configuración
    const coreModules = await this.vectorDatabase.getModulesByCategory('core');
    const selectedCoreModules = coreModules.slice(0, config.modules.minCoreModules);
    
    const allModules = [...selectedCoreModules, ...relevantModules, ...recommendedModules];

    // Remover duplicados
    const uniqueModules = this.removeDuplicateModules(allModules);

    // Aplicar lógica de selección inteligente con configuración
    const selectedModules = this.applyIntelligentSelection(uniqueModules, analysis);

    // Aplicar límites finales de configuración
    return this.applyConfigurationLimits(selectedModules);
  }

  /**
   * Construye el prompt óptimo combinando módulos
   */
  buildOptimalPrompt(modules: PromptModule[], maxTokens?: number): PromptBuildResult {
    const config = vectorConfigService.getCurrentConfig();
    const actualMaxTokens = maxTokens ?? config.tokens.maxTokensPerQuery;
    const baseTokens = config.tokens.basePromptTokens;
    const reserveTokens = config.tokens.responseTokenReserve;
    const availableTokens = actualMaxTokens - baseTokens - reserveTokens;
    
    let finalPrompt = this.basePrompt;
    const usedModules: PromptModule[] = [];
    let totalTokens = this.estimateTokens(this.basePrompt);
    let relevanceScore = 0;

    // Ordenar módulos por prioridad y relevancia con configuración
    const sortedModules = this.sortModulesByPriorityWithConfig(modules);

    for (const module of sortedModules) {
      // Aplicar límite de tokens por módulo de la configuración
      const moduleTokens = Math.min(module.metadata.maxTokens, config.tokens.maxTokensPerModule);
      
      // Verificar si podemos agregar este módulo sin exceder el límite
      if (totalTokens + moduleTokens <= actualMaxTokens && 
          (totalTokens - baseTokens) + moduleTokens <= availableTokens) {
        finalPrompt += '\n\n' + module.content;
        usedModules.push(module);
        totalTokens += moduleTokens;
        relevanceScore += this.calculateModuleRelevanceScore(module);
      }

      // Verificar límite máximo de módulos
      if (usedModules.length >= config.modules.maxModulesPerQuery) {
        break;
      }
    }

    // Actualizar métricas de configuración
    vectorConfigService.updateMetrics(
      Date.now(), // Placeholder para tiempo de procesamiento
      relevanceScore / usedModules.length || 0,
      totalTokens,
      false // Placeholder para cache hit
    );

    return {
      finalPrompt,
      usedModules,
      totalTokens,
      relevanceScore
    };
  }

  /**
   * Valida que el prompt no exceda límites de tokens
   */
  validateTokenLimits(prompt: string, maxTokens: number): boolean {
    const estimatedTokens = this.estimateTokens(prompt);
    return estimatedTokens <= maxTokens;
  }

  /**
   * Cachea embeddings de módulos
   */
  async cacheEmbeddings(modules: PromptModule[]): Promise<void> {
    const modulesWithoutEmbeddings = modules.filter(m => !m.embedding);
    
    if (modulesWithoutEmbeddings.length > 0) {
      console.log(`Generando embeddings para ${modulesWithoutEmbeddings.length} módulos...`);
      
      const texts = modulesWithoutEmbeddings.map(m => m.content);
      const embeddings = await this.vectorService.generateBatchEmbeddings(texts);
      
      // Asignar embeddings a módulos
      for (let i = 0; i < modulesWithoutEmbeddings.length; i++) {
        modulesWithoutEmbeddings[i].embedding = embeddings[i];
        await this.vectorDatabase.indexModule(modulesWithoutEmbeddings[i]);
      }
    }
  }

  /**
   * Detecta la intención de la consulta
   */
  private detectIntent(query: string): string {
    const lowerQuery = query.toLowerCase();

    // Patrones de intención
    const intentPatterns = {
      'analysis': [/analiz/i, /evaluar/i, /qué.*opciones/i, /cómo.*proceder/i],
      'drafting': [/redact/i, /escrib/i, /document/i, /carta/i, /contrato/i],
      'negotiation': [/negoci/i, /acuerdo/i, /propuesta/i, /oferta/i],
      'litigation': [/demand/i, /juicio/i, /tribunal/i, /recurso/i],
      'consultation': [/consult/i, /pregunt/i, /duda/i, /información/i]
    };

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => pattern.test(lowerQuery))) {
        return intent;
      }
    }

    return 'general';
  }

  /**
   * Evalúa la complejidad de la consulta
   */
  private assessComplexity(query: string): number {
    let complexity = 0;

    // Factores que aumentan complejidad
    const complexityFactors = [
      { pattern: /múltiple|varios|diferentes/i, weight: 0.2 },
      { pattern: /estrategia|táctica|plan/i, weight: 0.3 },
      { pattern: /riesgo|consecuencia|implicación/i, weight: 0.2 },
      { pattern: /jurisprudencia|precedente|doctrina/i, weight: 0.3 },
      { pattern: /\?.*\?/g, weight: 0.1 }, // Múltiples preguntas
    ];

    for (const factor of complexityFactors) {
      if (factor.pattern.test(query)) {
        complexity += factor.weight;
      }
    }

    // Longitud de la consulta también indica complejidad
    const lengthFactor = Math.min(query.length / 500, 0.3);
    complexity += lengthFactor;

    return Math.min(complexity, 1); // Normalizar entre 0 y 1
  }

  /**
   * Detecta el área legal de la consulta
   */
  private detectLegalArea(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    const areas: string[] = [];

    const areaPatterns = {
      'laboral': [/trabajo/i, /empleado/i, /despido/i, /salario/i, /lct/i],
      'civil': [/contrato/i, /propiedad/i, /daño/i, /responsabilidad/i, /cccn/i],
      'comercial': [/empresa/i, /sociedad/i, /comercio/i, /negocio/i],
      'penal': [/delito/i, /penal/i, /criminal/i, /denuncia/i],
      'administrativo': [/estado/i, /público/i, /administrativo/i, /municipal/i]
    };

    for (const [area, patterns] of Object.entries(areaPatterns)) {
      if (patterns.some(pattern => pattern.test(lowerQuery))) {
        areas.push(area);
      }
    }

    return areas.length > 0 ? areas : ['general'];
  }

  /**
   * Detecta si se requiere un modo especial
   */
  private detectSpecialMode(query: string): boolean {
    const specialModePatterns = [
      /modo.*estratega.*rojo/i,
      /red.*team/i,
      /análisis.*crítico/i,
      /evalúa.*debilidades/i
    ];

    return specialModePatterns.some(pattern => pattern.test(query));
  }

  /**
   * Extrae palabras clave de la consulta
   */
  private extractKeywords(query: string): string[] {
    // Palabras comunes a filtrar
    const stopWords = new Set([
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le',
      'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'una', 'como',
      'qué', 'cómo', 'cuál', 'dónde', 'cuándo', 'por', 'favor', 'gracias'
    ]);

    const words = query.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    return [...new Set(words)]; // Remover duplicados
  }

  /**
   * Remueve módulos duplicados
   */
  private removeDuplicateModules(modules: PromptModule[]): PromptModule[] {
    const seen = new Set<string>();
    return modules.filter(module => {
      if (seen.has(module.id)) {
        return false;
      }
      seen.add(module.id);
      return true;
    });
  }

  /**
   * Aplica selección inteligente basada en análisis
   */
  private applyIntelligentSelection(modules: PromptModule[], analysis: QueryAnalysis): PromptModule[] {
    // Filtrar módulos por área legal si es específica
    let filteredModules = modules;
    
    if (analysis.legalArea.length > 0 && !analysis.legalArea.includes('general')) {
      filteredModules = modules.filter(module => 
        analysis.legalArea.some(area => 
          module.metadata.keywords.some(keyword => 
            keyword.toLowerCase().includes(area)
          )
        ) || module.metadata.category === 'core'
      );
    }

    // Agregar módulos especiales si se requieren
    if (analysis.requiresSpecialMode) {
      const specialModules = modules.filter(m => m.metadata.category === 'modes');
      filteredModules = [...filteredModules, ...specialModules];
    }

    // Agregar módulos de análisis para consultas complejas
    if (analysis.complexity > 0.6) {
      const analysisModules = modules.filter(m => m.metadata.category === 'analysis');
      filteredModules = [...filteredModules, ...analysisModules];
    }

    return this.removeDuplicateModules(filteredModules);
  }

  /**
   * Aplica límites de configuración a los módulos seleccionados
   */
  private applyConfigurationLimits(modules: PromptModule[]): PromptModule[] {
    const config = vectorConfigService.getCurrentConfig();
    
    // Agrupar por categoría
    const modulesByCategory: Record<string, PromptModule[]> = {};
    for (const module of modules) {
      const category = module.metadata.category;
      if (!modulesByCategory[category]) {
        modulesByCategory[category] = [];
      }
      modulesByCategory[category].push(module);
    }

    // Aplicar límites por categoría
    const limitedModules: PromptModule[] = [];
    for (const [category, categoryModules] of Object.entries(modulesByCategory)) {
      const limit = category === 'modes' 
        ? config.modules.maxSpecializedModules 
        : config.modules.maxModulesPerCategory;
      
      const sortedCategoryModules = categoryModules.sort((a, b) => b.metadata.priority - a.metadata.priority);
      limitedModules.push(...sortedCategoryModules.slice(0, limit));
    }

    // Aplicar límite total
    return limitedModules
      .sort((a, b) => this.calculateModuleRelevanceScore(b) - this.calculateModuleRelevanceScore(a))
      .slice(0, config.modules.maxModulesPerQuery);
  }

  /**
   * Calcula score de relevancia de un módulo usando configuración
   */
  private calculateModuleRelevanceScore(module: PromptModule): number {
    const config = vectorConfigService.getCurrentConfig();
    const categoryWeight = config.categoryWeights[module.metadata.category as keyof typeof config.categoryWeights] || 1.0;
    
    return module.metadata.priority * categoryWeight;
  }

  /**
   * Ordena módulos por prioridad usando configuración
   */
  private sortModulesByPriorityWithConfig(modules: PromptModule[]): PromptModule[] {
    const config = vectorConfigService.getCurrentConfig();
    
    return modules.sort((a, b) => {
      // Usar pesos de categoría de la configuración
      const aWeight = config.categoryWeights[a.metadata.category as keyof typeof config.categoryWeights] || 1.0;
      const bWeight = config.categoryWeights[b.metadata.category as keyof typeof config.categoryWeights] || 1.0;
      
      const aScore = a.metadata.priority * aWeight;
      const bScore = b.metadata.priority * bWeight;
      
      return bScore - aScore;
    });
  }

  /**
   * Ordena módulos por prioridad (método legacy mantenido para compatibilidad)
   */
  private sortModulesByPriority(modules: PromptModule[]): PromptModule[] {
    return this.sortModulesByPriorityWithConfig(modules);
  }

  /**
   * Estima el número de tokens en un texto
   */
  private estimateTokens(text: string): number {
    // Estimación aproximada: ~4 caracteres por token en español
    return Math.ceil(text.length / 4);
  }

  /**
   * Registra feedback para el sistema de aprendizaje
   */
  async recordQueryFeedback(
    queryId: string,
    query: string,
    queryEmbedding: number[],
    selectedModules: string[],
    userRating: number,
    responseQuality: number,
    contextTags: string[] = []
  ): Promise<void> {
    await this.semanticLearningService.recordQueryFeedback({
      queryId,
      query,
      queryEmbedding,
      selectedModules,
      userRating,
      responseQuality,
      timestamp: new Date(),
      contextTags
    });
  }

  /**
   * Obtiene métricas de aprendizaje semántico
   */
  getLearningMetrics() {
    return this.semanticLearningService.getLearningMetrics();
  }

  /**
   * Obtiene efectividad de módulos
   */
  getModuleEffectiveness() {
    return this.semanticLearningService.getModuleEffectiveness();
  }

  /**
   * Obtiene clusters de consultas
   */
  getQueryClusters() {
    return this.semanticLearningService.getQueryClusters();
  }

  /**
   * Habilita o deshabilita el aprendizaje semántico
   */
  setLearningEnabled(enabled: boolean): void {
    this.semanticLearningService.setLearningEnabled(enabled);
  }

  /**
   * Exporta datos de aprendizaje
   */
  exportLearningData(): string {
    return this.semanticLearningService.exportLearningData();
  }

  /**
   * Importa datos de aprendizaje
   */
  async importLearningData(data: string): Promise<void> {
    await this.semanticLearningService.importLearningData(data);
  }

  /**
   * Genera embeddings especializados para dominio legal
   */
  async generateLegalSpecializedEmbeddings(): Promise<void> {
    const modules = this.vectorDatabase.getAllModules();
    await this.advancedOptimizer.generateLegalSpecializedEmbeddings(modules);
  }

  /**
   * Ejecuta fine-tuning de embeddings
   */
  async performFineTuning(): Promise<void> {
    await this.advancedOptimizer.performFineTuning();
  }

  /**
   * Optimiza embeddings existentes
   */
  async optimizeExistingEmbeddings() {
    return await this.advancedOptimizer.optimizeExistingEmbeddings();
  }

  /**
   * Registra datos para fine-tuning
   */
  recordFineTuningData(
    queryText: string,
    expectedModules: string[],
    userFeedback: number,
    contextTags: string[] = []
  ): void {
    this.advancedOptimizer.recordFineTuningData({
      queryText,
      expectedModules,
      userFeedback,
      contextTags,
      timestamp: new Date()
    });
  }

  /**
   * Obtiene métricas de optimización avanzada
   */
  getOptimizationMetrics() {
    return this.advancedOptimizer.getOptimizationMetrics();
  }

  /**
   * Exporta datos de optimización avanzada
   */
  exportOptimizationData(): string {
    return this.advancedOptimizer.exportOptimizationData();
  }

  /**
   * Importa datos de optimización avanzada
   */
  async importOptimizationData(data: string): Promise<void> {
    await this.advancedOptimizer.importOptimizationData(data);
  }

  /**
   * Obtiene el prompt base mínimo
   */
  private getBasePrompt(): string {
    return `Eres un abogado profesional especializado en derecho argentino (civil, laboral y comercial). 
Proporciona asesoramiento legal claro, preciso y profesional basado en la legislación argentina vigente.
Mantén un tono formal pero accesible, y sugiere consulta personalizada con Legalito para casos complejos.`;
  }
}
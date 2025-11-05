import { VectorService } from './vectorService';
import { VectorDatabase } from './vectorDatabase';
import { ModuleLoader } from './moduleLoader';

export class EmbeddingInitializer {
  private vectorService: VectorService;
  private vectorDatabase: VectorDatabase;
  private moduleLoader: ModuleLoader;

  constructor(huggingFaceApiKey: string) {
    this.vectorService = new VectorService(huggingFaceApiKey);
    this.vectorDatabase = new VectorDatabase();
    this.moduleLoader = new ModuleLoader();
  }

  /**
   * Inicializa todo el sistema vectorial
   */
  async initializeSystem(): Promise<void> {
    console.log('🚀 Iniciando sistema vectorial...');

    try {
      // 1. Cargar todos los módulos
      console.log('📁 Cargando módulos de prompts...');
      const modules = await this.moduleLoader.loadAllModules();
      console.log(`✅ Cargados ${modules.length} módulos`);

      // 2. Verificar si ya existen embeddings en cache
      const stats = this.vectorDatabase.getIndexStats();
      if (stats.totalModules === modules.length) {
        console.log('✅ Embeddings ya existen en cache, sistema listo');
        return;
      }

      // 3. Generar embeddings para módulos que no los tienen
      console.log('🔄 Generando embeddings...');
      await this.generateEmbeddings(modules);

      // 4. Indexar todos los módulos
      console.log('📊 Indexando módulos en base vectorial...');
      await this.indexModules(modules);

      // 5. Optimizar índice
      console.log('⚡ Optimizando índice vectorial...');
      await this.vectorDatabase.optimizeIndex();

      console.log('🎉 Sistema vectorial inicializado correctamente');
      this.printSystemStats();

    } catch (error) {
      console.error('❌ Error inicializando sistema vectorial:', error);
      throw error;
    }
  }

  /**
   * Genera embeddings para todos los módulos
   */
  private async generateEmbeddings(modules: any[]): Promise<void> {
    const modulesWithoutEmbeddings = modules.filter(m => !m.embedding);
    
    if (modulesWithoutEmbeddings.length === 0) {
      console.log('✅ Todos los módulos ya tienen embeddings');
      return;
    }

    console.log(`🔄 Generando embeddings para ${modulesWithoutEmbeddings.length} módulos...`);

    // Generar embeddings en lotes para optimizar
    const batchSize = 3; // Procesar de a 3 para evitar rate limiting
    
    for (let i = 0; i < modulesWithoutEmbeddings.length; i += batchSize) {
      const batch = modulesWithoutEmbeddings.slice(i, i + batchSize);
      
      console.log(`📊 Procesando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(modulesWithoutEmbeddings.length/batchSize)}`);
      
      // Generar embeddings para el lote
      const batchPromises = batch.map(async (module, index) => {
        try {
          console.log(`  🔄 Generando embedding para: ${module.id}`);
          const embedding = await this.vectorService.generateEmbedding(module.content);
          module.embedding = embedding;
          console.log(`  ✅ Embedding generado para: ${module.id} (${embedding.length} dimensiones)`);
          return module;
        } catch (error) {
          console.error(`  ❌ Error generando embedding para ${module.id}:`, error);
          throw error;
        }
      });

      await Promise.all(batchPromises);
      
      // Pausa entre lotes para evitar rate limiting
      if (i + batchSize < modulesWithoutEmbeddings.length) {
        console.log('⏳ Pausa para evitar rate limiting...');
        await this.sleep(2000); // 2 segundos entre lotes
      }
    }

    console.log('✅ Todos los embeddings generados correctamente');
  }

  /**
   * Indexa todos los módulos en la base vectorial
   */
  private async indexModules(modules: any[]): Promise<void> {
    for (const module of modules) {
      if (module.embedding) {
        await this.vectorDatabase.indexModule(module);
        console.log(`📊 Indexado: ${module.id}`);
      }
    }
  }

  /**
   * Prueba el sistema con una consulta de ejemplo
   */
  async testSystem(query: string = "¿Cómo analizar un caso de despido laboral?"): Promise<void> {
    console.log('\n🧪 Probando sistema vectorial...');
    console.log(`📝 Consulta de prueba: "${query}"`);

    try {
      // Generar embedding de la consulta
      const queryEmbedding = await this.vectorService.generateEmbedding(query);
      console.log(`✅ Embedding de consulta generado (${queryEmbedding.length} dimensiones)`);

      // Buscar módulos similares
      const searchResult = await this.vectorDatabase.searchSimilar(queryEmbedding, 5);
      console.log(`🔍 Encontrados ${searchResult.modules.length} módulos relevantes:`);

      searchResult.modules.forEach((module, index) => {
        const similarity = searchResult.similarities[index];
        console.log(`  📊 ${module.id} - Similitud: ${(similarity * 100).toFixed(1)}%`);
      });

      console.log(`🎯 Relevancia total: ${searchResult.totalRelevance.toFixed(3)}`);
      console.log('✅ Prueba del sistema completada exitosamente');

    } catch (error) {
      console.error('❌ Error en prueba del sistema:', error);
      throw error;
    }
  }

  /**
   * Obtiene las instancias de los servicios
   */
  getServices() {
    return {
      vectorService: this.vectorService,
      vectorDatabase: this.vectorDatabase,
      moduleLoader: this.moduleLoader
    };
  }

  /**
   * Imprime estadísticas del sistema
   */
  private printSystemStats(): void {
    const stats = this.vectorDatabase.getIndexStats();
    console.log('\n📊 Estadísticas del Sistema:');
    console.log(`  📁 Total de módulos: ${stats.totalModules}`);
    console.log(`  🏷️  Categorías: ${stats.totalCategories}`);
    console.log(`  📊 Módulos por categoría:`);
    
    Object.entries(stats.modulesByCategory).forEach(([category, count]) => {
      console.log(`    ${category}: ${count} módulos`);
    });
    
    if (stats.lastUpdated) {
      console.log(`  🕒 Última actualización: ${stats.lastUpdated.toLocaleString()}`);
    }

    const cacheStats = this.vectorService.getCacheStats();
    console.log(`  💾 Cache de embeddings: ${cacheStats.size} entradas`);
  }

  /**
   * Pausa la ejecución
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Limpia todo el sistema (útil para reinicializar)
   */
  async clearSystem(): Promise<void> {
    console.log('🧹 Limpiando sistema vectorial...');
    this.vectorDatabase.clearCache();
    this.vectorService.clearCache();
    console.log('✅ Sistema limpiado');
  }
}
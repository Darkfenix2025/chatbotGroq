import { PromptModule } from './vectorService';
import moduleMetadata from '../prompts/config/module-metadata.json';
import { PROMPT_CONTENTS } from '../prompts/promptContents';

export class ModuleLoader {
  private modules: Map<string, PromptModule> = new Map();

  /**
   * Carga todos los módulos de prompts desde archivos
   */
  async loadAllModules(): Promise<PromptModule[]> {
    const modules: PromptModule[] = [];

    for (const [moduleId, metadata] of Object.entries(moduleMetadata.modules)) {
      try {
        const module = await this.loadModule(moduleId, metadata as any);
        modules.push(module);
        this.modules.set(moduleId, module);
      } catch (error) {
        console.error(`Error cargando módulo ${moduleId}:`, error);
      }
    }

    console.log(`Cargados ${modules.length} módulos de prompts`);
    return modules;
  }

  /**
   * Carga un módulo específico
   */
  async loadModule(moduleId: string, metadata: any): Promise<PromptModule> {
    // En un entorno real, esto cargaría desde archivos
    // Por ahora, vamos a usar el contenido que ya creamos
    const content = await this.getModuleContent(moduleId);

    const module: PromptModule = {
      id: moduleId,
      name: metadata.description || moduleId,
      content: content,
      metadata: {
        category: metadata.category,
        priority: metadata.priority,
        maxTokens: metadata.maxTokens,
        keywords: metadata.keywords || []
      }
    };

    return module;
  }

  /**
   * Obtiene el contenido de un módulo desde el sistema unificado
   */
  private async getModuleContent(moduleId: string): Promise<string> {
    // Primero intentar obtener desde PROMPT_CONTENTS (contenido real)
    if (PROMPT_CONTENTS[moduleId]) {
      console.log(`✅ Cargando módulo ${moduleId} desde contenido unificado`);
      return PROMPT_CONTENTS[moduleId];
    }

    // Si no está en PROMPT_CONTENTS, intentar cargar desde archivos
    try {
      const filePath = `/src/prompts/${moduleId}`;
      const response = await fetch(filePath);
      
      if (!response.ok) {
        throw new Error(`No se pudo cargar el archivo: ${filePath}`);
      }
      
      const content = await response.text();
      console.log(`✅ Cargando módulo ${moduleId} desde archivo`);
      return content.trim();
      
    } catch (error) {
      console.warn(`⚠️ Error cargando ${moduleId}, usando contenido de fallback:`, error);
      
      // Último recurso: contenido de fallback
      return this.getFallbackContent(moduleId);
    }
  }

  /**
   * Contenido de fallback básico si no se pueden cargar los archivos
   */
  private getFallbackContent(moduleId: string): string {
    console.warn(`🚨 Usando contenido de fallback básico para ${moduleId}`);
    
    // Contenido mínimo de fallback
    const basicFallback = `Módulo ${moduleId}

Este es un contenido de fallback básico para el módulo ${moduleId}.
El sistema no pudo cargar el contenido real desde los archivos de prompts.

Por favor, verifica que:
1. El archivo ${moduleId} existe en la carpeta src/prompts/
2. El contenido está incluido en promptContents.ts
3. La configuración del módulo es correcta en module-metadata.json

Eres un asistente legal especializado en derecho argentino.
Proporciona asesoramiento legal preciso y profesional.`;

    return basicFallback;
  }

  /**
   * Obtiene un módulo cargado por ID
   */
  getModule(moduleId: string): PromptModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Obtiene todos los módulos cargados
   */
  getAllModules(): PromptModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Obtiene módulos por categoría
   */
  getModulesByCategory(category: string): PromptModule[] {
    return Array.from(this.modules.values()).filter(
      module => module.metadata.category === category
    );
  }
}
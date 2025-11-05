# Documento de Diseño - Sistema de Prompts Modulares

## Visión General

Este diseño implementa un sistema inteligente de gestión de prompts que divide el prompt legal complejo en módulos especializados, manteniendo toda su potencia mientras optimiza el rendimiento técnico. El sistema detectará automáticamente el contexto de cada consulta y activará solo los módulos relevantes.

## Arquitectura

### Arquitectura Actual
```
Usuario → Consulta → Prompt Completo (muy largo) → Gemini → Error/Límite
```

### Arquitectura Objetivo
```
Usuario → Consulta → Vectorización → Búsqueda Semántica → Ranking de Módulos → Prompt Dinámico → Gemini → Respuesta
                                ↓
                        Base de Vectores (Embeddings de Módulos)
```

## Componentes y Interfaces

### 1. Estructura de Archivos de Prompts

```
src/prompts/
├── core/
│   ├── base-agent.txt           # ADN básico del agente legal
│   ├── legal-context.txt        # Contexto legal argentino
│   └── interaction-style.txt    # Estilo de comunicación
├── analysis/
│   ├── strategic-360.txt        # Análisis estratégico 360°
│   ├── risk-assessment.txt      # Análisis de riesgo
│   └── case-reasoning.txt       # Razonamiento de casos
├── tactics/
│   ├── negotiation.txt          # Tácticas de negociación
│   ├── litigation.txt           # Tácticas de litigio
│   └── document-drafting.txt    # Redacción de documentos
├── modes/
│   ├── red-team.txt            # Modo Estratega Rojo
│   ├── collaborative.txt       # Modo colaborativo
│   └── technical.txt           # Modo técnico
└── triggers/
    ├── keywords.json           # Palabras clave por módulo
    ├── patterns.json           # Patrones de activación
    └── combinations.json       # Combinaciones de módulos
```

### 2. Sistema de Vectorización con EmbeddingGemma

**Ubicación:** `src/services/vectorService.ts`

```typescript
interface PromptModule {
  id: string;
  name: string;
  content: string;
  embedding: number[]; // 300 dimensiones para embeddinggemma-300m
  metadata: {
    category: string;
    priority: number;
    maxTokens: number;
    keywords: string[];
  };
}

interface SemanticMatch {
  moduleId: string;
  similarity: number;
  relevanceScore: number;
}

interface HuggingFaceConfig {
  model: 'google/embeddinggemma-300m';
  apiKey: string;
  maxLength: number;
}

class VectorService {
  private hfConfig: HuggingFaceConfig;
  
  constructor(apiKey: string);
  generateEmbedding(text: string): Promise<number[]>
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>
  calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number
  findSimilarModules(queryEmbedding: number[], threshold: number): SemanticMatch[]
  rankModules(matches: SemanticMatch[], maxTokens: number): PromptModule[]
}
```

### 3. Gestor de Prompts Inteligente

**Ubicación:** `src/services/promptManager.ts`

```typescript
interface QueryAnalysis {
  embedding: number[];
  intent: string;
  complexity: number;
  legalArea: string[];
  requiresSpecialMode: boolean;
}

class PromptManager {
  analyzeQuery(query: string): Promise<QueryAnalysis>
  selectModulesSemanticaly(analysis: QueryAnalysis): Promise<PromptModule[]>
  buildOptimalPrompt(modules: PromptModule[], basePrompt: string): string
  validateTokenLimits(prompt: string, maxTokens: number): boolean
  cacheEmbeddings(modules: PromptModule[]): void
}
```

### 4. Base de Datos Vectorial

**Ubicación:** `src/services/vectorDatabase.ts`

```typescript
interface VectorIndex {
  moduleId: string;
  embedding: number[];
  metadata: Record<string, any>;
  lastUpdated: Date;
}

interface SearchResult {
  modules: PromptModule[];
  similarities: number[];
  totalRelevance: number;
}

class VectorDatabase {
  indexModule(module: PromptModule): Promise<void>
  searchSimilar(queryEmbedding: number[], topK: number): Promise<SearchResult>
  updateIndex(moduleId: string, newEmbedding: number[]): Promise<void>
  getModulesByCategory(category: string): Promise<PromptModule[]>
  optimizeIndex(): Promise<void>
}
```

## Modelos de Datos

### Mapeo de Prompt Original a Módulos

| Sección Original | Módulo Destino | Archivo |
|------------------|----------------|---------|
| SECCIÓN 1: NÚCLEO DEL SISTEMA | core/base-agent.txt | Siempre activo |
| SECCIÓN 2: ARQUITECTURA DEL RAZONAMIENTO | analysis/strategic-360.txt | Consultas complejas |
| SECCIÓN 3: BASE DE CONOCIMIENTO | core/legal-context.txt | Siempre activo |
| SECCIÓN 4: PROTOCOLO DE INTERACCIÓN | core/interaction-style.txt | Siempre activo |
| SECCIÓN 5: ARSENAL TÁCTICO | tactics/*.txt | Según contexto |
| SECCIÓN 6: MODO ESTRATEGA ROJO | modes/red-team.txt | Activación explícita |
| SECCIÓN 7: DIRECTIVAS OPERATIVAS | core/base-agent.txt | Siempre activo |

### Lógica de Activación de Módulos

```typescript
const ACTIVATION_RULES = {
  'analysis/strategic-360.txt': {
    keywords: ['análisis', 'estrategia', 'evaluar', 'riesgo'],
    patterns: [/qué.*opciones/i, /cómo.*proceder/i],
    minComplexity: 0.6
  },
  'tactics/negotiation.txt': {
    keywords: ['negociar', 'acuerdo', 'propuesta', 'oferta'],
    patterns: [/cómo.*negociar/i, /estrategia.*negociación/i],
    contexts: ['negotiation']
  },
  'modes/red-team.txt': {
    explicit: ['activa modo estratega rojo', 'modo red team'],
    never_auto: true
  }
};
```

## Estrategia de Optimización

### 1. Prompt Base Mínimo Viable

El prompt base incluirá solo:
- Identidad del agente (abogado argentino especializado)
- Áreas de especialización (civil, laboral, comercial)
- Estilo de comunicación básico
- Directivas de seguridad y ética

### 2. Carga Dinámica Inteligente

```typescript
class SmartLoader {
  // Carga módulos según prioridad y límite de tokens
  loadOptimalModules(context: PromptContext, tokenLimit: number): PromptModule[]
  
  // Cache de módulos frecuentemente usados
  getCachedModule(moduleId: string): PromptModule | null
  
  // Predicción de módulos necesarios
  predictNextModules(currentModules: string[], query: string): string[]
}
```

### 3. Métricas y Monitoreo

```typescript
interface PromptMetrics {
  moduleUsage: Record<string, number>;
  tokenConsumption: Record<string, number>;
  responseQuality: Record<string, number>;
  activationAccuracy: number;
}
```

## Arquitectura Vectorial

### 1. Inicialización del Sistema
```
Módulos de Prompt → Generación de Embeddings → Indexación Vectorial → Cache en Memoria
```

### 2. Procesamiento de Consulta
```
Consulta Usuario → Embedding de Consulta → Búsqueda Semántica → Ranking por Similitud
```

### 3. Selección Inteligente
```
Módulos Candidatos → Análisis de Relevancia → Optimización de Tokens → Combinación Óptima
```

### 4. Construcción y Respuesta
```
Prompt Base + Módulos Seleccionados → Validación → Envío a Gemini → Respuesta Final
```

## Flujo de Procesamiento Vectorial

### 1. Pre-procesamiento (Una vez al inicio)
```typescript
// Generar embeddings para todos los módulos
for (const module of promptModules) {
  const embedding = await vectorService.generateEmbedding(module.content);
  await vectorDatabase.indexModule({...module, embedding});
}
```

### 2. Procesamiento de Consulta con EmbeddingGemma
```typescript
// 1. Vectorizar consulta del usuario usando EmbeddingGemma
const queryEmbedding = await vectorService.generateEmbedding(userQuery);

// 2. Búsqueda semántica en base vectorial local
const searchResult = await vectorDatabase.searchSimilar(queryEmbedding, topK=5);

// 3. Selección inteligente con límites de tokens
const selectedModules = promptManager.selectOptimalModules(
  searchResult.modules, 
  maxTokens=4000
);

// 4. Construcción del prompt final
const finalPrompt = promptManager.buildPrompt(basePrompt, selectedModules);
```

### 3. Configuración de Hugging Face
```typescript
// Configuración para EmbeddingGemma
const EMBEDDING_CONFIG = {
  model: 'google/embeddinggemma-300m',
  apiUrl: 'https://api-inference.huggingface.co/models/google/embeddinggemma-300m',
  dimensions: 300,
  maxInputLength: 512,
  batchSize: 10
};

// Ejemplo de llamada a la API
const response = await fetch(EMBEDDING_CONFIG.apiUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    inputs: [text],
    options: { wait_for_model: true }
  })
});
```

### 3. Optimizaciones de Rendimiento
```typescript
interface CacheStrategy {
  embeddingCache: Map<string, number[]>;
  moduleCache: Map<string, PromptModule>;
  similarityCache: Map<string, SemanticMatch[]>;
}

class PerformanceOptimizer {
  // Cache de embeddings frecuentes
  getCachedEmbedding(text: string): number[] | null
  
  // Pre-cálculo de similitudes comunes
  precomputeSimilarities(commonQueries: string[]): void
  
  // Optimización de índice vectorial
  optimizeVectorIndex(): Promise<void>
}
```

## Configuración y Personalización

### Variables de Configuración

```typescript
interface PromptConfig {
  maxTokensPerQuery: number;
  defaultModules: string[];
  similarityThreshold: number;
  cacheSize: number;
  enableLearning: boolean;
  huggingFace: {
    apiKey: string;
    model: 'google/embeddinggemma-300m';
    maxBatchSize: number;
    timeout: number;
  };
}
```

### Variables de Entorno Requeridas

```env
# API Keys
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_HUGGING_FACE_API_KEY=your_hf_key_here

# Configuración Vectorial
VITE_SIMILARITY_THRESHOLD=0.7
VITE_MAX_MODULES_PER_QUERY=5
VITE_EMBEDDING_CACHE_SIZE=1000
```

### Archivos de Configuración

```json
// src/prompts/config/activation-rules.json
{
  "global": {
    "maxTokens": 4000,
    "alwaysActive": ["core/base-agent.txt", "core/legal-context.txt"]
  },
  "modules": {
    "analysis/strategic-360.txt": {
      "priority": 1,
      "triggers": ["análisis", "estrategia", "evaluar"],
      "minConfidence": 0.7
    }
  }
}
```

## Migración del Prompt Actual

### Fase 1: Extracción
1. Dividir el prompt actual en secciones lógicas
2. Crear archivos .txt para cada sección
3. Definir reglas de activación iniciales

### Fase 2: Implementación
1. Desarrollar PromptManager y ContextAnalyzer
2. Integrar con GeminiService existente
3. Implementar sistema de métricas

### Fase 3: Optimización
1. Ajustar reglas basado en uso real
2. Optimizar combinaciones de módulos
3. Implementar aprendizaje automático

### Fase 4: Validación
1. Comparar respuestas con prompt original
2. Ajustar hasta lograr paridad funcional
3. Optimizar rendimiento final
# Sistema de Configuración Vectorial

Este documento describe el sistema de configuración vectorial implementado para el chatbot legal, que permite ajustar dinámicamente los parámetros de selección semántica de módulos de prompts.

## Visión General

El sistema de configuración vectorial proporciona control granular sobre:

- **Thresholds de similitud**: Controla qué tan similares deben ser los módulos para ser considerados relevantes
- **Límites de tokens**: Gestiona el uso de tokens para optimizar costos y rendimiento
- **Límites de módulos**: Controla cuántos módulos se pueden activar simultáneamente
- **Pesos y prioridades**: Define la importancia relativa de diferentes factores en el ranking
- **Configuración de rendimiento**: Optimiza cache y timeouts

## Arquitectura

### Componentes Principales

1. **VectorConfig**: Interfaz principal de configuración
2. **VectorConfigManager**: Gestor de configuración con historial
3. **VectorConfigService**: Servicio de alto nivel con métricas y optimización
4. **VectorConfigUI**: Utilidades para interfaz de usuario
5. **VectorConfigValidator**: Validación de configuraciones

### Estructura de Configuración

```typescript
interface VectorConfig {
  similarity: SimilarityThresholds;
  tokens: TokenLimits;
  modules: ModuleLimits;
  categoryWeights: CategoryWeights;
  rankingWeights: RankingWeights;
  performance: PerformanceConfig;
}
```

## Configuraciones Disponibles

### Thresholds de Similitud

- `minSimilarity`: Threshold mínimo para considerar un módulo relevante (0-1)
- `highConfidence`: Threshold para módulos de alta confianza (0-1)
- `coreActivation`: Threshold para activación automática de módulos core (0-1)
- `specializedModules`: Threshold específico para módulos especializados (0-1)

### Límites de Tokens

- `maxTokensPerQuery`: Límite máximo de tokens por consulta completa
- `basePromptTokens`: Tokens reservados para el prompt base
- `maxTokensPerModule`: Límite de tokens por módulo individual
- `responseTokenReserve`: Tokens reservados para la respuesta del modelo

### Límites de Módulos

- `maxModulesPerQuery`: Número máximo de módulos por consulta
- `minCoreModules`: Número mínimo de módulos core siempre activos
- `maxModulesPerCategory`: Número máximo de módulos por categoría
- `maxSpecializedModules`: Número máximo de módulos especializados

### Pesos por Categoría

- `core`: Peso para módulos core (siempre activos)
- `analysis`: Peso para módulos de análisis
- `tactics`: Peso para módulos tácticos
- `modes`: Peso para módulos especiales/modos

### Pesos de Ranking

- `semanticSimilarity`: Peso de la similitud semántica (0-1)
- `modulePriority`: Peso de la prioridad del módulo (0-1)
- `categoryWeight`: Peso de la categoría del módulo (0-1)
- `keywordMatch`: Peso de coincidencia de palabras clave (0-1)
- `recentUsage`: Peso del uso reciente del módulo (0-1)

*Nota: Los pesos de ranking deben sumar aproximadamente 1.0*

## Presets Predefinidos

### FAST (Rápido)
- Optimizado para velocidad de respuesta
- Thresholds más altos, menos módulos
- Cache más grande

### PRECISE (Preciso)
- Optimizado para precisión y cobertura
- Thresholds más bajos, más módulos
- Mayor límite de tokens

### BALANCED (Balanceado)
- Balance entre velocidad y precisión
- Configuración por defecto recomendada

### COMPLEX (Complejo)
- Para consultas complejas
- Permite más módulos y tokens
- Thresholds más permisivos

## Uso Básico

### Configuración Programática

```typescript
import { vectorConfigService } from './services/vectorConfigService';

// Obtener configuración actual
const config = vectorConfigService.getCurrentConfig();

// Actualizar configuración
vectorConfigService.updateConfig({
  similarity: { minSimilarity: 0.6 },
  tokens: { maxTokensPerQuery: 5000 }
});

// Cargar preset
vectorConfigService.loadPreset('FAST');

// Crear perfil personalizado
vectorConfigService.createProfile(
  'mi-perfil',
  'Configuración personalizada',
  customConfig
);
```

### Configuración por Entorno

El sistema carga automáticamente configuraciones específicas por entorno desde `src/config/vectorSettings.json`:

- `development`: Configuración para desarrollo (más permisiva)
- `production`: Configuración para producción (optimizada)
- `testing`: Configuración para pruebas (límites reducidos)

### Interfaz de Usuario

```typescript
import { VectorConfigPanel } from './components/VectorConfigPanel';

// Componente React para configuración
<VectorConfigPanel onConfigChange={(config) => console.log(config)} />
```

## Métricas y Monitoreo

El sistema recopila métricas automáticamente:

- Número de consultas procesadas
- Tiempo promedio de procesamiento
- Precisión promedio de selección
- Uso promedio de tokens
- Tasa de aciertos del cache

### Optimización Automática

```typescript
// Obtener configuración optimizada basada en métricas
const optimizedConfig = vectorConfigService.autoOptimizeConfig();

// Aplicar optimización automática
vectorConfigService.applyAutoOptimization();
```

## Validación

Todas las configuraciones se validan automáticamente:

```typescript
import { VectorConfigValidator } from './config/vectorConfig';

const validation = VectorConfigValidator.validate(config);
if (!validation.isValid) {
  console.log('Errores:', validation.errors);
}
```

## Exportar/Importar

```typescript
// Exportar configuración completa
const exportedConfig = vectorConfigService.exportConfiguration();

// Importar configuración
vectorConfigService.importConfiguration(exportedConfig);
```

## Integración con Servicios Existentes

El sistema se integra automáticamente con:

- `VectorService`: Usa thresholds y límites configurados
- `VectorDatabase`: Aplica filtros basados en configuración
- `PromptManager`: Utiliza pesos y límites para selección

## Mejores Prácticas

### Configuración Inicial

1. Comenzar con el preset `BALANCED`
2. Monitorear métricas durante una semana
3. Ajustar basado en patrones de uso observados
4. Crear perfil personalizado con ajustes

### Optimización de Rendimiento

1. Ajustar `embeddingCacheSize` basado en memoria disponible
2. Usar `batchSize` apropiado para la API de Hugging Face
3. Configurar `cacheTTLMinutes` según frecuencia de cambios

### Optimización de Precisión

1. Reducir `minSimilarity` si se pierden módulos relevantes
2. Aumentar `maxModulesPerQuery` para consultas complejas
3. Ajustar pesos de categoría según importancia del dominio

### Optimización de Costos

1. Reducir `maxTokensPerQuery` y `maxTokensPerModule`
2. Aumentar `minSimilarity` para ser más selectivo
3. Optimizar `responseTokenReserve` según longitud típica de respuestas

## Troubleshooting

### Configuración Inválida

- Verificar que los pesos de ranking sumen ~1.0
- Asegurar que `highConfidence > minSimilarity`
- Validar que hay suficientes tokens para módulos

### Rendimiento Lento

- Reducir `maxModulesPerQuery`
- Aumentar `minSimilarity`
- Incrementar `embeddingCacheSize`

### Baja Precisión

- Reducir `minSimilarity`
- Aumentar `maxModulesPerQuery`
- Ajustar pesos de ranking

### Uso Excesivo de Tokens

- Reducir `maxTokensPerModule`
- Disminuir `maxModulesPerQuery`
- Optimizar `responseTokenReserve`

## Desarrollo y Extensión

### Agregar Nuevos Parámetros

1. Actualizar interfaces en `vectorConfig.ts`
2. Agregar validación en `VectorConfigValidator`
3. Actualizar presets y configuración por defecto
4. Integrar con servicios relevantes

### Crear Nuevos Presets

```typescript
export const CUSTOM_PRESET: VectorConfig = {
  // ... configuración personalizada
};

// Agregar a VECTOR_CONFIG_PRESETS
```

### Métricas Personalizadas

Extender `ConfigurationMetrics` para agregar nuevas métricas de monitoreo.

## Testing

Ejecutar las pruebas del sistema:

```bash
npx tsx src/test-vector-config.ts
```

Las pruebas validan:
- Configuraciones por defecto y presets
- Validación de configuraciones
- Funcionalidad de gestión de perfiles
- Optimización automática
- Exportar/importar
- Integración con servicios

## Variables de Entorno

```env
# Configuración vectorial (opcional)
VITE_VECTOR_CONFIG_PRESET=BALANCED
VITE_VECTOR_CONFIG_AUTO_OPTIMIZE=true
VITE_VECTOR_CONFIG_METRICS_ENABLED=true
```

## Conclusión

El sistema de configuración vectorial proporciona control completo sobre el comportamiento del sistema de selección semántica de módulos, permitiendo optimizar tanto el rendimiento como la precisión según las necesidades específicas del chatbot legal.

Para más información, consultar los archivos de código fuente en:
- `src/config/vectorConfig.ts`
- `src/services/vectorConfigService.ts`
- `src/services/vectorConfigUI.ts`
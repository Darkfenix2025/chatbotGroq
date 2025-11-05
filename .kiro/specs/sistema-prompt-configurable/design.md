# Documento de Diseño

## Visión General

Este diseño describe la migración del chatbot de Legalito desde la API de Groq hacia la API de Gemini, utilizando el modelo "gemini-2.5-pro". La migración mantendrá toda la funcionalidad existente mientras mejora la calidad de las respuestas y proporciona una base más sólida para futuras mejoras.

## Arquitectura

### Arquitectura Actual
```
Usuario → ChatInput → App.tsx → API Groq → Respuesta → ChatMessage
```

### Arquitectura Objetivo
```
Usuario → ChatInput → App.tsx → API Gemini → Respuesta → ChatMessage
```

La arquitectura general se mantiene igual, solo cambia el proveedor de la API y el formato de las peticiones/respuestas.

## Componentes y Interfaces

### 1. Configuración de API

**Ubicación:** `src/config/gemini.ts`

```typescript
interface GeminiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}
```

### 2. Servicio de API Gemini

**Ubicación:** `src/services/geminiService.ts`

```typescript
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

class GeminiService {
  sendMessage(messages: Message[], systemPrompt: string): Promise<string>
  formatMessagesForGemini(messages: Message[], systemPrompt: string): GeminiMessage[]
  handleGeminiResponse(response: GeminiResponse): string
}
```

### 3. Modificaciones en App.tsx

- Reemplazar la lógica de Groq con llamadas al GeminiService
- Actualizar el manejo de variables de entorno (VITE_GEMINI_API_KEY)
- Mantener el mismo flujo de manejo de estados y errores

## Modelos de Datos

### Mensaje del Sistema para Gemini

Gemini maneja el prompt del sistema de manera diferente a Groq. En lugar de un mensaje separado con role "system", se incluye como parte del primer mensaje del usuario o se prepende al contexto.

```typescript
// Formato actual (Groq)
{
  role: "system",
  content: systemPrompt
}

// Formato objetivo (Gemini)
{
  role: "user",
  parts: [{ text: `${systemPrompt}\n\nUsuario: ${userMessage}` }]
}
```

### Mapeo de Roles

| Groq | Gemini |
|------|--------|
| "user" | "user" |
| "assistant" | "model" |
| "system" | Se integra en el primer mensaje |

## Manejo de Errores

### Tipos de Errores Específicos de Gemini

1. **Error de Autenticación (401):** API key inválida o faltante
2. **Error de Cuota (429):** Límite de rate limiting excedido
3. **Error de Modelo (400):** Parámetros inválidos o modelo no disponible
4. **Error de Contenido (400):** Contenido bloqueado por políticas de seguridad

### Estrategia de Manejo

```typescript
interface ErrorHandler {
  handleAuthError(): void;
  handleRateLimitError(): void;
  handleContentError(): void;
  handleGenericError(error: unknown): void;
}
```

## Estrategia de Testing

### Tests Unitarios
- Formateo correcto de mensajes para Gemini
- Manejo de respuestas de la API
- Manejo de diferentes tipos de errores

### Tests de Integración
- Flujo completo de envío y recepción de mensajes
- Validación de la configuración de API key
- Comportamiento con diferentes tipos de contenido

### Tests de Regresión
- Verificar que la funcionalidad existente se mantiene
- Comparar calidad de respuestas entre Groq y Gemini
- Validar tiempos de respuesta

## Configuración de Entorno

### Variables de Entorno Requeridas

```env
# Reemplazar
VITE_GROQ_API_KEY=xxx

# Por
VITE_GEMINI_API_KEY=xxx
```

### Configuración de Desarrollo

```typescript
// .env.development
VITE_GEMINI_API_KEY=your_development_key_here

// .env.production
VITE_GEMINI_API_KEY=your_production_key_here
```

## Consideraciones de Rendimiento

### Optimizaciones
- Implementar timeout para peticiones (30 segundos)
- Manejar respuestas streaming si está disponible
- Implementar retry logic para errores temporales

### Monitoreo
- Log de tiempos de respuesta
- Log de errores de API
- Métricas de uso de tokens (si aplica)

## Seguridad

### Protección de API Key
- Validar que la API key no se exponga en logs
- Usar variables de entorno exclusivamente
- Implementar validación de formato de API key

### Validación de Contenido
- Mantener validación de entrada del usuario
- Manejar respuestas vacías o inválidas
- Implementar sanitización básica de respuestas

## Plan de Migración

### Fase 1: Preparación
1. Configurar nueva API key de Gemini
2. Crear servicios y configuraciones
3. Implementar tests unitarios

### Fase 2: Implementación
1. Reemplazar lógica de Groq en App.tsx
2. Actualizar manejo de errores
3. Validar funcionamiento básico

### Fase 3: Validación
1. Ejecutar tests de regresión
2. Validar calidad de respuestas
3. Monitorear rendimiento

### Fase 4: Limpieza
1. Eliminar código relacionado con Groq
2. Actualizar documentación
3. Remover dependencias no utilizadas
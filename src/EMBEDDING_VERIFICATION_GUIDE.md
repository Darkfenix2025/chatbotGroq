# 🔍 Guía de Verificación del Sistema de Embeddings

## 🎯 **Cómo Verificar si el Sistema de Embeddings Funciona**

### 1. **Verificación Rápida en el Navegador**

1. **Ir a**: http://localhost:5173/
2. **Abrir DevTools**: Presiona F12 → Pestaña "Console"
3. **Ir a pestaña "Embeddings"** en la aplicación
4. **Hacer clic en "Test API Hugging Face"**

### 2. **Indicadores de Funcionamiento Correcto**

#### ✅ **En la Consola del Navegador deberías ver:**
```
🔑 API Keys Status:
   GEMINI: ✅ Configurada
   HUGGING_FACE: ✅ Configurada

🧪 Iniciando test directo de Hugging Face API...
📝 Texto de prueba: "¿Cuáles son mis derechos..."
📤 Enviando request a: https://api-inference.huggingface.co/...
📥 Response status: 200
✅ Response data type: object
✅ Embedding generado exitosamente:
   📐 Dimensiones: 384
   📊 Rango: -0.123 a 0.456
   🎯 Primeros 5 valores: [0.123, -0.045, 0.234, ...]
```

#### ✅ **En la Interfaz deberías ver:**
- Estado de API Keys: Ambas con círculo verde
- Test exitoso con duración (ej: 1500ms)
- Embedding generado con 384 dimensiones
- Valores numéricos en el rango -1 a 1

### 3. **Verificación del Sistema Vectorial Completo**

1. **Hacer clic en "Test Sistema Vectorial"**
2. **Observar la consola** para ver el proceso completo:

```
🧠 Iniciando test del sistema vectorial completo...
🔄 Creando servicios...
📊 Estadísticas iniciales:
   Sistema inicializado: false
   Módulos en DB: 0
   Cache size: 0

🧪 Probando análisis de consulta...
✅ Análisis completado: {intent: "consultation", complexity: 0.7, ...}

🔍 Probando búsqueda de módulos similares...
✅ Módulos similares encontrados: {modules: [...], similarities: [...]}

🚀 Probando generación de prompt inteligente...
✅ Prompt inteligente generado: {finalPrompt: "...", usedModules: [...]}

📊 Estadísticas finales:
   Sistema inicializado: true
   Módulos en DB: 12
   Cache size: 12
```

### 4. **Verificación en el Chat Real**

1. **Ir a la pestaña "Chat"**
2. **Hacer una consulta legal específica**:
   - "¿Puedo demandar por despido sin causa en Argentina?"
3. **Observar la consola durante la consulta**:

#### ✅ **Primera consulta (5-15 segundos):**
```
🧠 Iniciando análisis vectorial...
🔄 Inicializando sistema inteligente de prompts...
📁 Cargando módulos de prompts...
✅ Cargados 12 módulos de prompts
🔄 Generando embeddings para 12 módulos...
✅ Embedding generado para: core/base-agent.txt (384 dimensiones)
✅ Embedding generado para: core/legal-context.txt (384 dimensiones)
... (continúa para todos los módulos)
📊 Indexado: core/base-agent.txt
... (continúa para todos los módulos)
✅ Análisis vectorial completado:
  📊 Módulos utilizados: 4
  🔢 Tokens totales: 2847
  📈 Score de relevancia: 87.3%
  ⚡ Tiempo de procesamiento: 8234ms
```

#### ✅ **Consultas posteriores (1-3 segundos):**
```
🧠 Iniciando análisis vectorial...
✅ Sistema inteligente de prompts inicializado
✅ Análisis vectorial completado:
  📊 Módulos utilizados: 3
  🔢 Tokens totales: 2156
  📈 Score de relevancia: 82.1%
  ⚡ Tiempo de procesamiento: 1456ms
```

### 5. **Indicadores de Problemas**

#### ❌ **Problemas con API de Hugging Face:**
```
❌ Error response: {"error": "Invalid API token"}
❌ HTTP 401: API key inválida o sin permisos
❌ HTTP 429: Rate limit excedido
❌ HTTP 503: Modelo cargando
```

#### ❌ **Sistema no usa embeddings:**
```
⚠️ Error en análisis vectorial, usando prompt estático
📤 Enviando mensaje a Gemini...
(No aparecen logs de embeddings o módulos)
```

#### ❌ **Respuestas muy rápidas (<1 segundo):**
- Indica que no está usando el sistema vectorial
- Las respuestas serán más genéricas
- No aparecerán logs de "análisis vectorial"

### 6. **Métricas Esperadas**

#### 🎯 **Tiempos de Respuesta:**
- **Primera consulta**: 5-15 segundos (genera embeddings)
- **Consultas posteriores**: 1-3 segundos (usa cache)

#### 📊 **Calidad de Embeddings:**
- **Dimensiones**: 384 (modelo MiniLM-L6-v2)
- **Rango de valores**: -1.0 a 1.0
- **Similitud coseno**: 0.0 a 1.0

#### 🎯 **Selección de Módulos:**
- **Módulos por consulta**: 3-5 típicamente
- **Score de relevancia**: >70% para buenas consultas
- **Módulos core**: Siempre incluidos (base-agent, legal-context, interaction-style)

### 7. **Solución de Problemas Comunes**

#### 🔧 **API Key Inválida:**
1. Verificar que la key esté en `.env`
2. Verificar que tenga el prefijo `VITE_`
3. Reiniciar el servidor de desarrollo

#### 🔧 **Rate Limiting:**
1. Esperar 1-2 minutos
2. Usar consultas más cortas
3. Verificar límites de la cuenta HF

#### 🔧 **Modelo Cargando:**
1. Esperar 30-60 segundos
2. Reintentar la consulta
3. Es normal en la primera vez

#### 🔧 **Sistema No Inicializa:**
1. Verificar ambas API keys
2. Revisar consola por errores
3. Reiniciar navegador/servidor

### 8. **Consultas Recomendadas para Probar**

#### 📝 **Consultas Laborales:**
- "¿Cuáles son mis derechos si me despiden sin causa?"
- "¿Cómo calcular la indemnización por despido?"
- "¿Qué es el preaviso en derecho laboral?"

#### 📝 **Consultas Civiles:**
- "¿Puedo reclamar daños y perjuicios por incumplimiento?"
- "¿Cómo rescindir un contrato de alquiler?"
- "¿Qué es la responsabilidad civil extracontractual?"

#### 📝 **Consultas Complejas:**
- "Necesito estrategia para negociar acuerdo comercial"
- "Análisis de riesgo en inversión inmobiliaria"
- "Activa modo estratega rojo para evaluar mi caso"

---

## 🎉 **Resumen de Verificación**

### ✅ **Sistema Funcionando Correctamente:**
- API keys configuradas y válidas
- Embeddings se generan en 200-2000ms
- Sistema se inicializa en primera consulta
- Consultas posteriores usan cache (rápidas)
- Módulos específicos seleccionados por relevancia
- Respuestas especializadas y detalladas

### ❌ **Sistema con Problemas:**
- Errores de API en consola
- Todas las consultas <1 segundo
- Respuestas genéricas sin especialización
- No aparecen logs de "análisis vectorial"
- Errores de autenticación o rate limiting

**¡Usa esta guía para verificar que tu sistema de embeddings funciona perfectamente!** 🚀
# Plan de Implementación

- [x] 1. Configurar estructura base para la API de Gemini


  - Crear archivo de configuración para la API de Gemini con tipos TypeScript
  - Definir interfaces para peticiones y respuestas de Gemini
  - Configurar la URL base y parámetros del modelo "gemini-2.5-pro"
  - _Requisitos: 1.1, 1.3_

- [x] 2. Implementar servicio de API de Gemini

  - [x] 2.1 Crear servicio base para comunicación con Gemini


    - Implementar clase GeminiService con métodos para envío de mensajes
    - Configurar headers de autenticación y formato de peticiones
    - _Requisitos: 1.1, 1.4, 2.4_


  - [ ] 2.2 Implementar formateo de mensajes para Gemini
    - Convertir mensajes del formato interno al formato requerido por Gemini
    - Integrar el prompt del sistema en el primer mensaje del usuario
    - Mapear roles de "assistant" a "model" según especificación de Gemini
    - _Requisitos: 1.5, 3.1_


  - [ ] 2.3 Implementar manejo de respuestas de Gemini
    - Extraer texto de respuesta del formato específico de Gemini

    - Validar estructura de respuesta y manejar casos de respuesta vacía

    - _Requisitos: 1.4, 3.2_

- [x] 3. Actualizar configuración de variables de entorno

  - Cambiar variable de entorno de VITE_GROQ_API_KEY a VITE_GEMINI_API_KEY


  - Actualizar validación de API key en el componente principal
  - Implementar mensajes de error específicos para API key de Gemini faltante
  - _Requisitos: 2.1, 2.2, 2.3_


- [ ] 4. Migrar lógica principal en App.tsx
  - [ ] 4.1 Reemplazar llamadas a API de Groq con servicio de Gemini
    - Importar y utilizar GeminiService en lugar de fetch directo a Groq



    - Actualizar función handleSendMessage para usar el nuevo servicio
    - _Requisitos: 1.1, 3.1, 4.4_

  - [ ] 4.2 Actualizar manejo de errores específico para Gemini
    - Implementar manejo de errores 401 (autenticación), 429 (rate limit), 400 (contenido)
    - Mostrar mensajes de error informativos específicos para cada tipo de error
    - Mantener logging de errores para debugging
    - _Requisitos: 2.3, 3.4, 4.2, 4.3_

- [ ] 5. Limpiar código y dependencias de Groq
  - Eliminar todas las referencias a la API de Groq del código
  - Remover console.logs específicos de Groq
  - Actualizar comentarios y documentación para reflejar el uso de Gemini
  - _Requisitos: 4.1, 4.5_

- [ ]* 6. Implementar tests para la migración
  - [ ]* 6.1 Crear tests unitarios para GeminiService
    - Testear formateo correcto de mensajes
    - Testear manejo de respuestas válidas e inválidas
    - _Requisitos: 1.4, 1.5_

  - [ ]* 6.2 Crear tests de integración para el flujo completo
    - Testear flujo completo de envío y recepción de mensajes
    - Testear manejo de diferentes tipos de errores de API
    - _Requisitos: 3.4, 3.5_
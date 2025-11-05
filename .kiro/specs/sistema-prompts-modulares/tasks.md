# Plan de Implementación - Sistema de Prompts Modulares

- [x] 1. Configurar entorno para EmbeddingGemma


  - Configurar API key de Hugging Face en variables de entorno
  - Crear configuración para google/embeddinggemma-300m
  - Implementar manejo de errores específicos de HF API
  - Crear estructura de archivos de prompts organizados
  - _Requisitos: 2.1, 2.2, 4.1_

- [x] 1.1 Crear estructura de archivos de prompts


  - Crear carpetas organizadas para módulos de prompts
  - Extraer y dividir el prompt actual en archivos .txt especializados
  - Crear archivos de configuración vectorial
  - _Requisitos: 2.1, 2.2, 2.5_

- [x] 2. Implementar sistema de vectorización con EmbeddingGemma


  - [x] 2.1 Crear servicio de vectorización con Hugging Face

    - Implementar VectorService para google/embeddinggemma-300m
    - Integrar con API de Hugging Face Inference
    - Crear funciones de cálculo de similitud coseno para vectores de 300 dimensiones
    - Implementar manejo de rate limiting y timeouts
    - _Requisitos: 4.1, 4.2, 5.1_

  - [x] 2.2 Implementar base de datos vectorial

    - Crear VectorDatabase para indexación de módulos
    - Implementar búsqueda semántica eficiente
    - Crear sistema de cache de vectores en memoria
    - _Requisitos: 4.5, 5.2, 5.3_

  - [x] 2.3 Crear gestor de prompts inteligente

    - Implementar PromptManager con selección semántica
    - Crear lógica de ranking por relevancia
    - Implementar optimización de tokens con múltiples módulos
    - _Requisitos: 1.4, 5.4, 5.5_

- [x] 3. Extraer y modularizar prompt actual





  - [x] 3.1 Crear módulos core (siempre activos)


    - Extraer ADN básico del agente a base-agent.txt
    - Crear legal-context.txt con contexto legal argentino
    - Extraer interaction-style.txt con estilo de comunicación
    - _Requisitos: 1.1, 1.2, 1.3_

  - [x] 3.2 Crear módulos de análisis

    - Extraer análisis estratégico 360° a strategic-360.txt
    - Crear risk-assessment.txt con análisis de riesgo
    - Extraer case-reasoning.txt con razonamiento de casos
    - _Requisitos: 1.1, 1.3_

  - [x] 3.3 Crear módulos tácticos

    - Extraer tácticas de negociación a negotiation.txt
    - Crear litigation.txt con tácticas de litigio
    - Extraer document-drafting.txt para redacción
    - _Requisitos: 1.1, 1.3_

  - [x] 3.4 Crear módulos especiales

    - Extraer modo "Estratega Rojo" a red-team.txt
    - Crear collaborative.txt para modo colaborativo
    - Crear technical.txt para consultas técnicas
    - _Requisitos: 1.1, 3.4_

- [x] 4. Generar embeddings con EmbeddingGemma

  - [x] 4.1 Procesar módulos de prompt para vectorización


    - Generar embeddings de 300 dimensiones para cada módulo extraído
    - Implementar procesamiento por lotes para optimizar llamadas a HF
    - Crear índice vectorial inicial con todos los módulos
    - Implementar metadata enriquecida para cada módulo
    - Guardar embeddings localmente para evitar re-procesamiento
    - _Requisitos: 4.2, 5.1_

  - [x] 4.2 Optimizar índice vectorial

    - Implementar clustering de módulos similares
    - Crear estrategias de cache inteligente
    - Optimizar búsqueda para consultas frecuentes
    - _Requisitos: 4.5, 5.3_


- [x] 5. Integrar con servicio de Gemini existente





  - [x] 5.1 Actualizar GeminiService para usar sistema vectorial



    - Modificar sendMessage para usar selección semántica
    - Integrar análisis vectorial antes de envío
    - Mantener compatibilidad con funcionalidad existente
    - _Requisitos: 1.5, 5.4_

  - [x] 5.2 Implementar métricas vectoriales



    - Crear tracking de precisión semántica
    - Implementar medición de relevancia de módulos
    - Crear logs de similitudes y rankings para debugging
    - _Requisitos: 4.4, 5.5_

- [x] 6. Crear sistema de configuración vectorial





  - Crear configuración de thresholds de similitud
  - Implementar configuración de límites de tokens y módulos
  - Crear sistema de pesos y prioridades para ranking
  - _Requisitos: 4.4, 5.3, 5.4_

- [x] 7. Validar paridad funcional con sistema vectorial





  - [x] 7.1 Comparar respuestas vectoriales con prompt original


    - Crear suite de consultas de prueba diversas
    - Comparar calidad usando selección semántica vs original
    - Ajustar thresholds de similitud según resultados
    - _Requisitos: 1.1, 1.5, 5.5_

  - [x] 7.2 Optimizar rendimiento vectorial


    - Ajustar parámetros de búsqueda semántica
    - Optimizar cache de embeddings y índices
    - Validar tiempos de respuesta y precisión
    - _Requisitos: 4.5, 5.3, 5.4_


- [x] 8. Implementar funcionalidades avanzadas vectoriales





  - [x] 8.1 Sistema de aprendizaje semántico


    - Implementar mejora automática de embeddings basado en feedback
    - Crear re-ranking dinámico de módulos según efectividad
    - Implementar clustering automático de consultas similares
    - _Requisitos: 5.5_

  - [x] 8.2 Interfaz de administración vectorial



    - Crear panel para visualizar similitudes entre módulos
    - Implementar editor de thresholds y parámetros vectoriales
    - Crear dashboard de métricas de precisión semántica
    - _Requisitos: 4.4, 5.5_

  - [x] 8.3 Optimizaciones avanzadas



    - Implementar embeddings especializados para dominio legal
    - Crear fine-tuning de modelos de embedding
    - Implementar búsqueda híbrida (semántica + keywords)
    - _Requisitos: 5.1, 5.2_
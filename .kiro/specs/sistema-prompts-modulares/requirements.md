# Documento de Requisitos - Sistema de Prompts Modulares

## Introducción

El sistema debe implementar una arquitectura modular de prompts que preserve la totalidad del prompt de sistema legal existente, dividiéndolo en módulos gestionables que se activen dinámicamente según el contexto de la consulta. Esto permitirá mantener toda la potencia analítica del agente legal mientras se optimiza el rendimiento técnico.

## Glosario

- **Prompt_Base**: El núcleo fundamental del agente legal que siempre está activo
- **Modulo_Prompt**: Sección especializada del prompt que se activa según contexto
- **Sistema_Vectorizacion**: Componente que convierte prompts y consultas a embeddings
- **Busqueda_Semantica**: Proceso de encontrar módulos relevantes usando similitud vectorial
- **Gestor_Prompts**: Componente que administra la carga y combinación de prompts
- **Archivo_Prompt**: Archivo .txt externo que contiene un módulo de prompt específico
- **Embedding**: Representación vectorial de texto para búsqueda semántica
- **Similitud_Coseno**: Métrica para medir relevancia entre vectores

## Requisitos

### Requisito 1

**Historia de Usuario:** Como propietario del chatbot legal, quiero mantener toda la funcionalidad y potencia de mi prompt de sistema actual, para preservar la ventaja competitiva de mi producto.

#### Criterios de Aceptación

1. EL Sistema_Activacion DEBERÁ preservar el 100% de la funcionalidad del prompt original
2. EL Prompt_Base DEBERÁ mantener el ADN y personalidad del agente legal
3. CADA Modulo_Prompt DEBERÁ corresponder a una sección específica del prompt original
4. EL sistema DEBERÁ activar automáticamente los módulos relevantes según la consulta
5. LA respuesta final DEBERÁ ser indistinguible de la del prompt original completo

### Requisito 2

**Historia de Usuario:** Como desarrollador, quiero gestionar los prompts como archivos externos, para facilitar el mantenimiento y mejora continua sin modificar código.

#### Criterios de Aceptación

1. CADA Archivo_Prompt DEBERÁ estar en formato .txt en una estructura de carpetas organizada
2. EL Gestor_Prompts DEBERÁ cargar dinámicamente los archivos según necesidad
3. LOS cambios en archivos de prompt DEBERÁN aplicarse sin reiniciar la aplicación
4. EL sistema DEBERÁ incluir versionado y respaldo de prompts
5. LA estructura de carpetas DEBERÁ ser intuitiva y escalable

### Requisito 3

**Historia de Usuario:** Como usuario del chatbot, quiero que el sistema detecte automáticamente qué tipo de consulta estoy haciendo, para recibir la respuesta más especializada posible.

#### Criterios de Aceptación

1. EL Sistema_Activacion DEBERÁ analizar la consulta para identificar el contexto legal
2. EL sistema DEBERÁ activar módulos de análisis estratégico para consultas complejas
3. EL sistema DEBERÁ activar módulos tácticos para consultas de litigio
4. EL sistema DEBERÁ activar el modo "Estratega Rojo" cuando se solicite explícitamente
5. LA activación DEBERÁ ser transparente para el usuario

### Requisito 4

**Historia de Usuario:** Como administrador del sistema, quiero optimizar el rendimiento y costos de la API usando vectorización semántica, para hacer el chatbot técnica y económicamente viable.

#### Criterios de Aceptación

1. EL sistema DEBERÁ usar vectorización para seleccionar solo módulos semánticamente relevantes
2. EL Sistema_Vectorizacion DEBERÁ generar embeddings de cada módulo de prompt
3. EL sistema DEBERÁ realizar búsqueda semántica en tiempo real para selección de módulos
4. EL sistema DEBERÁ incluir métricas de precisión semántica y uso de tokens
5. EL sistema DEBERÁ mantener cache de vectores para optimizar rendimiento

### Requisito 5

**Historia de Usuario:** Como desarrollador, quiero implementar búsqueda semántica inteligente, para que el sistema seleccione automáticamente los módulos más relevantes sin depender de palabras clave.

#### Criterios de Aceptación

1. EL Sistema_Vectorizacion DEBERÁ convertir consultas de usuario a embeddings
2. EL sistema DEBERÁ calcular similitud coseno entre consulta y módulos
3. EL sistema DEBERÁ rankear módulos por relevancia semántica
4. EL sistema DEBERÁ combinar múltiples módulos relevantes de forma inteligente
5. EL sistema DEBERÁ aprender y mejorar la selección basado en feedback
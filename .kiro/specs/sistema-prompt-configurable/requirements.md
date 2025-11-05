# Documento de Requisitos

## Introducción

El sistema requiere migrar de la API de Groq a la API de Gemini, utilizando el modelo "gemini-2.5-pro" y configurando la nueva API key correspondiente. Esta migración mejorará la calidad de las respuestas del chatbot de Legalito.

## Glosario

- **API_Gemini**: La interfaz de programación de aplicaciones de Google Gemini
- **Chatbot_Legalito**: La aplicación de chat que proporciona asesoramiento legal
- **Modelo_Gemini**: El modelo "gemini-2.5-pro" que se utilizará para generar respuestas
- **Configuracion_API**: El conjunto de parámetros necesarios para conectar con la API de Gemini
- **Variable_Entorno**: Las variables de entorno que almacenan la API key de Gemini

## Requisitos

### Requisito 1

**Historia de Usuario:** Como desarrollador del chatbot, quiero migrar de la API de Groq a la API de Gemini, para utilizar el modelo "gemini-2.5-pro" y mejorar la calidad de las respuestas.

#### Criterios de Aceptación

1. EL Chatbot_Legalito DEBERÁ utilizar la API_Gemini en lugar de la API de Groq
2. EL Chatbot_Legalito DEBERÁ usar el Modelo_Gemini "gemini-2.5-pro"
3. LA Configuracion_API DEBERÁ incluir la URL correcta para la API de Gemini
4. EL Chatbot_Legalito DEBERÁ manejar el formato de respuesta específico de la API de Gemini
5. CUANDO se realiza una petición, EL Chatbot_Legalito DEBERÁ enviar los mensajes en el formato requerido por Gemini

### Requisito 2

**Historia de Usuario:** Como administrador del sistema, quiero configurar la API key de Gemini de manera segura, para autenticar las peticiones a la API sin exponer credenciales en el código.

#### Criterios de Aceptación

1. LA Variable_Entorno DEBERÁ almacenar la API key de Gemini con el nombre "VITE_GEMINI_API_KEY"
2. EL Chatbot_Legalito DEBERÁ leer la API key desde las variables de entorno
3. CUANDO la API key no está configurada, EL Chatbot_Legalito DEBERÁ mostrar un mensaje de error claro
4. LA Configuracion_API DEBERÁ incluir la API key en el header de autorización correcto para Gemini

### Requisito 3

**Historia de Usuario:** Como usuario del chatbot, quiero que el sistema mantenga la misma funcionalidad y experiencia de usuario, para continuar usando el chatbot sin interrupciones después de la migración.

#### Criterios de Aceptación

1. EL Chatbot_Legalito DEBERÁ mantener el mismo prompt del sistema actual
2. EL Chatbot_Legalito DEBERÁ mostrar las respuestas con el mismo formato visual
3. EL Chatbot_Legalito DEBERÁ manejar los errores de la API de manera consistente
4. CUANDO ocurre un error de API, EL Chatbot_Legalito DEBERÁ mostrar mensajes de error informativos
5. EL tiempo de respuesta DEBERÁ ser comparable o mejor que la implementación anterior

### Requisito 4

**Historia de Usuario:** Como desarrollador, quiero que el código sea limpio y mantenible después de la migración, para facilitar futuras modificaciones y debugging.

#### Criterios de Aceptación

1. EL código DEBERÁ eliminar todas las referencias a la API de Groq
2. EL código DEBERÁ incluir manejo de errores específico para la API de Gemini
3. EL código DEBERÁ incluir logging apropiado para debugging
4. LA Configuracion_API DEBERÁ estar centralizada y ser fácil de modificar
5. EL código DEBERÁ seguir las mejores prácticas para llamadas a APIs externas
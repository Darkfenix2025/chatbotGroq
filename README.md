# Legalito Chat Assistant

Un chatbot especializado en derecho argentino que utiliza la API de Gemini para proporcionar asesoramiento legal inicial.

## Configuración

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar API Key de Gemini

1. Obtén tu API key de Gemini en: https://makersuite.google.com/app/apikey
2. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edita el archivo `.env` y reemplaza `your_gemini_api_key_here` con tu API key real:
   ```
   VITE_GEMINI_API_KEY=tu_api_key_aqui
   ```

### 3. Ejecutar el proyecto

Para desarrollo:
```bash
npm run dev
```

Para compilar:
```bash
npm run build
```

## Características

- **Especialización legal**: Derecho laboral, civil y comercial argentino
- **API de Gemini**: Utiliza el modelo `gemini-2.5-pro` para respuestas de alta calidad
- **Interfaz intuitiva**: Chat simple y fácil de usar
- **Manejo de errores**: Mensajes informativos para diferentes tipos de errores

## Tecnologías

- React + TypeScript
- Vite
- Tailwind CSS
- API de Gemini
- Lucide React (iconos)

## Aviso Legal

La información proporcionada por este chatbot es solo para fines informativos generales y no constituye asesoramiento legal. Para asesoramiento legal específico, consulta a un abogado profesional.
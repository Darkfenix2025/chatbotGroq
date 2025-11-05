import { Message } from '../types';
import {
    GeminiConfig,
    GeminiMessage,
    GeminiRequest,
    GeminiResponse,
    GEMINI_CONFIG,
    DEFAULT_GENERATION_CONFIG
} from '../config/gemini';
import { IntelligentPromptService, IntelligentPromptResult } from './intelligentPromptService';
import { PROMPT_CONTENTS } from '../prompts/promptContents';

// Interfaces para métricas vectoriales
export interface VectorMetrics {
    queryId: string;
    timestamp: Date;
    userQuery: string;
    processingTime: number;
    usedModules: string[];
    totalTokens: number;
    relevanceScore: number;
    similarities: number[];
    moduleRankings: { moduleId: string; similarity: number; rank: number }[];
    responseTime: number;
    success: boolean;
    errorMessage?: string;
}

export interface SemanticPrecisionMetrics {
    totalQueries: number;
    averageRelevanceScore: number;
    averageProcessingTime: number;
    averageResponseTime: number;
    moduleUsageFrequency: Record<string, number>;
    successRate: number;
    tokenEfficiency: number; // tokens used vs max available
}

export class GeminiService {
    private config: GeminiConfig;
    private intelligentPromptService: IntelligentPromptService | null = null;
    private vectorMetrics: VectorMetrics[] = [];
    private enableMetrics: boolean = true;

    constructor(apiKey: string, huggingFaceApiKey?: string, enableMetrics: boolean = true) {
        this.config = {
            ...GEMINI_CONFIG,
            apiKey
        };
        this.enableMetrics = enableMetrics;

        // Inicializar servicio inteligente de prompts si se proporciona la API key de HF
        if (huggingFaceApiKey) {
            this.intelligentPromptService = new IntelligentPromptService(huggingFaceApiKey);
        }
    }

    /**
     * Envía un mensaje a la API de Gemini con análisis vectorial integrado
     */
    async sendMessage(messages: Message[], systemPrompt?: string): Promise<string> {
        const queryId = this.generateQueryId();
        const startTime = Date.now();
        let vectorialResult: IntelligentPromptResult | null = null;
        let finalSystemPrompt = systemPrompt;
        let success = false;
        let errorMessage: string | undefined;

        try {
            // Análisis vectorial si hay servicio inteligente disponible
            if (this.intelligentPromptService && messages.length > 0) {
                const lastUserMessage = messages[messages.length - 1];
                
                if (lastUserMessage.role === 'user') {
                    console.log('🧠 Iniciando análisis vectorial...');
                    
                    try {
                        // Realizar análisis vectorial completo
                        vectorialResult = await this.performVectorAnalysis(
                            lastUserMessage.content,
                            4000
                        );
                        
                        finalSystemPrompt = vectorialResult.finalPrompt;
                        
                        console.log(`✅ Análisis vectorial completado:`);
                        console.log(`  📊 Módulos utilizados: ${vectorialResult.usedModules.length}`);
                        console.log(`  🔢 Tokens totales: ${vectorialResult.totalTokens}`);
                        console.log(`  📈 Score de relevancia: ${(vectorialResult.relevanceScore * 100).toFixed(1)}%`);
                        console.log(`  ⚡ Tiempo de procesamiento: ${vectorialResult.processingTime}ms`);
                        
                    } catch (error) {
                        console.warn('⚠️ Error en análisis vectorial, usando prompt estático:', error);
                        errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                        finalSystemPrompt = systemPrompt || this.getDefaultPrompt();
                    }
                }
            }

            // Usar prompt por defecto si no se proporcionó ninguno
            if (!finalSystemPrompt) {
                finalSystemPrompt = this.getDefaultPrompt();
            }

            // Enviar mensaje a Gemini
            const geminiMessages = this.formatMessagesForGemini(messages, finalSystemPrompt);
            
            console.log('📤 Enviando mensaje a Gemini...');

            const requestBody: GeminiRequest = {
                contents: geminiMessages,
                generationConfig: DEFAULT_GENERATION_CONFIG
            };

            const url = `${this.config.baseUrl}/${this.config.model}:generateContent?key=${this.config.apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            console.log(`📥 Respuesta de Gemini: ${response.status}`);

            if (!response.ok) {
                await this.handleApiError(response);
            }

            const data: GeminiResponse = await response.json();
            const result = this.handleGeminiResponse(data);
            
            success = true;
            
            // Registrar métricas si están habilitadas
            if (this.enableMetrics && vectorialResult && messages.length > 0) {
                await this.recordVectorMetrics(
                    queryId,
                    messages[messages.length - 1].content,
                    vectorialResult,
                    Date.now() - startTime,
                    success,
                    errorMessage
                );
            }

            return result;

        } catch (error) {
            console.error('❌ Error en GeminiService:', error);
            errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            
            // Registrar métricas de error si están habilitadas
            if (this.enableMetrics && vectorialResult && messages.length > 0) {
                await this.recordVectorMetrics(
                    queryId,
                    messages[messages.length - 1].content,
                    vectorialResult,
                    Date.now() - startTime,
                    false,
                    errorMessage
                );
            }
            
            throw error;
        }
    }

    /**
     * Convierte mensajes del formato interno al formato de Gemini
     */
    formatMessagesForGemini(messages: Message[], systemPrompt: string): GeminiMessage[] {
        const geminiMessages: GeminiMessage[] = [];

        // Si hay mensajes, integrar el prompt del sistema en el primer mensaje del usuario
        if (messages.length > 0) {
            const firstUserMessage = messages.find(msg => msg.role === 'user');

            if (firstUserMessage) {
                // Crear el primer mensaje con el prompt del sistema integrado
                geminiMessages.push({
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\nUsuario: ${firstUserMessage.content}` }]
                });

                // Agregar el resto de mensajes (excluyendo el primer mensaje del usuario)
                const remainingMessages = messages.slice(messages.indexOf(firstUserMessage) + 1);

                for (const message of remainingMessages) {
                    geminiMessages.push({
                        role: message.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: message.content }]
                    });
                }
            }
        } else {
            // Si no hay mensajes, crear un mensaje inicial con solo el prompt del sistema
            geminiMessages.push({
                role: 'user',
                parts: [{ text: systemPrompt }]
            });
        }

        return geminiMessages;
    }

    /**
     * Extrae la respuesta del formato de Gemini
     */
    handleGeminiResponse(response: GeminiResponse): string {
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error('No se recibió una respuesta válida de Gemini');
        }

        const candidate = response.candidates[0];

        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            throw new Error('La respuesta de Gemini está vacía o mal formateada');
        }

        return candidate.content.parts[0].text;
    }

    /**
     * Maneja errores específicos de la API de Gemini
     */
    private async handleApiError(response: Response): Promise<never> {
        const errorData = await response.json().catch(() => ({}));

        switch (response.status) {
            case 401:
                throw new Error('API key de Gemini inválida o faltante');
            case 429:
                throw new Error('Límite de rate limiting excedido. Intenta nuevamente en unos momentos');
            case 400:
                if (errorData.error?.message?.includes('blocked')) {
                    throw new Error('El contenido fue bloqueado por las políticas de seguridad de Gemini');
                }
                throw new Error(`Error en la petición: ${errorData.error?.message || 'Parámetros inválidos'}`);
            default:
                throw new Error(`Error de API de Gemini (${response.status}): ${errorData.error?.message || 'Error desconocido'}`);
        }
    }

    /**
     * Realiza análisis vectorial completo de la consulta
     */
    private async performVectorAnalysis(
        userQuery: string, 
        maxTokens: number
    ): Promise<IntelligentPromptResult> {
        if (!this.intelligentPromptService) {
            throw new Error('Servicio inteligente de prompts no disponible');
        }

        // Generar prompt inteligente con análisis vectorial
        const result = await this.intelligentPromptService.generateIntelligentPrompt(
            userQuery,
            maxTokens
        );

        // Obtener información adicional para métricas
        if (this.enableMetrics) {
            const similarModules = await this.intelligentPromptService.findSimilarModules(
                userQuery,
                10
            );
            
            // Enriquecer resultado con datos de similitud
            (result as any).similarities = similarModules.similarities;
            (result as any).moduleRankings = similarModules.modules.map((module, index) => ({
                moduleId: module.id,
                similarity: similarModules.similarities[index],
                rank: index + 1
            }));
        }

        return result;
    }

    /**
     * Registra métricas vectoriales para análisis posterior
     */
    private async recordVectorMetrics(
        queryId: string,
        userQuery: string,
        vectorialResult: IntelligentPromptResult,
        responseTime: number,
        success: boolean,
        errorMessage?: string
    ): Promise<void> {
        try {
            const metrics: VectorMetrics = {
                queryId,
                timestamp: new Date(),
                userQuery: userQuery.substring(0, 200), // Limitar longitud para logs
                processingTime: vectorialResult.processingTime,
                usedModules: vectorialResult.usedModules,
                totalTokens: vectorialResult.totalTokens,
                relevanceScore: vectorialResult.relevanceScore,
                similarities: (vectorialResult as any).similarities || [],
                moduleRankings: (vectorialResult as any).moduleRankings || [],
                responseTime,
                success,
                errorMessage
            };

            this.vectorMetrics.push(metrics);

            // Mantener solo las últimas 1000 métricas en memoria
            if (this.vectorMetrics.length > 1000) {
                this.vectorMetrics = this.vectorMetrics.slice(-1000);
            }

            // Log detallado para debugging
            console.log(`📊 Métricas registradas para query ${queryId}:`);
            console.log(`  🎯 Relevancia: ${(metrics.relevanceScore * 100).toFixed(1)}%`);
            console.log(`  📦 Módulos: ${metrics.usedModules.join(', ')}`);
            console.log(`  ⏱️ Tiempos: Vectorial ${metrics.processingTime}ms, Total ${metrics.responseTime}ms`);
            
            if (metrics.similarities.length > 0) {
                const avgSimilarity = metrics.similarities.reduce((a, b) => a + b, 0) / metrics.similarities.length;
                console.log(`  🔍 Similitud promedio: ${(avgSimilarity * 100).toFixed(1)}%`);
            }

        } catch (error) {
            console.warn('⚠️ Error registrando métricas vectoriales:', error);
        }
    }

    /**
     * Genera un ID único para cada consulta
     */
    private generateQueryId(): string {
        return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Obtiene métricas de precisión semántica
     */
    getSemanticPrecisionMetrics(): SemanticPrecisionMetrics {
        if (this.vectorMetrics.length === 0) {
            return {
                totalQueries: 0,
                averageRelevanceScore: 0,
                averageProcessingTime: 0,
                averageResponseTime: 0,
                moduleUsageFrequency: {},
                successRate: 0,
                tokenEfficiency: 0
            };
        }

        const successfulQueries = this.vectorMetrics.filter(m => m.success);
        const totalQueries = this.vectorMetrics.length;
        
        // Calcular promedios
        const avgRelevanceScore = successfulQueries.reduce((sum, m) => sum + m.relevanceScore, 0) / successfulQueries.length;
        const avgProcessingTime = successfulQueries.reduce((sum, m) => sum + m.processingTime, 0) / successfulQueries.length;
        const avgResponseTime = successfulQueries.reduce((sum, m) => sum + m.responseTime, 0) / successfulQueries.length;
        
        // Calcular frecuencia de uso de módulos
        const moduleUsageFrequency: Record<string, number> = {};
        successfulQueries.forEach(metrics => {
            metrics.usedModules.forEach(moduleId => {
                moduleUsageFrequency[moduleId] = (moduleUsageFrequency[moduleId] || 0) + 1;
            });
        });

        // Calcular eficiencia de tokens (asumiendo máximo de 4000)
        const avgTokens = successfulQueries.reduce((sum, m) => sum + m.totalTokens, 0) / successfulQueries.length;
        const tokenEfficiency = avgTokens / 4000;

        return {
            totalQueries,
            averageRelevanceScore: avgRelevanceScore || 0,
            averageProcessingTime: avgProcessingTime || 0,
            averageResponseTime: avgResponseTime || 0,
            moduleUsageFrequency,
            successRate: successfulQueries.length / totalQueries,
            tokenEfficiency
        };
    }

    /**
     * Obtiene métricas detalladas de los últimos N queries
     */
    getRecentVectorMetrics(limit: number = 10): VectorMetrics[] {
        return this.vectorMetrics
            .slice(-limit)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Obtiene ranking de módulos por frecuencia de uso
     */
    getModuleUsageRanking(): Array<{ moduleId: string; usage: number; avgRelevance: number }> {
        const moduleStats: Record<string, { count: number; totalRelevance: number }> = {};
        
        this.vectorMetrics.filter(m => m.success).forEach(metrics => {
            metrics.usedModules.forEach(moduleId => {
                if (!moduleStats[moduleId]) {
                    moduleStats[moduleId] = { count: 0, totalRelevance: 0 };
                }
                moduleStats[moduleId].count++;
                moduleStats[moduleId].totalRelevance += metrics.relevanceScore;
            });
        });

        return Object.entries(moduleStats)
            .map(([moduleId, stats]) => ({
                moduleId,
                usage: stats.count,
                avgRelevance: stats.totalRelevance / stats.count
            }))
            .sort((a, b) => b.usage - a.usage);
    }

    /**
     * Limpia las métricas almacenadas
     */
    clearMetrics(): void {
        this.vectorMetrics = [];
        console.log('🧹 Métricas vectoriales limpiadas');
    }

    /**
     * Habilita o deshabilita el registro de métricas
     */
    setMetricsEnabled(enabled: boolean): void {
        this.enableMetrics = enabled;
        console.log(`📊 Métricas vectoriales ${enabled ? 'habilitadas' : 'deshabilitadas'}`);
    }

    /**
     * Obtiene el prompt por defecto usando los módulos core reales
     */
    private getDefaultPrompt(): string {
        try {
            // Cargar contenido real de los módulos core
            const coreModules = [
                'core/base-agent.txt',
                'core/legal-context.txt', 
                'core/interaction-style.txt'
            ];

            let combinedPrompt = '';
            
            // Cargar contenido real de los módulos core
            coreModules.forEach(moduleId => {
                if (PROMPT_CONTENTS[moduleId]) {
                    combinedPrompt += PROMPT_CONTENTS[moduleId] + '\n\n';
                    console.log(`✅ Cargado módulo core: ${moduleId}`);
                } else {
                    console.warn(`⚠️ No se encontró contenido para módulo ${moduleId}`);
                }
            });

            if (combinedPrompt.trim()) {
                console.log('✅ Usando prompt combinado de módulos core reales');
                return combinedPrompt.trim();
            }
        } catch (error) {
            console.warn('⚠️ Error cargando módulos core, usando fallback:', error);
        }

        // Fallback mejorado con contenido más específico
        console.log('⚠️ Usando prompt de fallback básico');
        return `NÚCLEO DEL SISTEMA - AGENTE JURÍDICO ARGENTINO

Eres una IA avanzada diseñada para actuar como un Agente Jurídico Argentino especializado en derecho civil, laboral y comercial. 

ESPECIALIZACIÓN:
- Derecho Civil: Código Civil y Comercial de la Nación (CCCN), Ley 26.994
- Derecho Laboral: Ley de Contrato de Trabajo (LCT), Ley de Riesgos del Trabajo (LRT)
- Derecho Comercial: Ley de Sociedades Comerciales, normativa empresarial

DIRECTIVAS:
- Proporciona análisis legal preciso basado en normativa argentina vigente
- Cita artículos específicos cuando sea relevante (ej: "art. 242 LCT")
- Mantén tono profesional pero accesible
- Identifica hechos clave, normativa aplicable y argumentos
- Sugiere acciones concretas cuando corresponda

IDENTIDAD: Asistente IA especializado en derecho argentino (sin matrícula profesional).`;
    }
}
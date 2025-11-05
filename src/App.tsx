import { useState } from 'react';
import { Message } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { AdvancedVectorTest } from './components/AdvancedVectorTest';
import { EmbeddingTestPanel } from './components/EmbeddingTestPanel';
import { MessageSquare, TestTube, Settings, Zap } from 'lucide-react';
import { GeminiService } from './services/geminiService';
import logo from './assets/imagen_chatbot.jpg'

function App() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'test' | 'admin' | 'embeddings'>('chat');

    const handleSendMessage = async (content: string) => {
        try {
            setIsLoading(true);

            // Añadir mensaje del usuario
            const userMessage: Message = { role: 'user', content };
            setMessages(prev => [...prev, userMessage]);

            const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const hfApiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;

            console.log("VITE_GEMINI_API_KEY configurada:", !!geminiApiKey);
            console.log("VITE_HUGGING_FACE_API_KEY configurada:", !!hfApiKey);

            if (!geminiApiKey) {
                console.error("VITE_GEMINI_API_KEY is not set in the environment variables.");
                const errorMessage: Message = { 
                    role: 'assistant', 
                    content: 'Error: API key de Gemini no configurada. Por favor configura VITE_GEMINI_API_KEY en tu archivo .env' 
                };
                setMessages(prev => [...prev, errorMessage]);
                setIsLoading(false);
                return;
            }

            // Crear instancia de GeminiService con sistema vectorial inteligente
            const geminiService = new GeminiService(geminiApiKey, hfApiKey, true);
            
            // El sistema vectorial seleccionará automáticamente los módulos relevantes
            // basado en el contenido de la consulta del usuario
            const allMessages = [...messages, userMessage];

            if (hfApiKey) {
                console.log('🧠 Usando sistema vectorial inteligente para selección de prompts...');
            } else {
                console.log('⚠️ Sistema vectorial no disponible - usando prompt básico');
            }

            // Usar el servicio de Gemini (con análisis vectorial automático si HF está disponible)
            const assistantResponse = await geminiService.sendMessage(allMessages);

            // Agregar la respuesta del asistente
            const assistantMessage: Message = { role: 'assistant', content: assistantResponse };
            setMessages(prev => [...prev, assistantMessage]);

            // Mostrar métricas si están disponibles
            if (hfApiKey) {
                const metrics = geminiService.getSemanticPrecisionMetrics();
                if (metrics.totalQueries > 0) {
                    console.log('📊 Métricas del sistema vectorial:');
                    console.log(`  - Total consultas: ${metrics.totalQueries}`);
                    console.log(`  - Relevancia promedio: ${(metrics.averageRelevanceScore * 100).toFixed(1)}%`);
                    console.log(`  - Tiempo promedio: ${metrics.averageProcessingTime.toFixed(0)}ms`);
                    console.log(`  - Tasa de éxito: ${(metrics.successRate * 100).toFixed(1)}%`);
                }
            }

        } catch (error) {
            console.error('Error:', error);
            let errorMessage: Message;

            if (error instanceof Error) {
                errorMessage = { role: 'assistant', content: `Error: ${error.message}` };
            } else {
                errorMessage = { role: 'assistant', content: 'Ocurrió un error al procesar tu mensaje con Gemini.' };
            }

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <img 
                                src={logo} 
                                alt="Legal-IT-Ø Logo" 
                                className="w-16 h-16 rounded-full mr-3"
                            />
                            <MessageSquare className="w-8 h-8 text-blue-600 mr-2" />
                            <h1 className="text-3xl font-bold text-gray-800">
                                Asistente Legal Argentino
                            </h1>
                        </div>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Asistente jurídico especializado en derecho argentino con sistema inteligente de análisis vectorial.
                            {import.meta.env.VITE_HUGGING_FACE_API_KEY ? 
                                ' ✨ Sistema vectorial activo para respuestas optimizadas.' : 
                                ' ⚡ Modo básico - configura VITE_HUGGING_FACE_API_KEY para funcionalidad completa.'
                            }
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-white rounded-lg shadow-sm p-1 flex space-x-1">
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                                    activeTab === 'chat'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span>Chat</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('test')}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                                    activeTab === 'test'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <TestTube className="w-4 h-4" />
                                <span>Tests Avanzados</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('embeddings')}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                                    activeTab === 'embeddings'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Zap className="w-4 h-4" />
                                <span>Embeddings</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('admin')}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                                    activeTab === 'admin'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <Settings className="w-4 h-4" />
                                <span>Administración</span>
                            </button>
                        </div>
                    </div>

                    {/* Content based on active tab */}
                    {activeTab === 'chat' && (
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="h-96 overflow-y-auto p-6 space-y-4">
                                {messages.length === 0 ? (
                                    <div className="text-center text-gray-500 mt-8">
                                        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                        <p>¡Hola! Soy tu asistente legal argentino.</p>
                                        <p className="text-sm mt-2">
                                            Puedo ayudarte con consultas sobre derecho civil, laboral, comercial y más.
                                        </p>
                                        {import.meta.env.VITE_HUGGING_FACE_API_KEY && (
                                            <p className="text-sm mt-2 text-blue-600">
                                                🧠 Sistema vectorial activo - seleccionaré automáticamente los módulos más relevantes para tu consulta.
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    messages.map((message, index) => (
                                        <ChatMessage key={index} message={message} />
                                    ))
                                )}
                                {isLoading && (
                                    <div className="flex items-center space-x-2 text-gray-500">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        <span>
                                            {import.meta.env.VITE_HUGGING_FACE_API_KEY ? 
                                                'Analizando consulta y seleccionando módulos relevantes...' : 
                                                'Procesando consulta...'
                                            }
                                        </span>
                                    </div>
                                )}
                            </div>
                            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
                        </div>
                    )}

                    {activeTab === 'test' && (
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <AdvancedVectorTest />
                        </div>
                    )}

                    {activeTab === 'embeddings' && (
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <EmbeddingTestPanel />
                        </div>
                    )}

                    {activeTab === 'admin' && (
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden p-6">
                            <div className="text-center text-gray-500">
                                <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Panel de Administración</h3>
                                <p className="text-sm">
                                    Panel de administración vectorial en desarrollo.
                                </p>
                                <p className="text-sm mt-2 text-blue-600">
                                    Próximamente: Configuración avanzada, métricas detalladas y optimización del sistema.
                                </p>
                            </div>
                        </div>
                    )}

                    <p className="text-s text-gray-900 mt-6 text-justify">
                        <strong>Aviso Legal:</strong> La información proporcionada por este chatbot es solo para fines informativos generales y no constituye asesoramiento legal. Si necesitas asesoramiento legal específico, por favor consulta a un abogado de Legal-IT-Ø.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default App;
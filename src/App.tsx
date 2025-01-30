// src/App.tsx
import { useState, useEffect } from 'react';
import { Message } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { MessageSquare } from 'lucide-react';
import logo from './assets/imagen_chatbot.jpg';
import { db } from './firebase-config';
import { collection, addDoc } from 'firebase/firestore';

function App() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Aquí podrías cargar mensajes antiguos desde Firebase si es necesario en el futuro
        // Por ahora lo dejamos vacío, pero es un buen lugar para esa lógica.
    }, []);

    const handleSendMessage = async (content: string) => {
        try {
            setIsLoading(true);
            // Añadir mensaje del usuario
            const userMessage: Message = { role: 'user', content };
            setMessages(prev => [...prev, userMessage]);

            // Guardar mensaje del usuario en Firebase
            try {
                await addDoc(collection(db, 'chat-messages'), userMessage);
            } catch (firebaseError) {
                console.error('Error al guardar mensaje del usuario en Firebase:', firebaseError);
                // Decide si quieres mostrar un mensaje de error al usuario si falla el guardado en Firebase.
                // Por ahora, solo loggeamos el error.
            }


            const apiKey = import.meta.env.VITE_GROQ_API_KEY;
            console.log("VITE_GROQ_API_KEY:", apiKey);
            if (!apiKey) {
                console.error("VITE_GROQ_API_KEY no está configurada en las variables de entorno.");
                const errorMessage: Message = { role: 'assistant', content: 'Error: API key no configurada. Contacta al administrador.' };
                setMessages(prev => [...prev, errorMessage]);
                setIsLoading(false);
                return;
            }
            const chatbotPrompt = `Eres un abogado profesional en Argentina... (mismo prompt que tienes)`;
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile", // o el modelo que desees utilizar
                    messages: [
                        {
                            role: "system",
                            content: chatbotPrompt
                        },
                        {
                            role: "user",
                            content: content
                        }
                    ]
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error desde la API de Groq:', errorData); // Más detalle en el log
                const errorMessage: Message = { role: 'assistant', content: `Error al procesar tu mensaje con Groq. Código de error: ${response.status}. Por favor, intenta de nuevo más tarde.` }; // Mensaje más informativo al usuario
                setMessages(prev => [...prev, errorMessage]);
                return;
            }
            const data = await response.json();
            const assistantResponse = data.choices[0]?.message?.content;
            if (assistantResponse) {
                const assistantMessage: Message = { role: 'assistant', content: assistantResponse };
                setMessages(prev => [...prev, assistantMessage]);

                // Guardar mensaje del asistente en Firebase
                try {
                    await addDoc(collection(db, 'chat-messages'), assistantMessage);
                } catch (firebaseError) {
                    console.error('Error al guardar mensaje del asistente en Firebase:', firebaseError);
                    // Decide si quieres mostrar un mensaje de error al usuario.
                    // Por ahora, solo loggeamos el error.
                }
            } else {
                const errorMessage: Message = { role: 'assistant', content: 'No se recibió una respuesta válida del asistente. Por favor, intenta de nuevo más tarde.' }; // Mensaje más amigable al usuario
                setMessages(prev => [...prev, errorMessage]);
                console.error('No se recibió respuesta válida de Groq:', data); // Loggeamos la data completa para debuggear
            }

        } catch (error) {
            console.error('Error inesperado:', error); // Mensaje de error más general para errores inesperados
            const errorMessage: Message = { role: 'assistant', content: 'Ocurrió un error inesperado al procesar tu mensaje. Por favor, intenta de nuevo más tarde.' }; // Mensaje de error más amigable al usuario
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-8 text-center">
                    <div className="inline-flex items-center gap-2 text-2xl font-bold text-gray-800">
                        <img src={logo} alt="Legalito" className="h-16 w-16 mr-5" />
                        <MessageSquare className="h-8 w-8 text-blue-500" />
                        Legalito Chat Assistant
                    </div>
                </div>
                <div className="rounded-xl bg-white p-4 shadow-lg">
                    <div className="mb-4 h-[500px] overflow-y-auto space-y-4">
                        {messages.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-gray-500">
                                Inicia una conversación enviando un mensaje
                            </div>
                        ) : (
                            messages.map((message, index) => (
                                <ChatMessage key={index} message={message} />
                            ))
                        )}
                    </div>
                    <ChatInput onSend={handleSendMessage} disabled={isLoading} />
                    <p className="text-s text-gray-900 mt-6 text-justify">
                        <strong>Aviso Legal:</strong> La información proporcionada por este chatbot es solo para fines informativos generales y no constituye asesoramiento legal. Si necesitas asesoramiento legal específico, por favor consulta a un abogado de Legal-IT-Ø.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default App;